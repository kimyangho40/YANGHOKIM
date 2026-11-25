// 채팅 첨부 테스트. App.js 의 ⛳ 채팅-첨부 구간을 소스째 떼어내 실행한다(DB·저장소 무접촉).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, "..", "src/App.js"), "utf8");
const i = src.indexOf("// ⛳ 채팅-첨부 시작"), j = src.indexOf("// ⛳ 채팅-첨부 끝");
if (i < 0 || j < 0) { console.error("마커를 찾지 못했습니다"); process.exit(1); }
const A = new Function(src.slice(i, j) + "\nreturn { CHAT_FILE_BUCKET, CHAT_FILE_MAX_BYTES, CHAT_FILE_MAX_COUNT, CHAT_FILE_EXTS, chatFileExt, chatChannelHex, chatFilePath, chatFileSize, chatFileCheck, chatAttachmentsOf, isChatImage, chatMessagePreview };")();

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  if (JSON.stringify(got) === JSON.stringify(want)) pass++;
  else { fail++; console.log("❌ " + name + "\n   got : " + JSON.stringify(got) + "\n   want: " + JSON.stringify(want)); }
};
const ok = (name, cond) => eq(name, !!cond, true);
const hexToText = (h) => Buffer.from(h, "hex").toString("utf8");

// ① 확장자
eq("확장자 소문자", A.chatFileExt("견적서.PDF"), "pdf");
eq("확장자 없음", A.chatFileExt("메모"), "");
eq("점이 여러 개", A.chatFileExt("a.b.c.xlsx"), "xlsx");

// ② 채널 → 16진수 → 다시 채널 (SQL chat_file_channel 과 같은 왕복)
["general", "corporate", "individual", "dm:양호|유진", "dm:이만나미|정원"].forEach((ch) => {
  const hex = A.chatChannelHex(ch);
  ok("16진수만: " + ch, /^[0-9a-f]+$/.test(hex));
  eq("왕복: " + ch, hexToText(hex), ch);
});
eq("검증 SQL 04번과 같은 값", A.chatChannelHex("dm:양호|유진"), "646d3aec9691ed98b87cec9ca0eca784");

// ③ 저장 경로 — 한글·공백·기호가 키에 들어가지 않는다
const p = A.chatFilePath("dm:양호|유진", "2026 견적서 (최종).pdf", 1732500000000, "ab12cd");
eq("경로 모양", p, "646d3aec9691ed98b87cec9ca0eca784/1732500000000_ab12cd.pdf");
ok("경로는 아스키만", /^[\x21-\x7e]+$/.test(p));
eq("첫 폴더 = 채널", hexToText(p.split("/")[0]), "dm:양호|유진");
ok("확장자 없는 파일", A.chatFilePath("general", "메모", 1, "x").endsWith(".bin"));

// ④ 올릴 수 있는 파일인가
const f = (name, size) => ({ name, size });
eq("정상 pdf", A.chatFileCheck(f("a.pdf", 1000), 0), "");
eq("정상 hwp", A.chatFileCheck(f("신청서.hwp", 5 * 1024 * 1024), 4), "");
ok("개수 초과", A.chatFileCheck(f("a.pdf", 1000), 5).includes("5개"));
ok("막힌 종류(exe)", A.chatFileCheck(f("a.exe", 1000), 0).includes("첨부할 수 없어요"));
ok("막힌 종류(영상)", A.chatFileCheck(f("a.mp4", 1000), 0).includes("첨부할 수 없어요"));
ok("확장자 없음", A.chatFileCheck(f("메모", 1000), 0).includes("첨부할 수 없어요"));
ok("빈 파일", A.chatFileCheck(f("a.pdf", 0), 0).includes("빈 파일"));
eq("딱 20MB 는 통과", A.chatFileCheck(f("a.zip", 20 * 1024 * 1024), 0), "");
ok("20MB 초과", A.chatFileCheck(f("a.zip", 20 * 1024 * 1024 + 1), 0).includes("20MB"));

// ⑤ 크기 표기
eq("B", A.chatFileSize(512), "512B");
eq("KB", A.chatFileSize(2048), "2KB");
eq("MB", A.chatFileSize(3.25 * 1024 * 1024), "3.3MB");

// ⑥ 옛 메시지(칸 없음)·이상한 값
eq("칸 없음", A.chatAttachmentsOf({ message: "안녕" }), []);
eq("null", A.chatAttachmentsOf(null), []);
eq("문자열", A.chatAttachmentsOf({ attachments: "x" }), []);
eq("경로 없는 항목은 버린다", A.chatAttachmentsOf({ attachments: [{ name: "a" }, null, { path: "p/1.pdf", name: "a.pdf" }] }).length, 1);

// ⑦ 이미지 판별 · 알림 문구
ok("png 는 이미지", A.isChatImage({ name: "캡처.PNG", path: "x/1.png" }));
ok("pdf 는 아님", !A.isChatImage({ name: "a.pdf", path: "x/1.pdf" }));
eq("글만", A.chatMessagePreview({ message: "안녕" }), "안녕");
eq("파일만", A.chatMessagePreview({ message: "", attachments: [{ path: "a/1.pdf" }, { path: "a/2.pdf" }] }), "📎 파일 2개");
eq("글+파일", A.chatMessagePreview({ message: "확인 부탁", attachments: [{ path: "a/1.pdf" }] }), "확인 부탁 (📎 1)");
eq("옛 메시지", A.chatMessagePreview({ message: "예전 글" }), "예전 글");

// ⑧ 글만 보내는 메시지의 payload 는 예전과 같다 — attachments 는 파일이 있을 때만 싣는다
ok("payload 에 조건부로 싣는다", src.includes("if (attachments.length) payload.attachments = attachments;"));
ok("기본 payload 에 attachments 키가 없다", src.includes('var payload = { sender: me, message: text, channel: channel, read_by: [me], saved_to_activity: [] };'));
// ⑨ SQL 과 짝: 버킷 이름·크기·개수
const sql = fs.readFileSync(path.join(here, "..", "채팅_첨부파일.sql"), "utf8");
ok("버킷 이름이 SQL 과 같다", sql.includes("'" + A.CHAT_FILE_BUCKET + "'"));
ok("크기 제한이 SQL 과 같다", sql.includes(String(A.CHAT_FILE_MAX_BYTES)));
ok("개수 제한이 SQL 과 같다", sql.includes("<= " + A.CHAT_FILE_MAX_COUNT));

console.log(`\n채팅 첨부: ${pass} 통과 · ${fail} 실패`);
process.exit(fail ? 1 : 0);
