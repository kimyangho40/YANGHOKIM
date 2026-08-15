// audit-select-columns.mjs 의 payload 파서 회귀 테스트.
// 실행: node scripts/test-audit-parser.mjs
//
// 왜 필요한가:
//   감사 스크립트가 "문제 0곳"이라고 말할 때, 그게 **정말 깨끗해서**인지
//   **파서가 아무것도 못 읽어서**인지 구분이 안 되면 아무 의미가 없다.
//   그래서 일부러 틀린 코드를 넣고 "잡아내는지"를 확인한다(red 확인).
import { topLevelKeys, findBalanced, collectWrites } from "./audit-select-columns.mjs";

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  if (cond) { pass++; console.log("  ✅ " + label); }
  else { fail++; console.log("  ❌ " + label + (detail ? "  → " + detail : "")); }
};
const keysOf = (t) => topLevelKeys(t).keys.sort().join(",");

console.log("■ 객체 리터럴에서 최상위 키만 뽑는가");
check("평범한 키", keysOf('{ name: "a", stage: "b" }') === "name,stage");
check("단축 속성", keysOf("{ name, stage }") === "name,stage");
check("문자열 키", keysOf('{ "name": 1, "stage": 2 }') === "name,stage");
check("섞인 형태", keysOf('{ name, "stage": 2, fee: 3 }') === "fee,name,stage");
check("중첩 객체의 안쪽 키는 제외",
  keysOf('{ name: "a", accounts: { inner: 1, deep: { x: 2 } } }') === "accounts,name",
  keysOf('{ name: "a", accounts: { inner: 1, deep: { x: 2 } } }'));
check("배열 값의 안쪽은 제외",
  keysOf('{ agency_list: ["a", "b"], name: 1 }') === "agency_list,name");
check("함수 호출 값 안쪽은 제외",
  keysOf('{ updated_at: new Date().toISOString(), name: f({ x: 1 }) }') === "name,updated_at",
  keysOf('{ updated_at: new Date().toISOString(), name: f({ x: 1 }) }'));
check("문자열 안의 중괄호에 안 속는다",
  keysOf('{ content: "여기 } 중괄호", name: 1 }') === "content,name",
  keysOf('{ content: "여기 } 중괄호", name: 1 }'));
check("주석 안의 중괄호에 안 속는다",
  keysOf('{ /* } */ name: 1, // }\n stage: 2 }') === "name,stage",
  keysOf('{ /* } */ name: 1, // }\n stage: 2 }'));
check("스프레드는 unknown 표시", topLevelKeys('{ ...rest, name: 1 }').unknown === true);
check("스프레드가 있어도 나머지 키는 읽는다", topLevelKeys('{ ...rest, name: 1 }').keys.join(",") === "name");
check("계산된 키는 unknown 표시", topLevelKeys("{ [k]: 1, name: 2 }").unknown === true);

console.log("■ 괄호 짝 맞추기");
// findBalanced 는 닫는 괄호 **다음** 위치(exclusive)를 준다 → 전체 길이와 같아야 정상
check("문자열 속 닫는 괄호 무시", findBalanced('{ a: "}" }', 0) === '{ a: "}" }'.length,
  String(findBalanced('{ a: "}" }', 0)));
check("중첩 객체", findBalanced("{ a: { b: 1 } }", 0) === 15, String(findBalanced("{ a: { b: 1 } }", 0)));

console.log("■ 실제 호출 형태를 인식하는가");
const src = `
supabase.from("companies").update({ name: 1, zzz: 2 }).eq("id", x);
supabase.from("agency_cases").insert([{ business_name: "a", zzz2: 1 }]);
supabase.from("companies").upsert({ zzz3: 1 });
supabase.from("companies").update(payloadVar);
writeGuarded({ table: "work_notes", op: "update", id: n, payload: { zzz4: 1 }, label: "x" });
writeGuarded({ table: "companies", op: "update", id: n, payload: somePatch, label: "y" });
`;
const w = collectWrites(src);
const find = (tbl, kind) => w.find((x) => x.table === tbl && x.kind === kind);
check("update 리터럴", (find("companies", "update") || {}).keys.join(",") === "name,zzz");
check("배열 insert", (find("agency_cases", "insert") || {}).keys.join(",") === "business_name,zzz2");
check("upsert", (find("companies", "upsert") || {}).keys.join(",") === "zzz3");
check("writeGuarded 리터럴 payload", (find("work_notes", "writeGuarded") || {}).keys.join(",") === "zzz4");
check("변수 payload 는 dynamic",
  w.filter((x) => x.dynamic).length === 2, JSON.stringify(w.filter((x) => x.dynamic).map((x) => x.table + "." + x.kind)));

console.log("\n결과: " + pass + " pass / " + fail + " fail");
process.exit(fail ? 1 : 0);
