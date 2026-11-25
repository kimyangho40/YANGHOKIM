// 정책자금·지원금 공고 — 「정부 기관 사이트」 화면 하단 (2026-11-25)
// AgencySites.jsx 가 그린다. 위 기관 목록이 접혀 있어도 이 영역은 항상 보인다.
//   · 데이터: fund_notices(공고) · fund_news_daily(날짜별 뉴스 12건) — 읽기 전용 거울. 채우는 쪽은 supabase/functions/fund-notices.
//   · 분류(종류·지역·카테고리·대상 판정·「최근 공고」)는 수집할 때 굳혀 저장한다. 여기서는 거르고 그리기만 한다.
//   · supabase 를 안 주고 staticData 를 주면 그 값으로 그린다(미리보기·테스트용).
import React, { useEffect, useMemo, useRef, useState } from "react";

// ⛳ 공고화면-계산 시작 — 순수 함수. scripts/test-fund-notices.mjs 가 소스째 떼어내 실행한다(React·supabase 를 들이지 말 것).
const NOTICE_PAGE_SIZE = 10;
const NEWS_KEEP = 10;
const KIND_LABEL = { loan: "융자·대출", guarantee: "보증", interest: "이자 지원", grant: "지원금·보조금", tax: "세제혜택", invest: "투자·펀드", etc: "기타" };
const STATUS_LABEL = { open: "모집중", upcoming: "모집예정", closed: "마감", unknown: "기간 미상" };
const VERDICT_LABEL = { sme: "중소·소상공인", check: "대상 확인 필요", agri: "농어업" };
function kstToday(now) { return new Date((now || new Date()).getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10); }
function noticeStatus(n, today) {
  if (n.end_date && n.end_date < today) return "closed";
  if (n.start_date && n.start_date > today) return "upcoming";
  if (n.start_date || n.end_date) return "open";
  return /소진|상시|수시|마감시|별도/.test(String(n.period || "")) ? "open" : "unknown";
}
// 목록 거르기. cat = 기관 사이트 카테고리 이름("전체" 포함) · scope = "recent"(제목 6낱말) | "all"
function filterNotices(items, f, today) {
  const q = String(f.q || "").trim().toLowerCase();
  return (items || [])
    .filter(n =>
      (f.scope !== "recent" || n.is_recent) &&
      (f.cat === "전체" || (n.cats || []).includes(f.cat)) &&
      (f.region === "전체" || (n.regions || []).includes(f.region)) &&
      (f.showClosed || noticeStatus(n, today) !== "closed") &&
      (f.showAgri || n.verdict !== "agri") &&
      !n.duplicate_of &&
      (!q || [n.title, n.org, n.target, n.content].join(" ").toLowerCase().includes(q)))
    .sort((a, b) => String(b.reg_date || "").localeCompare(String(a.reg_date || "")) || String(a.key).localeCompare(String(b.key)));
}
function pageCount(total) { return Math.max(1, Math.ceil(total / NOTICE_PAGE_SIZE)); }
function pageSlice(list, page) { return list.slice((page - 1) * NOTICE_PAGE_SIZE, page * NOTICE_PAGE_SIZE); }
// 1 … 4 5 [6] 7 8 … 23 — 공고가 몰려 페이지가 늘어도 줄이 넘치지 않게.
function pageButtons(page, pages) {
  const set = new Set([1, pages, page - 2, page - 1, page, page + 1, page + 2].filter(p => p >= 1 && p <= pages));
  const arr = [...set].sort((a, b) => a - b), out = [];
  arr.forEach((p, i) => { if (i && p - arr[i - 1] > 1) out.push("…"); out.push(p); });
  return out;
}
const dot = (ymd) => String(ymd || "").replace(/-/g, ".");
const md = (ymd) => { const p = String(ymd || "").split("-"); return p.length === 3 ? Number(p[1]) + "." + Number(p[2]) : ""; };
function dday(n, today) {
  if (!n.end_date) return null;
  return Math.round((Date.parse(n.end_date + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 86400000);
}
// 변경·정정·재공고는 게시일과 접수 시작일이 다를 수 있다 → 멘트에 게시일을 따로 적는다.
function isChangeNotice(n) { return /변경|정정|수정|재공고|연장|추가\s*모집/.test(String(n.title || "")); }
// 고객에게 보낼 멘트 한 건. 공고에 없는 값은 그 줄을 "공고문 참조"로 둔다(지어내지 않는다).
function noticeMent(n) {
  const region = /^\s*\[/.test(n.title) ? "" : "[" + ((n.regions || ["전국"]).join("·")) + "] ";
  const tail = n.end_date ? "(~" + md(n.end_date) + ")" : "";
  const lines = [region + String(n.title || "").trim() + tail];
  lines.push("접수시작일 : " + (n.start_date ? dot(n.start_date) : "공고문 참조"));
  lines.push("접수기간 : " + (n.start_date && n.end_date ? dot(n.start_date) + " ~ " + dot(n.end_date) : (n.period || "공고문 참조")));
  if (isChangeNotice(n) && n.reg_date && n.reg_date !== n.start_date) lines.push("변경 공고 게시일 : " + dot(n.reg_date));
  lines.push("원문 링크 : " + (n.link || ""));
  const body = String(n.summary || "").replace(/문의\s*전화번호\s*/g, "문의 ").trim()
    || [n.target && "지원 대상은 " + n.target + "입니다.", n.apply_method && "신청 방법: " + n.apply_method.replace(/\n/g, " "), n.contact && "문의 " + n.contact.replace(/\n/g, " ")].filter(Boolean).join(" ");
  lines.push("👉 해당 업종 : " + body);
  return lines.join("\n");
}
// 그날 뉴스 전체 멘트 — 이미지에 실린 순서 그대로, 공고 사이는 빈 줄.
function newsMent(date, notices) {
  return ["📢 " + dot(date) + " 정책자금•지원금 News 💡", ""].concat(notices.map(noticeMent).join("\n\n")).join("\n") + "\n";
}
// 뉴스 카드 오른쪽 강조 칸 — 공고의 「지원 내용」 줄에 있는 숫자만 쓴다(대상 요건의 매출액 같은 숫자를 집지 않게). 없으면 종류 + 신청 가능.
function noticeBadge(n, today) {
  const t = String(n.support || "");
  const out = [];
  const rate = /(금리|이자|이차보전)[^\d%]{0,12}(\d+(?:\.\d+)?)\s*%/.exec(t);
  const amt = /(\d[\d,]*\s*(?:천만|백만|억|만)\s*원)\s*(이내|한도|까지)?/.exec(t);
  if (rate) out.push((rate[1] === "금리" ? "금리 " : "이자 ") + rate[2] + "%");
  else if (amt) out.push(amt[1].replace(/\s+/g, "") + (amt[2] ? " " + amt[2] : ""));
  const d = dday(n, today);
  if (d != null && d >= 0 && d <= 7) out.push("마감 D-" + d);
  if (!out.length) out.push(KIND_LABEL[(n.kinds || ["etc"])[0]] || "공고", "신청 가능");
  return out.slice(0, 2);
}
// ⛳ 공고화면-계산 끝

// ── 뉴스 이미지: 그날의 공고 12건을 캔버스에 그린다(서버에 그림을 저장하지 않는다).
const CARD_COLORS = ["#e03131", "#1c64f2", "#7048e8", "#0c8599", "#a61e4d", "#3b5bdb"];
const KIND_COLORS = { loan: "#1c64f2", guarantee: "#5f3dc4", interest: "#0c8599", grant: "#7048e8", tax: "#b7791f", invest: "#5f3dc4", etc: "#495057" };
function wrapText(ctx, text, maxW, maxLines) {
  const out = []; let line = "";
  for (const ch of String(text || "").replace(/\s+/g, " ").trim()) {
    if (ctx.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; if (out.length === maxLines) break; }
    else line += ch;
  }
  if (out.length < maxLines && line) out.push(line);
  else if (out.length === maxLines && line) { let l = out[maxLines - 1]; while (ctx.measureText(l + "…").width > maxW && l.length) l = l.slice(0, -1); out[maxLines - 1] = l + "…"; }
  return out;
}
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function drawNews(canvas, date, notices) {
  const W = 1080, PAD = 30, GAP = 24, CW = (W - PAD * 2 - GAP) / 2, CH = 340, HEAD = 250;
  const rows = Math.ceil(notices.length / 2);
  const H = HEAD + 30 + rows * (CH + GAP) + 26;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const F = (w, s) => `${w} ${s}px Pretendard, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;
  ctx.fillStyle = "#eef2f8"; ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, W, HEAD); g.addColorStop(0, "#0f1f4d"); g.addColorStop(1, "#1d4ed8");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, HEAD);
  const [y, m, d] = date.split("-").map(Number);
  const wd = "일월화수목금토"[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  ctx.textBaseline = "middle";
  ctx.font = F(700, 26); const dl = `${y}년 ${m}월 ${d}일 (${wd})`; const dw = ctx.measureText(dl).width + 44;
  ctx.fillStyle = "rgba(255,255,255,.14)"; rrect(ctx, PAD, 26, dw, 48, 24); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.fillText(dl, PAD + 22, 51);
  ctx.font = F(800, 66); let x = PAD;
  [["오늘의 ", "#fff"], ["정책자금 ", "#ffd43b"], ["주요공고", "#fff"]].forEach(([t, c]) => { ctx.fillStyle = c; ctx.fillText(t, x, 132); x += ctx.measureText(t).width; });
  ctx.font = F(500, 24); ctx.fillStyle = "#dbe4ff"; ctx.fillText(`지금 신청할 수 있는 공고 ${notices.length}건`, PAD, 202);
  notices.forEach((n, i) => {
    const cx = PAD + (i % 2) * (CW + GAP), cy = HEAD + 30 + Math.floor(i / 2) * (CH + GAP);
    const grant = (n.kinds || []).includes("grant"), special = /특례/.test(n.title);
    ctx.fillStyle = grant ? "#ebfbee" : "#fff"; rrect(ctx, cx, cy, CW, CH, 18); ctx.fill();
    ctx.strokeStyle = special ? "#f76707" : grant ? "#2b8a3e" : "#dfe5ef"; ctx.lineWidth = special || grant ? 4 : 1.5; ctx.stroke();
    const col = CARD_COLORS[i % CARD_COLORS.length];
    ctx.fillStyle = col; rrect(ctx, cx + 20, cy + 20, 44, 44, 9); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = F(800, 26); ctx.textAlign = "center"; ctx.fillText(String(i + 1), cx + 42, cy + 43); ctx.textAlign = "left";
    let tx = cx + 76;
    const k = (n.kinds || ["etc"])[0]; ctx.font = F(700, 18);
    const kl = KIND_LABEL[k] || "기타", kw = ctx.measureText(kl).width + 24;
    ctx.fillStyle = KIND_COLORS[k] || "#495057"; rrect(ctx, tx, cy + 26, kw, 32, 7); ctx.fill(); ctx.fillStyle = "#fff"; ctx.fillText(kl, tx + 12, cy + 43); tx += kw + 8;
    const rl = (n.regions || ["전국"]).join("·"), rw = ctx.measureText(rl).width + 22;
    ctx.fillStyle = "#edf0f5"; rrect(ctx, tx, cy + 26, rw, 32, 7); ctx.fill(); ctx.fillStyle = "#343a40"; ctx.fillText(rl, tx + 11, cy + 43);
    ctx.fillStyle = "#16191f"; ctx.font = F(800, 25);
    const title = String(n.title || "").replace(/^\s*\[[^\]]+\]\s*/, "").replace(/\d{4}년\s*/g, "");
    wrapText(ctx, title, CW - 40, 2).forEach((l, j) => ctx.fillText(l, cx + 20, cy + 98 + j * 34));
    const BW = 178, BX = cx + CW - BW - 20, BY = cy + 196, BH = 106;
    ctx.fillStyle = grant ? "#2b8a3e" : "#e03131"; rrect(ctx, BX, BY, BW, BH, 12); ctx.fill();
    const bl = noticeBadge(n, canvas.dataset.today || date);
    ctx.fillStyle = "#fff"; ctx.font = F(800, 21); ctx.textAlign = "center";
    bl.forEach((l, j) => ctx.fillText(l, BX + BW / 2, BY + BH / 2 + (j - (bl.length - 1) / 2) * 28)); ctx.textAlign = "left";
    ctx.font = F(500, 16.5); ctx.fillStyle = "#343a40";
    let ly = cy + 188; const LW = CW - BW - 62;
    [["대상", n.target_detail || n.target], ["지원", n.support], ["신청", n.start_date && n.end_date ? md(n.start_date) + " ~ " + md(n.end_date) : (n.period || "공고문 참조")]].forEach(([lab, val], j) => {
      const ls = wrapText(ctx, lab + " " + (val || "공고문 참조"), LW, j === 2 ? 1 : 2);
      ls.forEach((l, q) => { if (!q) { ctx.fillStyle = "#16191f"; ctx.beginPath(); ctx.arc(cx + 24, ly, 3, 0, 6.3); ctx.fill(); ctx.fillStyle = "#343a40"; } ctx.fillText(l, cx + 34, ly); ly += 23; });
      ly += 3;
    });
    ctx.font = F(400, 14); ctx.fillStyle = "#868e96";
    ctx.fillText(wrapText(ctx, (n.source_name || "") + " · " + String(n.org || "").replace(/\s*\(소관:.*\)$/, ""), CW - 40, 1)[0] || "", cx + 20, cy + CH - 20);
  });
}
function saveBlob(blob, name) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export default function FundNotices({ supabase, staticData, categories }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [f, setF] = useState({ scope: "recent", cat: "정책자금", region: "전체", q: "", showClosed: false, showAgri: false });
  const [page, setPage] = useState(1);
  const [newsDate, setNewsDate] = useState("");
  const [newsUrl, setNewsUrl] = useState("");
  const listRef = useRef(null);
  const today = (data && data.today) || kstToday();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (staticData) { if (alive) setData(staticData); return; }
        if (!supabase) return;
        // 전체를 받아야 하는 조회라 1000행씩 끝까지 읽는다(PostgREST 는 한 번에 1000행까지만 준다).
        const items = [];
        for (let from = 0; ; from += 1000) {
          const r = await supabase.from("fund_notices").select("*").order("key").range(from, from + 999);
          if (r.error) throw r.error;
          items.push(...r.data); if (r.data.length < 1000) break;
        }
        const d = await supabase.from("fund_news_daily").select("news_date,notice_keys,updated_at").order("news_date", { ascending: false }).limit(NEWS_KEEP);
        if (d.error) throw d.error;
        if (alive) setData({ items, daily: d.data.map(x => ({ date: x.news_date, keys: x.notice_keys })), updated_at: (d.data[0] || {}).updated_at });
      } catch (e) { console.error("[FundNotices] load failed", e); if (alive) setErr(String((e && e.message) || e)); }
    })();
    return () => { alive = false; };
  }, [supabase, staticData]);

  const items = (data && data.items) || [];
  const byKey = useMemo(() => new Map(items.map(n => [n.key, n])), [items]);
  const list = useMemo(() => filterNotices(items, f, today), [items, f, today]);
  const pages = pageCount(list.length);
  const cur = Math.min(page, pages);
  const set = (patch) => { setF(v => ({ ...v, ...patch })); setPage(1); };   // 필터를 바꾸면 1페이지부터
  const cats = ["전체"].concat((categories || []).map(c => c[0]));
  const catCount = (c) => filterNotices(items, { ...f, cat: c }, today).length;
  const regions = useMemo(() => { const s = new Set(); items.forEach(n => (n.regions || []).forEach(r => s.add(r))); return ["전국", ...[...s].filter(r => r !== "전국").sort()]; }, [items]);

  const daily = ((data && data.daily) || []).slice(0, NEWS_KEEP);
  const curDate = newsDate || (daily[0] && daily[0].date) || "";
  const newsList = useMemo(() => { const d = daily.find(x => x.date === curDate); return d ? d.keys.map(k => byKey.get(k)).filter(Boolean) : []; }, [daily, curDate, byKey]);
  useEffect(() => {
    if (!newsList.length) { setNewsUrl(""); return; }
    const c = document.createElement("canvas"); c.dataset.today = curDate;
    const paint = () => { drawNews(c, curDate, newsList); setNewsUrl(c.toDataURL("image/png")); };
    paint();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(paint).catch(() => {});
  }, [newsList, curDate]);
  const dateLabel = (d) => { const [y, m, dd] = d.split("-").map(Number); return `${y}년 ${m}월 ${dd}일 (${"일월화수목금토"[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()]})`; };
  const saveImage = () => { if (!newsUrl) return; fetch(newsUrl).then(r => r.blob()).then(b => saveBlob(b, `정책자금뉴스_${curDate}.png`)); };
  const saveMent = () => saveBlob(new Blob(["﻿" + newsMent(curDate, newsList).replace(/\n/g, "\r\n")], { type: "text/plain;charset=utf-8" }), `정책자금뉴스_멘트_${curDate}.txt`);
  const go = (p) => { setPage(p); if (listRef.current) listRef.current.scrollIntoView({ block: "start", behavior: "smooth" }); };

  return (
    <section className="fn">
      <style>{CSS}</style>
      <div className="fn-head">
        <h2>정책자금·지원금 공고<small>매일 09:00 새 공고와 변경 공고를 모읍니다</small></h2>
        {data && data.updated_at && <div className="upd">마지막 갱신 {new Date(data.updated_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" })}</div>}
      </div>
      {err && <div className="fn-empty">공고를 불러오지 못했습니다. ({err})</div>}
      {!err && !data && <div className="fn-empty">불러오는 중…</div>}
      {!err && data && <>
        <div className="fn-cats">
          {cats.map(c => { const n = catCount(c); const ic = (categories || []).find(x => x[0] === c);
            return <button key={c} className={"cat" + (f.cat === c ? " on" : "") + (n ? "" : " zero")} onClick={() => set({ cat: c })}><span className="em">{ic ? ic[1] : "🗂️"}</span>{c}<span className="n">{n}</span></button>; })}
        </div>
        <div className="fn-bar" ref={listRef}>
          <div className="seg">
            <button className={f.scope === "recent" ? "on" : ""} onClick={() => set({ scope: "recent" })}>최근 공고</button>
            <button className={f.scope === "all" ? "on" : ""} onClick={() => set({ scope: "all" })}>전체 공고</button>
          </div>
          <label className="f">지역 <select value={f.region} onChange={e => set({ region: e.target.value })}><option value="전체">전체 지역</option>{regions.map(r => <option key={r} value={r}>{r}</option>)}</select></label>
          <input className="q" value={f.q} onChange={e => set({ q: e.target.value })} placeholder="공고명 · 기관 · 대상 · 내용 검색" />
          <label className="ck"><input type="checkbox" checked={f.showClosed} onChange={e => set({ showClosed: e.target.checked })} /> 마감 포함</label>
          <label className="ck"><input type="checkbox" checked={f.showAgri} onChange={e => set({ showAgri: e.target.checked })} /> 농어업 포함</label>
          <div className="stat"><b>{list.length.toLocaleString()}</b>건 · {cur} / {pages}쪽</div>
        </div>
        {f.scope === "recent" && <div className="fn-note">제목에 융자 · 대출 · 보증 · 이자 지원 · 지원금 · 보조금이 들어간 공고를 게시일이 최근인 순서로 보여 줍니다.</div>}
        <div className="fn-list">
          {list.length === 0 && <div className="fn-empty">조건에 맞는 공고가 없습니다.</div>}
          {pageSlice(list, cur).map(n => { const st = noticeStatus(n, today); const d = dday(n, today);
            // 참고 사이트와 같은 강조: 제목에 「특례」 = 주황, 지원금·보조금 = 초록.
            const hot = /특례/.test(n.title) ? "sp" : (n.kinds || []).includes("grant") ? "gr" : "";
            return (
              <article key={n.key} className={"card" + (hot ? " hot hot-" + hot : "")}>
                <div className="tags">
                  {hot && <span className="tg hotg">★ {hot === "sp" ? "특례" : "지원금"}</span>}
                  <span className="tg">{n.source_name}</span>
                  <span className={"tg vd-" + n.verdict}>{VERDICT_LABEL[n.verdict]}</span>
                  <span className={"tg st-" + st}>{STATUS_LABEL[st]}{st === "open" && d != null && d <= 7 ? ` · D-${d}` : ""}</span>
                  <span className="tg rg">{(n.regions || ["전국"]).join("·")}</span>
                  {(n.kinds || []).map(k => <span key={k} className="tg kd">{KIND_LABEL[k] || k}</span>)}
                  {isChangeNotice(n) && <span className="tg ch">변경 공고</span>}
                </div>
                <h3><a href={n.link} target="_blank" rel="noopener noreferrer">{n.title}</a></h3>
                <div className="meta">{n.org}</div>
                <div className="meta">신청 {n.start_date && n.end_date ? dot(n.start_date) + " ~ " + dot(n.end_date) : (n.period || "-")} · 등록 {dot(n.reg_date) || "-"}</div>
                <a className="open" href={n.link} target="_blank" rel="noopener noreferrer">원문 열기 →</a>
              </article>
            ); })}
        </div>
        {pages > 1 && <div className="fn-pager">
          <button disabled={cur === 1} onClick={() => go(cur - 1)}>이전</button>
          {pageButtons(cur, pages).map((p, i) => p === "…" ? <span key={"e" + i} className="gap">…</span> : <button key={p} className={p === cur ? "on" : ""} onClick={() => go(p)}>{p}</button>)}
          <button disabled={cur === pages} onClick={() => go(cur + 1)}>다음</button>
        </div>}

        <div className="fn-news">
          <div className="nh"><h3>정책자금 뉴스 이미지<small>지금 신청할 수 있는 주요 공고 12건 · 최신 {NEWS_KEEP}개</small></h3></div>
          {daily.length === 0 && <div className="fn-empty">아직 만들어진 뉴스가 없습니다.</div>}
          {daily.length > 0 && <div className="nb">
            <nav className="dates">{daily.map(d => <button key={d.date} className={d.date === curDate ? "on" : ""} onClick={() => setNewsDate(d.date)}>{dateLabel(d.date)}</button>)}</nav>
            <div className="view">
              <div className="vbar">
                <b>{curDate && dateLabel(curDate)}</b>
                <button className="btn" onClick={saveImage} disabled={!newsUrl}>이미지 저장</button>
                <button className="btn ghost" onClick={saveMent} disabled={!newsList.length}>멘트 저장</button>
              </div>
              {newsUrl ? <img src={newsUrl} alt={`${curDate} 정책자금 주요공고`} /> : <div className="fn-empty">이 날짜의 공고를 찾지 못했습니다.</div>}
            </div>
          </div>}
        </div>
      </>}
    </section>
  );
}

const CSS = `
.fn{margin-top:22px;padding-top:20px;border-top:2px solid var(--line-2)}
.fn-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:12px}.fn-head h2{margin:0;font-size:19px;font-weight:800}.fn-head h2 small{margin-left:10px;font-size:12px;font-weight:500;color:var(--ink-3)}.fn-head .upd{font-size:12px;color:var(--ink-3)}
.fn-cats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}.fn-cats .cat{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border:1px solid var(--line-2);border-radius:999px;background:#fff;font-size:13px;font-weight:600;color:var(--ink-2)}.fn-cats .cat .n{font-size:11px;color:var(--ink-3)}.fn-cats .cat.on{background:var(--green);border-color:var(--green);color:#fff}.fn-cats .cat.on .n{color:rgba(255,255,255,.75)}.fn-cats .cat.zero:not(.on){opacity:.5}
.fn-bar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:9px 12px;margin-bottom:8px;scroll-margin-top:12px}
.fn-bar .seg{display:inline-flex;border:1px solid var(--line-2);border-radius:var(--rs);overflow:hidden}.fn-bar .seg button{padding:6px 12px;font-size:13px;font-weight:700;color:var(--ink-2);background:#fff}.fn-bar .seg button.on{background:var(--green);color:#fff}
.fn-bar .f,.fn-bar .ck{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--ink-3)}.fn-bar select{font:inherit;font-size:13px;font-weight:600;color:var(--ink);border:1px solid var(--line-2);border-radius:var(--rs);background:#fff;padding:5px 9px}
.fn-bar .q{flex:1;min-width:180px;font:inherit;font-size:13px;border:1px solid var(--line-2);border-radius:var(--rs);padding:6px 10px;outline:none}.fn-bar .q:focus{border-color:var(--green)}
.fn-bar .stat{margin-left:auto;font-size:12px;color:var(--ink-3)}.fn-bar .stat b{color:var(--ink)}
.fn-note{font-size:12px;color:var(--ink-3);margin:0 2px 10px}
.fn-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(320px,100%),1fr));gap:12px}
.fn .card{display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 14px;box-shadow:var(--sh);overflow-wrap:anywhere}
.fn .card.hot-sp{border:2px solid #e8590c;background:#fff4e6}.fn .card.hot-gr{border:2px solid #2b8a3e;background:#ebfbee}
.fn .card h3{margin:6px 0 4px;font-size:14.5px;font-weight:800;line-height:1.45}.fn .card h3 a{color:var(--ink)}.fn .card h3 a:hover{color:var(--green);text-decoration:underline}
.fn .card .meta{font-size:12.5px;color:var(--ink-3)}
.fn .card .open{align-self:flex-start;margin-top:auto;background:var(--green);color:#fff;font-size:12px;font-weight:700;padding:6px 11px;border-radius:7px}.fn .card .meta + .open{margin-top:10px}.fn .card .open:hover{background:var(--green-2)}
.fn .tags{display:flex;flex-wrap:wrap;gap:4px}.fn .tg{font-size:11.5px;border-radius:4px;padding:1px 6px;background:var(--chip);color:var(--ink-3);white-space:nowrap}
.fn .tg.hotg{color:#fff;font-weight:700}.fn .hot-sp .tg.hotg{background:#e8590c}.fn .hot-gr .tg.hotg{background:#2b8a3e}
.fn .tg.vd-sme{background:#e5f4ec;color:#1d7a46}.fn .tg.vd-check{background:#fbf1dd;color:#9a6200}.fn .tg.vd-agri{background:#fbe7e5;color:#b3261e}
.fn .tg.st-open{background:var(--blue-tint);color:var(--blue-ink)}.fn .tg.st-closed{text-decoration:line-through}.fn .tg.st-upcoming{background:#fbf1dd;color:#9a6200}
.fn .tg.rg{color:var(--ink);font-weight:500}.fn .tg.kd{background:var(--blue-tint);color:var(--blue-ink)}.fn .tg.ch{background:#fbe7e5;color:#b3261e}
.fn-pager{display:flex;flex-wrap:wrap;justify-content:center;gap:5px;margin:14px 0 4px}.fn-pager button{min-width:34px;padding:6px 10px;border:1px solid var(--line-2);border-radius:var(--rs);background:#fff;font-size:13px;font-weight:600;color:var(--ink-2)}.fn-pager button.on{background:var(--green);border-color:var(--green);color:#fff}.fn-pager button:disabled{opacity:.4;cursor:default}.fn-pager .gap{align-self:center;color:var(--ink-3);padding:0 2px}
.fn-news{margin-top:26px}.fn-news .nh h3{margin:0 0 10px;font-size:16px;font-weight:800}.fn-news .nh small{margin-left:10px;font-size:12px;font-weight:500;color:var(--ink-3)}
.fn-news .nb{display:grid;grid-template-columns:210px minmax(0,1fr);gap:14px;align-items:start}@media(max-width:760px){.fn-news .nb{grid-template-columns:1fr}}
.fn-news .dates{display:flex;flex-direction:column;gap:5px}@media(max-width:760px){.fn-news .dates{flex-direction:row;flex-wrap:wrap}}
.fn-news .dates button{text-align:left;padding:8px 11px;border:1px solid var(--line);border-radius:var(--rs);background:#fff;font-size:13px;font-weight:600;color:var(--ink-2)}.fn-news .dates button.on{background:var(--green);border-color:var(--green);color:#fff}
.fn-news .view{background:var(--panel);border:1px solid var(--line);border-radius:var(--r);padding:12px;box-shadow:var(--sh)}
.fn-news .vbar{display:flex;align-items:center;gap:8px;margin-bottom:10px}.fn-news .vbar b{margin-right:auto;font-size:14px}
.fn-news .btn{background:var(--green);color:#fff;font-size:12.5px;font-weight:700;padding:7px 13px;border-radius:7px}.fn-news .btn.ghost{background:#fff;color:var(--green);border:1px solid var(--green)}.fn-news .btn:disabled{opacity:.4;cursor:default}
.fn-news img{display:block;width:100%;max-width:560px;margin:0 auto;border-radius:10px;border:1px solid var(--line)}
.fn-empty{padding:34px 20px;text-align:center;color:var(--ink-3);font-size:13px;background:var(--panel);border:1px dashed var(--line-2);border-radius:var(--r)}
`;
