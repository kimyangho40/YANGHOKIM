// 매출액 입력칸 회귀 테스트 (수동 입력 뒷자리 잘림 사고 재발 방지).
// 실행: node scripts/test-revenue-input.mjs
//
// src/App.js 에서 normalizeRevenueInput·formatRevenue 소스를 그대로 떼어내 돌린다 —
// 손으로 옮겨 적으면 검증이 아니라 연기가 된다.
import fs from "node:fs";
const src=fs.readFileSync("src/App.js","utf8");
const a=src.indexOf("var REVENUE_MAX_DIGITS");
const b=src.indexOf("const formatRevenue = (val) =>",a);
const c=src.indexOf("\r\n// ",b);
const mod=await import("data:text/javascript;charset=utf-8,"+encodeURIComponent(
  src.slice(a,b)+src.slice(b,c).replace("const formatRevenue","const formatRevenue")+"\nexport {normalizeRevenueInput, formatRevenue};"));
const {normalizeRevenueInput:N, formatRevenue:F}=mod;
let pass=0,fail=0;
const ck=(l,cond,d)=>{cond?(pass++,console.log("  ✅ "+l)):(fail++,console.log("  ❌ "+l+" → "+d));};
const p=(s)=>{const d=N(s);return d?parseInt(d,10):"";};

console.log("■ 요청한 회귀 케이스");
ck('"3002936000" → 3,002,936,000', p("3002936000")===3002936000, p("3002936000"));
ck('"3002936000" 표시 = 30억 293만 6천', F(p("3002936000"))==="30억 293만 6천", F(p("3002936000")));
ck('"790000000" → 790,000,000', p("790000000")===790000000, p("790000000"));
ck('"790000000" 표시 = 7억 9천만', F(p("790000000"))==="7억 9천만", F(p("790000000")));
console.log("■ 붙여넣기·오타에 안 잘린다 (옛 type=number 는 통째로 빈칸이 됐다)");
ck('"3,002,936,000" 콤마 붙여넣기', p("3,002,936,000")===3002936000, p("3,002,936,000"));
ck('"3002936000원"', p("3002936000원")===3002936000, p("3002936000원"));
ck('" 3 002 936 000 "', p(" 3 002 936 000 ")===3002936000, p(" 3 002 936 000 "));
ck('"3e9" 는 3 이 되지 않는다', p("3e9")===39, p("3e9"));
ck('앞 0 제거', N("0003002936000")==="3002936000", N("0003002936000"));
console.log("■ 자릿수 상한 12자리(9,999억)");
ck('12자리 그대로', p("999999999999")===999999999999, p("999999999999"));
ck('13자리는 13번째부터 안 받는다', N("1234567890123")==="123456789012", N("1234567890123"));
console.log("■ 빈칸·비숫자");
ck("빈 문자열", N("")==="" );
ck("문자만", N("abc")==="" );
ck('"0" 은 유지', N("0")==="0", N("0"));
console.log("\n"+(fail?"🔴":"🟢")+" 통과 "+pass+" / 실패 "+fail);
process.exit(fail?1:0);
