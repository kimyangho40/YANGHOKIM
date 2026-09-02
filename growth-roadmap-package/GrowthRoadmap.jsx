// 성장 로드맵 — CRM(React CRA + Supabase) 드롭인 컴포넌트
// 사용법:
//   1) crm/supabase_growth_roadmap.sql 을 Supabase SQL Editor 에서 실행 (테이블 + 시드)
//   2) 이 파일을 src/pages/GrowthRoadmap.jsx 로 복사, 라우트 추가:
//        <Route path="/growth-roadmap" element={<GrowthRoadmap supabase={supabase} />} />
//   3) 사이드바 메뉴에 "성장 로드맵" 항목 추가 (기관 사이트 옆 권장, 아이콘 🧭)
//   4) (선택) 기업 상세 드로어에서 <GrowthRoadmap industry="mfg" embedded /> 로 해당 업종만 표시
// 의존성: React 17+, @supabase/supabase-js v2. 스타일은 하단 <style> 자체 완결 — 전역 CSS 오염 없음.
// 폴백: supabase prop 을 안 주면 ../roadmap.json 을 staticData 로 넘겨 동작.

import React, { useEffect, useMemo, useState } from "react";

const FALLBACK_COPY = {
  title: "어떤 사업을 하고 계신가요?",
  intro: "공고는 해마다 바뀌지만 “음식점 → OEM → 유통 → 수출”은 바뀌지 않습니다. 그래서 한국기업진단협회는 이 지도를 따로 관리합니다.",
  path_footer: "대표님 회사에 지금 무엇이 필요한지는 기업정보를 넣어야 판정할 수 있습니다. 정보 없이 ‘자금 필요’라고 적지 않습니다.",
  disclaimer: "성장 시나리오 예시입니다. 실제 고객 사례가 아니며 결과는 사업 여건에 따라 달라집니다.",
  cta: "내 기업으로 확인", prep_label: "이 방향에서 준비할 것", opps_label: "활용할 수 있는 기회",
  found_suffix: "개 경로 발견", opens_suffix: "건 열림",
  analyze_headline: "그렇다면, 대표님 회사는 어떨까요?",
  analyze_sub: "업종을 고르고 이미 갖춘 서류·인증에 표시하면, 어느 경로가 가장 가깝고 무엇이 남았는지 보여드립니다. 입력한 내용은 저장되지 않습니다.",
  analyze_cta: "내 기업 분석하기", analyze_pick: "업종을 선택하세요", analyze_have: "이미 갖춘 것에 표시하세요",
  analyze_result: "대표님 회사에서 가까운 순서", analyze_left: "남은 준비물", analyze_done: "준비물 충족",
  analyze_note: "체크한 정보만으로 계산한 거리입니다. 정확한 판정은 기업정보를 보고 해야 합니다 — 상담 1533-8728.",
};
const INDUSTRY_ORDER = ["food", "service", "retail", "build", "edu", "mfg", "it"];

