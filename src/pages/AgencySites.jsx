// 정부 기관 사이트 — CRM(React CRA + Supabase) 드롭인 컴포넌트
// 사용법:
//   1) crm/supabase_agency_sites.sql 을 Supabase SQL Editor 에서 실행 (테이블 + 시드 256건)
//   2) 이 파일을 src/pages/AgencySites.jsx 로 복사, 라우트 추가:  <Route path="/agency-sites" element={<AgencySites supabase={supabase} />} />
//   3) 사이드바 메뉴에 "기관 사이트" 항목 추가 (아이콘 🏛️ 권장)
// 의존성: React 17+, @supabase/supabase-js v2. 스타일은 이 파일 하단 CSS(인라인 <style>)로 자체 완결 — 전역 CSS 오염 없음.
// 폴백: supabase prop 을 안 주면 ../agencies.json 을 정적 import 해 동작 (즐겨찾기는 localStorage).

import React, { useEffect, useMemo, useState, useCallback } from "react";

const REGION_CAT = "지자체·지역사업";
const CATEGORIES = [
  ["정책자금", "🏦"], ["정부지원금", "💰"], ["R&D", "🔬"], ["투자", "💎"],
  ["바우처", "🎫"], ["창업", "🚀"], ["고용", "👥"], ["수출·판로", "🌐"],
  ["기업인증·IP", "🏅"], ["조달", "🖨️"], ["교육", "🎓"], [REGION_CAT, "📍"],
];
const REGIONS = ["서울","경기","인천","부산","대구","광주","대전","울산","세종","강원","충북","충남","전북","전남","경북","경남","제주"];
const QUICK = ["스마트공장","수출","R&D","인건비","특허","관광","농업","콘텐츠","바우처","청년","시설자금","재기","TIPS","LIPS","서울","경기"];
const ICON = Object.fromEntries(CATEGORIES);
const LS_KEY = "agencySites.fav.v1";

