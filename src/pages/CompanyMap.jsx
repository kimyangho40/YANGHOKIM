// 🗺 사업장 지도 — 기업목록의 사업장을 지도 위 마커로 본다. (2026-11-03)
// 사이드바 `주요 메뉴 → 사업장 지도` (`view === "company-map"`). App.js 의 메뉴 배열·렌더 분기와 한 쌍이다.
//
// 좌표 규칙
//   · 상세 주소(companies.address)가 있으면 그 주소로 → 진한 핀(geo_level='address')
//   · 주소가 없거나 못 찾으면 지역(region, "경기_수원") 중심으로 → 연한 점(geo_level='region', 대략 위치)
//   · 좌표는 Supabase Edge Function `geocode`(supabase/functions/geocode) 로 받아 **이 화면을 연 사람의 세션으로** companies.geo_* 에 저장한다(RLS 그대로).
//   · geo_query 에 "주소|지역" 원문을 남긴다 → 기업상세에서 주소·지역을 고치면 값이 달라져 다음에 지도를 열 때 다시 받는다.
//
// ⚠️ supabase 클라이언트는 App.js 에서 받은 것만 쓴다(새로 만들면 GoTrueClient 가 둘이 된다 — GrowthRoadmap 과 같은 규칙).
// ⚠️ 지도 타일 = OpenStreetMap(키 불필요). 주소 → 좌표 = 카카오 로컬 API(키는 Supabase 함수 비밀값 KAKAO_REST_API_KEY — 저장소·브라우저에 없음),
//    키가 없으면 서버가 OSM 으로 대신 찾는다(상세 주소 정확도가 낮다 — 화면 상단에 안내가 뜬다).
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// markercluster 는 전역 L 에 붙는 플러그인이라 L 을 먼저 걸고 불러온다.
window.L = L;
require("leaflet.markercluster");

const KOREA_CENTER = [36.35, 127.8];

// 좌표를 받은 기준 문자열 — 주소나 지역이 바뀌면 값이 달라져 다시 받는다.
export function geoKeyOf(c) {
  return String((c && c.address) || "").trim() + "|" + String((c && c.region) || "").trim();
}
export function needsGeocode(c) {
  if (!c) return false;
  var hasSrc = String(c.address || "").trim() || String(c.region || "").trim();
  if (!hasSrc) return false;
  if (c.geo_lat == null || c.geo_lng == null) return true;
  return c.geo_query !== geoKeyOf(c);
}

// 지역 중심(대략) 점은 같은 시·군·구끼리 좌표가 완전히 같아 한 점에 겹친다 → 목록에서 눌러도 지도가 골목까지 확대되고
// 팝업이 안 뜬다(2026-11-03 운영 화면에서 확인). 업체 id 로 정해지는 작은 흩뿌림(±약 1.5km)을 준다 — 새로고침해도 같은 자리.
export function approxOffset(id) {
  var s = String(id == null ? "" : id), h1 = 2166136261, h2 = 5381;
  for (var i = 0; i < s.length; i++) { h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619); h2 = (h2 * 33 + s.charCodeAt(i)) | 0; }
  var a = ((h1 >>> 0) % 1000) / 1000 * Math.PI * 2;
  var r = 0.004 + ((h2 >>> 0) % 1000) / 1000 * 0.01;
  return [Math.sin(a) * r, Math.cos(a) * r * 1.25];
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function(ch) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
  });
}

function pinIcon(color, approx) {
  if (approx) {
    return L.divIcon({
      className: "",
      html: '<div style="width:14px;height:14px;border-radius:50%;background:' + color + ';opacity:.45;border:2px dashed #fff;box-shadow:0 0 0 1px ' + color + '"></div>',
      iconSize: [14, 14], iconAnchor: [7, 7], popupAnchor: [0, -8],
    });
  }
  return L.divIcon({
    className: "",
    html: '<svg width="26" height="34" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M13 0C5.8 0 0 5.6 0 12.6 0 22 13 34 13 34s13-12 13-21.4C26 5.6 20.2 0 13 0z" fill="' + color + '" stroke="#fff" stroke-width="1.5"/>' +
      '<circle cx="13" cy="12.5" r="4.6" fill="#fff"/></svg>',
    iconSize: [26, 34], iconAnchor: [13, 34], popupAnchor: [0, -30],
  });
}

// Edge Function 호출 — 에러 본문({error})까지 꺼내 화면에 띄운다(supabase-js 는 기본으로 상태코드만 준다).
async function invokeGeocode(supabase, body) {
  var r = await supabase.functions.invoke("geocode", { body: body });
  if (r.error) {
    var msg = r.error.message || "좌표 조회 실패";
    try { var j = r.error.context && (await r.error.context.json()); if (j && j.error) msg = j.error; } catch (e) { /* 본문 없음 */ }
    throw new Error(msg);
  }
  return r.data || {};
}