export default function GrowthRoadmap({ supabase, staticData, industry, embedded = false, onCta }) {
  const [rows, setRows] = useState([]);
  const [copy, setCopy] = useState(FALLBACK_COPY);
  const [cur, setCur] = useState(industry || "food");
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAz, setShowAz] = useState(false);
  const [azInd, setAzInd] = useState(industry || "food");
  const [azHave, setAzHave] = useState(() => new Set());

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (supabase) {
          const { data, error } = await supabase.from("growth_paths").select("*")
            .eq("is_active", true).order("sort_order");
          if (error) throw error;
          if (!alive) return;
          setRows(data.map(r => ({
            id: r.id, industry: r.industry, label: r.industry_label, from: r.from_stage,
            to: r.to_stage, months: r.months, opens: r.opens, summary: r.summary,
            prep: r.prep || {}, opps: r.opportunities || [],
          })));
          const { data: c } = await supabase.from("growth_roadmap_copy").select("copy").eq("id", 1).maybeSingle();
          if (alive && c?.copy) setCopy({ ...FALLBACK_COPY, ...c.copy });
        } else if (staticData) {
          const IND = Object.fromEntries(staticData.industries.map(i => [i.id, i.label]));
          setRows(staticData.paths.map(p => ({ ...p, label: IND[p.industry] })));
          if (staticData.copy) setCopy({ ...FALLBACK_COPY, ...staticData.copy });
        }
      } catch (e) { console.error("[GrowthRoadmap] load failed", e); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [supabase, staticData]);

  const industries = useMemo(() => {
    const seen = new Map();
    rows.forEach(r => seen.set(r.industry, r.label));
    return INDUSTRY_ORDER.filter(id => seen.has(id)).map(id => ({ id, label: seen.get(id) }));
  }, [rows]);

  const list = useMemo(() => rows.filter(r => r.industry === cur), [rows, cur]);
  const open = openId ?? list[0]?.id;

  if (loading) return <div className="gr-wrap">불러오는 중…</div>;

  return (
    <div className={"gr-wrap" + (embedded ? " gr-embedded" : "")}>
      <style>{CSS}</style>
      {!embedded && (<>
        <div className="gr-eyebrow">성장경로</div>
        <h1 className="gr-h1">{copy.title}</h1>
        <p className="gr-intro">{copy.intro}</p>
      </>)}
      {!industry && (
        <div className="gr-tabs" role="tablist">
          {industries.map(i => (
            <button key={i.id} role="tab" aria-selected={i.id === cur}
              className={"gr-tab" + (i.id === cur ? " on" : "")}
              onClick={() => { setCur(i.id); setOpenId(null); }}>{i.label}</button>
          ))}
        </div>
      )}
      <div className="gr-grid">
        {!embedded && (
          <aside className="gr-now">
            <span className="gr-nowlbl">현재</span>
            <div className="gr-nownm">{industries.find(i => i.id === cur)?.label}</div>
            <div className="gr-nowcnt">{list.length}{copy.found_suffix}</div>
          </aside>
        )}
        <main className="gr-paths">
          {list.map(p => (
            <article key={p.id} className={"gr-path" + (p.id === open ? " open" : "")}>
              <button className="gr-phead" aria-expanded={p.id === open}
                onClick={() => setOpenId(open === p.id ? 0 : p.id)}>
                <h3>{p.from} → {p.to}</h3>
                <span className="gr-meta">{p.months} · +{p.opens}{copy.opens_suffix}</span>
              </button>
              <div className="gr-crumb" onClick={() => setOpenId(open === p.id ? 0 : p.id)}>
                <span className="c1">{p.from}</span><span className="arr">→</span><span className="c2">{p.to}</span>
              </div>
              {p.id === open && (
                <div className="gr-pbody">
                  <p className="gr-summary">{p.summary}</p>
                  <div className="gr-cols">
                    <div>
                      <div className="gr-colh">{copy.prep_label}</div>
                      {Object.entries(p.prep).map(([g, chips]) => (
                        <React.Fragment key={g}>
                          <div className="gr-gname">{g}</div>
                          <div className="gr-chips">{chips.map(c => <span key={c} className="gr-chip">{c}</span>)}</div>
                        </React.Fragment>
                      ))}
                    </div>
                    <div>
                      <div className="gr-colh">{copy.opps_label}</div>
                      <div className="gr-chips" style={{ marginTop: 8 }}>
                        {p.opps.map(c => <span key={c} className="gr-chip white">{c}</span>)}
                      </div>
                    </div>
                  </div>
                  <div className="gr-pfoot">{copy.path_footer}</div>
                </div>
              )}
            </article>
          ))}
        </main>
      </div>
      <p className="gr-disclaimer">{copy.disclaimer}</p>

      <section className="gr-analyze">
        <div>
          <h2>{copy.analyze_headline}</h2>
          <p>{copy.analyze_sub}</p>
        </div>
        <button className="gr-azgo" onClick={() => { setAzInd(cur); setAzHave(new Set()); setShowAz(true); }}>
          {copy.analyze_cta}
        </button>
      </section>
      {onCta && <div className="gr-ctabar"><button className="gr-cta" onClick={onCta}>{copy.cta}</button></div>}

      {showAz && (
        <div className="gr-ovl" role="dialog" aria-modal="true" onClick={e => { if (e.target === e.currentTarget) setShowAz(false); }}>
          <div className="gr-modal">
            <button className="gr-x" aria-label="닫기" onClick={() => setShowAz(false)}>✕</button>
            <h2>{copy.analyze_cta}</h2>
            <div className="gr-msub">{copy.analyze_sub}</div>
            <div className="gr-step">1 · {copy.analyze_pick}</div>
            <div className="gr-ipills">
              {industries.map(i => (
                <button key={i.id} className={"gr-ipill" + (i.id === azInd ? " on" : "")}
                  onClick={() => { setAzInd(i.id); setAzHave(new Set()); }}>{i.label}</button>
              ))}
            </div>
            <div className="gr-step">2 · {copy.analyze_have}</div>
            <div className="gr-havegrid">
              {(() => {
                const groups = new Map();
                rows.filter(r => r.industry === azInd).forEach(r => Object.entries(r.prep).forEach(([g, chips]) => {
                  if (!groups.has(g)) groups.set(g, []);
                  chips.forEach(c => { if (!groups.get(g).includes(c)) groups.get(g).push(c); });
                }));
                const out = [];
                groups.forEach((chips, g) => chips.forEach(c => out.push(
                  <label key={g + c} className={"gr-have" + (azHave.has(c) ? " on" : "")}>
                    <input type="checkbox" checked={azHave.has(c)} onChange={e => {
                      const next = new Set(azHave); e.target.checked ? next.add(c) : next.delete(c); setAzHave(next);
                    }} />{g} · {c}
                  </label>
                )));
                return out;
              })()}
            </div>
            <div className="gr-step">3 · {copy.analyze_result}</div>
            <div className="gr-res">
              {rows.filter(r => r.industry === azInd)
                .map(p => { const need = Object.values(p.prep).flat(); const left = need.filter(c => !azHave.has(c)); return { p, need, left }; })
                .sort((a, b) => a.left.length - b.left.length || b.p.opens - a.p.opens)
                .map((s, i) => {
                  const pct = s.need.length ? Math.round((s.need.length - s.left.length) / s.need.length * 100) : 100;
                  return (
                    <div key={s.p.id} className={"gr-resrow" + (i === 0 ? " best" : "")}>
                      <div className="t"><b>{s.p.from} → {s.p.to}</b><span>{s.p.months} · +{s.p.opens}{copy.opens_suffix}</span></div>
                      <div className="gr-bar"><i style={{ width: pct + "%" }} /></div>
                      <div className="gr-left">
                        {s.left.length === 0
                          ? `${copy.analyze_done} ${s.need.length}/${s.need.length}`
                          : <>{copy.analyze_left} {s.left.length}개 — {s.left.map(c => <span key={c} className="gr-chip" style={{ margin: "2px 3px 0 0", display: "inline-block" }}>{c}</span>)}</>}
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="gr-mnote">{copy.analyze_note}</div>
          </div>
        </div>
      )}
    </div>
  );
}

const CSS = `
.gr-wrap{--line:#e3e8f0;--line2:#d7deea;--ink:#141a26;--tx:#333c4d;--sub:#7a8496;--faint:#a3abbb;--navy:#16233f;--blue:#2b5fd9;font-size:14px;color:var(--tx);letter-spacing:-.01em}
.gr-eyebrow{font-size:11px;font-weight:800;letter-spacing:.14em;color:var(--blue)}
.gr-h1{font-size:24px;font-weight:800;color:var(--ink);margin:8px 0 10px}
.gr-intro{font-size:13.5px;color:var(--sub);max-width:620px;line-height:1.7}
.gr-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0 16px}
.gr-tab{border:1px solid var(--line2);background:#fff;color:var(--tx);font:inherit;font-size:12.5px;font-weight:600;padding:7px 14px;border-radius:999px;cursor:pointer}
.gr-tab.on{background:var(--navy);border-color:var(--navy);color:#fff;font-weight:700}
.gr-grid{display:grid;grid-template-columns:150px 1fr;gap:16px;align-items:start}
.gr-embedded .gr-grid{grid-template-columns:1fr}
@media(max-width:760px){.gr-grid{grid-template-columns:1fr}}
.gr-now{background:var(--navy);border-radius:10px;color:#fff;padding:16px 14px;text-align:center}
.gr-nowlbl{font-size:9.5px;font-weight:800;letter-spacing:.12em;color:#8fa3c8;border:1px solid #3a4a6b;border-radius:4px;display:inline-block;padding:2px 7px}
.gr-nownm{font-size:16.5px;font-weight:800;margin:10px 0 8px}
.gr-nowcnt{font-size:11px;color:#9fb0cf}
.gr-paths{display:flex;flex-direction:column;gap:10px}
.gr-path{background:#fff;border:1px solid var(--line);border-radius:10px;overflow:hidden}
.gr-path.open{background:#f3f7ff;border-color:#c9d8f2;border-left:3px solid var(--blue)}
.gr-phead{display:flex;justify-content:space-between;gap:12px;padding:14px 18px 0;cursor:pointer;background:none;border:0;width:100%;text-align:left;font:inherit}
.gr-phead h3{font-size:14.5px;font-weight:800;color:var(--ink);margin:0}
.gr-meta{font-size:11px;color:var(--faint);white-space:nowrap;font-weight:600;padding-top:2px}
.gr-crumb{display:flex;align-items:center;gap:7px;padding:8px 18px 14px;cursor:pointer}
.gr-crumb .c1{background:#e8effc;color:var(--blue);font-size:11px;font-weight:700;padding:3px 9px;border-radius:5px}
.gr-crumb .arr{color:var(--faint);font-size:11px}
.gr-crumb .c2{background:#fff;border:1px solid var(--line2);font-size:11px;font-weight:600;padding:3px 9px;border-radius:5px}
.gr-pbody{padding:2px 18px 14px}
.gr-summary{font-size:13px;line-height:1.75;margin:0 0 14px;max-width:680px}
.gr-cols{display:grid;grid-template-columns:1fr 1fr;gap:18px}
@media(max-width:640px){.gr-cols{grid-template-columns:1fr}}
.gr-colh{font-size:10.5px;font-weight:700;color:var(--faint);letter-spacing:.06em;margin-bottom:8px}
.gr-gname{font-size:10px;font-weight:600;color:var(--sub);margin:8px 0 4px}
.gr-chips{display:flex;flex-wrap:wrap;gap:5px}
.gr-chip{background:#f8fafc;border:1px solid var(--line2);border-radius:5px;font-size:11px;font-weight:600;padding:3px 9px}
.gr-chip.white{background:#fff}
.gr-pfoot{margin-top:14px;padding-top:10px;border-top:1px solid var(--line);font-size:10.5px;color:var(--faint)}
.gr-disclaimer{margin-top:16px;font-size:10.5px;color:var(--faint)}
.gr-ctabar{margin-top:20px}
.gr-cta{background:var(--navy);color:#fff;border:0;font:inherit;font-size:13px;font-weight:700;padding:11px 22px;border-radius:8px;cursor:pointer}
.gr-analyze{margin-top:30px;background:var(--navy);border-radius:12px;padding:26px 28px;display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}
.gr-analyze h2{color:#fff;font-size:18px;font-weight:800;margin:0}
.gr-analyze p{color:#9fb0cf;font-size:12.5px;max-width:520px;margin:6px 0 0;line-height:1.7}
.gr-azgo{background:#fff;color:var(--navy);border:0;font:inherit;font-size:13.5px;font-weight:800;padding:12px 24px;border-radius:8px;cursor:pointer;white-space:nowrap}
.gr-ovl{position:fixed;inset:0;background:rgba(10,16,30,.55);display:flex;align-items:flex-start;justify-content:center;padding:5vh 16px;z-index:1000;overflow:auto}
.gr-modal{background:#fff;border-radius:14px;max-width:640px;width:100%;padding:26px 28px;position:relative}
.gr-x{position:absolute;top:14px;right:16px;background:none;border:0;font-size:18px;color:var(--faint);cursor:pointer;line-height:1}
.gr-modal h2{font-size:18px;font-weight:800;color:var(--ink);margin:0 24px 4px 0}
.gr-msub{font-size:12px;color:var(--sub);margin-bottom:14px}
.gr-step{font-size:10.5px;font-weight:800;letter-spacing:.08em;color:var(--blue);margin:16px 0 8px}
.gr-ipills{display:flex;flex-wrap:wrap;gap:6px}
.gr-ipill{border:1px solid var(--line2);background:#fff;font:inherit;font-size:12px;font-weight:600;padding:6px 12px;border-radius:999px;cursor:pointer}
.gr-ipill.on{background:var(--navy);border-color:var(--navy);color:#fff;font-weight:700}
.gr-havegrid{display:flex;flex-wrap:wrap;gap:6px}
.gr-have{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line2);background:#f8fafc;border-radius:6px;font-size:11.5px;font-weight:600;padding:5px 10px;cursor:pointer;user-select:none}
.gr-have input{accent-color:var(--blue);margin:0}
.gr-have.on{border-color:var(--blue);background:#e8effc;color:var(--blue)}
.gr-res{display:flex;flex-direction:column;gap:8px;margin-top:8px}
.gr-resrow{border:1px solid var(--line);border-radius:9px;padding:11px 14px;background:#fff}
.gr-resrow.best{border-color:#c9d8f2;background:#f3f7ff;border-left:3px solid var(--blue)}
.gr-resrow .t{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.gr-resrow .t b{font-size:13px;color:var(--ink)}
.gr-resrow .t span{font-size:10.5px;color:var(--faint);white-space:nowrap;font-weight:600}
.gr-bar{height:5px;background:#edf0f5;border-radius:3px;margin:8px 0 7px;overflow:hidden}
.gr-bar i{display:block;height:100%;background:var(--blue);border-radius:3px}
.gr-left{font-size:11px;color:var(--sub)}
.gr-mnote{margin-top:14px;padding-top:11px;border-top:1px solid var(--line);font-size:10.5px;color:var(--faint)}
`;