export default function AgencySites({ supabase, staticData }) {
  const [rows, setRows] = useState([]);
  const [favs, setFavs] = useState(() => new Set());
  const [userId, setUserId] = useState(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("전체");
  const [region, setRegion] = useState("전체");
  const [type, setType] = useState("전체");
  const [favOnly, setFavOnly] = useState(false);
  const [pickRegion, setPickRegion] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── load data (Supabase → fallback static JSON)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (supabase) {
          const { data, error } = await supabase.from("agency_sites").select("*").eq("is_active", true).order("sort_order");
          if (error) throw error;
          if (!alive) return;
          setRows(data.map(r => ({ ...r, desc: r.description })));
          const { data: u } = await supabase.auth.getUser();
          const uid = u?.user?.id || null; setUserId(uid);
          if (uid) {
            const { data: f } = await supabase.from("agency_site_favorites").select("site_id").eq("user_id", uid);
            if (alive && f) setFavs(new Set(f.map(x => x.site_id)));
          }
        } else if (staticData) {
          setRows(staticData.agencies);
          try { setFavs(new Set(JSON.parse(localStorage.getItem(LS_KEY) || "[]"))); } catch (_) {}
        }
      } catch (e) { console.error("[AgencySites] load failed", e); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [supabase, staticData]);

  const toggleFav = useCallback(async (id) => {
    const next = new Set(favs); const on = !next.has(id);
    on ? next.add(id) : next.delete(id); setFavs(next);
    if (supabase && userId) {
      on ? await supabase.from("agency_site_favorites").insert({ user_id: userId, site_id: id })
         : await supabase.from("agency_site_favorites").delete().match({ user_id: userId, site_id: id });
    } else { try { localStorage.setItem(LS_KEY, JSON.stringify([...next])); } catch (_) {} }
  }, [favs, supabase, userId]);

  const types = useMemo(() => [...new Set(rows.map(r => r.type))], [rows]);
  const terms = useMemo(() => q.toLowerCase().split(/\s+/).filter(Boolean), [q]);
  const hay = (x) => [x.name, x.org, x.desc, x.region, x.type, x.category, x.url, ...(x.tags || [])].join(" ").toLowerCase();
  const base = useMemo(() => rows.filter(x =>
    (!terms.length || terms.every(t => hay(x).includes(t))) &&
    (region === "전체" || x.region === region) &&
    (type === "전체" || x.type === type) &&
    (!favOnly || favs.has(x.id))), [rows, terms, region, type, favOnly, favs]);
  const list = useMemo(() => {
    let r = cat === "전체" ? base : base.filter(x => x.category === cat);
    if (cat === REGION_CAT && pickRegion) r = r.filter(x => x.region === pickRegion);
    return r;
  }, [base, cat, pickRegion]);
  const showPicker = cat === REGION_CAT && region === "전체" && !q && !favOnly && !pickRegion;
  const regionRows = base.filter(x => x.category === REGION_CAT);

  const reset = () => { setQ(""); setCat("전체"); setRegion("전체"); setType("전체"); setFavOnly(false); setPickRegion(null); };
  const host = (u) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="ags">
      <style>{CSS}</style>
      <div className="ags-head"><h1>정부 기관 사이트<small>대한민국 기업지원 기관 포털</small></h1><div className="ags-count">기관 <b>{rows.length}</b></div></div>

      <div className={"ags-search" + (q ? " has" : "")}>
        <span className="ico">🔍</span>
        <input value={q} onChange={e => { setQ(e.target.value); setPickRegion(null); }} placeholder="기관명 · 사업명 · 키워드 · 지역 · 지원분야로 검색   (예: 스마트공장, 수출, 서울, R&D, 인건비, 특허, 관광, 농업, 콘텐츠)" />
        {q && <button className="clr" onClick={() => setQ("")}>✕</button>}
      </div>

      <div className="ags-quick"><span className="lbl">추천 검색</span>{QUICK.map(k => <button key={k} onClick={() => { setQ(k); setCat("전체"); setPickRegion(null); }}>{k}</button>)}</div>

      <div className="ags-cats">
        {[["전체", "🗂️"], ...CATEGORIES].map(([k, ic]) => {
          const n = k === "전체" ? base.length : base.filter(x => x.category === k).length;
          return <button key={k} className={"cat" + (cat === k ? " on" : "")} onClick={() => { setCat(k); setPickRegion(null); }}><span className="em">{ic}</span>{k}<span className="n">{n}</span></button>;
        })}
      </div>

      <div className="ags-bar">
        <label className="f">지역 <select value={region} onChange={e => { setRegion(e.target.value); setPickRegion(null); }}><option value="전체">전체 지역</option><option value="전국">전국</option>{REGIONS.map(r => <option key={r} value={r}>{r}</option>)}</select></label>
        <label className="f">기관유형 <select value={type} onChange={e => setType(e.target.value)}><option value="전체">전체 유형</option>{types.map(t => <option key={t} value={t}>{t}</option>)}</select></label>
        <button className={"tog" + (favOnly ? " on" : "")} onClick={() => { setFavOnly(v => !v); setPickRegion(null); }}>★ 즐겨찾기만</button>
        <button className="reset" onClick={reset}>필터 초기화</button>
        <div className="stat">표시 <b>{list.length}</b> / 전체 <b>{rows.length}</b>곳 · 즐겨찾기 <b>{favs.size}</b>곳</div>
      </div>

      {loading && <div className="ags-empty">불러오는 중…</div>}

      {!loading && showPicker && (
        <div className="ags-rp">
          <h3>📍 지역을 선택하세요</h3>
          <p>17개 시·도별로 그 지역의 핵심 기업지원 기관만 모았습니다. 시·도청 · 테크노파크 · 경제진흥원 · 창조경제혁신센터 · 지역신용보증재단 순으로 보여드려요.</p>
          <div className="grid">{REGIONS.map(r => <button key={r} onClick={() => setPickRegion(r)}><span>📍 {r}</span><span className="n">{regionRows.filter(x => x.region === r).length}</span></button>)}</div>
        </div>
      )}
      {!loading && cat === REGION_CAT && pickRegion && (
        <div className="ags-crumb"><button className="back" onClick={() => setPickRegion(null)}>← 지역 다시 선택</button><span className="cur">📍 {pickRegion}</span><span className="sub">주요 기업지원 기관 {list.length}곳</span></div>
      )}

      {!loading && !showPicker && (
        <div className="ags-grid">
          {list.length === 0 && <div className="ags-empty" style={{ gridColumn: "1/-1" }}>조건에 맞는 기관이 없습니다. 검색어나 필터를 바꿔보세요.</div>}
          {list.map(x => {
            const fav = favs.has(x.id);
            return (
              <article key={x.id} className={"card" + (fav ? " fav" : "")}>
                <div className="top"><div className="ic">{ICON[x.category] || "🏢"}</div><div><div className="nm">{x.name}</div><div className="og">{x.org}</div></div></div>
                <button className="star" title="즐겨찾기" onClick={() => toggleFav(x.id)}>{fav ? "★" : "☆"}</button>
                <div className="ds">{x.desc}</div>
                <div className="pills"><span className="pill c">{x.category}</span><span className="pill r">{x.region}</span><span className="pill t">{x.type}</span></div>
                <div className="tags">{(x.tags || []).filter(t => t !== x.region && t !== "지자체").slice(0, 6).map(t => <button key={t} className="tag" onClick={() => { setQ(t); setCat("전체"); setPickRegion(null); }}># {t}</button>)}</div>
                <div className="ft"><span className="url" title={x.url}>{host(x.url)}</span><a className="open" href={x.url} target="_blank" rel="noopener noreferrer">사이트 열기 →</a></div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

const CSS = `
.ags{--bg:#f4f3ee;--panel:#fff;--line:#e6e4dc;--line-2:#d9d6cc;--ink:#1d1f1a;--ink-2:#4b4f47;--ink-3:#8a8e85;--ink-4:#b3b6ae;--green:#1f3f31;--green-2:#2b5442;--green-tint:#e7efe9;--gold-tint:#f6efd9;--gold-ink:#7a5a12;--blue-tint:#e6eef8;--blue-ink:#2a4f7c;--chip:#f3f2ec;--star:#e0b12b;--sh:0 1px 2px rgba(20,25,20,.04),0 6px 18px rgba(20,25,20,.05);--r:12px;--rs:8px;
  background:var(--bg);color:var(--ink);font-size:14px;line-height:1.5;padding:22px;border-radius:var(--r);min-height:100%}
.ags *{box-sizing:border-box}.ags button{font:inherit;color:inherit;cursor:pointer;background:none;border:0;padding:0}.ags a{color:inherit;text-decoration:none}
.ags-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:12px}.ags-head h1{margin:0;font-size:21px;font-weight:800}.ags-head h1 small{margin-left:10px;font-size:12px;font-weight:500;color:var(--ink-3)}.ags-count{font-size:12px;color:var(--ink-3)}.ags-count b{color:var(--ink-2)}
.ags-search{position:relative;background:var(--panel);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--sh)}.ags-search input{width:100%;border:0;background:transparent;padding:14px 40px 14px 42px;font:inherit;font-size:14px;color:var(--ink);outline:none;border-radius:var(--r)}.ags-search .ico{position:absolute;left:15px;top:50%;transform:translateY(-50%);font-size:14px}.ags-search .clr{position:absolute;right:10px;top:50%;transform:translateY(-50%);width:24px;height:24px;border-radius:50%;background:var(--chip);color:var(--ink-3);font-size:13px}
.ags-quick{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:10px 0 12px}.ags-quick .lbl{font-size:12px;color:var(--ink-3)}.ags-quick button{font-size:12px;padding:3px 9px;border:1px solid var(--line-2);border-radius:999px;background:#fff;color:var(--ink-2)}.ags-quick button:hover{border-color:var(--green);color:var(--green)}
.ags-cats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}.ags-cats .cat{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border:1px solid var(--line-2);border-radius:999px;background:#fff;font-size:13px;font-weight:600;color:var(--ink-2)}.ags-cats .cat .n{font-size:11px;color:var(--ink-3)}.ags-cats .cat.on{background:var(--green);border-color:var(--green);color:#fff}.ags-cats .cat.on .n{color:rgba(255,255,255,.75)}
.ags-bar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:9px 12px;margin-bottom:14px}.ags-bar .f{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--ink-3)}.ags-bar select{font:inherit;font-size:13px;font-weight:600;color:var(--ink);border:1px solid var(--line-2);border-radius:var(--rs);background:#fff;padding:5px 9px}.ags-bar .tog{font-size:13px;font-weight:600;color:var(--ink-2);border:1px solid var(--line-2);border-radius:var(--rs);padding:5px 10px;background:#fff}.ags-bar .tog.on{background:var(--gold-tint);border-color:#e6cf8a;color:var(--gold-ink)}.ags-bar .reset{font-size:12px;color:var(--ink-3);text-decoration:underline}.ags-bar .stat{margin-left:auto;font-size:12px;color:var(--ink-3)}.ags-bar .stat b{color:var(--ink)}
.ags-rp{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:16px 18px;margin-bottom:14px;box-shadow:var(--sh)}.ags-rp h3{margin:0 0 3px;font-size:14px;font-weight:800}.ags-rp p{margin:0 0 12px;font-size:12px;color:var(--ink-3)}.ags-rp .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:8px}.ags-rp .grid button{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border:1px solid var(--line-2);border-radius:var(--rs);background:#fff;font-size:13px;font-weight:700}.ags-rp .grid button:hover{border-color:var(--green);background:var(--green-tint)}.ags-rp .grid .n{font-size:11px;font-weight:600;color:var(--ink-3)}
.ags-crumb{display:flex;align-items:center;gap:10px;margin:0 0 12px;font-size:13px}.ags-crumb .back{border:1px solid var(--line-2);border-radius:var(--rs);padding:4px 10px;background:#fff;font-size:12px;font-weight:600}.ags-crumb .cur{font-weight:800}.ags-crumb .sub{color:var(--ink-3);font-size:12px}
.ags-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}@media(max-width:1100px){.ags-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.ags-grid{grid-template-columns:1fr}}
.ags .card{position:relative;display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:14px 14px 12px;box-shadow:var(--sh)}.ags .card.fav{border-color:#e6cf8a}.ags .card .top{display:flex;gap:10px;padding-right:26px}.ags .card .ic{flex:none;width:34px;height:34px;border-radius:9px;background:var(--chip);display:flex;align-items:center;justify-content:center;font-size:16px}.ags .card .nm{font-size:14px;font-weight:800;line-height:1.3}.ags .card .og{font-size:11.5px;color:var(--ink-3)}.ags .card .star{position:absolute;top:11px;right:11px;width:24px;height:24px;border-radius:6px;font-size:15px;color:var(--ink-4)}.ags .card.fav .star{color:var(--star)}.ags .card .ds{font-size:12.5px;color:var(--ink-2);margin:10px 0 9px}
.ags .pills{display:flex;flex-wrap:wrap;gap:5px}.ags .pill{font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;background:var(--chip);color:var(--ink-2)}.ags .pill.c{background:var(--green-tint);color:var(--green)}.ags .pill.r{background:var(--blue-tint);color:var(--blue-ink)}.ags .pill.t{background:var(--gold-tint);color:var(--gold-ink)}
.ags .tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:7px}.ags .tag{font-size:11px;color:var(--ink-3);border:1px solid var(--line);border-radius:6px;padding:1px 6px;background:#fff}.ags .tag:hover{color:var(--green);border-color:var(--green-2)}
.ags .ft{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:12px;padding-top:11px;border-top:1px solid var(--line)}.ags .url{font-size:11px;color:var(--ink-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}.ags .open{flex:none;background:var(--green);color:#fff;font-size:12px;font-weight:700;padding:6px 11px;border-radius:7px}.ags .open:hover{background:var(--green-2)}
.ags-empty{padding:48px 20px;text-align:center;color:var(--ink-3);font-size:13px;background:var(--panel);border:1px dashed var(--line-2);border-radius:var(--r)}
`;
