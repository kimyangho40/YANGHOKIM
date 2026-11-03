// 사업장 지도 테스트 — App.js `⛳ 사업장주소` 블록과 api/geocode.js 정리 함수를 소스째 떼어내 실행한다.
// 실행: node scripts/test-company-map.mjs
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath, pathToFileURL } from "url";
const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

let pass = 0, fail = 0;
const ok = (cond, name, extra) => { if (cond) pass++; else { fail++; console.log("❌", name, extra === undefined ? "" : JSON.stringify(extra)); } };

// ① App.js 블록
const src = fs.readFileSync(path.join(root, "src/App.js"), "utf8");
const a = src.indexOf("// ⛳ 사업장주소 시작"), b = src.indexOf("// ⛳ 사업장주소 끝");
ok(a > 0 && b > a, "마커 블록 존재");
const fn = new Function(src.slice(a, b) + "\nreturn { cleanAddrText, looksLikeAddress };")();

const yes = ["경기도 수원시 팔달구 효원로 241", "(50315) 경상남도 창녕군 창녕읍 탐하로 132", "서울특별시 금천구 가산디지털1로 145, 1003호",
  "경기 안산시 단원구 원시동 773-5", "충남 천안시 서북구 성거읍 오송리 123", "인천 남동구 남동대로 215번길 30"];
const no = ["경기_수원", "서울 강남구", "경기도 고양시", "본사", "", null, "충북 청주시 흥덕구"];
yes.forEach(s => ok(fn.looksLikeAddress(s), "주소로 판정: " + s));
no.forEach(s => ok(!fn.looksLikeAddress(s), "주소 아님: " + s));
ok(fn.cleanAddrText("(50315) 경상남도  창녕군 창녕읍") === "경상남도 창녕군 창녕읍", "우편번호·공백 정리");
ok(fn.cleanAddrText("[12345] 서울 중구") === "서울 중구", "대괄호 우편번호");
ok(fn.cleanAddrText(undefined) === "", "빈값");

// ② 파서 3곳이 address 를 남기는지(소스 문자열 확인 — 함수 전체 실행은 시트지 픽스처가 필요해 생략)
ok(/updates\.address = cleanAddrText\(addr\)/.test(src), "시트지 v1 파서가 address 저장");
ok(/m\.field === "region" && !updates\.address && looksLikeAddress/.test(src), "범용 파서가 address 저장");
ok(/setF\("address", cleanAddrText\(addr\)\)/.test(src), "현황표 v2 파서가 address 저장");
ok(/updateObj\.address = null/.test(src), "주소 지우면 null 저장");
ok(/insertData\.address = cleanAddrText\(form\.address\)/.test(src), "신규등록 address 저장");
ok(src.includes('{ id: "company-map", label: "사업장 지도", icon: "map" }') && src.includes('view === "company-map" && <CompanyMap'), "메뉴·렌더 분기 한 쌍");
ok(/^\s+map:\s+<svg/m.test(src), "Icon 에 map 아이콘");

// ③ api/geocode.js 정리 함수
const geo = await import(pathToFileURL(path.join(root, "api/geocode.js")).href);
ok(geo.cleanRegion("경기_수원") === "경기도 수원", "지역 _ 분리", geo.cleanRegion("경기_수원"));
ok(geo.cleanRegion("서울시 강남구") === "서울특별시 강남구", "서울시 → 서울특별시", geo.cleanRegion("서울시 강남구"));
ok(geo.cleanRegion("경기 수원(본사)") === "경기도 수원", "괄호 제거", geo.cleanRegion("경기 수원(본사)"));
ok(geo.cleanRegion("본점:_경기도") === "경기도", "본점 접두 제거", geo.cleanRegion("본점:_경기도"));
ok(geo.cleanRegion("광주_광주 북구") === "광주광역시 광주 북구", "광역시 3단어", geo.cleanRegion("광주_광주 북구"));
ok(geo.cleanAddress("(50315) 경상남도 창녕군 창녕읍 탐하로 132, 2층") === "경상남도 창녕군 창녕읍 탐하로 132", "주소 우편번호·쉼표 뒤 제거");
ok(JSON.stringify(geo.regionCandidates(geo.cleanRegion("경기_시흥"))) === JSON.stringify(["경기도 시흥시","경기도 시흥군","경기도 시흥구","경기도 시흥","경기도"]), "지역 접미사 후보");
ok(geo.regionCandidates(geo.cleanRegion("서울_강서"))[0] === "서울특별시 강서구", "광역시는 구 먼저");
ok(geo.cleanAddress("본사: 서울 중구 세종대로 110 (태평로1가)") === "서울 중구 세종대로 110", "주소 접두·끝 괄호 제거");

// ④ 화면 판정(CompanyMap.jsx 의 geoKeyOf·needsGeocode) — JSX 를 안 거치도록 함수 본문만 떼어낸다
const mapSrc = fs.readFileSync(path.join(root, "src/pages/CompanyMap.jsx"), "utf8");
const g1 = mapSrc.indexOf("export function geoKeyOf"), g2 = mapSrc.indexOf("function esc(");
const m = new Function(mapSrc.slice(g1, g2).replace(/export /g, "") + "\nreturn { geoKeyOf, needsGeocode };")();
const base = { address: "서울 중구 세종대로 110", region: "서울_중구" };
ok(m.needsGeocode(base), "좌표 없으면 받는다");
ok(!m.needsGeocode(Object.assign({}, base, { geo_lat: 37.5, geo_lng: 127, geo_query: m.geoKeyOf(base) })), "같은 주소면 다시 안 받는다");
ok(m.needsGeocode(Object.assign({}, base, { geo_lat: 37.5, geo_lng: 127, geo_query: "옛주소|서울_중구" })), "주소가 바뀌면 다시 받는다");
ok(!m.needsGeocode({ address: "", region: "" }), "주소·지역 둘 다 없으면 안 묻는다");

console.log(`\n사업장 지도 테스트 ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