export default function CompanyMap({ supabase, companies, setCompanies, onSelect, stageColors, assignees }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const clusterRef = useRef(null);
  const markerById = useRef(new Map());
  const runningRef = useRef(false);

  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [assignee, setAssignee] = useState("");
  const [showApprox, setShowApprox] = useState(true);
  const [geo, setGeo] = useState({ running: false, done: 0, total: 0, provider: "", error: "" });
  const [failed, setFailed] = useState({}); // id → 사유 (이번 화면에서만 기억 — 다시 시도는 버튼으로)
  const [showFailed, setShowFailed] = useState(false);

  const live = useMemo(function() { return (companies || []).filter(function(c) { return !c.deleted_at; }); }, [companies]);

  const stageList = useMemo(function() {
    var s = {}; live.forEach(function(c) { if (c.stage) s[c.stage] = (s[c.stage] || 0) + 1; });
    return Object.keys(s).sort();
  }, [live]);

  const assigneeList = useMemo(function() {
    return (assignees || []).filter(function(a) { return a && a !== "전체"; });
  }, [assignees]);

  const filtered = useMemo(function() {
    var q = search.trim().toLowerCase();
    return live.filter(function(c) {
      if (stage && c.stage !== stage) return false;
      if (assignee && String(c.assignee || "").indexOf(assignee) < 0) return false;
      if (q) {
        var hay = [c.name, c.representative, c.address, c.region, c.industry].join(" ").toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
  }, [live, search, stage, assignee]);

  const stats = useMemo(function() {
    var exact = 0, approx = 0, none = 0, pending = 0, noAddr = 0;
    filtered.forEach(function(c) {
      if (!String(c.address || "").trim()) noAddr++;
      if (needsGeocode(c)) { pending++; return; }
      if (c.geo_lat == null) { none++; return; }
      if (c.geo_level === "address") exact++; else approx++;
    });
    return { exact: exact, approx: approx, none: none, pending: pending, noAddr: noAddr };
  }, [filtered]);

  // ── 지도 만들기(한 번) ──
  useEffect(function() {
    if (!mapEl.current || mapRef.current) return;
    var map = L.map(mapEl.current, { center: KOREA_CENTER, zoom: 7, minZoom: 6, maxZoom: 18, zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    var cluster = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 45, spiderfyOnMaxZoom: true });
    map.addLayer(cluster);
    mapRef.current = map;
    clusterRef.current = cluster;
    // 사이드바 접기 등으로 크기가 바뀌면 타일이 비지 않게
    var ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(function() { map.invalidateSize(); }) : null;
    if (ro) ro.observe(mapEl.current);
    return function() { if (ro) ro.disconnect(); map.remove(); mapRef.current = null; clusterRef.current = null; };
  }, []);

  // ── 마커 다시 그리기 ──
  useEffect(function() {
    var cluster = clusterRef.current;
    if (!cluster) return;
    cluster.clearLayers();
    markerById.current = new Map();
    var bounds = [];
    filtered.forEach(function(c) {
      if (c.geo_lat == null || c.geo_lng == null) return;
      var approx = c.geo_level !== "address";
      if (approx && !showApprox) return;
      var col = (stageColors && stageColors[c.stage] && stageColors[c.stage].text) || "#4338CA";
      var off = approx ? approxOffset(c.id) : [0, 0];
      var pos = [c.geo_lat + off[0], c.geo_lng + off[1]];
      var m = L.marker(pos, { icon: pinIcon(col, approx), title: c.name || "" });
      var box = document.createElement("div");
      box.style.minWidth = "200px";
      box.innerHTML =
        '<div style="font-weight:700;font-size:13px;margin-bottom:4px">' + esc(c.name) + "</div>" +
        (c.stage ? '<div style="display:inline-block;font-size:11px;font-weight:600;padding:1px 7px;border-radius:5px;margin-bottom:5px;background:' +
          esc((stageColors[c.stage] || {}).bg || "#F3F4F6") + ";color:" + esc(col) + '">' + esc(c.stage) + "</div>" : "") +
        '<div style="font-size:11px;color:#555;line-height:1.5">' +
          (c.representative ? "대표 " + esc(c.representative) + "<br/>" : "") +
          (c.assignee ? "담당 " + esc(c.assignee) + "<br/>" : "") +
          (c.address ? esc(c.address) : '<span style="color:#B45309">상세 주소 없음 · ' + esc(c.region || "") + " 중심(대략)</span>") +
        "</div>";
      var btn = document.createElement("button");
      btn.textContent = "기업상세 열기";
      btn.style.cssText = "margin-top:8px;width:100%;padding:6px;border:none;border-radius:6px;background:#1A1917;color:#fff;font-size:12px;font-weight:600;cursor:pointer";
      btn.addEventListener("click", function() { onSelect && onSelect(c); });
      box.appendChild(btn);
      m.bindPopup(box);
      cluster.addLayer(m);
      markerById.current.set(c.id, m);
      bounds.push(pos);
    });
    var map = mapRef.current;
    if (map && bounds.length && (search || stage || assignee)) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [filtered, showApprox, stageColors, onSelect, search, stage, assignee]);

  // ── 좌표 채우기 ──
  function applyPatches(patches) {
    setCompanies(function(prev) {
      return prev.map(function(c) { return patches[c.id] ? Object.assign({}, c, patches[c.id]) : c; });
    });
  }
  async function runGeocode(onlyIds) {
    if (runningRef.current) return;
    var targets = live.filter(function(c) {
      if (onlyIds) return onlyIds.indexOf(c.id) >= 0;
      return needsGeocode(c) && !failed[c.id];
    });
    if (!targets.length) return;
    runningRef.current = true;
    setGeo({ running: true, done: 0, total: targets.length, provider: geo.provider, error: "" });
    var batch = geo.provider === "kakao" ? 20 : 2;
    var done = 0, newFailed = {}, provider = geo.provider;
    try {
      for (var i = 0; i < targets.length; i += batch) {
        var chunk = targets.slice(i, i + batch);
        var res = await invokeGeocode(supabase, {
          items: chunk.map(function(c) { return { id: c.id, address: c.address || "", region: c.region || "" }; }),
        });
        provider = res.provider || provider;
        if (provider === "kakao") batch = 20;
        var nowIso = new Date().toISOString();
        var byId = {}; for (var ci = 0; ci < chunk.length; ci++) byId[chunk[ci].id] = chunk[ci];
        var patches = {};
        for (var k = 0; k < (res.results || []).length; k++) {
          var r = res.results[k];
          var co = byId[r.id];
          if (!co) continue;
          if (!r.ok) { newFailed[r.id] = r.error || "찾지 못함"; continue; }
          var patch = { geo_lat: r.lat, geo_lng: r.lng, geo_level: r.level, geo_query: geoKeyOf(co), geo_at: nowIso };
          var up = await supabase.from("companies").update(patch).eq("id", r.id);
          if (up.error) {
            // 컬럼이 아직 없으면(SQL 미실행) 전부 같은 이유로 실패한다 — 한 번에 멈추고 원인을 띄운다
            throw new Error("좌표 저장 실패: " + up.error.message + (up.error.code === "PGRST204" || /column/.test(up.error.message) ? " — 사업장지도_주소좌표_컬럼추가.sql 실행이 필요합니다." : ""));
          }
          patches[r.id] = patch;
        }
        if (Object.keys(patches).length) applyPatches(patches);
        done += chunk.length;
        setGeo({ running: true, done: done, total: targets.length, provider: provider, error: "" });
      }
      setGeo({ running: false, done: done, total: targets.length, provider: provider, error: "" });
    } catch (e) {
      setGeo({ running: false, done: done, total: targets.length, provider: provider, error: e.message || String(e) });
    } finally {
      runningRef.current = false;
      setFailed(function(p) {
        var n = Object.assign({}, p);
        if (onlyIds) onlyIds.forEach(function(id) { delete n[id]; });
        return Object.assign(n, newFailed);
      });
    }
  }

  // 화면을 열면 좌표가 없거나 낡은 곳을 자동으로 채운다(이번 화면에서 못 찾은 곳은 다시 안 묻는다).
  useEffect(function() {
    if (!runningRef.current && !geo.error && live.some(function(c) { return needsGeocode(c) && !failed[c.id]; })) runGeocode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, failed, geo.error]);

  function focusCompany(c) {
    var m = markerById.current.get(c.id);
    var map = mapRef.current;
    if (!m || !map) { onSelect && onSelect(c); return; }
    // 대략 위치는 시·군 단위로만 보여 준다(골목까지 확대하면 정확한 위치처럼 보인다)
    if (c.geo_level !== "address") {
      map.setView(m.getLatLng(), 15);
      clusterRef.current.zoomToShowLayer(m, function() { m.openPopup(); });
      return;
    }
    clusterRef.current.zoomToShowLayer(m, function() { m.openPopup(); });
  }

  const failedList = live.filter(function(c) { return failed[c.id]; });
  const sel = { fontSize: 12, padding: "6px 8px", border: "1px solid #E8E5E0", borderRadius: 6, background: "#fff", outline: "none" };
  const chip = function(bg, fg) { return { fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99, background: bg, color: fg, whiteSpace: "nowrap" }; };

  return (
    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10, height: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1917" }}>🗺 사업장 지도</div>
        <span style={chip("#EEF2FF", "#4338CA")}>📍 상세 주소 {stats.exact}</span>
        <span style={chip("#FEF3C7", "#92400E")}>◌ 지역 대략 {stats.approx}</span>
        {stats.none + failedList.length > 0 && <span style={chip("#FEE2E2", "#B91C1C")}>위치 없음 {stats.none + failedList.length}</span>}
        <span style={{ fontSize: 11, color: "#888" }}>상세 주소 미입력 {stats.noAddr}곳 · 기업상세 기본정보에서 입력</span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="업체명·대표자·주소 검색"
          style={Object.assign({}, sel, { width: 200 })} />
        <select value={assignee} onChange={function(e) { setAssignee(e.target.value); }} style={sel}>
          <option value="">담당자 전체</option>
          {assigneeList.map(function(a) { return <option key={a} value={a}>{a}</option>; })}
        </select>
        <select value={stage} onChange={function(e) { setStage(e.target.value); }} style={sel}>
          <option value="">단계 전체</option>
          {stageList.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#555", cursor: "pointer" }}>
          <input type="checkbox" checked={showApprox} onChange={function(e) { setShowApprox(e.target.checked); }} />
          주소 없는 곳은 지역 중심에 대략 표시
        </label>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {geo.running && <span style={{ fontSize: 12, color: "#4338CA", fontWeight: 600 }}>좌표 받는 중 {geo.done}/{geo.total}…</span>}
          {failedList.length > 0 && !geo.running && (
            <button onClick={function() { setShowFailed(function(v) { return !v; }); }}
              style={{ fontSize: 12, padding: "6px 10px", borderRadius: 6, border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#B91C1C", cursor: "pointer" }}>
              못 찾은 곳 {failedList.length} {showFailed ? "▲" : "▼"}
            </button>
          )}
        </div>
      </div>

      {geo.error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#B91C1C", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
          📛 {geo.error}
          <button onClick={function() { setGeo(Object.assign({}, geo, { error: "" })); }}
            style={{ marginLeft: 10, fontSize: 11, padding: "2px 8px", border: "1px solid #FCA5A5", background: "#fff", borderRadius: 5, cursor: "pointer" }}>다시 시도</button>
        </div>
      )}
      {geo.provider === "osm" && (
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
          ⚠️ 카카오 키(KAKAO_REST_API_KEY)가 아직 없어 무료 지도(OSM)로 위치를 찾고 있습니다. 시·군·구는 맞지만 상세 주소는 못 찾는 곳이 많아 지역 중심으로 찍힙니다.
        </div>
      )}
      {showFailed && failedList.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 12px", fontSize: 12, maxHeight: 160, overflowY: "auto" }}>
          {failedList.map(function(c) {
            return (
              <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "3px 0", borderBottom: "1px solid #F5F3F0" }}>
                <span onClick={function() { onSelect && onSelect(c); }} style={{ fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>{c.name}</span>
                <span style={{ color: "#888", flex: 1 }}>{c.address || c.region} — {failed[c.id]}</span>
                <button onClick={function() { runGeocode([c.id]); }} style={{ fontSize: 11, padding: "2px 8px", border: "1px solid #E8E5E0", background: "#fff", borderRadius: 5, cursor: "pointer" }}>다시 찾기</button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flex: 1, minHeight: 480 }}>
        <div ref={mapEl} style={{ flex: 1, minHeight: 480, height: "calc(100vh - 210px)", borderRadius: 10, border: "1px solid #E8E5E0", overflow: "hidden", background: "#EEF2F5" }} />
        <div style={{ width: 240, flexShrink: 0, height: "calc(100vh - 210px)", minHeight: 480, overflowY: "auto", background: "#fff", border: "1px solid #E8E5E0", borderRadius: 10 }}>
          <div style={{ padding: "8px 12px", fontSize: 11, color: "#888", borderBottom: "1px solid #F0EEEA", position: "sticky", top: 0, background: "#fff" }}>
            {filtered.length}곳 · 누르면 지도에서 찾아요
          </div>
          {filtered.map(function(c) {
            var has = c.geo_lat != null;
            var approx = has && c.geo_level !== "address";
            return (
              <div key={c.id} onClick={function() { focusCompany(c); }}
                style={{ padding: "7px 12px", borderBottom: "1px solid #F5F3F0", cursor: "pointer", opacity: has ? 1 : 0.55 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1917", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {has ? (approx ? "◌ " : "📍 ") : "· "}{c.name}
                </div>
                <div style={{ fontSize: 10, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.address || c.region || "주소·지역 없음"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
