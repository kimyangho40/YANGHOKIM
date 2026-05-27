/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, no-redeclare */
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ?€?€ Supabase ?¤ì • ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
const SUPABASE_URL = "https://ujdrjvnihxjvbkezjvwc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZHJqdm5paHhqdmJrZXpqdndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTgzODIsImV4cCI6MjA5Mzk3NDM4Mn0.K0zbRGT8SrDBeZoDyc_VM61xAHZye8V0p0m2PemNUWM";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ?€?€ ?ìˆ˜ ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
const STAGES = ["?ë‹´/ì§„ë‹¨?„ë£Œ", "?„ìˆ˜?œë¥˜ ë°??¸ì¦?œìš”ì²?, "ê¸°ê?? ì²­?€ê¸?ë°©ë¬¸?ˆì •", "?¤í¬ë¦½íŠ¸ ?„ë‹¬ ?„ë£Œ", "ê¸°ê?? ì²­?„ë£Œ/ë°©ë¬¸?„ë£Œ", "?¬ì‚¬ì¤??¤íƒœì¡°ì‚¬?€ê¸?, "?¤íƒœì¡°ì‚¬?„ë£Œ/?½ì •?„ë£Œ", "?ê¸ˆì§‘í–‰?„ë£Œ", "?˜ìˆ˜ë£Œë?ê¸?ë°??…ê¸ˆ?”ì²­", "?…ê¸ˆ?„ë£Œ/?¬í›„ê´€ë¦?, "ì¶”ê? ì§„í–‰ ?ˆì •", "ì¶”ê? ì§„í–‰ ì¤?, "ê¸°í?"];
const STAGE_COLORS = {
  "?ë‹´/ì§„ë‹¨?„ë£Œ":           { bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
  "?„ìˆ˜?œë¥˜ ë°??¸ì¦?œìš”ì²?:  { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  "ê¸°ê?? ì²­?€ê¸?ë°©ë¬¸?ˆì •":   { bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" },
  "?¤í¬ë¦½íŠ¸ ?„ë‹¬ ?„ë£Œ":       { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  "ê¸°ê?? ì²­?„ë£Œ/ë°©ë¬¸?„ë£Œ":   { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
  "?¬ì‚¬ì¤??¤íƒœì¡°ì‚¬?€ê¸?:     { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  "?¤íƒœì¡°ì‚¬?„ë£Œ/?½ì •?„ë£Œ":   { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  "?ê¸ˆì§‘í–‰?„ë£Œ":            { bg: "#F5F3FF", text: "#7C3AED", border: "#DDD6FE" },
  "?˜ìˆ˜ë£Œë?ê¸?ë°??…ê¸ˆ?”ì²­":  { bg: "#FDF4FF", text: "#A21CAF", border: "#F0ABFC" },
  "?…ê¸ˆ?„ë£Œ/?¬í›„ê´€ë¦?:       { bg: "#F0FDF4", text: "#166534", border: "#86EFAC" },
  "ì¶”ê? ì§„í–‰ ?ˆì •":          { bg: "#F5F3FF", text: "#6D28D9", border: "#C4B5FD" },
  "ì¶”ê? ì§„í–‰ ì¤?:            { bg: "#EFF6FF", text: "#1D4ED8", border: "#93C5FD" },
  "ê¸°í?":                    { bg: "#F7F6F3", text: "#666",    border: "#D1D5DB" },
};
const AGENCIES = ["?Œìƒê³µì¸?œì¥ì§„í¥ê³µë‹¨","ì¤‘ì†Œë²¤ì²˜ê¸°ì—…ì§„í¥ê³µë‹¨","? ìš©ë³´ì¦ê¸°ê¸ˆ","? ìš©ë³´ì¦?¬ë‹¨","ê¸°ìˆ ë³´ì¦ê¸°ê¸ˆ","?œë?ê¸ˆìœµì§„í¥??,"êµ¬ì¡°?ì‹ &?¬ì—…?„í™˜","ê¸°í?"];
const JUNGINGONG_PRODUCTS = ["ì°½ì—…ê¸°ë°˜ì§€??,"ì²?…„ì°½ì—…?ê¸ˆ","?ì‹ ?±ì¥ì§€??,"ê°œë°œê¸°ìˆ ?¬ì—…??,"?¬ì°½??,"?´ìˆ˜ê¸°ì—…?˜ì¶œê¸°ì—…??10ë§Œë¶ˆ ë¯¸ë§Œ)","?˜ì¶œê¸°ì—…ê¸€ë¡œë²Œ??10ë§Œë¶ˆ ?´ìƒ)","?¬ì—…?„í™˜","êµ¬ì¡°ê°œì„ ","ê¸°í?"];
const SOJINGONG_PRODUCTS = ["? ìš©ì·¨ì•½?ê¸ˆ","?¬ë„?„íŠ¹ë³„ìê¸?,"?ì‹ ?±ì¥ ì´‰ì§„?ê¸ˆ(?¤ë§ˆ??ê¸°ìˆ )","?ì‹ ?±ì¥ ì´‰ì§„?ê¸ˆ(2???°ì† ë§¤ì¶œ 10% ? ì¥)","?ì‹ ?±ì¥ ì´‰ì§„?ê¸ˆ(?˜ì¶œ ?ê¸ˆ)","?ì‹ ?±ì¥ ì´‰ì§„?ê¸ˆ(ê·???ê¸°í?)","?ìƒ?±ì¥ì§€?ìê¸?,"ê·???ê¸°í?","?€ë¦¬ë?ì¶?];
const AGENCY_GROUPS = [
  { id: "?Œìƒê³µì¸?œì¥ì§„í¥ê³µë‹¨", label: "?Œìƒê³µì¸?œì¥ì§„í¥ê³µë‹¨", color: "#4338CA" },
  { id: "? ìš©ë³´ì¦ê¸°ê¸ˆ", label: "? ìš©ë³´ì¦ê¸°ê¸ˆ", color: "#0F6E56" },
  { id: "ê¸°ìˆ ë³´ì¦ê¸°ê¸ˆ", label: "ê¸°ìˆ ë³´ì¦ê¸°ê¸ˆ", color: "#0369A1" },
  { id: "? ìš©ë³´ì¦?¬ë‹¨", label: "? ìš©ë³´ì¦?¬ë‹¨", color: "#B45309" },
  { id: "ì¤‘ì†Œë²¤ì²˜ê¸°ì—…ì§„í¥ê³µë‹¨", label: "ì¤‘ì†Œë²¤ì²˜ê¸°ì—…ì§„í¥ê³µë‹¨", color: "#7C3AED" },
  { id: "êµ¬ì¡°?ì‹ &?¬ì—…?„í™˜", label: "êµ¬ì¡°?ì‹ &?¬ì—…?„í™˜", color: "#BE123C" },
  { id: "ê²½ì •ì²?µ¬", label: "ê²½ì •ì²?µ¬", color: "#0369A1" },
  { id: "ê¸°í?", label: "ê¸°í?", color: "#555" },
];
const DOC_LIST = ["?¬ì—…?ë“±ë¡ì¦","ìµœê·¼ 3?„ì¹˜ ?¬ë¬´?œí‘œ (23??25??","ìµœê·¼ 3?„ì¹˜ ë¶€ê°€??ì¦ëª…??(23??25??","ë²•ì¸ ê¸°ì—… ê¸ˆìœµê±°ë˜ ?•ì¸??,"?€?œì ? ìš©?ìˆ˜","4?€ë³´í—˜ ëª…ë?","?”ë³„ ê³ ìš©ë³´í—˜ ê°€?…ì ëª…ë?","ê·????¬ì—…?„í™˜ ?„ìˆ˜ ?œë¥˜","ìµœê·¼ 1???˜ì¶œ?¤ì  ì¦ëª…??,"?¬ì—…???€ì¶?ê¸ˆìœµê±°ë˜ ?•ì¸??,"?€?œì ? ë¶„ì¦?,"?„ë?ì°?ê³„ì•½??,"?Œì‚¬ ?Œê°œ???ëŠ” ?¬ì—…ê³„íš??];
const TEAMS = ["ë²•ì¸?„ë‹´","ê°œì¸?„ë‹´","ê´€ë¦¬ì"];
const ASSIGNEES = ["ë¯¸í˜„","? ì§„","ê´€??,"ì§€??,"?„ì• ","?¸ì„ ","?™ì¼","?‘í˜¸"];
const INDUSTRY_OPTIONS = ["?œì¡°??,"?ì—…Â·?´ì—…","?™ë°•??,"?Œì‹?ì—…","?„ì?ê±°?˜ì—…","?•ë³´?µì‹ ??,"?„ì†Œë§¤ì—…","?œë¹„?¤ì—…","ì°½ê³ ??,"?ë™ì°¨ì„?€??];
const DB_ASSIGNEES = ["ë¯¸í˜„","? ì§„","ê´€??,"ì§€??,"?„ì• ","?¸ì„ ","?™ì¼"];
const DB_MANAGERS = ["?‘í˜¸","?™ì¼","ê´€??];

// ?„í™”ë²ˆí˜¸ ?ë™ ?˜ì´???¬ë§· (01012345678 ??010-1234-5678)
function formatPhone(v) {
  if (!v) return "";
  var d = String(v).replace(/[^0-9]/g, "");
  if (d.length === 0) return "";
  if (d.startsWith("02")) {
    if (d.length <= 2) return d;
    if (d.length <= 5) return d.slice(0,2) + "-" + d.slice(2);
    if (d.length <= 9) return d.slice(0,2) + "-" + d.slice(2,5) + "-" + d.slice(5);
    return d.slice(0,2) + "-" + d.slice(2,6) + "-" + d.slice(6,10);
  }
  if (d.length <= 3) return d;
  if (d.length <= 7) return d.slice(0,3) + "-" + d.slice(3);
  if (d.length <= 10) return d.slice(0,3) + "-" + d.slice(3,6) + "-" + d.slice(6);
  return d.slice(0,3) + "-" + d.slice(3,7) + "-" + d.slice(7,11);
}

// ?¬ì—…?ë“±ë¡ë²ˆ???ë™ ?˜ì´??(1234567890 ??123-45-67890)
function formatBizNumber(v) {
  if (!v) return "";
  var d = String(v).replace(/[^0-9]/g, "");
  if (d.length === 0) return "";
  if (d.length <= 3) return d;
  if (d.length <= 5) return d.slice(0,3) + "-" + d.slice(3);
  return d.slice(0,3) + "-" + d.slice(3,5) + "-" + d.slice(5,10);
}

// ì¤‘ì†Œë²¤ì²˜ê¸°ì—…ì§„í¥ê³µë‹¨ / êµ¬ì¡°?ì‹ &?¬ì—…?„í™˜ ì§€??³¸ë¶€Â·ì§€ë¶€ ê´€??ë§¤í•‘
// ê°’ì? ë°°ì—´ ??ë³µìˆ˜ ê´€? ì???˜ ê²½ìš° 2ê°??¤ì–´ê°?const JUNGINGONG_REGION_MAP = {
  // ?œìš¸ì§€??³¸ë¶€
  "ì¤‘êµ¬": ["?œìš¸ì§€??³¸ë¶€"], "ê°•ë¶êµ?: ["?œìš¸ì§€??³¸ë¶€"], "?¸ì›êµ?: ["?œìš¸ì§€??³¸ë¶€"], "?„ë´‰êµ?: ["?œìš¸ì§€??³¸ë¶€"],
  "?™ë?ë¬¸êµ¬": ["?œìš¸ì§€??³¸ë¶€"], "ë§ˆí¬êµ?: ["?œìš¸ì§€??³¸ë¶€"], "?œë?ë¬¸êµ¬": ["?œìš¸ì§€??³¸ë¶€"], "?±ë™êµ?: ["?œìš¸ì§€??³¸ë¶€"],
  "?±ë¶êµ?: ["?œìš¸ì§€??³¸ë¶€"], "?©ì‚°êµ?: ["?œìš¸ì§€??³¸ë¶€"], "?€?‰êµ¬": ["?œìš¸ì§€??³¸ë¶€"], "ì¢…ë¡œêµ?: ["?œìš¸ì§€??³¸ë¶€"], "ì¤‘ë‘êµ?: ["?œìš¸ì§€??³¸ë¶€"],
  // ?œìš¸?™ë?ì§€ë¶€
  "ê°•ë™êµ?: ["?œìš¸?™ë?ì§€ë¶€"], "ê´‘ì§„êµ?: ["?œìš¸?™ë?ì§€ë¶€"], "?¡íŒŒêµ?: ["?œìš¸?™ë?ì§€ë¶€"],
  // ?œìš¸?œë?ì§€ë¶€
  "?‘ì²œêµ?: ["?œìš¸?œë?ì§€ë¶€"], "ê¸ˆì²œêµ?: ["?œìš¸?œë?ì§€ë¶€"], "ê°•ì„œêµ?: ["?œìš¸?œë?ì§€ë¶€"], "ê´€?…êµ¬": ["?œìš¸?œë?ì§€ë¶€"],
  "êµ¬ë¡œêµ?: ["?œìš¸?œë?ì§€ë¶€"], "?™ì‘êµ?: ["?œìš¸?œë?ì§€ë¶€"], "?ë“±?¬êµ¬": ["?œìš¸?œë?ì§€ë¶€"],
  // ?œìš¸?¨ë?ì§€ë¶€
  "?œì´ˆêµ?: ["?œìš¸?¨ë?ì§€ë¶€"], "ê°•ë‚¨êµ?: ["?œìš¸?¨ë?ì§€ë¶€"],
  // ?¸ì²œì§€??³¸ë¶€
  "?°ìˆ˜êµ?: ["?¸ì²œì§€??³¸ë¶€"], "ê³„ì–‘êµ?: ["?¸ì²œì§€??³¸ë¶€"], "?¨ë™êµ?: ["?¸ì²œì§€??³¸ë¶€"], "ë¶€?‰êµ¬": ["?¸ì²œì§€??³¸ë¶€"], "ë¶€ì²œì‹œ": ["?¸ì²œì§€??³¸ë¶€"],
  // ?¸ì²œ?œë?ì§€ë¶€
  "?œêµ¬": ["?¸ì²œ?œë?ì§€ë¶€"], "?™êµ¬": ["?¸ì²œ?œë?ì§€ë¶€"], "ë¯¸ì¶”?€êµ?: ["?¸ì²œ?œë?ì§€ë¶€"], "ê°•í™”êµ?: ["?¸ì²œ?œë?ì§€ë¶€"], "?¹ì§„êµ?: ["?¸ì²œ?œë?ì§€ë¶€"], "ê¹€?¬ì‹œ": ["?¸ì²œ?œë?ì§€ë¶€"],
  // ê²½ê¸°ì§€??³¸ë¶€
  "?˜ì›??: ["ê²½ê¸°ì§€??³¸ë¶€"], "?ˆì„±??: ["ê²½ê¸°ì§€??³¸ë¶€"], "?©ì¸??: ["ê²½ê¸°ì§€??³¸ë¶€"], "ê³¼ì²œ??: ["ê²½ê¸°ì§€??³¸ë¶€"],
  "?ˆì–‘??: ["ê²½ê¸°ì§€??³¸ë¶€"], "?˜ì™•??: ["ê²½ê¸°ì§€??³¸ë¶€"], "êµ°í¬??: ["ê²½ê¸°ì§€??³¸ë¶€"],
  // ê²½ê¸°?™ë?ì§€ë¶€ (ê°€?‰êµ°, ?‘í‰êµ°ì? ë³µìˆ˜ ê´€??
  "ê´‘ì£¼??: ["ê²½ê¸°?™ë?ì§€ë¶€"], "êµ¬ë¦¬??: ["ê²½ê¸°?™ë?ì§€ë¶€"], "?¨ì–‘ì£¼ì‹œ": ["ê²½ê¸°?™ë?ì§€ë¶€"],
  "?±ë‚¨??: ["ê²½ê¸°?™ë?ì§€ë¶€"], "?´ì²œ??: ["ê²½ê¸°?™ë?ì§€ë¶€"], "?˜ë‚¨??: ["ê²½ê¸°?™ë?ì§€ë¶€"], "?¬ì£¼??: ["ê²½ê¸°?™ë?ì§€ë¶€"],
  "ê°€?‰êµ°": ["ê²½ê¸°?™ë?ì§€ë¶€","ê²½ê¸°ë¶ë?ì§€ë¶€"], "?‘í‰êµ?: ["ê²½ê¸°?™ë?ì§€ë¶€","ê²½ê¸°ë¶ë?ì§€ë¶€"],
  // ê²½ê¸°?œë?ì§€ë¶€ (?”ì„±?œëŠ” ?¡ì‚°ë©??œì‹ ë©?ë§ˆë„ë©??¨ì–‘??ë¹„ë´‰ë©´ì´ ë³µìˆ˜)
  "?œí¥??: ["ê²½ê¸°?œë?ì§€ë¶€"], "ê´‘ëª…??: ["ê²½ê¸°?œë?ì§€ë¶€"], "?ˆì‚°??: ["ê²½ê¸°?œë?ì§€ë¶€"],
  "?”ì„±??: ["ê²½ê¸°?œë?ì§€ë¶€","ê²½ê¸°?¨ë?ì§€ë¶€"],
  // ê²½ê¸°?¨ë?ì§€ë¶€
  "?‰íƒ??: ["ê²½ê¸°?¨ë?ì§€ë¶€"], "?¤ì‚°??: ["ê²½ê¸°?¨ë?ì§€ë¶€"],
  // ê²½ê¸°ë¶ë?ì§€ë¶€
  "ê³ ì–‘??: ["ê²½ê¸°ë¶ë?ì§€ë¶€"], "?™ë‘ì²œì‹œ": ["ê²½ê¸°ë¶ë?ì§€ë¶€"], "?˜ì •ë¶€??: ["ê²½ê¸°ë¶ë?ì§€ë¶€"],
  "?Œì£¼??: ["ê²½ê¸°ë¶ë?ì§€ë¶€"], "?¬ì²œ??: ["ê²½ê¸°ë¶ë?ì§€ë¶€"], "?°ì²œêµ?: ["ê²½ê¸°ë¶ë?ì§€ë¶€"],
  // ê°•ì›ì§€??³¸ë¶€ (ê°€?‰êµ° ë³µìˆ˜???„ì—??ì²˜ë¦¬??
  "ì¶˜ì²œ??: ["ê°•ì›ì§€??³¸ë¶€"], "?ì£¼??: ["ê°•ì›ì§€??³¸ë¶€"], "?ì›”êµ?: ["ê°•ì›ì§€??³¸ë¶€"],
  "?¸ì œêµ?: ["ê°•ì›ì§€??³¸ë¶€"], "ì² ì›êµ?: ["ê°•ì›ì§€??³¸ë¶€"], "?ì²œêµ?: ["ê°•ì›ì§€??³¸ë¶€"],
  "?”ì²œêµ?: ["ê°•ì›ì§€??³¸ë¶€"], "?¡ì„±êµ?: ["ê°•ì›ì§€??³¸ë¶€"],
  // ê°•ì›?ë™ì§€ë¶€ (?•ì„ êµ? ?‰ì°½êµ?ë³µìˆ˜)
  "ê°•ë¦‰??: ["ê°•ì›?ë™ì§€ë¶€"], "?™í•´??: ["ê°•ì›?ë™ì§€ë¶€"], "?¼ì²™??: ["ê°•ì›?ë™ì§€ë¶€"],
  "?ì´ˆ??: ["ê°•ì›?ë™ì§€ë¶€"], "?œë°±??: ["ê°•ì›?ë™ì§€ë¶€"], "ê³ ì„±êµ?: ["ê°•ì›?ë™ì§€ë¶€"], "?‘ì–‘êµ?: ["ê°•ì›?ë™ì§€ë¶€"],
  "?•ì„ êµ?: ["ê°•ì›ì§€??³¸ë¶€","ê°•ì›?ë™ì§€ë¶€"], "?‰ì°½êµ?: ["ê°•ì›ì§€??³¸ë¶€","ê°•ì›?ë™ì§€ë¶€"],
  // ?€?„ì???³¸ë¶€
  "?€??: ["?€?„ì???³¸ë¶€"], "ê³„ë£¡??: ["?€?„ì???³¸ë¶€"], "?¼ì‚°??: ["?€?„ì???³¸ë¶€"],
  "ê¸ˆì‚°êµ?: ["?€?„ì???³¸ë¶€"], "?¥ì²œêµ?: ["?€?„ì???³¸ë¶€","ì¶©ë¶ì§€??³¸ë¶€"],
  // ?¸ì¢…ì§€??³¸ë¶€ (?œì²œêµ?ë³µìˆ˜)
  "?¸ì¢…": ["?¸ì¢…ì§€??³¸ë¶€"], "ê³µì£¼??: ["?¸ì¢…ì§€??³¸ë¶€"], "ì²?–‘êµ?: ["?¸ì¢…ì§€??³¸ë¶€"],
  "ë³´ë ¹??: ["?¸ì¢…ì§€??³¸ë¶€"], "ë¶€?¬êµ°": ["?¸ì¢…ì§€??³¸ë¶€"],
  "?œì²œêµ?: ["?¸ì¢…ì§€??³¸ë¶€","ì¶©ë‚¨ì§€??³¸ë¶€"],
  // ì¶©ë‚¨ì§€??³¸ë¶€
  "ì²œì•ˆ??: ["ì¶©ë‚¨ì§€??³¸ë¶€"], "?œì‚°??: ["ì¶©ë‚¨ì§€??³¸ë¶€"], "?„ì‚°??: ["ì¶©ë‚¨ì§€??³¸ë¶€"],
  "?¹ì§„??: ["ì¶©ë‚¨ì§€??³¸ë¶€"], "?ˆì‚°êµ?: ["ì¶©ë‚¨ì§€??³¸ë¶€"], "?œì•ˆêµ?: ["ì¶©ë‚¨ì§€??³¸ë¶€"], "?ì„±êµ?: ["ì¶©ë‚¨ì§€??³¸ë¶€"],
  // ì¶©ë¶ì§€??³¸ë¶€
  "ì²?£¼??: ["ì¶©ë¶ì§€??³¸ë¶€"], "ë³´ì?êµ?: ["ì¶©ë¶ì§€??³¸ë¶€"], "?ë™êµ?: ["ì¶©ë¶ì§€??³¸ë¶€"],
  "?¥ì²œêµ?ì¶©ë¶": ["ì¶©ë¶ì§€??³¸ë¶€"], "ì§„ì²œêµ?: ["ì¶©ë¶ì§€??³¸ë¶€"], "ì¦í‰êµ?: ["ì¶©ë¶ì§€??³¸ë¶€"], "?Œì„±êµ?: ["ì¶©ë¶ì§€??³¸ë¶€"],
  // ì¶©ë¶ë¶ë?ì§€ë¶€
  "ì¶©ì£¼??: ["ì¶©ë¶ë¶ë?ì§€ë¶€"], "?œì²œ??: ["ì¶©ë¶ë¶ë?ì§€ë¶€"], "ê´´ì‚°êµ?: ["ì¶©ë¶ë¶ë?ì§€ë¶€"], "?¨ì–‘êµ?: ["ì¶©ë¶ë¶ë?ì§€ë¶€"],
  // ?„ë¶ì§€??³¸ë¶€
  "?„ì£¼??: ["?„ë¶ì§€??³¸ë¶€"], "?¨ì›??: ["?„ë¶ì§€??³¸ë¶€"], "ë¬´ì£¼êµ?: ["?„ë¶ì§€??³¸ë¶€"],
  "?œì°½êµ?: ["?„ë¶ì§€??³¸ë¶€"], "?„ì£¼êµ?: ["?„ë¶ì§€??³¸ë¶€"], "?„ì‹¤êµ?: ["?„ë¶ì§€??³¸ë¶€"],
  "?¥ìˆ˜êµ?: ["?„ë¶ì§€??³¸ë¶€"], "ì§„ì•ˆêµ?: ["?„ë¶ì§€??³¸ë¶€"], "?•ì??: ["?„ë¶ì§€??³¸ë¶€"],
  "?µì‚°??: ["?„ë¶ì§€??³¸ë¶€"], "ê¹€?œì‹œ": ["?„ë¶ì§€??³¸ë¶€"],
  // ?„ë¶?œë?ì§€ë¶€
  "êµ°ì‚°??: ["?„ë¶?œë?ì§€ë¶€"], "ê³ ì°½êµ?: ["?„ë¶?œë?ì§€ë¶€"], "ë¶€?ˆêµ°": ["?„ë¶?œë?ì§€ë¶€"], "?œì²œêµ??„ë¶": ["?„ë¶?œë?ì§€ë¶€"], "?µì‚°???„ë¶?œë?": ["?„ë¶?œë?ì§€ë¶€"],
  // ê´‘ì£¼ì§€??³¸ë¶€ (?ê´‘êµ? ?¨í‰êµ? ?˜ì£¼?œëŠ” ë³µìˆ˜)
  "ê´‘ì£¼": ["ê´‘ì£¼ì§€??³¸ë¶€"], "?´ì–‘êµ?: ["ê´‘ì£¼ì§€??³¸ë¶€"], "?¥ì„±êµ?: ["ê´‘ì£¼ì§€??³¸ë¶€"], "?”ìˆœêµ?: ["ê´‘ì£¼ì§€??³¸ë¶€"],
  // ?„ë‚¨ì§€??³¸ë¶€ (?ê´‘êµ? ?¨í‰êµ? ?˜ì£¼?? ?¥í¥êµ?ë³µìˆ˜)
  "ë¬´ì•ˆêµ?: ["?„ë‚¨ì§€??³¸ë¶€"], "ëª©í¬??: ["?„ë‚¨ì§€??³¸ë¶€"], "ê°•ì§„êµ?: ["?„ë‚¨ì§€??³¸ë¶€"],
  "? ì•ˆêµ?: ["?„ë‚¨ì§€??³¸ë¶€"], "?ì•”êµ?: ["?„ë‚¨ì§€??³¸ë¶€"], "?„ë„êµ?: ["?„ë‚¨ì§€??³¸ë¶€"],
  "ì§„ë„êµ?: ["?„ë‚¨ì§€??³¸ë¶€"], "?´ë‚¨êµ?: ["?„ë‚¨ì§€??³¸ë¶€"],
  "?ê´‘êµ?: ["ê´‘ì£¼ì§€??³¸ë¶€","?„ë‚¨ì§€??³¸ë¶€"], "?¨í‰êµ?: ["ê´‘ì£¼ì§€??³¸ë¶€","?„ë‚¨ì§€??³¸ë¶€"],
  "?˜ì£¼??: ["ê´‘ì£¼ì§€??³¸ë¶€","?„ë‚¨ì§€??³¸ë¶€"], "?¥í¥êµ?: ["?„ë‚¨ì§€??³¸ë¶€","?„ë‚¨?™ë?ì§€ë¶€"],
  // ?„ë‚¨?™ë?ì§€ë¶€
  "?œì²œ??: ["?„ë‚¨?™ë?ì§€ë¶€"], "ê´‘ì–‘??: ["?„ë‚¨?™ë?ì§€ë¶€"], "?¬ìˆ˜??: ["?„ë‚¨?™ë?ì§€ë¶€"],
  "ê³ í¥êµ?: ["?„ë‚¨?™ë?ì§€ë¶€"], "ê³¡ì„±êµ?: ["?„ë‚¨?™ë?ì§€ë¶€"], "êµ¬ë?êµ?: ["?„ë‚¨?™ë?ì§€ë¶€"], "ë³´ì„±êµ?: ["?„ë‚¨?™ë?ì§€ë¶€"],
  // ?€êµ¬ì???³¸ë¶€
  "?€êµ?: ["?€êµ¬ì???³¸ë¶€"],
  // ê²½ë¶ì§€??³¸ë¶€ (ë´‰í™”êµ?ë³µìˆ˜)
  "êµ¬ë???: ["ê²½ë¶ì§€??³¸ë¶€"], "ê¹€ì²œì‹œ": ["ê²½ë¶ì§€??³¸ë¶€"], "ë¬¸ê²½??: ["ê²½ë¶ì§€??³¸ë¶€"],
  "?ì£¼??: ["ê²½ë¶ì§€??³¸ë¶€"], "?ˆë™??: ["ê²½ë¶ì§€??³¸ë¶€"], "?ì£¼??: ["ê²½ë¶ì§€??³¸ë¶€"],
  "ê³ ë ¹êµ?: ["ê²½ë¶ì§€??³¸ë¶€"], "?±ì£¼êµ?: ["ê²½ë¶ì§€??³¸ë¶€"], "?ˆì²œêµ?: ["ê²½ë¶ì§€??³¸ë¶€"],
  "?˜ì„±êµ?: ["ê²½ë¶ì§€??³¸ë¶€"], "ì¹ ê³¡êµ?: ["ê²½ë¶ì§€??³¸ë¶€"],
  "ë´‰í™”êµ?: ["ê²½ë¶ì§€??³¸ë¶€","ê²½ë¶?™ë?ì§€ë¶€"],
  // ê²½ë¶?™ë?ì§€ë¶€
  "?¬í•­??: ["ê²½ë¶?™ë?ì§€ë¶€"], "ê²½ì£¼??: ["ê²½ë¶?™ë?ì§€ë¶€","?¸ì‚°ì§€??³¸ë¶€"],
  "?ë•êµ?: ["ê²½ë¶?™ë?ì§€ë¶€"], "?ì–‘êµ?: ["ê²½ë¶?™ë?ì§€ë¶€"], "?¸ë¦‰êµ?: ["ê²½ë¶?™ë?ì§€ë¶€"], "?¸ì§„êµ?: ["ê²½ë¶?™ë?ì§€ë¶€"], "ì²?†¡êµ?: ["ê²½ë¶?™ë?ì§€ë¶€"],
  // ê²½ë¶?¨ë?ì§€ë¶€
  "ê²½ì‚°??: ["ê²½ë¶?¨ë?ì§€ë¶€"], "?ì²œ??: ["ê²½ë¶?¨ë?ì§€ë¶€"], "ì²?„êµ?: ["ê²½ë¶?¨ë?ì§€ë¶€"],
  // ë¶€?°ë™ë¶€ì§€??³¸ë¶€
  "?¬ìƒêµ?: ["ë¶€?°ë™ë¶€ì§€??³¸ë¶€"], "ê°•ì„œêµ?ë¶€??: ["ë¶€?°ë™ë¶€ì§€??³¸ë¶€"], "?™êµ¬_ë¶€??: ["ë¶€?°ë™ë¶€ì§€??³¸ë¶€"],
  "ë¶€?°ì§„êµ?: ["ë¶€?°ë™ë¶€ì§€??³¸ë¶€"], "ë¶êµ¬_ë¶€??: ["ë¶€?°ë™ë¶€ì§€??³¸ë¶€"], "?¬í•˜êµ?: ["ë¶€?°ë™ë¶€ì§€??³¸ë¶€"],
  "?œêµ¬_ë¶€??: ["ë¶€?°ë™ë¶€ì§€??³¸ë¶€"], "?ë„êµ?: ["ë¶€?°ë™ë¶€ì§€??³¸ë¶€"], "ì¤‘êµ¬_ë¶€??: ["ë¶€?°ë™ë¶€ì§€??³¸ë¶€"],
  // ë¶€?°ë™ë¶€ì§€ë¶€
  "?´ìš´?€êµ?: ["ë¶€?°ë™ë¶€ì§€ë¶€"], "ê¸ˆì •êµ?: ["ë¶€?°ë™ë¶€ì§€ë¶€"], "?¨êµ¬_ë¶€??: ["ë¶€?°ë™ë¶€ì§€ë¶€"],
  "?™ë˜êµ?: ["ë¶€?°ë™ë¶€ì§€ë¶€"], "?˜ì˜êµ?: ["ë¶€?°ë™ë¶€ì§€ë¶€"], "?°ì œêµ?: ["ë¶€?°ë™ë¶€ì§€ë¶€"], "ê¸°ì¥êµ?: ["ë¶€?°ë™ë¶€ì§€ë¶€"],
  // ?¸ì‚°ì§€??³¸ë¶€ (ê²½ì£¼?? ?‘ì‚°??ë³µìˆ˜)
  "?¸ì‚°": ["?¸ì‚°ì§€??³¸ë¶€"], "?¸ë™??: ["?¸ì‚°ì§€??³¸ë¶€"], "?´ë‚¨ë©?: ["?¸ì‚°ì§€??³¸ë¶€"], "?°ë‚´ë©?: ["?¸ì‚°ì§€??³¸ë¶€"],
  "?‘ì‚°??: ["?¸ì‚°ì§€??³¸ë¶€","ê²½ë‚¨ì§€??³¸ë¶€"],
  // ê²½ë‚¨ì§€??³¸ë¶€
  "ì°½ì›??: ["ê²½ë‚¨ì§€??³¸ë¶€"], "?˜ë ¹êµ?: ["ê²½ë‚¨ì§€??³¸ë¶€"], "?¨ì•ˆêµ?: ["ê²½ë‚¨ì§€??³¸ë¶€"], "ì°½ë…•êµ?: ["ê²½ë‚¨ì§€??³¸ë¶€"],
  // ê²½ë‚¨?™ë?ì§€ë¶€
  "ê¹€?´ì‹œ": ["ê²½ë‚¨?™ë?ì§€ë¶€"], "ë°€?‘ì‹œ": ["ê²½ë‚¨?™ë?ì§€ë¶€"],
  // ê²½ë‚¨?œë?ì§€ë¶€
  "ì§„ì£¼??: ["ê²½ë‚¨?œë?ì§€ë¶€"], "ê±°ì œ??: ["ê²½ë‚¨?œë?ì§€ë¶€"], "?¬ì²œ??: ["ê²½ë‚¨?œë?ì§€ë¶€"],
  "?µì˜??: ["ê²½ë‚¨?œë?ì§€ë¶€"], "ê±°ì°½êµ?: ["ê²½ë‚¨?œë?ì§€ë¶€"], "?¨í•´êµ?: ["ê²½ë‚¨?œë?ì§€ë¶€"],
  "?°ì²­êµ?: ["ê²½ë‚¨?œë?ì§€ë¶€"], "?˜ë™êµ?: ["ê²½ë‚¨?œë?ì§€ë¶€"], "?¨ì–‘êµ?: ["ê²½ë‚¨?œë?ì§€ë¶€"], "?©ì²œêµ?: ["ê²½ë‚¨?œë?ì§€ë¶€"],
  // ?œì£¼ì§€??³¸ë¶€
  "?œì£¼??: ["?œì£¼ì§€??³¸ë¶€"], "?œê??¬ì‹œ": ["?œì£¼ì§€??³¸ë¶€"],
};

// ì§€??ë¬¸ì?´ì—????êµ?êµ¬ë? ì°¾ì•„??ì§€??³¸ë¶€/ì§€ë¶€ ë°˜í™˜
function findJungingongBranch(regionStr) {
  if (!regionStr) return "";
  var matches = [];
  // ?…ë ¥ ?•ê·œ?? ê³µë°±, _, -, ?¼í‘œ ??êµ¬ë¶„?ë? ?œê±°
  var normalized = (regionStr || "").replace(/[\s_\-,\.\/]/g, "");
  // ëª¨ë“  ?¤ë? ê¸¸ì´ ?´ë¦¼ì°¨ìˆœ ?•ë ¬ (ê¸??´ë¦„ ?°ì„  ë§¤ì¹­ ???? "ê´‘ì£¼ê´‘ì—­?? ??"ê´‘ì£¼?? ë³´ë‹¤ ë¨¼ì?)
  var sortedKeys = Object.keys(JUNGINGONG_REGION_MAP).sort(function(a, b) {
    return b.length - a.length;
  });
  sortedKeys.forEach(function(key) {
    // _ë¶€?? _?„ë¶ ??ì¤‘ë³µ ???œê±°
    var pureKey = key.split("_")[0];
    if (!pureKey || pureKey.length < 2) return;
    // 1) ?„ì²´ ?¤ë¡œ ë§¤ì¹­ (?? "?ˆì‚°??, "ê´‘ì£¼??)
    var matched = normalized.indexOf(pureKey) >= 0;
    // 2) ??êµ?êµ??‘ë????œê±°?˜ê³  ë§¤ì¹­ (?? "?ˆì‚°", "?±ë‚¨")
    if (!matched) {
      var keyWithoutSuffix = pureKey.replace(/(?¹ë³„??ê´‘ì—­???¹ë³„?ì¹˜???¹ë³„?ì¹˜??ê´‘ì—­????êµ?êµ?$/, "");
      if (keyWithoutSuffix.length >= 2) {
        // ?¨ì–´ ê²½ê³„ë¥?ê³ ë ¤??ë§¤ì¹­ ???? "?ˆì‚°" ê²€????"ê³ ì–‘"??"??ê³?ë§¤ì¹­?˜ì? ?Šë„ë¡?        // ?œê? ?…ë ¥?€ ?¨ì–´ ê²½ê³„ê°€ ëª…í™•?˜ì? ?Šìœ¼ë¯€ë¡? ê·¸ëƒ¥ indexOfë¡?ì²˜ë¦¬
        matched = normalized.indexOf(keyWithoutSuffix) >= 0;
      }
    }
    if (matched) {
      JUNGINGONG_REGION_MAP[key].forEach(function(b) {
        if (matches.indexOf(b) < 0) matches.push(b);
      });
    }
  });
  return matches.join(", ");
}

// ë§¤ì¶œ???¬ë§· ?¨ìˆ˜
const formatRevenue = (val) => {
  if (!val && val !== 0) return '-';
  const n = typeof val === 'string' ? parseInt(val.replace(/[^0-9]/g, '')) : val;
  if (isNaN(n) || n === 0) return '-';
  // ?œê? ?¨ìœ„ ë¶„í•´: ì¡?/ ??/ ë§?  var parts = [];
  var jo = Math.floor(n / 1000000000000);
  var eok = Math.floor((n % 1000000000000) / 100000000);
  var man = Math.floor((n % 100000000) / 10000);
  var won = n % 10000;
  if (jo > 0) parts.push(jo + 'ì¡?);
  // ???¨ìœ„ - 1000 ?´ìƒ?´ë©´ ì²œì–µ ?œì‹œ
  if (eok > 0) {
    if (eok >= 1000) {
      var cheonEok = Math.floor(eok / 1000);
      var nam = eok % 1000;
      var eokStr = cheonEok + 'ì²?;
      if (nam > 0) eokStr += nam;
      parts.push(eokStr + '??);
    } else {
      parts.push(eok + '??);
    }
  }
  // ë§??¨ìœ„ - 1000 ?´ìƒ?´ë©´ ì²œë§Œ ?œì‹œ
  if (man > 0) {
    if (man >= 1000) {
      var cheonMan = Math.floor(man / 1000);
      var namMan = man % 1000;
      var manStr = cheonMan + 'ì²?;
      if (namMan > 0) {
        var baekMan = Math.floor(namMan / 100);
        var restMan = namMan % 100;
        if (baekMan > 0) manStr += baekMan + 'ë°?;
        if (restMan > 0) manStr += restMan;
      }
      parts.push(manStr + 'ë§?);
    } else {
      parts.push(man + 'ë§?);
    }
  }
  return parts.length > 0 ? parts.join(' ') : n.toLocaleString();
};

// ?€?€ ?„ì´ì½??€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    dashboard: <svg {...p}><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
    pipeline:  <svg {...p}><rect x="3" y="3" width="5" height="19" rx="1"/><rect x="10" y="3" width="5" height="13" rx="1"/><rect x="17" y="3" width="5" height="9" rx="1"/></svg>,
    list:      <svg {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill={color}/><circle cx="3" cy="12" r="1" fill={color}/><circle cx="3" cy="18" r="1" fill={color}/></svg>,
    alert:     <svg {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><circle cx="12" cy="17" r="1" fill={color}/></svg>,
    users:     <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    plus:      <svg {...p}><path d="M12 5v14M5 12h14"/></svg>,
    search:    <svg {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    check:     <svg {...p} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    x:         <svg {...p} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    phone:     <svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.54 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    logout:    <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    edit:      <svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    refresh:   <svg {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    copy:      <svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    save:      <svg {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
    building:  <svg {...p}><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/></svg>,
    money:     <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v2m0 8v2M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m.08 4h.01"/></svg>,
    activity:  <svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    folder:    <svg {...p}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    calendar:  <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    chevronR:  <svg {...p}><polyline points="9 18 15 12 9 6"/></svg>,
    chevronL:  <svg {...p}><polyline points="15 18 9 12 15 6"/></svg>,
  };
  return icons[name] || null;
};

// ?€?€ ? í‹¸ ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
const docRate = (docs) => {
  if (!docs || docs.length === 0) return 0;
  return Math.round(docs.filter(d => d.received).length / docs.length * 100);
};

// ?€?€ ë©”ì¸ ???€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (uid) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    setProfile(data);
    setLoading(false);
  };

  if (loading) return <Splash />;
  if (!session) return <AuthScreen />;
  if (!profile) return <SetupProfile userId={session.user.id} email={session.user.email} onDone={(p) => setProfile(p)} />;
  return <CRMApp profile={profile} session={session} />;
}

// ?€?€ ?¤í”Œ?˜ì‹œ ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
function Splash() {
  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1A1917", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 40, height: 40, border: "3px solid #F7F6F3", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ color: "#666", fontSize: 13 }}>ë¡œë”© ì¤?..</div>
    </div>
  );
}

// ?€?€ ë¡œê·¸???Œì›ê°€???”ë©´ ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handle = async () => {
    setError(""); setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) setError("?´ë©”???ëŠ” ë¹„ë?ë²ˆí˜¸ê°€ ?€?¸ì–´??");
    } else {
      const { error } = await supabase.auth.signUp({ email, password: pw });
      if (error) setError(error.message);
      else setDone(true);
    }
    setLoading(false);
  };

  return (
    <div style={{ height: "100vh", display: "flex", background: "#1A1917" }}>
      {/* ?¼ìª½ ë¸Œëœ??*/}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 80px" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.14em", color: "#555", marginBottom: 12, textTransform: "uppercase" }}>Policy Fund</div>
        <h1 style={{ fontSize: 42, fontWeight: 800, color: "#F7F6F3", letterSpacing: "-0.04em", lineHeight: 1.15, margin: "0 0 20px" }}>
          ?•ì±…?ê¸ˆ<br />ì»¨ì„¤??CRM
        </h1>
        <p style={{ color: "#666", fontSize: 15, lineHeight: 1.7, maxWidth: 360 }}>
          200ê°??…ì²´, 15ëª??€?ì˜ ?…ë¬´ë¥?br />?˜ë‚˜???”ë©´?ì„œ ê´€ë¦¬í•˜?¸ìš”.
        </p>
        <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 14 }}>
          {["5?¨ê³„ ?Œì´?„ë¼??ì¶”ì ","?œë¥˜ ì²´í¬ë¦¬ìŠ¤???ë™??,"?•ì²´ ?…ì²´ ?¤ì‹œê°??Œë¦¼","?€?ë³„ ?…ë¬´ ?€?œë³´??].map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#2E2C29", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="check" size={11} color="#4ADE80" />
              </div>
              <span style={{ color: "#888", fontSize: 13 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ?¤ë¥¸ìª?ë¡œê·¸????*/}
      <div style={{ width: 420, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: "100%", background: "#fff", borderRadius: 16, padding: "40px 36px", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>
          {done ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>?“§</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>?´ë©”?¼ì„ ?•ì¸?´ì£¼?¸ìš”</h2>
              <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>{email}ë¡??¸ì¦ ë§í¬ë¥?ë³´ëƒˆ?´ìš”.<br />ë§í¬ ?´ë¦­ ??ë¡œê·¸?¸í•˜?¸ìš”.</p>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.03em" }}>{mode === "login" ? "ë¡œê·¸?? : "ê³„ì • ë§Œë“¤ê¸?}</h2>
              <p style={{ fontSize: 13, color: "#888", margin: "0 0 28px" }}>{mode === "login" ? "?€ CRM???‘ì†?˜ì„¸?? : "ì²˜ìŒ ?¬ìš©?˜ì‹œ?˜ìš”? ê³„ì •??ë§Œë“œ?¸ìš”"}</p>
              {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#DC2626", marginBottom: 16 }}>{error}</div>}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>?´ë©”??/label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com"
                  style={{ width: "100%", padding: "11px 14px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none" }}
                  onKeyDown={e => e.key === "Enter" && handle()} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>ë¹„ë?ë²ˆí˜¸</label>
                <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="6???´ìƒ"
                  style={{ width: "100%", padding: "11px 14px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none" }}
                  onKeyDown={e => e.key === "Enter" && handle()} />
              </div>
              <button onClick={handle} disabled={loading}
                style={{ width: "100%", padding: "13px", background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "ì²˜ë¦¬ ì¤?.." : mode === "login" ? "ë¡œê·¸?? : "ê°€?…í•˜ê¸?}
              </button>
              <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#888" }}>
                {mode === "login" ? "ê³„ì •???†ìœ¼? ê??? " : "?´ë? ê³„ì •???ˆìœ¼? ê??? "}
                <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
                  style={{ color: "#4338CA", cursor: "pointer", fontWeight: 600 }}>
                  {mode === "login" ? "ê°€?…í•˜ê¸? : "ë¡œê·¸??}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ?€?€ ?„ë¡œ??ìµœì´ˆ ?¤ì • ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
function SetupProfile({ userId, email, onDone }) {
  const [name, setName] = useState("");
  const [team, setTeam] = useState("ë²•ì¸?„ë‹´");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.from("profiles").insert({ id: userId, name: name.trim(), role: "member", team }).select().single();
    if (!error) onDone(data);
    setLoading(false);
  };

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F6F3" }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: "40px 36px", width: 380, boxShadow: "0 8px 40px rgba(0,0,0,0.1)" }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px" }}>?„ë¡œ???¤ì •</h2>
        <p style={{ fontSize: 13, color: "#888", margin: "0 0 28px" }}>{email}</p>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>?´ë¦„ (?…ë¬´???œì‹œ???´ë¦„)</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="?? ?•ì›"
            style={{ width: "100%", padding: "11px 14px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none" }} />
        </div>
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>?Œì† ?€</label>
          <select value={team} onChange={e => setTeam(e.target.value)}
            style={{ width: "100%", padding: "11px 14px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 14, background: "#fff", cursor: "pointer" }}>
            {TEAMS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <button onClick={save} disabled={!name.trim() || loading}
          style={{ width: "100%", padding: "13px", background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: !name.trim() ? 0.5 : 1 }}>
          {loading ? "?€??ì¤?.." : "?œì‘?˜ê¸°"}
        </button>
      </div>
    </div>
  );
}

// ?€?€ CRM ë©”ì¸ ???€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
function CRMApp({ profile, session }) {
  const [dashboardFilter, setDashboardFilter] = useState(null);
  const [view, setView] = useState(() => {
    var params = new URLSearchParams(window.location.search);
    return params.get("view") || "dashboard";
  });
  const [agencyJumpMonth, setAgencyJumpMonth] = useState(() => {
    var params = new URLSearchParams(window.location.search);
    var m = params.get("month");
    return m ? parseInt(m, 10) : null;
  });
  const [agencyJumpGroup, setAgencyJumpGroup] = useState(() => {
    var params = new URLSearchParams(window.location.search);
    return params.get("group") || null;
  });
  const [companies, setCompanies] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("?„ì²´");
  const [filterAssignee, setFilterAssignee] = useState("?„ì²´");
  const [filterType, setFilterType] = useState("?„ì²´");
  const [toast, setToast] = useState(null);
  const [showTodayAlert, setShowTodayAlert] = useState(false);
  const [workNotesBadge, setWorkNotesBadge] = useState(0);
  const [quickMemo, setQuickMemo] = useState(false);
  const [quickMemoText, setQuickMemoText] = useState("");
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [agencyRefreshKey, setAgencyRefreshKey] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef(null);

  // ?Œë¦¼ ?´ë§ - ???´ë‹¹ ???¸íŠ¸ ?•ì¸ (30ì´ˆë§ˆ??
  useEffect(function() {
    if (!profile) return;
    var lastChecked = localStorage.getItem("notif_last_checked_" + profile.name) || new Date(0).toISOString();
    var checkNotifs = async function() {
      var r = await supabase.from("work_notes")
        .select("*").eq("assignee", profile.name)
        .gt("created_at", lastChecked).is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (!r.error && r.data && r.data.length > 0) {
        setNotifications(function(prev) {
          var ids = new Set(prev.map(function(n) { return n.id; }));
          var newOnes = r.data.filter(function(n) { return !ids.has(n.id); });
          return newOnes.concat(prev).slice(0, 20);
        });
      }
    };
    checkNotifs();
    var interval = setInterval(checkNotifs, 30000);
    return function() { clearInterval(interval); };
  }, [profile]);

  var markAllRead = function() {
    if (profile) localStorage.setItem("notif_last_checked_" + profile.name, new Date().toISOString());
    setNotifications([]);
    setShowNotifPanel(false);
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  // ?°ì´??ë¡œë“œ
  const fetchWorkNotesBadge = async (profileName) => {
    if (!profileName) return;
    try {
      // ë³¸ì¸ ?´ë‹¹ + ????+ ë¯¸ì™„ë£?is_done=false) + ?? œ?˜ì? ?Šì? ê²ƒë§Œ
      var r = await supabase.from("work_notes")
        .select("id, content, is_done")
        .eq("assignee", profileName)
        .eq("is_todo", true)
        .is("deleted_at", null);
      if (!r.error && r.data) {
        // is_done??false???¸íŠ¸ë§?ì¹´ìš´??        // ê·¸ë¦¬ê³?ì²´í¬ë¦¬ìŠ¤?¸ê? ?ˆëŠ” ê²½ìš°, ëª¨ë“  ??ª©??ì²´í¬?˜ì? ?Šì? ?¸íŠ¸ë§?ì¹´ìš´??        var incomplete = r.data.filter(function(n) {
          if (n.is_done) return false; // ?´ë? ?„ë£Œ???¸íŠ¸???œì™¸
          // ì²´í¬ë¦¬ìŠ¤?¸ê? ?ˆëŠ” ê²½ìš° ëª¨ë“  ??ª© ì²´í¬ ?¬ë? ?•ì¸
          if (n.content && n.content.indexOf("- [") !== -1) {
            var lines = n.content.split("\n");
            var checkLines = lines.filter(function(l) { return /^- \[[ x]\]/.test(l.trim()); });
            if (checkLines.length > 0) {
              var uncheckedExists = checkLines.some(function(l) { return l.trim().indexOf("- [ ]") === 0; });
              return uncheckedExists; // ë¯¸ì²´????ª©???ˆìœ¼ë©?ë¯¸ì™„ë£?            }
          }
          return true; // ?¼ë°˜ ???¼ì? is_done=false?´ë©´ ë¯¸ì™„ë£?        }).length;
        setWorkNotesBadge(incomplete);
      }
    } catch(e) {}
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: cos }, { data: profs }, { data: agencyCases }] = await Promise.all([
      supabase.from("companies").select("*, documents(*)").is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*"),
      supabase.from("agency_cases").select("business_name, region").not("region", "is", null).limit(10000),
    ]);
    // ê¸°ê?ë³??„í™© ì§€????ê¸°ì—… ëª©ë¡ ?ë™ ?™ê¸°??    var companiesList = cos || [];
    if (agencyCases && agencyCases.length > 0) {
      var regionMap = {};
      agencyCases.forEach(function(ac) {
        if (ac.business_name && ac.region && ac.region.trim()) {
          regionMap[ac.business_name] = ac.region.trim();
        }
      });
      var updates = [];
      companiesList.forEach(function(co) {
        if (!co.region && regionMap[co.name]) {
          updates.push({ id: co.id, region: regionMap[co.name] });
          co.region = regionMap[co.name];
        }
      });
      // ë¹?ì§€???ë™ ì±„ìš°ê¸?(ë°±ê·¸?¼ìš´??
      updates.forEach(function(u) {
        supabase.from("companies").update({ region: u.region }).eq("id", u.id);
      });
    }
    setCompanies(companiesList);
    setProfiles(profs || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    if (profile?.name) fetchWorkNotesBadge(profile.name);
  }, [fetchAll]);

  // ë¡œê·¸?????¤ëŠ˜ ?????Œë¦¼ - ìµœì´ˆ 1?Œë§Œ
  const alertShownRef = useRef(false);
  useEffect(() => {
    if (companies.length > 0 && !alertShownRef.current) {
      alertShownRef.current = true;
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayContacts = companies.filter(c => c.next_contact === todayStr);
      const stagnantList = companies.filter(c => c.stagnant_days >= 7);
      if (todayContacts.length > 0 || stagnantList.length > 0) {
        setTimeout(() => setShowTodayAlert(true), 800);
      }
    }
  }, [companies]);

  // ?¤ì‹œê°?êµ¬ë…
  useEffect(() => {
    const channel = supabase.channel("crm-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "companies" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, fetchAll)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchAll]);

  const filtered = useMemo(() => (companies || []).filter(c => {
    const s = search.toLowerCase();
    const matchSearch = !s || c.name?.includes(s) || c.representative?.includes(s);
    const matchStage = filterStage === "?„ì²´" || c.stage === filterStage;
    const matchAssignee = filterAssignee === "?„ì²´" || c.assignee === filterAssignee;
    const matchType = filterType === "?„ì²´" || c.type === filterType;
    return matchSearch && matchStage && matchAssignee && matchType;
  }), [companies, search, filterStage, filterAssignee, filterType]);

  const stagnant = companies.filter(c => c.stagnant_days >= 7);
  const assignees = ["?„ì²´", ...new Set(profiles.map(p => p.name))];

  const logout = () => supabase.auth.signOut();

  // 30ë¶??ë™ ë¡œê·¸?„ì›ƒ
  useEffect(() => {
    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { supabase.auth.signOut(); }, 30 * 60 * 1000);
    };
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach(e => window.addEventListener(e, reset));
    reset();
    return () => { clearTimeout(timer); events.forEach(e => window.removeEventListener(e, reset)); };
  }, []);

  // ?Œì‚¬ ?€??  const saveCompany = async (data, prevData) => {
    const { documents, ...rest } = data;
    const { error } = await supabase.from("companies").update({
      name: rest.name, type: rest.type, representative: rest.representative,
      phone: rest.phone, stage: rest.stage, assignee: rest.assignee,
      agency: rest.agency, received_docs: rest.received_docs, last_contact: rest.last_contact,
      next_contact: rest.next_contact, call_count: rest.call_count,
      fee: rest.fee, fee_status: rest.fee_status,
      revenue_2023: rest.revenue_2023, revenue_2024: rest.revenue_2024, revenue_2025: rest.revenue_2025,
      issue: rest.issue, next_action: rest.next_action,
      employee_count: rest.employee_count || null, credit_score: rest.credit_score || null,
      credit_score_kcb: rest.credit_score_kcb ? parseInt(rest.credit_score_kcb) || null : null,
      credit_score_nice: rest.credit_score_nice ? parseInt(rest.credit_score_nice) || null : null,
      founded_year: rest.founded_year || null, founded_month: rest.founded_month ? parseInt(rest.founded_month) || null : null,
      application_month: rest.application_month || null,
      business_number: rest.business_number || null,
      business_type: rest.business_type || null,
      industry: rest.industry || null,
      region: rest.region || null,
      contract_date: rest.contract_date || null,
    }).eq("id", rest.id);
    if (!error) {
      // ? ì²­?ˆì •??+ ?´ë‹¹ê¸°ê????ˆìœ¼ë©?ê¸°ê?ë³??„í™©???ë™ ë°˜ì˜
      if (rest.application_month && rest.agency) {
        var monthNum = parseInt(rest.application_month.split("-")[1], 10);
        var yearNum = parseInt(rest.application_month.split("-")[0], 10);
        var AGENCY_MAP = {
          "?Œìƒê³µì¸?œì¥ì§„í¥ê³µë‹¨": "?Œìƒê³µì¸?œì¥ì§„í¥ê³µë‹¨",
          "ì¤‘ì†Œë²¤ì²˜ê¸°ì—…ì§„í¥ê³µë‹¨": "ì¤‘ì†Œë²¤ì²˜ê¸°ì—…ì§„í¥ê³µë‹¨",
          "? ìš©ë³´ì¦ê¸°ê¸ˆ": "? ìš©ë³´ì¦ê¸°ê¸ˆ",
          "ê¸°ìˆ ë³´ì¦ê¸°ê¸ˆ": "ê¸°ìˆ ë³´ì¦ê¸°ê¸ˆ",
          "? ìš©ë³´ì¦?¬ë‹¨": "? ìš©ë³´ì¦?¬ë‹¨",
          "?œë?ê¸ˆìœµì§„í¥??: "? ìš©ë³´ì¦?¬ë‹¨",
          "êµ¬ì¡°?ì‹ &?¬ì—…?„í™˜": "êµ¬ì¡°?ì‹ &?¬ì—…?„í™˜",
          "ê¸°í?": "ê¸°í?",
        };
        var rawAgencies = rest.agency.split(",").map(function(a) { return a.trim(); }).filter(Boolean);
        var mappedGroups = [];
        rawAgencies.forEach(function(a) {
          var g = AGENCY_MAP[a];
          if (g && mappedGroups.indexOf(g) === -1) mappedGroups.push(g);
        });
        var addedCount = 0;
        for (var gi = 0; gi < mappedGroups.length; gi++) {
          var agencyGroup = mappedGroups[gi];
          var existing = await supabase.from("agency_cases")
            .select("id").eq("business_name", rest.name).eq("agency_group", agencyGroup)
            .eq("month", monthNum).eq("year", yearNum).is("deleted_at", null).maybeSingle();
          if (!existing.data) {
            var ins = await supabase.from("agency_cases").insert({
              business_name: rest.name, agency_group: agencyGroup,
              month: monthNum, year: yearNum,
              assignee: Array.isArray(rest.assignee) ? rest.assignee.join(", ") : (rest.assignee || ""),
              representative: rest.representative || null,
              business_number: rest.business_number || null,
              region: rest.region || null,
              notes: rest.issue || null,
              contract_date: rest.contract_date || null,
              status: "?œì‘ ??,
            });
            if (!ins.error) addedCount++;
            else showToast("ê¸°ê?ë³„í˜„???±ë¡ ?¤íŒ¨: " + ins.error.message, "error");
          }
        }
        if (addedCount > 0) showToast("ê¸°ê?ë³??„í™©??" + addedCount + "ê±??ë™ ?±ë¡?ì–´??(" + monthNum + "??!");
      }
      // ?´ìŠˆ/?¡ì…˜ ë³€ê²????œë™ ë¡œê·¸ ?ë™ ê¸°ë¡
      const logEntries = [];
      if (prevData && rest.issue && rest.issue !== prevData.issue) {
        logEntries.push({ case_id: rest.id, case_type: "company", business_name: rest.name, assignee: rest.assignee, log_type: "issue_update", memo: "?„ì¬ ?´ìŠˆ: " + rest.issue.slice(0, 100), logged_by: rest.assignee });
      }
      if (prevData && rest.next_action && rest.next_action !== prevData.next_action) {
        logEntries.push({ case_id: rest.id, case_type: "company", business_name: rest.name, assignee: rest.assignee, log_type: "action_update", memo: "?¤ìŒ ?¡ì…˜: " + rest.next_action.slice(0, 100), logged_by: rest.assignee });
      }
      if (logEntries.length > 0) {
        await supabase.from("activity_logs").insert(logEntries);
      }
      // ê¸°ê?ë³??„í™© ?ë™ ?™ê¸°?? ?Œì‚¬ëª…ì´ ê°™ì? ëª¨ë“  agency_cases???•ë³´ë¥?ìµœì‹ ??      if (rest.name && prevData) {
        var syncUpdates = {};
        if (rest.representative !== prevData.representative) syncUpdates.representative = rest.representative || null;
        if (rest.business_number !== prevData.business_number) syncUpdates.business_number = rest.business_number || null;
        if (rest.region !== prevData.region) syncUpdates.region = rest.region || null;
        if (rest.contract_date !== prevData.contract_date) syncUpdates.contract_date = rest.contract_date || null;
        var prevAssignee = Array.isArray(prevData.assignee) ? prevData.assignee.join(", ") : (prevData.assignee || "");
        var newAssignee = Array.isArray(rest.assignee) ? rest.assignee.join(", ") : (rest.assignee || "");
        if (newAssignee !== prevAssignee) syncUpdates.assignee = newAssignee;
        // ?Œì‚¬ëª?ë³€ê²???        var nameChanged = prevData.name && rest.name !== prevData.name;
        if (nameChanged) syncUpdates.business_name = rest.name;
        if (Object.keys(syncUpdates).length > 0) {
          var oldName = nameChanged ? prevData.name : rest.name;
          var syncResult = await supabase.from("agency_cases").update(syncUpdates).eq("business_name", oldName).is("deleted_at", null);
          if (!syncResult.error && syncResult.count !== 0) {
            // ?™ê¸°???±ê³µ (ì¡°ìš©??ì²˜ë¦¬)
          }
        }
      }
      showToast("?€?¥ë?´ìš”!"); fetchAll();
    }
    else showToast("?€???¤íŒ¨: " + error.message, "error");
  };

  // ?œë¥˜ ? ê?
  const toggleDoc = async (docId, current) => {
    await supabase.from("documents").update({ received: !current, received_at: !current ? new Date().toISOString().slice(0,10) : null }).eq("id", docId);
    fetchAll();
  };

  // ? ê·œ ?Œì‚¬ ì¶”ê?
  const addCompany = async (form) => {
    if (!form.name || !form.name.trim()) { showToast("?…ì²´ëª…ì„ ?…ë ¥?´ì£¼?¸ìš”.", "error"); return; }
    if (!form.representative || !form.representative.trim()) { showToast("?€?œìëª…ì„ ?…ë ¥?´ì£¼?¸ìš”.", "error"); return; }
    var insertData = {
      name: form.name.trim(),
      type: form.type || "ë²•ì¸",
      representative: form.representative.trim(),
      phone: form.phone || "",
      stage: form.stage || "?ë‹´/ì§„ë‹¨?„ë£Œ",
      assignee: form.assignee || "",
      agency: form.agency || "",
      last_contact: new Date().toISOString().slice(0,10),
      issue: form.issue || "",
      next_action: form.next_action || "",
      fee: form.fee || 5,
      fee_status: "ë¯¸ìˆ˜??,
      stagnant_days: 0,
      stage_updated_at: new Date().toISOString().slice(0,10),
    };
    if (form.next_contact) insertData.next_contact = form.next_contact;
    if (form.contract_date) insertData.contract_date = form.contract_date;
    if (form.employee_count) insertData.employee_count = parseInt(form.employee_count) || null;
    if (form.credit_score_kcb) insertData.credit_score_kcb = parseInt(form.credit_score_kcb) || null;
    if (form.credit_score_nice) insertData.credit_score_nice = parseInt(form.credit_score_nice) || null;
    if (form.founded_year) insertData.founded_year = parseInt(form.founded_year) || null;
    if (form.founded_month) insertData.founded_month = parseInt(form.founded_month) || null;
    if (form.business_number) insertData.business_number = form.business_number;
    if (form.business_type) insertData.business_type = form.business_type;
    if (form.industry) insertData.industry = form.industry;
    if (form.region) insertData.region = form.region;
    if (form.revenue_2023) insertData.revenue_2023 = parseInt(form.revenue_2023) || null;
    if (form.revenue_2024) insertData.revenue_2024 = parseInt(form.revenue_2024) || null;
    if (form.revenue_2025) insertData.revenue_2025 = parseInt(form.revenue_2025) || null;
    // ë¹ ë¥¸ ?±ë¡?ì„œ agency_list(ë°°ì—´)?€ agency ì²˜ë¦¬
    if (Array.isArray(form.agency_list) && form.agency_list.length > 0) {
      insertData.agency = form.agency_list.join(", ");
      insertData.agency_list = form.agency_list.join(", ");
    } else if (form.agency_list_str) {
      insertData.agency_list = form.agency_list_str;
    }

    const { data: co, error } = await supabase.from("companies").insert(insertData).select().single();
    if (!error && co) {
      // ?œë¥˜ ì²´í¬ë¦¬ìŠ¤???ë™ ?ì„±
      var docsInsert = await supabase.from("documents").insert(DOC_LIST.map(d => ({ company_id: co.id, doc_name: d, received: false }))).select();
      var newCompany = Object.assign({}, co, { documents: docsInsert.data || [] });
      showToast("? ê·œ ?…ì²´ê°€ ?±ë¡?ì–´?? ?ì„¸ ?•ë³´ë¥??…ë ¥?˜ì„¸??");
      setShowAdd(false);
      // ?±ë¡ ??ê³§ë°”ë¡?ê¸°ì—… ?ì„¸ ?”ë©´ ?ë™ ?¤í”ˆ (??ë²??????˜ë„ë¡?
      setSelectedCompany(newCompany);
      fetchAll();
    } else {
      console.error("?±ë¡ ?¤íŒ¨:", error);
      showToast("?±ë¡ ?¤íŒ¨: " + (error?.message || "?????†ëŠ” ?¤ë¥˜"), "error");
    }
  };

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", background: "#F7F6F3", minHeight: "100vh", color: "#1A1917" }}>
      <style>{`
        @media (max-width: 768px) {
          .crm-sidebar { display: none !important; }
          .crm-mobile-nav { display: flex !important; }
          .crm-main { margin-left: 0 !important; padding: 16px !important; padding-bottom: 70px !important; }
        }
        @media (min-width: 769px) {
          .crm-mobile-nav { display: none !important; }
        }
        .crm-mobile-nav {
          position: fixed; bottom: 0; left: 0; right: 0; height: 58px;
          background: #1A1917; display: flex; align-items: center;
          justify-content: space-around; z-index: 200; border-top: 1px solid #2E2C29;
        }
      `}</style>
      {/* ? ìŠ¤??*/}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: toast.type === "success" ? "#15803D" : "#DC2626", color: "#fff", padding: "11px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", animation: "fadein 0.2s ease" }}>
          <style>{`@keyframes fadein{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
          {toast.msg}
        </div>
      )}

      {/* ?¤ëŠ˜ ?????Œë¦¼ ?ì—… */}
      {showTodayAlert && (function() {
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayContacts = companies.filter(c => c.next_contact === todayStr);
        const stagnantList = companies.filter(c => c.stagnant_days >= 7);
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setShowTodayAlert(false)}>
            <div style={{ background: "#fff", borderRadius: 16, padding: "24px", width: 400, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>?“‹ ?¤ëŠ˜??????/div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}</div>
                </div>
                <button onClick={() => setShowTodayAlert(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <Icon name="x" size={18} color="#888" />
                </button>
              </div>
              {todayContacts.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#4338CA", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                    ?“ ?¤ëŠ˜ ?°ë½ ?ˆì • ({todayContacts.length}ê±?
                  </div>
                  {todayContacts.map(function(c) {
                    return (
                      <div key={c.id} onClick={function() { setSelectedCompany(c); setShowTodayAlert(false); }}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#EEF2FF", borderRadius: 8, marginBottom: 6, cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#E0E7FF"}
                        onMouseLeave={e => e.currentTarget.style.background = "#EEF2FF"}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{c.assignee} Â· {c.stage}</div>
                        </div>
                        <Icon name="chevronR" size={14} color="#4338CA" />
                      </div>
                    );
                  })}
                </div>
              )}
              {stagnantList.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#DC2626", marginBottom: 8 }}>
                    ? ï¸ ?•ì²´ ?…ì²´ ({stagnantList.length}ê±?
                  </div>
                  {stagnantList.slice(0, 5).map(function(c) {
                    return (
                      <div key={c.id} onClick={function() { setSelectedCompany(c); setShowTodayAlert(false); }}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#FEF2F2", borderRadius: 8, marginBottom: 6, cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#FEE2E2"}
                        onMouseLeave={e => e.currentTarget.style.background = "#FEF2F2"}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{c.stagnant_days}???•ì²´ Â· {c.assignee}</div>
                        </div>
                        <Icon name="chevronR" size={14} color="#DC2626" />
                      </div>
                    );
                  })}
                </div>
              )}
              {todayContacts.length === 0 && stagnantList.length === 0 && (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#AAA", fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>?‰</div>
                  ?¤ëŠ˜ ???¼ì´ ?†ì–´??
                </div>
              )}
              <button onClick={() => setShowTodayAlert(false)}
                style={{ width: "100%", marginTop: 16, padding: "11px", background: "#1A1917", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                ?•ì¸
              </button>
            </div>
          </div>
        );
      })()}

      {/* ë¹ ë¥¸ ë©”ëª¨ ?ì—… */}
      {quickMemo && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setQuickMemo(false)}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "22px", width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>?ï¸ ë¹ ë¥¸ ë©”ëª¨</div>
              <button onClick={() => setQuickMemo(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Icon name="x" size={18} color="#888" />
              </button>
            </div>
            <textarea value={quickMemoText} onChange={function(e) { var v = e.target.value; setQuickMemoText(v); }}
              placeholder="ë©”ëª¨ ?´ìš©???…ë ¥?˜ì„¸??.."
              rows={5} autoFocus
              style={{ width: "100%", padding: "12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, resize: "none", boxSizing: "border-box", outline: "none", lineHeight: 1.6 }} />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={async function() {
                if (!quickMemoText.trim()) return;
                await supabase.from("work_notes").insert({
                  title: "ë¹ ë¥¸ ë©”ëª¨",
                  content: quickMemoText.trim(),
                  assignee: profile?.name || "",
                  is_todo: false,
                  pinned: false,
                });
                setQuickMemoText("");
                setQuickMemo(false);
                showToast("ë©”ëª¨ê°€ ?€?¥ë?´ìš”!");
              }}
                style={{ flex: 1, padding: "11px", background: "#1A1917", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                ?…ë¬´?¸íŠ¸???€??              </button>
              <button onClick={() => setQuickMemo(false)}
                style={{ padding: "11px 16px", background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                ì·¨ì†Œ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ?¬ì´?œë°” */}
      <div className="crm-sidebar" style={{ position: "fixed", left: 0, top: 0, width: 220, height: "100vh", background: "#1A1917", display: "flex", flexDirection: "column", zIndex: 100 }}>
        <div style={{ padding: "24px 20px 14px" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", color: "#555", textTransform: "uppercase", marginBottom: 5 }}>Policy Fund CRM</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#F7F6F3", letterSpacing: "-0.02em" }}>ì»¨ì„¤??ê´€ë¦?/div>
        </div>

        {stagnant.length > 0 && (
          <div onClick={() => setView("stagnant")} style={{ margin: "0 12px 8px", background: "#7C2020", borderRadius: 8, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="alert" size={13} color="#FCA5A5" />
            <span style={{ color: "#FCA5A5", fontSize: 12, fontWeight: 600 }}>?•ì²´ {stagnant.length}ê±?ê²½ë³´</span>
          </div>
        )}

        <nav style={{ padding: "6px 12px", flex: 1, overflowY: "auto", minHeight: 0 }}>
          {/* ?ì£¼ ?°ëŠ” ë©”ë‰´ */}
          <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.08em", padding: "4px 12px 6px", fontWeight: 600 }}>ì£¼ìš” ë©”ë‰´</div>
          {[
            { id: "dashboard",  label: "?€?œë³´??,   icon: "dashboard" },
            { id: "mytodo",     label: "??? ì¼",     icon: "check" },
            { id: "agency",     label: "ê¸°ê?ë³??„í™©", icon: "building" },
            { id: "worknotes",  label: "?…ë¬´ ?¸íŠ¸",   icon: "edit" },
            { id: "list",       label: "ê¸°ì—… ëª©ë¡",   icon: "list" },
            { id: "pipeline",   label: "?Œì´?„ë¼??,  icon: "pipeline" },
          ].map(({ id, label, icon }) => (
            <div key={id} onClick={() => setView(id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 2, background: view === id ? "#2E2C29" : "transparent", color: view === id ? "#F7F6F3" : "#666", fontSize: 13, fontWeight: view === id ? 600 : 400 }}>
              <Icon name={icon} size={15} color={view === id ? "#F7F6F3" : "#666"} />
              {label}
              {id === "worknotes" && workNotesBadge > 0 && (
                <span style={{ marginLeft: "auto", background: "#DC2626", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>{workNotesBadge}</span>
              )}
              {id === "list" && stagnant.filter(function(c) { return c.stagnant_days >= 14; }).length > 0 && (
                <span style={{ marginLeft: "auto", background: "#B45309", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>??/span>
              )}
            </div>
          ))}

          {/* ?”ë³´ê¸??‘ê¸° */}
          <div onClick={() => setMenuExpanded(m => !m)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", cursor: "pointer", color: "#555", fontSize: 12, marginTop: 4, marginBottom: 2 }}>
            <Icon name={menuExpanded ? "chevronL" : "chevronR"} size={12} color="#555" />
            {menuExpanded ? "?‘ê¸°" : "?”ë³´ê¸?}
            {stagnant.length > 0 && !menuExpanded && (
              <span style={{ background: "#DC2626", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>{stagnant.length}</span>
            )}
          </div>

          {menuExpanded && (
            <>
              <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.08em", padding: "4px 12px 6px", fontWeight: 600 }}>ì¶”ê? ë©”ë‰´</div>
              {/* DBë¦¬ìŠ¤??+ ìº˜ë¦°???„ì•„??*/}
              {[
                { id: "dbleads", label: "DBë¦¬ìŠ¤??, icon: "phone" },
                { id: "calendar", label: "ìº˜ë¦°??, icon: "calendar" },
              ].map(function({ id, label, icon }) {
                return (
                  <div key={id} onClick={function() { setView(id); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 2, background: view === id ? "#2E2C29" : "transparent", color: view === id ? "#F7F6F3" : "#666", fontSize: 13, fontWeight: view === id ? 600 : 400 }}>
                    <Icon name={icon} size={15} color={view === id ? "#F7F6F3" : "#666"} />
                    {label}
                  </div>
                );
              })}
              {[
                { id: "stagnant",    label: "?•ì²´ ?Œë¦¼",   icon: "alert", badge: stagnant.length },
                { id: "activitylog", label: "?œë™ ë¡œê·¸",   icon: "activity" },
                { id: "manual",      label: "?ë£Œ??,      icon: "folder" },
                { id: "settlement",  label: "?•ì‚°ê´€ë¦?,    icon: "money" },
                ...(profile.role === "admin" ? [{ id: "members", label: "?€??ê´€ë¦?, icon: "users" }] : []),
              ].map(({ id, label, icon, badge }) => (
                <div key={id} onClick={() => setView(id)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 2, background: view === id ? "#2E2C29" : "transparent", color: view === id ? "#F7F6F3" : "#666", fontSize: 13, fontWeight: view === id ? 600 : 400 }}>
                  <Icon name={icon} size={15} color={view === id ? "#F7F6F3" : "#666"} />
                  {label}
                  {badge > 0 && (
                    <span style={{ marginLeft: "auto", background: "#DC2626", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>{badge}</span>
                  )}
                </div>
              ))}
            </>
          )}
        </nav>

        {/* ?˜ë‹¨ ?„ë¡œ??*/}
        <div style={{ padding: "12px 16px 20px", borderTop: "1px solid #2E2C29" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2E2C29", display: "flex", alignItems: "center", justifyContent: "center", color: "#F7F6F3", fontSize: 13, fontWeight: 700 }}>{profile.name?.[0]}</div>
            <div>
              <div style={{ color: "#F7F6F3", fontSize: 13, fontWeight: 600 }}>{profile.name}</div>
              <div style={{ color: "#555", fontSize: 11 }}>{profile.team} Â· {profile.role === "admin" ? "ê´€ë¦¬ì" : "?€??}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <button onClick={() => setQuickMemo(true)}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 6px", background: "#4338CA", border: "none", borderRadius: 6, color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
              ?ï¸ ë¹ ë¥¸ ë©”ëª¨
            </button>
            <button onClick={() => setShowTodayAlert(true)}
              style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 10px", background: "#2E2C29", border: "none", borderRadius: 6, color: "#888", fontSize: 11, cursor: "pointer" }}>
              ?“‹
              {companies.filter(c => c.next_contact === new Date().toISOString().slice(0,10)).length > 0 && (
                <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, background: "#DC2626", borderRadius: "50%" }} />
              )}
            </button>
            <button onClick={function() { setShowNotifPanel(function(p) { return !p; }); }}
              style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "7px 10px", background: "#2E2C29", border: "none", borderRadius: 6, color: "#888", fontSize: 14, cursor: "pointer" }}>
              ?””
              {notifications.length > 0 && (
                <span style={{ position: "absolute", top: -3, right: -3, minWidth: 16, height: 16, background: "#DC2626", borderRadius: 99, fontSize: 9, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>{notifications.length}</span>
              )}
            </button>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={fetchAll} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px", background: "#2E2C29", border: "none", borderRadius: 6, color: "#888", fontSize: 11, cursor: "pointer" }}>
              <Icon name="refresh" size={12} color="#888" /> ?ˆë¡œê³ ì¹¨
            </button>
            <button onClick={logout} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px", background: "#2E2C29", border: "none", borderRadius: 6, color: "#888", fontSize: 11, cursor: "pointer" }}>
              <Icon name="logout" size={12} color="#888" /> ë¡œê·¸?„ì›ƒ
            </button>
          </div>
        </div>
      </div>

      {/* ?Œë¦¼ ?¨ë„ */}
      {showNotifPanel && (
        <div style={{ position: "fixed", top: 0, left: 220, right: 0, bottom: 0, zIndex: 900 }} onClick={function() { setShowNotifPanel(false); }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: 360, maxHeight: "100vh", background: "#fff", boxShadow: "4px 0 24px rgba(0,0,0,0.15)", overflowY: "auto" }}
            onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>?”” ?Œë¦¼</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{profile?.name}?˜ì—ê²????…ë¬´ ?Œë¦¼</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {notifications.length > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: 11, color: "#4338CA", background: "none", border: "1px solid #C7D2FE", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>ëª¨ë‘ ?½ìŒ</button>
                )}
                <button onClick={function() { setShowNotifPanel(false); }} style={{ background: "none", border: "none", fontSize: 18, color: "#888", cursor: "pointer" }}>??/button>
              </div>
            </div>
            <div style={{ padding: "12px 16px" }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#CCC", fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>?””</div>
                  ?ˆë¡œ???Œë¦¼???†ì–´??                </div>
              ) : (
                notifications.map(function(note) {
                  return (
                    <div key={note.id} style={{ background: "#F8F9FF", border: "1px solid #E0E7FF", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}
                      onClick={function() { setView("worknotes"); setShowNotifPanel(false); }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1917", marginBottom: 4 }}>{note.title || "?œëª© ?†ìŒ"}</div>
                      {note.content && <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 60, overflow: "hidden" }}>{note.content}</div>}
                      <div style={{ fontSize: 11, color: "#AAA", marginTop: 6 }}>
                        ?‘ì„±?? {note.created_by || note.assignee} Â· {new Date(note.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ë©”ì¸ */}
      <div className="crm-main" style={{ marginLeft: 220, padding: "28px 32px", minHeight: "100vh" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
            <div style={{ width: 36, height: 36, border: "3px solid #E8E5E0", borderTopColor: "#1A1917", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <span style={{ color: "#888", fontSize: 13 }}>?°ì´??ë¶ˆëŸ¬?¤ëŠ” ì¤?..</span>
          </div>
        ) : (
          <>
            {view === "dashboard" && <Dashboard companies={companies} profiles={profiles} stagnant={stagnant} onSelectCompany={setSelectedCompany} setView={setView} setFilterStage={setFilterStage} setDashboardFilter={setDashboardFilter} onAdd={() => setShowAdd(true)} />}
            {view === "agency" && <AgencyView jumpToMonth={agencyJumpMonth} jumpToGroup={agencyJumpGroup} />}
            {view === "dbleads" && <DBLeadsView />}
            {view === "settlement" && <SettlementView />}
            {view === "activitylog" && <ActivityLogView />}
            {view === "worknotes" && <WorkNotesView profile={profile} onBadgeUpdate={function() { fetchWorkNotesBadge(profile?.name); }} />}
            {view === "calendar" && <CalendarView companies={companies} onSelectCompany={setSelectedCompany} profile={profile} />}
            {view === "manual" && <ManualView />}
            {view === "pipeline" && <PipelineView filtered={filtered} filterAssignee={filterAssignee} setFilterAssignee={setFilterAssignee} assignees={assignees} onSelect={setSelectedCompany} />}
            {view === "mytodo" && <MyTodoView currentUser={profile?.name} isAdmin={profile?.role === "admin" || profile?.name === "?‘í˜¸"} onSelectCompany={setSelectedCompany} setView={setView} />}
            {view === "list" && <ListView filtered={filtered} search={search} setSearch={setSearch} filterStage={filterStage} setFilterStage={setFilterStage} filterAssignee={filterAssignee} setFilterAssignee={setFilterAssignee} filterType={filterType} setFilterType={setFilterType} assignees={assignees} onSelect={setSelectedCompany} onAdd={() => setShowAdd(true)} setCompanies={setCompanies} showToast={showToast} dashboardFilter={dashboardFilter} setDashboardFilter={setDashboardFilter} />}
            {view === "stagnant" && <StagnantView stagnant={stagnant} onSelect={setSelectedCompany} />}
            {view === "members" && profile.role === "admin" && <MembersView profiles={profiles} onRefresh={fetchAll} showToast={showToast} />}
          </>
        )}
      </div>

      {selectedCompany && (
        <CompanyModal
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
          onSave={saveCompany}
          onToggleDoc={toggleDoc}
          currentUser={profile}
          onAgencyRegistered={function() {}}
        />
      )}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={addCompany} assignees={assignees.filter(a => a !== "?„ì²´")} />}

      {/* ëª¨ë°”???˜ë‹¨ ?¤ë¹„ê²Œì´??*/}
      <div className="crm-mobile-nav">
        {[
          { id: "dashboard",  label: "??,      icon: "dashboard" },
          { id: "agency",     label: "ê¸°ê?",     icon: "building" },
          { id: "dbleads",    label: "DB",       icon: "phone" },
          { id: "settlement", label: "?•ì‚°",     icon: "money" },
          { id: "calendar",   label: "ìº˜ë¦°??,   icon: "calendar" },
        ].map(({ id, label, icon }) => (
          <div key={id} onClick={() => setView(id)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", flex: 1, padding: "6px 0" }}>
            <Icon name={icon} size={20} color={view === id ? "#F7F6F3" : "#555"} />
            <span style={{ fontSize: 10, color: view === id ? "#F7F6F3" : "#555", fontWeight: view === id ? 700 : 400 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ?€?€ ?€?œë³´???€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
function Dashboard({ companies, profiles, stagnant, onSelectCompany, setView, setFilterStage, setDashboardFilter, onAdd }) {
  const contractDone = companies.filter(c => c.fee_status === "?˜ìˆ˜ë£Œìˆ˜?¹ì™„ë£?).length;
  const contracted = companies.filter(c => c.fee_status !== "ë¯¸ìˆ˜??).length;
  // const thisWeek = companies.filter(c => c.next_contact && c.next_contact <= "2026-05-15").length;
  const stageCount = STAGES.reduce((a, s) => ({ ...a, [s]: companies.filter(c => c.stage === s).length }), {});

  const [agencyCases, setAgencyCases] = useState([]);
  const [kpiGoals, setKpiGoals] = useState([]);
  const [editingKpi, setEditingKpi] = useState(false);
  const [kpiEdits, setKpiEdits] = useState({});
  const thisMonth = new Date().getMonth() + 1;
  const thisYear = 2026;

  useEffect(function() {
    supabase.from("agency_cases").select("*").is("deleted_at", null).limit(10000).then(function(r) {
      if (!r.error) setAgencyCases(r.data || []);
    });
    supabase.from("kpi_goals").select("*").eq("year", thisYear).eq("month", thisMonth).then(function(r) {
      if (!r.error) setKpiGoals(r.data || []);
    });
  }, [thisMonth, thisYear]);
  const monthCases = agencyCases.filter(c => c.month === thisMonth && c.year === thisYear);
  const DASHBOARD_AGENCY_GROUPS = [
    { id: "?Œìƒê³µì¸?œì¥ì§„í¥ê³µë‹¨", label: "?Œì§„ê³?, color: "#4338CA", ids: ["?Œìƒê³µì¸?œì¥ì§„í¥ê³µë‹¨"] },
    { id: "ì¤‘ì†Œë²¤ì²˜ê¸°ì—…ì§„í¥ê³µë‹¨", label: "ì¤‘ì§„ê³?, color: "#7C3AED", ids: ["ì¤‘ì†Œë²¤ì²˜ê¸°ì—…ì§„í¥ê³µë‹¨","êµ¬ì¡°?ì‹ &?¬ì—…?„í™˜"] },
    { id: "ê¸°ê¸ˆ", label: "ë³´ì¦ê¸°ê¸ˆ", color: "#0F6E56", ids: ["? ìš©ë³´ì¦ê¸°ê¸ˆ"] },
    { id: "?¬ë‹¨", label: "ë³´ì¦?¬ë‹¨", color: "#B45309", ids: ["? ìš©ë³´ì¦?¬ë‹¨"] },
    { id: "ê¸°í?", label: "ê²½ì •ì²?µ¬/ê¸°í?", color: "#555", ids: ["ê²½ì •ì²?µ¬","ê¸°í?"] },
  ];
  const agencyStats = DASHBOARD_AGENCY_GROUPS.map(function(g) {
    const cases = monthCases.filter(c => g.ids.includes(c.agency_group));
    const approved = cases.filter(c => ["?¹ì¸","?½ì •","?„ë£Œ"].includes(c.status)).length;
    const total = cases.length;
    const rate = total > 0 ? Math.round(approved / total * 100) : 0;
    return { id: g.id, label: g.label, color: g.color, ids: g.ids, total, approved, rate };
  });

  // ?´ë‹¹?ë³„ KPI
  const assigneeKpi = ASSIGNEES.map(function(name) {
    const myCases = monthCases.filter(c => c.assignee === name);
    const approved = myCases.filter(c => ["?¹ì¸","?½ì •","?„ë£Œ"].includes(c.status)).length;
    const goal = kpiGoals.find(g => g.assignee === name);
    const goalAmt = goal ? goal.goal_approvals : 0;
    const pct = goalAmt > 0 ? Math.min(Math.round(approved / goalAmt * 100), 100) : 0;
    return { name, total: myCases.length, approved, goalAmt, pct };
  }).filter(a => a.total > 0 || a.goalAmt > 0);

  const saveKpiGoals = async function() {
    for (const [assignee, val] of Object.entries(kpiEdits)) {
      await supabase.from("kpi_goals").upsert({
        year: thisYear, month: thisMonth, assignee,
        goal_approvals: parseInt(val) || 0,
        updated_at: new Date().toISOString()
      }, { onConflict: "year,month,assignee" });
    }
    const r = await supabase.from("kpi_goals").select("*").eq("year", thisYear).eq("month", thisMonth);
    if (!r.error) setKpiGoals(r.data || []);
    setEditingKpi(false); setKpiEdits({});
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>?€?œë³´??/h1>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>?„ì²´ ?„í™©???œëˆˆ??/p>
        </div>
        <button onClick={onAdd} style={{ display: "flex", alignItems: "center", gap: 6, background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Icon name="plus" size={15} color="#F7F6F3" /> ? ê·œ ?…ì²´ ?±ë¡
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
        {[
          { label: "?„ì²´ ê´€ë¦??…ì²´", value: companies.length, sub: "ë²•ì¸ " + companies.filter(c=>c.type==="ë²•ì¸").length + " Â· ê°œì¸ " + companies.filter(c=>c.type==="ê°œì¸").length, color: "#4338CA", viewId: "list" },
          { label: "ê³„ì•½ ?„ë£Œ", value: contracted + "ê±?, sub: "?˜ìˆ˜ë£??„ë‚© " + contractDone + "ê±?, color: "#15803D", viewId: "settlement" },
          { label: "?€ê¸?ê±?, value: companies.filter(c=>["?ë‹´/ì§„ë‹¨?„ë£Œ","?„ìˆ˜?œë¥˜ ë°??¸ì¦?œìš”ì²?,"ê¸°ê?? ì²­?€ê¸?ë°©ë¬¸?ˆì •","?¤í¬ë¦½íŠ¸ ?„ë‹¬ ?„ë£Œ"].includes(c.stage)).length + "ê±?, sub: "? ì²­ ???¨ê³„", color: "#B45309", viewId: "pipeline" },
          { label: "ì§„í–‰ì¤?, value: companies.filter(c=>["ê¸°ê?? ì²­?„ë£Œ/ë°©ë¬¸?„ë£Œ","?¬ì‚¬ì¤??¤íƒœì¡°ì‚¬?€ê¸?,"?¤íƒœì¡°ì‚¬?„ë£Œ/?½ì •?„ë£Œ","?ê¸ˆì§‘í–‰?„ë£Œ"].includes(c.stage)).length + "ê±?, sub: "ê¸°ê? ? ì²­ ?´í›„", color: "#7C3AED", viewId: "agency" },
        ].map((k, i) => (
          <div key={i} onClick={() => setView(k.viewId)}
            style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #E8E5E0", cursor: "pointer", transition: "box-shadow 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.04em", color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "#AAA", marginTop: 4, marginBottom: 8 }}>{k.sub}</div>
            <div style={{ fontSize: 11, color: k.color, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
              ë°”ë¡œê°€ê¸?<Icon name="chevronR" size={12} color={k.color} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E8E5E0", marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>?Œì´?„ë¼???¨ê³„ë³??„í™©</div>
        <div style={{ display: "flex", gap: 10 }}>
          {STAGES.map((stage, i) => {
            const c = STAGE_COLORS[stage];
            const count = stageCount[stage] || 0;
            const pct = companies.length ? Math.round(count / companies.length * 100) : 0;
            return (
              <div key={stage} onClick={() => { setView("list"); setFilterStage(stage); }}
                style={{ flex: 1, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: c.text }}>0{i+1}</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: c.text }}>{count}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: c.text, marginBottom: 8 }}>{stage}</div>
                <div style={{ height: 4, background: `${c.border}`, borderRadius: 99 }}>
                  <div style={{ height: 4, background: c.text, borderRadius: 99, width: pct + "%" }} />
                </div>
                <div style={{ fontSize: 10, color: c.text, marginTop: 4, opacity: 0.7 }}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ê¸°ê?ë³??´ë²ˆ ???„í™© */}
      {true && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E8E5E0", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>ê¸°ê?ë³??´ë²ˆ ???„í™© <span style={{ fontSize: 12, color: "#888", fontWeight: 400 }}>{thisMonth}??/span></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            {agencyStats.map(function(g) {
              var allCases = agencyCases.filter(function(c) { return g.ids.includes(c.agency_group); });
              var doneCases = allCases.filter(function(c) { return ["?¹ì¸","?½ì •","?„ë£Œ"].includes(c.status) && c.contract_date; });
              var avgDays = 0;
              if (doneCases.length > 0) {
                var totalDays = doneCases.reduce(function(s, c) {
                  var contractDate = new Date(c.contract_date);
                  var createdDate = new Date(c.created_at || c.contract_date);
                  var diff = Math.max(0, Math.floor((contractDate - createdDate) / 86400000));
                  return s + diff;
                }, 0);
                avgDays = Math.round(totalDays / doneCases.length);
              }
              return (
                <div key={g.id} style={{ background: "#F7F6F3", borderRadius: 10, padding: "14px 16px", borderLeft: "3px solid " + g.color }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: g.color, marginBottom: 8 }}>{g.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#1A1917", marginBottom: 2 }}>{g.total}ê±?/div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>?¹ì¸ {g.approved}ê±?/div>
                  <div style={{ height: 4, background: "#E8E5E0", borderRadius: 99 }}>
                    <div style={{ height: 4, background: g.color, borderRadius: 99, width: g.rate + "%" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                    <span style={{ fontSize: 10, color: g.color, fontWeight: 600 }}>?¹ì¸??{g.rate}%</span>
                    {avgDays > 0 && <span style={{ fontSize: 10, color: "#888", fontWeight: 600 }}>?‰ê·  {avgDays}??/span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ?†• ë¯¸ì™„ë£??…ë¬´ ?¸íŠ¸ ?„ì ¯ */}
      {(function() {
        var today = new Date().toISOString().slice(0, 10);
        var myTodos = companies ? [] : []; // ?¤ì œ work_notes?ì„œ ê°€?¸ì????˜ë?ë¡?ë³„ë„ ì²˜ë¦¬
        return null; // ?…ë¬´?¸íŠ¸??WorkNotesView?ì„œ ê´€ë¦?      })()}

      {/* ?†• ?¤ëŠ˜???????„ì ¯ */}
      {(function() {
        var today = new Date().toISOString().slice(0, 10);
        var tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        var weekLater = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
        var todayItems = companies.filter(function(c) { return c.next_contact === today || c.contract_date === today; });
        var tomorrowItems = companies.filter(function(c) { return c.next_contact === tomorrow || c.contract_date === tomorrow; });
        var overdue = companies.filter(function(c) { return c.next_contact && c.next_contact < today; });
        var stagnant14 = companies.filter(function(c) { return c.stagnant_days >= 14; });
        var stagnant7 = companies.filter(function(c) { return c.stagnant_days >= 7 && c.stagnant_days < 14; });
        var weekContracts = companies.filter(function(c) { return c.contract_date && c.contract_date > today && c.contract_date <= weekLater; });
        var totalCount = todayItems.length + tomorrowItems.length + overdue.length + stagnant14.length + stagnant7.length + weekContracts.length;
        if (totalCount === 0) return null;
        return (
          <div style={{ background: "linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%)", borderRadius: 12, padding: "20px 24px", border: "1px solid #FCD34D", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 16 }}>?“‹</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#92400E" }}>?¤ëŠ˜??????/div>
              <span style={{ fontSize: 11, color: "#92400E", background: "#FEF3C7", padding: "2px 8px", borderRadius: 99, fontWeight: 600, border: "1px solid #FCD34D" }}>{totalCount}ê±?/span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              {/* ?“‹ ??? ì¼ ?„ì ¯ - work_notes ì²´í¬ë°•ìŠ¤ ê¸°ë°˜ */}
              <MyTodoWidget setView={setView} />
              
              {/* companies ê¸°ë°˜ ?„ì ¯ ?œê±°??- work_notes ê¸°ë°˜ "??? ì¼" ?„ì ¯??ë©”ì¸ */}
              {stagnant14.length > 0 && (
                <div onClick={function() { setView("stagnant"); }} style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", cursor: "pointer", borderLeft: "3px solid #DC2626" }}>
                  <div style={{ fontSize: 10, color: "#DC2626", fontWeight: 700, marginBottom: 4 }}>?”´ ?¬ê° ?•ì²´</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#DC2626" }}>{stagnant14.length}ê±?/div>
                  <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>14???´ìƒ ?•ì²´</div>
                </div>
              )}
              {stagnant7.length > 0 && (
                <div onClick={function() { setView("stagnant"); }} style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", cursor: "pointer", borderLeft: "3px solid #B45309" }}>
                  <div style={{ fontSize: 10, color: "#B45309", fontWeight: 700, marginBottom: 4 }}>?Ÿ¡ ?•ì²´ ì£¼ì˜</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#B45309" }}>{stagnant7.length}ê±?/div>
                  <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>7-13???•ì²´</div>
                </div>
              )}
              {weekContracts.length > 0 && (
                <div onClick={function() { setView("list"); }} style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", cursor: "pointer", borderLeft: "3px solid #15803D" }}>
                  <div style={{ fontSize: 10, color: "#15803D", fontWeight: 700, marginBottom: 4 }}>?“‹ ?´ë²ˆ ì£?ê³„ì•½</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#15803D" }}>{weekContracts.length}ê±?/div>
                  <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>7????ê³„ì•½ ?ˆì •</div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ?†• ë¯¸ìˆ˜ê¸?/ ?…ê¸ˆ ?ˆì • ?„ì ¯ */}
      {(function() {
        var unpaidList = companies.filter(function(c) { return c.fee_status === "ê³„ì•½ê¸ˆìˆ˜?? || c.fee_status === "ë¯¸ìˆ˜??; });
        var unpaidTotal = unpaidList.reduce(function(sum, c) { var amt = parseInt((c.received_amount || c.request_amount || "0").toString().replace(/[^0-9]/g, "")) || 0; return sum + amt; }, 0);
        var paidList = companies.filter(function(c) { return c.fee_status === "?˜ìˆ˜ë£Œìˆ˜?¹ì™„ë£?; });
        var paidTotal = paidList.reduce(function(sum, c) { var amt = parseInt((c.received_amount || "0").toString().replace(/[^0-9]/g, "")) || 0; return sum + amt; }, 0);
        var formatAmt = function(n) { if (n >= 100000000) return (n / 100000000).toFixed(1) + "??; if (n >= 10000) return Math.round(n / 10000) + "ë§?; return n + "??; };
        return (
          <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E8E5E0", marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>?’° ?˜ìˆ˜ë£??„í™©</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <div onClick={function() { setView("settlement"); }} style={{ background: "#FEF2F2", borderRadius: 10, padding: "14px 16px", cursor: "pointer", borderLeft: "3px solid #DC2626" }}>
                <div style={{ fontSize: 11, color: "#DC2626", fontWeight: 700, marginBottom: 5 }}>ë¯¸ìˆ˜ê¸?/div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#DC2626" }}>{formatAmt(unpaidTotal)}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>{unpaidList.length}ê±?ë¯¸ì…ê¸?/div>
              </div>
              <div onClick={function() { setView("settlement"); }} style={{ background: "#F0FDF4", borderRadius: 10, padding: "14px 16px", cursor: "pointer", borderLeft: "3px solid #15803D" }}>
                <div style={{ fontSize: 11, color: "#15803D", fontWeight: 700, marginBottom: 5 }}>?…ê¸ˆ ?„ë£Œ</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#15803D" }}>{formatAmt(paidTotal)}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>{paidList.length}ê±??„ë£Œ</div>
              </div>
              <div style={{ background: "#F7F6F3", borderRadius: 10, padding: "14px 16px", borderLeft: "3px solid #4338CA" }}>
                <div style={{ fontSize: 11, color: "#4338CA", fontWeight: 700, marginBottom: 5 }}>ì´??˜ìˆ˜ë£?/div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#4338CA" }}>{formatAmt(unpaidTotal + paidTotal)}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>?„ì²´ ?©ê³„</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* KPI ëª©í‘œ ?¬ì„±ë¥?*/}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E8E5E0", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>?´ë‹¹?ë³„ KPI ?¬ì„±ë¥?<span style={{ fontSize: 12, color: "#888", fontWeight: 400 }}>{thisMonth}??ëª©í‘œ</span></div>
          <div style={{ display: "flex", gap: 6 }}>
            {editingKpi ? (
              <>
                <button onClick={saveKpiGoals} style={{ fontSize: 12, padding: "5px 12px", background: "#1A1917", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>?€??/button>
                <button onClick={function() { setEditingKpi(false); setKpiEdits({}); }} style={{ fontSize: 12, padding: "5px 10px", background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 6, cursor: "pointer" }}>ì·¨ì†Œ</button>
              </>
            ) : (
              <button onClick={function() { setEditingKpi(true); }} style={{ fontSize: 12, padding: "5px 12px", background: "#F7F6F3", color: "#555", border: "1px solid #E8E5E0", borderRadius: 6, cursor: "pointer" }}>ëª©í‘œ ?¤ì •</button>
            )}
          </div>
        </div>
        {editingKpi ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
            {ASSIGNEES.map(function(name) {
              var goal = kpiGoals.find(function(g) { return g.assignee === name; });
              return (
                <div key={name} style={{ background: "#F7F6F3", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{name}</div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>?¹ì¸ ëª©í‘œ (ê±?</div>
                  <input type="number" min="0"
                    defaultValue={kpiEdits[name] !== undefined ? kpiEdits[name] : (goal ? goal.goal_approvals : 0)}
                    onChange={function(e) { var n = name; setKpiEdits(function(p) { return Object.assign({}, p, { [n]: e.target.value }); }); }}
                    style={{ width: "100%", padding: "6px 8px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 13, boxSizing: "border-box" }} />
                </div>
              );
            })}
          </div>
        ) : assigneeKpi.length === 0 ? (
          <div style={{ textAlign: "center", color: "#CCC", fontSize: 13, padding: "20px 0" }}>
            ?´ë²ˆ ???°ì´?°ê? ?†ì–´?? ëª©í‘œ ?¤ì • ë²„íŠ¼???ŒëŸ¬ KPIë¥??¤ì •?´ì£¼?¸ìš”.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {assigneeKpi.map(function(a) {
              var color = a.pct >= 100 ? "#047857" : a.pct >= 70 ? "#4338CA" : a.pct >= 40 ? "#B45309" : "#DC2626";
              return (
                <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#F7F6F3", borderRadius: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1A1917", color: "#F7F6F3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{a.name[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</span>
                      <span style={{ fontSize: 12, color: "#888" }}>?¹ì¸ {a.approved}ê±?{a.goalAmt > 0 ? "/ ëª©í‘œ " + a.goalAmt + "ê±? : ""}</span>
                    </div>
                    <div style={{ height: 6, background: "#E8E5E0", borderRadius: 99 }}>
                      <div style={{ height: 6, background: color, borderRadius: 99, width: a.pct + "%", transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: color, minWidth: 36, textAlign: "right" }}>
                    {a.goalAmt > 0 ? a.pct + "%" : a.approved + "ê±?}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E8E5E0" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>?´ë‹¹?ë³„ ?…ë¬´ ?„í™©</div>
          {profiles.filter(p => p.role !== "admin").map(p => {
            const mine = companies.filter(c => c.assignee === p.name);
            const stag = mine.filter(c => c.stagnant_days >= 7);
            const pct = companies.length ? Math.round(mine.length / companies.length * 100) : 0;
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9, padding: "8px 10px", background: "#F7F6F3", borderRadius: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1A1917", color: "#F7F6F3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{p.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name} <span style={{ fontWeight: 400, color: "#888", fontSize: 11 }}>{p.team}</span></div>
                  <div style={{ fontSize: 11, color: "#888" }}>{mine.length}ê°??…ì²´ ?´ë‹¹</div>
                </div>
                {stag.length > 0 && <span style={{ fontSize: 10, color: "#DC2626", background: "#FEF2F2", padding: "2px 7px", borderRadius: 99, fontWeight: 600, flexShrink: 0 }}>?•ì²´ {stag.length}</span>}
                <div style={{ width: 70, height: 5, background: "#E8E5E0", borderRadius: 99, flexShrink: 0 }}>
                  <div style={{ height: 5, background: "#1A1917", borderRadius: 99, width: pct + "%" }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #E8E5E0" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>?¤ëŠ˜ ?´ìŠˆ Â· ?¬í†µ???„ìš”</div>
          {companies.filter(c => c.stagnant_days >= 7 || (c.next_contact && c.next_contact <= new Date().toISOString().slice(0,10))).slice(0, 6).map(c => (
            <div key={c.id} onClick={() => onSelectCompany(c)}
              style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #E8E5E0", marginBottom: 7, cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.stagnant_days >= 7 ? "#DC2626" : "#F59E0B", marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name} <span style={{ fontWeight: 400, color: "#888" }}>Â· {c.assignee}</span></div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.issue}</div>
              </div>
              <span style={{ fontSize: 10, color: STAGE_COLORS[c.stage]?.text, background: STAGE_COLORS[c.stage]?.bg, padding: "2px 7px", borderRadius: 99, border: `1px solid ${STAGE_COLORS[c.stage]?.border}`, flexShrink: 0, fontWeight: 600 }}>{c.stage}</span>
            </div>
          ))}
          {companies.filter(c => c.stagnant_days >= 7 || (c.next_contact && c.next_contact <= new Date().toISOString().slice(0,10))).length === 0 && (
            <div style={{ textAlign: "center", color: "#CCC", fontSize: 13, padding: "30px 0" }}>?¤ëŠ˜ ?´ìŠˆê°€ ?†ì–´???‘</div>
          )}
        </div>
      </div>
    </>
  );
}

// ?€?€ ?Œì´?„ë¼???€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
function PipelineView({ filtered, filterAssignee, setFilterAssignee, assignees, onSelect }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>?Œì´?„ë¼??/h1>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>?¨ê³„ë³??…ì²´ ?„í™©</p>
        </div>
        <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
          style={{ padding: "7px 12px", border: "1px solid #E8E5E0", borderRadius: 7, fontSize: 13, background: "#fff", cursor: "pointer" }}>
          {assignees.map(a => <option key={a}>{a}</option>)}
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, alignItems: "start" }}>
        {STAGES.map((stage, si) => {
          const c = STAGE_COLORS[stage];
          const items = filtered.filter(co => co.stage === stage);
          // ?‰ê·  ì²´ë¥˜ ?¼ìˆ˜ ê³„ì‚°
          var avgStay = 0;
          if (items.length > 0) {
            var totalStay = items.reduce(function(s, co) { return s + (co.stagnant_days || 0); }, 0);
            avgStay = Math.round(totalStay / items.length);
          }
          // ?¤ìŒ ?¨ê³„ë¡œì˜ ?„í™˜??(?¨ìˆœ?? ?„ì¬ ?¨ê³„ + ?´í›„ ?¨ê³„ / ?„ì²´)
          var nextStages = STAGES.slice(si + 1);
          var afterCount = filtered.filter(function(co) { return nextStages.includes(co.stage); }).length;
          var conversionPct = items.length + afterCount > 0 ? Math.round(afterCount / (items.length + afterCount) * 100) : 0;
          return (
            <div key={stage} style={{ background: "#fff", borderRadius: 14, border: "1px solid #E8E5E0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ background: c.bg, borderBottom: `2px solid ${c.border}`, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: c.text, letterSpacing: "0.06em" }}>STEP {si+1}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, background: c.text, color: "#fff", borderRadius: 99, padding: "1px 8px" }}>{items.length}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.text, lineHeight: 1.3, marginBottom: 6 }}>{stage}</div>
                <div style={{ display: "flex", gap: 6, fontSize: 9, fontWeight: 600 }}>
                  {avgStay > 0 && <span style={{ color: c.text, opacity: 0.8 }}>?‰ê·  {avgStay}??/span>}
                  {si < STAGES.length - 1 && conversionPct > 0 && <span style={{ color: c.text, opacity: 0.8 }}>??{conversionPct}%</span>}
                </div>
              </div>
              <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: 6, maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
                {items.map(co => {
                  const docPct = docRate(co.documents);
                  return (
                    <div key={co.id} onClick={() => onSelect(co)}
                      style={{ background: co.stagnant_days >= 7 ? "#FEF2F2" : "#F7F6F3", borderRadius: 10, padding: "10px 12px", cursor: "pointer", border: co.stagnant_days >= 7 ? "1px solid #FECACA" : "1px solid transparent", transition: "all 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = co.stagnant_days >= 7 ? "#FEE2E2" : "#EDEDE9"}
                      onMouseLeave={e => e.currentTarget.style.background = co.stagnant_days >= 7 ? "#FEF2F2" : "#F7F6F3"}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1917", lineHeight: 1.3 }}>{co.name}</span>
                        {co.stagnant_days >= 7 && <span style={{ fontSize: 9, color: "#DC2626", fontWeight: 800, background: "#FEE2E2", padding: "2px 5px", borderRadius: 4, flexShrink: 0, marginLeft: 4 }}>??co.stagnant_days}??/span>}
                      </div>
                      <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
                        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: co.type === "ë²•ì¸" ? "#EEF2FF" : "#F0FDF4", color: co.type === "ë²•ì¸" ? "#4338CA" : "#15803D", fontWeight: 600 }}>{co.type}</span>
                        <span style={{ fontSize: 10, color: "#888" }}>{co.assignee}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ flex: 1, height: 3, background: "#E8E5E0", borderRadius: 99 }}>
                          <div style={{ height: 3, background: docPct === 100 ? "#15803D" : c.text, borderRadius: 99, width: docPct + "%", transition: "width 0.3s" }} />
                        </div>
                        <span style={{ fontSize: 9, color: "#AAA", flexShrink: 0 }}>?œë¥˜ {docPct}%</span>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && <div style={{ fontSize: 12, color: "#DDD", textAlign: "center", padding: "24px 0" }}>?†ìŒ</div>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ?€?€ ê¸°ì—… ëª©ë¡ ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€

// ============================================================
// ?“‹ ??? ì¼ ?”ë©´ - work_notes content?ì„œ ì²´í¬ë°•ìŠ¤ ?Œì‹±
// ============================================================
function MyTodoView({ currentUser, isAdmin, onSelectCompany, setView }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(isAdmin ? "all" : "mine"); // "mine" | "all"
  const [filterAssignee, setFilterAssignee] = useState("");

  useEffect(function() {
    fetchNotes();
  }, [viewMode, filterAssignee, currentUser]);

  async function fetchNotes() {
    setLoading(true);
    var query = supabase.from("work_notes").select("*").is("deleted_at", null);
    
    if (viewMode === "mine" && currentUser) {
      query = query.eq("assignee", currentUser);
    } else if (viewMode === "all" && filterAssignee) {
      query = query.eq("assignee", filterAssignee);
    }
    
    var res = await query.order("due_date", { ascending: true, nullsFirst: false });
    if (!res.error) setNotes(res.data || []);
    setLoading(false);
  }

  // ?¸íŠ¸ content?ì„œ ì²´í¬ë°•ìŠ¤ ??ª©???Œì‹± (ê°???ª©ë³?ë§ˆê°?¼ë„ ì¶”ì¶œ)
  function parseCheckboxes(noteContent) {
    if (!noteContent) return [];
    var lines = noteContent.split("\n");
    var items = [];
    lines.forEach(function(line, idx) {
      // - [ ] ?ëŠ” - [x] ?¨í„´ ë§¤ì¹­
      var match = line.match(/^(\s*)- \[([ x])\]\s*(.*)$/i);
      if (match) {
        var textFull = match[3].trim();
        var itemDueDate = null;
        var displayText = textFull;
        
        // ë§ˆê°??ì¶”ì¶œ: [MM/DD] ?ëŠ” [YYYY-MM-DD] ?ëŠ” ??MM/DD
        // ?°ì„ ?œìœ„: ?€ê´„í˜¸ > ?”ì‚´??        var bracketMatch = textFull.match(/\[(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2})\]/);
        var arrowMatch = !bracketMatch && textFull.match(/??s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2})\s*$/);
        var dateStr = bracketMatch ? bracketMatch[1] : (arrowMatch ? arrowMatch[1] : null);
        
        if (dateStr) {
          // YYYY-MM-DD ?ëŠ” MM/DDë¥?YYYY-MM-DDë¡?ë³€??          if (dateStr.indexOf("-") >= 0) {
            itemDueDate = dateStr;
          } else {
            var parts = dateStr.split("/");
            var year = new Date().getFullYear();
            var mm = parts[0].padStart(2, "0");
            var dd = parts[1].padStart(2, "0");
            itemDueDate = year + "-" + mm + "-" + dd;
            // ê³¼ê±° ? ì§œë©??´ë…„?¼ë¡œ (?? 12?”ì— 1/5 = ?¤ìŒ??1/5)
            if (itemDueDate < new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10)) {
              itemDueDate = (year + 1) + "-" + mm + "-" + dd;
            }
          }
          // ?œì‹œ ?ìŠ¤?¸ì—??? ì§œ ë¶€ë¶??œê±°
          displayText = textFull.replace(/\[\d{4}-\d{2}-\d{2}\]|\[\d{1,2}\/\d{1,2}\]/, "").replace(/??s*\d{4}-\d{2}-\d{2}\s*$|??s*\d{1,2}\/\d{1,2}\s*$/, "").trim();
        }
        
        items.push({
          lineIdx: idx,
          checked: match[2].toLowerCase() === "x",
          text: displayText,
          itemDueDate: itemDueDate,
          rawLine: line
        });
      }
    });
    return items;
  }

  // ì²´í¬ë°•ìŠ¤ ? ê? - content ?ìŠ¤??ì§ì ‘ ?˜ì •
  async function toggleCheckbox(noteId, lineIdx, currentChecked) {
    var note = notes.find(function(n) { return n.id === noteId; });
    if (!note || !note.content) return;
    
    var lines = note.content.split("\n");
    var oldLine = lines[lineIdx];
    var newLine;
    
    if (currentChecked) {
      // [x] -> [ ]
      newLine = oldLine.replace(/- \[x\]/i, "- [ ]");
    } else {
      // [ ] -> [x]
      newLine = oldLine.replace(/- \[ \]/i, "- [x]");
    }
    
    lines[lineIdx] = newLine;
    var newContent = lines.join("\n");
    
    // ?™ê????…ë°?´íŠ¸
    setNotes(function(prev) {
      return prev.map(function(n) {
        return n.id === noteId ? Object.assign({}, n, { content: newContent }) : n;
      });
    });
    
    // DB ?€??    var r = await supabase.from("work_notes")
      .update({ content: newContent, updated_at: new Date().toISOString() })
      .eq("id", noteId);
    
    if (r.error) {
      // ?¤íŒ¨ ???ë³µ
      setNotes(function(prev) {
        return prev.map(function(n) {
          return n.id === noteId ? Object.assign({}, n, { content: note.content }) : n;
        });
      });
      alert("?€???¤íŒ¨: " + r.error.message);
    }
  }

  // ëª¨ë“  ?¸íŠ¸?ì„œ ì²´í¬ë°•ìŠ¤ ??ª©??ì¶”ì¶œ + ë©”í??°ì´??ê²°í•©
  // ??ª©ë³?ë§ˆê°?¼ì´ ?ˆìœ¼ë©?ê·¸ê±¸ ?°ì„ , ?†ìœ¼ë©??¸íŠ¸??due_date ?¬ìš©
  var allItems = [];
  notes.forEach(function(note) {
    var items = parseCheckboxes(note.content);
    items.forEach(function(item) {
      if (item.text) { // ë¹???ª© ?œì™¸
        allItems.push({
          noteId: note.id,
          noteTitle: note.title || "(?œëª© ?†ìŒ)",
          assignee: note.assignee,
          taggedCompany: note.tagged_company,
          dueDate: item.itemDueDate || note.due_date,  // ??ª©ë³??°ì„ 
          itemDueDate: item.itemDueDate,                // ??ª©ë³?ë§ˆê°???œì‹œ??          checked: item.checked,
          text: item.text,
          lineIdx: item.lineIdx
        });
      }
    });
  });

  // ì¹´í…Œê³ ë¦¬ë³?ë¶„ë¥˜
  var today = new Date().toISOString().slice(0, 10);
  var tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  var weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  var unchecked = allItems.filter(function(i) { return !i.checked; });
  var checked = allItems.filter(function(i) { return i.checked; });
  
  var overdue = unchecked.filter(function(i) { return i.dueDate && i.dueDate < today; });
  var todayItems = unchecked.filter(function(i) { return i.dueDate === today; });
  var tomorrowItems = unchecked.filter(function(i) { return i.dueDate === tomorrow; });
  var thisWeek = unchecked.filter(function(i) { return i.dueDate && i.dueDate > tomorrow && i.dueDate <= weekEnd; });
  var noDue = unchecked.filter(function(i) { return !i.dueDate; });
  var later = unchecked.filter(function(i) { return i.dueDate && i.dueDate > weekEnd; });

  // ì¹´í…Œê³ ë¦¬ ?Œë” ?¬í¼
  function renderSection(title, items, color, bgColor, icon) {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "6px 12px", background: bgColor, borderRadius: 8, borderLeft: "3px solid " + color }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: color }}>{icon} {title}</span>
          <span style={{ fontSize: 11, color: color, opacity: 0.8 }}>({items.length}ê±?</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {items.map(function(item, idx) {
            var daysOverdue = item.dueDate ? Math.floor((new Date(today) - new Date(item.dueDate)) / 86400000) : 0;
            return (
              <div key={item.noteId + "_" + item.lineIdx + "_" + idx}
                style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", padding: "8px 12px", borderRadius: 6, border: "1px solid #F0EDE8" }}>
                <input type="checkbox" checked={item.checked}
                  onChange={function() { toggleCheckbox(item.noteId, item.lineIdx, item.checked); }}
                  style={{ margin: 0, width: 16, height: 16, cursor: "pointer", flexShrink: 0 }} />
                {item.taggedCompany && (
                  <span style={{ background: "#EEF2FF", color: "#4338CA", padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 600, flexShrink: 0, cursor: "pointer" }}
                    onClick={function() { onSelectCompany && onSelectCompany({ name: item.taggedCompany }); }}>
                    {item.taggedCompany}
                  </span>
                )}
                <span style={{ fontSize: 12, color: "#333", flex: 1, lineHeight: 1.5 }}>{item.text}</span>
                {isAdmin && viewMode === "all" && item.assignee && (
                  <span style={{ background: "#F5F3FF", color: "#6D28D9", padding: "1px 6px", borderRadius: 4, fontSize: 10, flexShrink: 0 }}>
                    {item.assignee}
                  </span>
                )}
                {daysOverdue > 0 && (
                  <span style={{ color: "#DC2626", fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                    {daysOverdue}??ì§€??                  </span>
                )}
                {item.dueDate && daysOverdue <= 0 && (
                  <span style={{ color: item.itemDueDate ? "#4338CA" : "#888", fontSize: 10, flexShrink: 0, fontWeight: item.itemDueDate ? 600 : 400 }} title={item.itemDueDate ? "????ª©??ê°œë³„ ë§ˆê°?? : "?¸íŠ¸ ë§ˆê°??}>
                    {item.itemDueDate ? "?“… " : ""}{item.dueDate.slice(5)}
                  </span>
                )}
                <button onClick={function() { setView && setView("worknotes"); }}
                  style={{ background: "none", border: "none", color: "#888", fontSize: 11, cursor: "pointer", padding: "2px 4px", flexShrink: 0 }}
                  title="?ë³¸ ?¸íŠ¸ë¡??´ë™">
                  ?“
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>ë¶ˆëŸ¬?¤ëŠ” ì¤?..</div>;
  }

  return (
    <div style={{ padding: "24px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>
            ??? ì¼ {currentUser && <span style={{ fontSize: 14, color: "#888", fontWeight: 400 }}>Â· {currentUser}</span>}
          </h1>
          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
            ?„ë£Œ {checked.length}ê±?/ ë¯¸ì™„ë£?{unchecked.length}ê±?          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {isAdmin && (
            <>
              <button onClick={function() { setViewMode("mine"); setFilterAssignee(""); }}
                style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: viewMode === "mine" ? "#1A1917" : "#fff",
                  color: viewMode === "mine" ? "#fff" : "#666",
                  border: viewMode === "mine" ? "none" : "1px solid #E8E5E0" }}>
                ??ê²ƒë§Œ
              </button>
              <button onClick={function() { setViewMode("all"); }}
                style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: viewMode === "all" ? "#1A1917" : "#fff",
                  color: viewMode === "all" ? "#fff" : "#666",
                  border: viewMode === "all" ? "none" : "1px solid #E8E5E0" }}>
                ?„ì²´ ë³´ê¸°
              </button>
              {viewMode === "all" && (
                <select value={filterAssignee} onChange={function(e) { setFilterAssignee(e.target.value); }}
                  style={{ padding: "6px 10px", borderRadius: 6, fontSize: 12, border: "1px solid #E8E5E0", outline: "none" }}>
                  <option value="">ëª¨ë“  ?´ë‹¹??/option>
                  {["ë¯¸í˜„","? ì§„","ê´€??,"ì§€??,"?„ì• ","?¸ì„ ","?™ì¼","?‘í˜¸","?•ì›"].map(function(a) {
                    return <option key={a} value={a}>{a}</option>;
                  })}
                </select>
              )}
            </>
          )}
        </div>
      </div>

      {allItems.length === 0 && (
        <div style={{ background: "#F7F6F3", borderRadius: 12, padding: 40, textAlign: "center", color: "#888" }}>
          <div style={{ fontSize: 30, marginBottom: 12 }}>?“</div>
          <div style={{ fontSize: 14, marginBottom: 6 }}>? ì¼???†ì–´??</div>
          <div style={{ fontSize: 11 }}>?…ë¬´ ?¸íŠ¸??ì²´í¬ë°•ìŠ¤ ?•íƒœë¡?? ì¼???ì–´ì£¼ì„¸??</div>
          <button onClick={function() { setView && setView("worknotes"); }}
            style={{ marginTop: 16, padding: "8px 16px", background: "#1A1917", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
            ?…ë¬´ ?¸íŠ¸ë¡??´ë™
          </button>
        </div>
      )}

      {renderSection("ê¸°í•œ ì§€??, overdue, "#DC2626", "#FEF2F2", "??)}
      {renderSection("?¤ëŠ˜", todayItems, "#4338CA", "#EEF2FF", "?“…")}
      {renderSection("?´ì¼", tomorrowItems, "#7C3AED", "#F5F3FF", "?“†")}
      {renderSection("?´ë²ˆ ì£?, thisWeek, "#0F6E56", "#E1F5EE", "?—“ï¸?)}
      {renderSection("ê¸°í•œ ?†ìŒ", noDue, "#888", "#F7F6F3", "?“¥")}
      {renderSection("?˜ì¤‘??, later, "#999", "#F7F6F3", "?”®")}
      
      {checked.length > 0 && (
        <details style={{ marginTop: 24 }}>
          <summary style={{ cursor: "pointer", fontSize: 12, color: "#888", padding: "8px 12px", background: "#F7F6F3", borderRadius: 8 }}>
            ???„ë£Œ????{checked.length}ê±?ë³´ê¸°
          </summary>
          <div style={{ marginTop: 8 }}>
            {renderSection("", checked.slice(0, 50), "#9CA3AF", "#F7F6F3", "??)}
          </div>
        </details>
      )}
    </div>
  );
}


// ?“‹ ?€?œë³´?œìš© ??? ì¼ ë¯¸ë‹ˆ ?„ì ¯
function MyTodoWidget({ setView }) {
  const [count, setCount] = useState({ total: 0, overdue: 0, today: 0 });
  
  useEffect(function() {
    async function load() {
      var res = await supabase.from("work_notes")
        .select("content, due_date")
        .is("deleted_at", null);
      if (res.error || !res.data) return;
      
      var today = new Date().toISOString().slice(0, 10);
      var total = 0, overdue = 0, todayCount = 0;
      
      res.data.forEach(function(note) {
        if (!note.content) return;
        var lines = note.content.split("\n");
        lines.forEach(function(line) {
          var match = line.match(/^\s*- \[ \]\s*(.+)/);
          if (match && match[1].trim()) {
            total++;
            if (note.due_date) {
              if (note.due_date < today) overdue++;
              else if (note.due_date === today) todayCount++;
            }
          }
        });
      });
      
      setCount({ total: total, overdue: overdue, today: todayCount });
    }
    load();
  }, []);
  
  if (count.total === 0) return null;
  
  return (
    <div onClick={function() { setView("mytodo"); }}
      style={{ background: "linear-gradient(135deg, #4338CA 0%, #6366F1 100%)", borderRadius: 10, padding: "14px 16px", cursor: "pointer", color: "#fff", boxShadow: "0 2px 8px rgba(67, 56, 202, 0.2)" }}>
      <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, opacity: 0.9 }}>?“‹ ??? ì¼</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{count.total}ê±?/div>
      <div style={{ fontSize: 10, opacity: 0.9 }}>
        {count.overdue > 0 && <span style={{ marginRight: 6 }}>??ì§€??{count.overdue}</span>}
        {count.today > 0 && <span>?“… ?¤ëŠ˜ {count.today}</span>}
        {count.overdue === 0 && count.today === 0 && <span>ëª¨ë‘ ì§„í–‰ ì¤?/span>}
      </div>
    </div>
  );
}

// ?€?€ ?…ì¢… ?€ ì»´í¬?ŒíŠ¸ (?¸ë¼???¸ì§‘ + ?ë™?„ì„± ?œë¡­?¤ìš´) ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
function IndustryCell({ co, setCompanies }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  const ref = useRef(null);

  // industry??"?œì¡°?? ?„ì†Œë§¤ì—…" ê°™ì? ?¼í‘œ êµ¬ë¶„ ë¬¸ì??  var selectedList = (co.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);

  useEffect(function() {
    if (!editing) return;
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) { setEditing(false); setVal(""); } }
    document.addEventListener("mousedown", handleClick);
    return function() { document.removeEventListener("mousedown", handleClick); };
  }, [editing]);

  var saveList = async function(newList) {
    var industry = newList.length > 0 ? newList.join(", ") : null;
    var r = await supabase.from("companies").update({ industry: industry, updated_at: new Date().toISOString() }).eq("id", co.id);
    if (!r.error) {
      setCompanies && setCompanies(function(prev) { return prev.map(function(c) { return c.id === co.id ? Object.assign({}, c, { industry: industry }) : c; }); });
    }
  };

  var toggleItem = function(item) {
    var cur = selectedList.slice();
    var idx = cur.indexOf(item);
    if (idx >= 0) cur.splice(idx, 1);
    else cur.push(item);
    saveList(cur);
  };

  var addCustom = function() {
    var v = (val || "").trim();
    if (!v) return;
    if (selectedList.indexOf(v) >= 0) { setVal(""); return; }
    var cur = selectedList.slice();
    cur.push(v);
    saveList(cur);
    setVal("");
  };

  if (!editing) return (
    <span onClick={function() { setEditing(true); }}
      style={{ cursor: "pointer", padding: "2px 6px", borderRadius: 4, fontSize: 11, display: "inline-flex", alignItems: "center", gap: 3, color: selectedList.length > 0 ? "#4338CA" : "#CCC",
        background: selectedList.length > 0 ? "#EEF2FF" : "transparent", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      onMouseEnter={function(e) { e.currentTarget.style.background = "#EEF2FF"; }}
      onMouseLeave={function(e) { e.currentTarget.style.background = selectedList.length > 0 ? "#EEF2FF" : "transparent"; }}
      title={selectedList.join(", ")}>
      {selectedList.length > 0 ? selectedList.join(", ") : "+ ?…ì¢…"}
    </span>
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, zIndex: 999, background: "#fff", border: "1px solid #4338CA", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 260, padding: 10 }}>
        <div style={{ fontSize: 10, color: "#888", marginBottom: 6, fontWeight: 700 }}>?…ì¢… ? íƒ (ë³µìˆ˜ ê°€??</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
          {INDUSTRY_OPTIONS.map(function(opt) {
            var sel = selectedList.indexOf(opt) >= 0;
            return (
              <button key={opt} onClick={function() { toggleItem(opt); }}
                style={{ padding: "3px 9px", borderRadius: 99, fontSize: 10, fontWeight: sel ? 700 : 400,
                  background: sel ? "#4338CA" : "#fff", color: sel ? "#fff" : "#666",
                  border: sel ? "none" : "1px solid #E8E5E0", cursor: "pointer" }}>
                {sel ? "??" : ""}{opt}
              </button>
            );
          })}
        </div>
        {/* ì§ì ‘ ?…ë ¥??ì»¤ìŠ¤?€ ?…ì¢… ?œì‹œ */}
        {selectedList.filter(function(s) { return INDUSTRY_OPTIONS.indexOf(s) < 0; }).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
            {selectedList.filter(function(s) { return INDUSTRY_OPTIONS.indexOf(s) < 0; }).map(function(s) {
              return (
                <span key={s} style={{ background: "#0F6E56", color: "#fff", padding: "3px 9px", borderRadius: 99, fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  ??{s}
                  <span onClick={function() { toggleItem(s); }} style={{ cursor: "pointer", fontSize: 11, opacity: 0.8 }}>??/span>
                </span>
              );
            })}
          </div>
        )}
        <input value={val} placeholder="ì§ì ‘ ?…ë ¥ ??Enter (?? ë¶€?™ì‚°?„ë???"
          onChange={function(e) { setVal(e.target.value); }}
          onKeyDown={function(e) { if (e.key === "Enter") { e.preventDefault(); addCustom(); } if (e.key === "Escape") { setEditing(false); setVal(""); } }}
          style={{ width: "100%", padding: "5px 8px", border: "1px solid #E8E5E0", borderRadius: 5, fontSize: 10, outline: "none", boxSizing: "border-box" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 6, borderTop: "1px solid #F0EDE8" }}>
          <span style={{ fontSize: 10, color: "#888" }}>{selectedList.length}ê°?? íƒ??/span>
          <button onClick={function() { setEditing(false); setVal(""); }} style={{ background: "#1A1917", color: "#fff", border: "none", borderRadius: 5, padding: "4px 12px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>?„ë£Œ</button>
        </div>
      </div>
    </div>
  );
}

function ListView({ filtered, search, setSearch, filterStage, setFilterStage, filterAssignee, setFilterAssignee, filterType, setFilterType, assignees, onSelect, onAdd, setCompanies, showToast, dashboardFilter, setDashboardFilter }) {
  const [showCompanyTrash, setShowCompanyTrash] = useState(false);
  const [trashedCompanies, setTrashedCompanies] = useState([]);

  var fetchTrashedCompanies = async function() {
    var r = await supabase.from("companies").select("*").not("deleted_at", "is", null).order("deleted_at", { ascending: false });
    if (!r.error) setTrashedCompanies(r.data || []);
  };
  var restoreCompany = async function(id) {
    var r = await supabase.from("companies").update({ deleted_at: null }).eq("id", id);
    if (!r.error) {
      setTrashedCompanies(function(prev) { return prev.filter(function(c) { return c.id !== id; }); });
      if (setCompanies) setCompanies(function(prev) { return prev.map(function(c) { return c.id === id ? Object.assign({}, c, { deleted_at: null }) : c; }); });
    }
  };
  var permanentDeleteCompany = async function(id) {
    if (!window.confirm("?êµ¬ ?? œ?©ë‹ˆ?? ë³µêµ¬?????†ìŠµ?ˆë‹¤.")) return;
    var r = await supabase.from("companies").delete().eq("id", id);
    if (!r.error) setTrashedCompanies(function(prev) { return prev.filter(function(c) { return c.id !== id; }); });
  };
  var openTrash = function() { fetchTrashedCompanies(); setShowCompanyTrash(true); };
  const [editNameId, setEditNameId] = useState(null);
  const [editNameVal, setEditNameVal] = useState("");
  const [editRegionId, setEditRegionId] = useState(null);
  const [editRegionVal, setEditRegionVal] = useState("");

  const saveNameEdit = async function(id) {
    if (!editNameVal.trim()) { setEditNameId(null); return; }
    var newName = editNameVal.trim();
    var r = await supabase.from("companies").update({ name: newName }).eq("id", id);
    if (!r.error) {
      setCompanies(function(prev) { return prev.map(function(c) { return c.id === id ? Object.assign({}, c, { name: newName }) : c; }); });
      setEditNameId(null);
      if (showToast) showToast("?…ì²´ëª…ì´ ë³€ê²½ë?´ìš”!");
    } else {
      alert("?€???¤íŒ¨: " + r.error.message);
    }
  };

  const saveRegionEdit = async function(id) {
    var newRegion = editRegionVal.trim() || null;
    var r = await supabase.from("companies").update({ region: newRegion }).eq("id", id);
    if (!r.error) {
      setCompanies(function(prev) { return prev.map(function(c) { return c.id === id ? Object.assign({}, c, { region: newRegion }) : c; }); });
      setEditRegionId(null);
      if (showToast) showToast("ì§€??´ ?€?¥ë?´ìš”!");
    } else {
      alert("?€???¤íŒ¨: " + r.error.message);
    }
  };
  return (
    <>
      {dashboardFilter && (
        <div style={{ background: dashboardFilter.type === "overdue" ? "#FEF2F2" : dashboardFilter.type === "today" ? "#EEF2FF" : "#F5F3FF", border: "1px solid " + (dashboardFilter.type === "overdue" ? "#FECACA" : dashboardFilter.type === "today" ? "#C7D2FE" : "#DDD6FE"), borderRadius: 10, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{dashboardFilter.type === "overdue" ? "?? : dashboardFilter.type === "today" ? "?“…" : "?“†"}</span>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: dashboardFilter.type === "overdue" ? "#DC2626" : dashboardFilter.type === "today" ? "#4338CA" : "#7C3AED" }}>
                {dashboardFilter.type === "overdue" ? "ê¸°í•œ ì§€??ê¸°ì—…" : dashboardFilter.type === "today" ? "?¤ëŠ˜ ?°ë½/ê³„ì•½ ê¸°ì—…" : "?´ì¼ ?°ë½/ê³„ì•½ ê¸°ì—…"} {dashboardFilter.items.length}ê±?              </span>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                {dashboardFilter.items.map(function(c) { return c.name; }).join(", ")}
              </div>
            </div>
          </div>
          <button onClick={function() { setDashboardFilter && setDashboardFilter(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#888" }}>??/button>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>ê¸°ì—… ëª©ë¡ <span style={{ fontSize: 15, color: "#888", fontWeight: 400 }}>{filtered.length}ê°?/span></h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onAdd} style={{ display: "flex", alignItems: "center", gap: 6, background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Icon name="plus" size={15} color="#F7F6F3" /> ? ê·œ ?±ë¡
          </button>
          <button onClick={openTrash} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
            ?—‘ï¸??´ì???trashedCompanies.length > 0 ? " (" + trashedCompanies.length + ")" : ""}
          </button>
        </div>
      </div>
      <div style={{ background: "#fff", borderRadius: 10, padding: "12px 16px", border: "1px solid #E8E5E0", marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
          <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}><Icon name="search" size={14} color="#AAA" /></div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="?…ì²´ëª?Â· ?€?œì ê²€??
            style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1px solid #E8E5E0", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        {[
          { v: filterStage, set: setFilterStage, opts: ["?„ì²´", ...STAGES] },
          { v: filterAssignee, set: setFilterAssignee, opts: assignees },
          { v: filterType, set: setFilterType, opts: ["?„ì²´", "ë²•ì¸", "ê°œì¸"] },
        ].map(({ v, set, opts }, i) => (
          <select key={i} value={v} onChange={e => set(e.target.value)}
            style={{ padding: "8px 10px", border: "1px solid #E8E5E0", borderRadius: 7, fontSize: 13, background: "#fff", cursor: "pointer" }}>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        {(search || filterStage !== "?„ì²´" || filterAssignee !== "?„ì²´" || filterType !== "?„ì²´") && (
          <button onClick={() => { setSearch(""); setFilterStage("?„ì²´"); setFilterAssignee("?„ì²´"); setFilterType("?„ì²´"); }}
            style={{ fontSize: 12, color: "#888", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>ì´ˆê¸°??/button>
        )}
      </div>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E5E0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto", maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
          <thead>
            <tr style={{ background: "#F7F6F3", borderBottom: "1px solid #E8E5E0", position: "sticky", top: 0, zIndex: 2 }}>
              {["?…ì²´ëª?,"? í˜•","ì§€??,"?…ì¢…","?€?œì","?´ë‹¹","ì§„í–‰?¨ê³„","?•ì²´?¼ìˆ˜","? ì²­?ˆì •/?ê¸ˆ","ê³„ì•½??,"ì§„í–‰ê¸°ê?","23??25??ë§¤ì¶œ","? ìš©?ìˆ˜","ê¸°í?","?‘ì—…"].map(h => (
                <th key={h} style={{ padding: "10px 8px", fontSize: 11, fontWeight: 600, color: "#888", textAlign: "left", letterSpacing: "0.03em", whiteSpace: "nowrap", background: "#F7F6F3", maxWidth: h === "ì§€?? ? 90 : h === "?€?œì" ? 70 : undefined }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((co, i) => {
              const sc = STAGE_COLORS[co.stage] || {};
              return (
                <tr key={co.id} onClick={() => editNameId !== co.id && editRegionId !== co.id && onSelect(co)}
                  style={{ borderBottom: "1px solid #F0EDE8", cursor: editNameId === co.id ? "default" : "pointer", background: i % 2 === 0 ? "#fff" : "#FAFAF8" }}
                  onMouseOver={e => { if (editNameId !== co.id) e.currentTarget.style.background = "#F0F0EC"; }}
                  onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#FAFAF8"}>
                  <td style={{ padding: "11px 13px", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }} onClick={e => e.stopPropagation()}>
                    {editNameId === co.id ? (
                      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input value={editNameVal} onChange={function(e) { var v = e.target.value; setEditNameVal(v); }} autoFocus
                          onKeyDown={e => { if (e.key === "Enter") saveNameEdit(co.id); if (e.key === "Escape") setEditNameId(null); }}
                          style={{ padding: "3px 7px", border: "1px solid #4338CA", borderRadius: 5, fontSize: 13, fontWeight: 600, outline: "none", width: 140 }} />
                        <button onClick={() => saveNameEdit(co.id)} style={{ background: "#1A1917", color: "#fff", border: "none", borderRadius: 4, padding: "2px 8px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>?€??/button>
                        <button onClick={() => setEditNameId(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#888" }}>ì·¨ì†Œ</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span>{co.name}</span>
                        {co.stagnant_days >= 7 && <span style={{ fontSize: 10, color: "#DC2626" }}>??/span>}
                        <button onClick={e => { e.stopPropagation(); setEditNameId(co.id); setEditNameVal(co.name); }}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, opacity: 0, transition: "opacity 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.opacity = 1}
                          onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                          <Icon name="edit" size={12} color="#888" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "11px 13px", whiteSpace: "nowrap" }}><span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 99, background: co.type === "ë²•ì¸" ? "#EEF2FF" : "#F0FDF4", color: co.type === "ë²•ì¸" ? "#4338CA" : "#15803D", fontWeight: 600 }}>{co.type === "ë²•ì¸" ? "ë²•ì¸?¬ì—…?? : "ê°œì¸?¬ì—…??}</span></td>
                  <td style={{ padding: "11px 8px", fontSize: 12, color: "#555", whiteSpace: "nowrap", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis" }} onClick={e => e.stopPropagation()}>
                    {editRegionId === co.id ? (
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <input value={editRegionVal} onChange={function(e) { var v = e.target.value; setEditRegionVal(v); }} autoFocus
                          onKeyDown={function(e) { if (e.key === "Enter") saveRegionEdit(co.id); if (e.key === "Escape") setEditRegionId(null); }}
                          placeholder="?? ?œìš¸ ê°•ë‚¨"
                          style={{ padding: "3px 7px", border: "1px solid #4338CA", borderRadius: 5, fontSize: 12, outline: "none", width: 90 }} />
                        <button onClick={function() { saveRegionEdit(co.id); }} style={{ background: "#1A1917", color: "#fff", border: "none", borderRadius: 4, padding: "2px 6px", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>??/button>
                        <button onClick={function() { setEditRegionId(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#888" }}>??/button>
                      </div>
                    ) : (
                      <span onClick={function(e) { e.stopPropagation(); setEditRegionId(co.id); setEditRegionVal(co.region || ""); }}
                        style={{ cursor: "pointer", padding: "2px 6px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 3 }}
                        onMouseEnter={function(e) { e.currentTarget.style.background = "#EEF2FF"; }}
                        onMouseLeave={function(e) { e.currentTarget.style.background = "transparent"; }}>
                        {co.region || <span style={{ color: "#CCC" }}>+ ?…ë ¥</span>}
                        <Icon name="edit" size={10} color="#AAA" />
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "6px 8px", fontSize: 12, color: "#555", whiteSpace: "nowrap", maxWidth: 80 }} onClick={function(e) { e.stopPropagation(); }}>
                    <IndustryCell co={co} setCompanies={setCompanies} />
                  </td>
                  <td style={{ padding: "11px 8px", fontSize: 12, color: "#555", whiteSpace: "nowrap", maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis" }}>{co.representative || "-"}</td>
                  <td style={{ padding: "11px 13px", fontSize: 12, whiteSpace: "nowrap" }}>{co.assignee || "-"}</td>
                  <td style={{ padding: "11px 13px", whiteSpace: "nowrap" }}><span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 99, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontWeight: 600 }}>{co.stage}</span></td>
                  <td style={{ padding: "11px 13px", whiteSpace: "nowrap", textAlign: "center" }}>{(function() { var d = co.stagnant_days || 0; if (d >= 14) return <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: "#FEE2E2", color: "#DC2626", fontWeight: 700 }}>??{d}??/span>; if (d >= 7) return <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: "#FEF3C7", color: "#B45309", fontWeight: 700 }}>{d}??/span>; return <span style={{ fontSize: 11, color: "#AAA" }}>{d}??/span>; })()}</td>
                  <td style={{ padding: "11px 13px", fontSize: 11, color: "#555", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{co.fund_plan || "-"}</td>
                  <td style={{ padding: "11px 13px", fontSize: 12, color: "#555", whiteSpace: "nowrap" }}>{co.contract_date || "-"}</td>
                  <td style={{ padding: "11px 13px", fontSize: 11, color: "#555", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{co.agency || "-"}</td>
                  <td style={{ padding: "11px 13px", fontSize: 11, color: "#555", whiteSpace: "nowrap" }}>{[formatRevenue(co.revenue_2023), formatRevenue(co.revenue_2024), formatRevenue(co.revenue_2025)].filter(r=>r&&r!=="-").join(" / ") || "-"}</td>
                  <td style={{ padding: "11px 13px", fontSize: 11, color: "#555", whiteSpace: "nowrap" }}>{(co.credit_score_kcb || co.credit_score_nice) ? ((co.credit_score_kcb || "-") + " / " + (co.credit_score_nice || "-")) : "-"}</td>
                  <td style={{ padding: "11px 13px", fontSize: 11, color: "#555", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{co.next_action || "-"}</td>
                  <td style={{ padding: "11px 8px", whiteSpace: "nowrap" }} onClick={function(e) { e.stopPropagation(); }}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                      <button onClick={function() { onSelect(co); }} title="?Œí†µ/?ì„¸ë³´ê¸°"
                        style={{ background: "#EEF2FF", border: "none", borderRadius: 4, padding: "3px 7px", fontSize: 11, cursor: "pointer", color: "#4338CA", fontWeight: 600 }}>?’¬</button>
                      <button onClick={function() { onSelect(co); }} title="?˜ì •"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                        <Icon name="edit" size={14} color="#888" />
                      </button>
                      <button onClick={async function() {
                        if (!window.confirm("'" + co.name + "' ?…ì²´ë¥??´ì??µìœ¼ë¡??´ë™? ê¹Œ??")) return;
                        await supabase.from("companies").update({ deleted_at: new Date().toISOString() }).eq("id", co.id);
                        setCompanies(function(prev) { return prev.filter(function(c) { return c.id !== co.id; }); });
                        if (showToast) showToast("?´ì??µìœ¼ë¡??´ë™?ì–´??");
                      }} title="?? œ(?´ì???"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                        <Icon name="x" size={14} color="#CCC" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        {filtered.length === 0 && <div style={{ padding: "40px", textAlign: "center", color: "#CCC", fontSize: 13 }}>ê²€??ê²°ê³¼ê°€ ?†ì–´??/div>}
      </div>

      {/* ê¸°ì—…ëª©ë¡ ?´ì???ëª¨ë‹¬ */}
      {showCompanyTrash && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={function(e) { if (e.target === e.currentTarget) setShowCompanyTrash(false); }}>
          <div style={{ background: "#fff", borderRadius: 14, width: 640, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>?—‘ï¸?ê¸°ì—…ëª©ë¡ ?´ì???({trashedCompanies.length}ê±?</h2>
              <button onClick={function() { setShowCompanyTrash(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#888" }}>??/button>
            </div>
            <div style={{ padding: "16px 24px" }}>
              {trashedCompanies.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#CCC", fontSize: 13 }}>?´ì??µì´ ë¹„ì–´ ?ˆìŠµ?ˆë‹¤</div>
              ) : (
                trashedCompanies.map(function(co) {
                  var deletedAt = co.deleted_at ? new Date(co.deleted_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
                  return (
                    <div key={co.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F0EDE8" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{co.name}</div>
                        <div style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>?? œ?? {deletedAt} Â· {co.assignee || "-"}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={function() { restoreCompany(co.id); }} style={{ background: "#EEF2FF", color: "#4338CA", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>ë³µêµ¬</button>
                        <button onClick={function() { permanentDeleteCompany(co.id); }} style={{ background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>?êµ¬?? œ</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ?€?€ ?•ì²´ ?Œë¦¼ ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
function StagnantView({ stagnant, onSelect }) {
  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>?•ì²´ ?…ì²´ ?Œë¦¼</h1>
        <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>7???´ìƒ ê°™ì? ?¨ê³„??ë¨¸ë¬¼???ˆëŠ” ?…ì²´</p>
      </div>
      {stagnant.length === 0 ? (
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>??/div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#15803D" }}>ëª¨ë“  ?…ì²´ê°€ ?•ìƒ ì§„í–‰ ì¤‘ì´?ìš”!</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {stagnant.sort((a, b) => b.stagnant_days - a.stagnant_days).map(co => {
            const sc = STAGE_COLORS[co.stage] || {};
            return (
              <div key={co.id} onClick={() => onSelect(co)}
                style={{ background: "#fff", border: "1px solid #FECACA", borderRadius: 12, padding: "18px 22px", cursor: "pointer", display: "flex", gap: 18, alignItems: "flex-start" }}>
                <div style={{ background: "#FEF2F2", borderRadius: 10, padding: "10px 14px", textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#DC2626" }}>{co.stagnant_days}</div>
                  <div style={{ fontSize: 10, color: "#DC2626", fontWeight: 600 }}>???•ì²´</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{co.name}</span>
                    <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 99, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontWeight: 600 }}>{co.stage}</span>
                    <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 99, background: co.type === "ë²•ì¸" ? "#EEF2FF" : "#F0FDF4", color: co.type === "ë²•ì¸" ? "#4338CA" : "#15803D", fontWeight: 600 }}>{co.type}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 7 }}>?´ë‹¹: {co.assignee} Â· {co.agency}</div>
                  {co.issue && <div style={{ fontSize: 12, background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 7, padding: "7px 11px", color: "#92400E", marginBottom: 5 }}><strong>?´ìŠˆ:</strong> {co.issue}</div>}
                  {co.next_action && <div style={{ fontSize: 12, fontWeight: 600 }}>??{co.next_action}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ?€?€ ?€??ê´€ë¦?(ê´€ë¦¬ì ?„ìš©) ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
function MembersView({ profiles, onRefresh, showToast }) {
  const updateRole = async (id, role) => {
    await supabase.from("profiles").update({ role }).eq("id", id);
    showToast("ê¶Œí•œ??ë³€ê²½ë?´ìš”");
    onRefresh();
  };

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 22px" }}>?€??ê´€ë¦?/h1>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E5E0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F7F6F3", borderBottom: "1px solid #E8E5E0" }}>
              {["?´ë¦„","?Œì†?€","ê¶Œí•œ","ê°€?…ì¼"].map(h => (
                <th key={h} style={{ padding: "11px 16px", fontSize: 11, fontWeight: 600, color: "#888", textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid #F0EDE8" }}>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1A1917", color: "#F7F6F3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{p.name[0]}</div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                  </div>
                </td>
                <td style={{ padding: "13px 16px", fontSize: 13, color: "#555" }}>{p.team}</td>
                <td style={{ padding: "13px 16px" }}>
                  <select value={p.role} onChange={e => updateRole(p.id, e.target.value)}
                    style={{ padding: "5px 9px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 12, background: "#fff", cursor: "pointer" }}>
                    <option value="member">?€??/option>
                    <option value="admin">ê´€ë¦¬ì</option>
                  </select>
                </td>
                <td style={{ padding: "13px 16px", fontSize: 12, color: "#888" }}>{p.created_at?.slice(0,10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 16, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "14px 18px", fontSize: 13, color: "#92400E" }}>
        ?’¡ ???€??ì¶”ê?: ?€?ì—ê²???ì£¼ì†Œë¥?ê³µìœ ?˜ê³  ?´ë©”?¼ë¡œ ?Œì›ê°€?…í•˜ê²??´ì£¼?¸ìš”. ê°€???????”ë©´???ë™?¼ë¡œ ?˜í??˜ìš”.
      </div>
    </>
  );
}

// ?€?€ ê¸°ì—… ?ì„¸ ëª¨ë‹¬ ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
function CompanyModal({ company, onClose, onSave, onToggleDoc, currentUser, onAgencyRegistered }) {
  const [tab, setTab] = useState("info");
  const [data, setData] = useState({ ...company });
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(company.name || "");
  const [agencyCases, setAgencyCases] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [commLogs, setCommLogs] = useState([]);
  const [commInput, setCommInput] = useState("");
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [kakaoText, setKakaoText] = useState("");
  const sc = STAGE_COLORS[data.stage] || {};

  useEffect(function() {
    if (!company.name) return;
    setLoadingExtra(true);
    Promise.all([
      supabase.from("agency_cases").select("*").eq("business_name", company.name).order("created_at", { ascending: false }),
      supabase.from("settlement_manual").select("*").eq("business_name", company.name).is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("activity_logs").select("*").eq("company_id", company.id).order("created_at", { ascending: false }),
    ]).then(function([r1, r2, r3]) {
      if (!r1.error) setAgencyCases(r1.data || []);
      if (!r2.error) setSettlements(r2.data || []);
      if (!r3.error) { setCommLogs(r3.data || []); }
      setLoadingExtra(false);
    });
  }, [company.id, company.name]);

  var saveCommLog = async function() {
    if (!commInput.trim()) return;
    var r = await supabase.from("activity_logs").insert({
      company_id: company.id, business_name: company.name,
      assignee: currentUser?.name || "", log_type: "manual_memo",
      memo: commInput.trim(), logged_by: currentUser?.name || "",
    });
    if (!r.error) {
      setCommInput("");
      var r2 = await supabase.from("activity_logs").select("*").eq("company_id", company.id).order("created_at", { ascending: false });
      if (!r2.error) { setCommLogs(r2.data || []); }
    }
  };

  const copyComm = () => {
    const txt = `[${data.name}] / ${data.representative} ?€??n?„ì¬?¨ê³„: ${data.stage}\n?´ìŠˆ: ${data.issue}\n?¤ìŒ?¡ì…˜: ${data.next_action}\nê¸°í•œ: ${data.next_contact}\n?´ë‹¹: ${data.assignee}`;
    navigator.clipboard?.writeText(txt).then(() => {});
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "flex-end" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 460, height: "100vh", background: "#fff", overflowY: "auto", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}>
        {/* ?¤ë” */}
        <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid #E8E5E0", background: sc.bg || "#F7F6F3" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", gap: 7, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#fff", color: data.type === "ë²•ì¸" ? "#4338CA" : "#15803D", fontWeight: 700 }}>{data.type}</span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: sc.text, color: "#fff", fontWeight: 600 }}>{data.stage}</span>
                {data.stagnant_days >= 7 && <span style={{ fontSize: 11, color: "#DC2626", fontWeight: 700, background: "#FEF2F2", padding: "2px 8px", borderRadius: 99 }}>??{data.stagnant_days}???•ì²´</span>}
              </div>
              {editingName ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                  <input value={nameInput} onChange={e => setNameInput(e.target.value)} autoFocus
                    style={{ fontSize: 18, fontWeight: 700, padding: "4px 8px", border: "1px solid #C7D2FE", borderRadius: 6, outline: "none", background: "#fff", width: 260 }} />
                  <button onClick={() => { setData(p => ({ ...p, name: nameInput })); setEditingName(false); }}
                    style={{ background: "#1A1917", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>?•ì¸</button>
                  <button onClick={() => { setNameInput(data.name); setEditingName(false); }}
                    style={{ background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 6, padding: "5px 8px", fontSize: 12, cursor: "pointer" }}>ì·¨ì†Œ</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>{nameInput || data.name}</h2>
                  <button onClick={() => setEditingName(true)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2, opacity: 0.5 }}>
                    <Icon name="edit" size={14} color="#333" />
                  </button>
                </div>
              )}
              <div style={{ fontSize: 13, color: "#666", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <span onClick={function() {
                  var v = prompt("?€?œìëª??˜ì •:", data.representative || "");
                  if (v !== null) setData(function(p) { return Object.assign({}, p, { representative: v }); });
                }} style={{ cursor: "pointer", borderBottom: "1px dashed #CCC" }}
                  title="?´ë¦­?˜ì—¬ ?˜ì •">{data.representative || "?€?œì ?…ë ¥"} ?€??/span>
                <span>Â·</span>
                <span onClick={function() {
                  var v = prompt("?„í™”ë²ˆí˜¸ ?˜ì •:", data.phone || "");
                  if (v !== null) setData(function(p) { return Object.assign({}, p, { phone: v }); });
                }} style={{ cursor: "pointer", borderBottom: "1px dashed #CCC" }}
                  title="?´ë¦­?˜ì—¬ ?˜ì •">{data.phone || "?„í™”ë²ˆí˜¸ ?…ë ¥"}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}><Icon name="x" size={20} color="#888" /></button>
          </div>
          {/* ?¨ê³„ ë³€ê²?*/}
          <div style={{ display: "flex", gap: 4, marginTop: 14, flexWrap: "wrap" }}>
            {STAGES.map(s => (
              <button key={s} onClick={() => setData(p => ({ ...p, stage: s }))}
                style={{ fontSize: 11, padding: "5px 10px", borderRadius: 99, border: `1px solid ${s === data.stage ? STAGE_COLORS[s].text : "#E8E5E0"}`, background: s === data.stage ? STAGE_COLORS[s].text : "#fff", color: s === data.stage ? "#fff" : "#888", cursor: "pointer", fontWeight: s === data.stage ? 700 : 400 }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ??*/}
        <div style={{ display: "flex", borderBottom: "1px solid #E8E5E0", background: "#FAFAF8", overflowX: "auto" }}>
          {[
            { id: "info", label: "ê¸°ë³¸?•ë³´" },
            { id: "docs", label: "?œë¥˜?„í™©" },
            { id: "history", label: "?´ìŠˆÂ·?¡ì…˜" },
            { id: "agency", label: "ê¸°ê?ì§„í–‰", badge: agencyCases.length },
            { id: "settlement", label: "?•ì‚°?„í™©", badge: settlements.length },
            { id: "comm", label: "?Œí†µ?´ì—­", badge: commLogs.length },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: "0 0 auto", padding: "11px 14px", fontSize: 12, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? "#1A1917" : "#888", background: "none", border: "none", borderBottom: `2px solid ${tab === t.id ? "#1A1917" : "transparent"}`, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
              {t.label}
              {t.badge > 0 && <span style={{ fontSize: 10, background: tab === t.id ? "#1A1917" : "#E8E5E0", color: tab === t.id ? "#fff" : "#888", borderRadius: 99, padding: "1px 5px", fontWeight: 700 }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
          {tab === "info" && (
            <>
              <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>?´ë‹¹ ê¸°ê? (ë³µìˆ˜ ? íƒ ê°€??</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {AGENCIES.map(ag => {
                    const selected = (data.agency || "").split(",").map(s => s.trim()).filter(Boolean).includes(ag);
                    return (
                      <button key={ag} onClick={() => {
                        const current = (data.agency || "").split(",").map(s => s.trim()).filter(Boolean);
                        const next = selected ? current.filter(a => a !== ag) : [...current, ag];
                        setData(p => ({ ...p, agency: next.join(", ") }));
                      }} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 99, border: `1px solid ${selected ? "#4338CA" : "#E8E5E0"}`, background: selected ? "#4338CA" : "#fff", color: selected ? "#fff" : "#888", cursor: "pointer", fontWeight: selected ? 700 : 400 }}>
                        {ag}
                      </button>
                    );
                  })}
                </div>
                {data.agency && <div style={{ fontSize: 11, color: "#4338CA", marginTop: 8, fontWeight: 600 }}>? íƒ: {data.agency}</div>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>?°ë½ì²?/div>
                  <input type="text" value={data.phone || ""} placeholder="01012345678" onChange={function(e) { var v = formatPhone(e.target.value); setData(function(p) { return Object.assign({}, p, { phone: v }); }); }} style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
                </div>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>ì¢…ì—…????/div>
                  <input type="number" value={data.employee_count || ""} placeholder="ëª? onChange={function(e) { var v = e.target.value; setData(function(p) { return Object.assign({}, p, { employee_count: v }); }); }} style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
                </div>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>KCB / NICE</div>
                  <input type="text" inputMode="numeric" value={(data.credit_score_kcb || "") + (data.credit_score_nice ? " / " + data.credit_score_nice : "")} placeholder="KCB / NICE" onChange={function(e) { var raw = e.target.value.replace(/[^0-9]/g, ""); var kcb = raw.slice(0, 3); var nice = raw.slice(3, 6); setData(function(p) { return Object.assign({}, p, { credit_score_kcb: kcb, credit_score_nice: nice }); }); }} style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none", minWidth: 0, boxSizing: "border-box" }} />
                </div>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>?¤ë¦½?°ì›”</div>
                  <input type="text" inputMode="numeric" value={(function() { if (!data.founded_year && !data.founded_month) return ""; var y = data.founded_year || ""; var m = data.founded_month; if (!m && m !== 0) return y; return y + "-" + String(m); })()} placeholder="YYYY-MM (?? 2018-08)" onChange={function(e) { var raw = e.target.value.replace(/[^0-9]/g, ""); var year = raw.slice(0, 4); var monthRaw = raw.slice(4, 6); var monthNum; if (monthRaw.length === 0) { monthNum = ""; } else { monthNum = parseInt(monthRaw); if (monthNum > 12) monthNum = 12; } setData(function(p) { return Object.assign({}, p, { founded_year: year, founded_month: monthNum }); }); }} style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none", minWidth: 0, boxSizing: "border-box" }} />
                </div>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>ê³„ì•½??/div>
                  <input type="date" value={data.contract_date || ""} onChange={function(e) { var v = e.target.value; setData(function(p) { return Object.assign({}, p, { contract_date: v }); }); }} style={{ width: "auto", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
                </div>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>?¬ì—…?ë“±ë¡ë²ˆ??/div>
                  <input type="text" value={data.business_number || ""} placeholder="1234567890" onChange={function(e) { var v = formatBizNumber(e.target.value); setData(function(p) { return Object.assign({}, p, { business_number: v }); }); }} style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
                </div>
              </div>
              {/* ?¬ì—…??? í˜• + ì§€??*/}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>?¬ì—…??? í˜•</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {["ê°œì¸?¬ì—…??,"ë²•ì¸?¬ì—…??].map(function(t) {
                      var sel = data.business_type === t;
                      return (
                        <button key={t} onClick={function() { setData(function(p) { return Object.assign({}, p, { business_type: t }); }); }}
                          style={{ flex: 1, padding: "6px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                            background: sel ? (t === "ë²•ì¸?¬ì—…?? ? "#4338CA" : "#0F6E56") : "#fff",
                            color: sel ? "#fff" : "#666",
                            border: sel ? "none" : "1px solid #E8E5E0", cursor: "pointer" }}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>?…ì¢… (ë³µìˆ˜ ? íƒ ê°€??</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                    {INDUSTRY_OPTIONS.map(function(ind) {
                      var cur = (data.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                      var sel = cur.indexOf(ind) >= 0;
                      return (
                        <button key={ind} onClick={function() {
                          var arr = (data.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                          var idx = arr.indexOf(ind);
                          if (idx >= 0) arr.splice(idx, 1);
                          else arr.push(ind);
                          var newVal = arr.length > 0 ? arr.join(", ") : "";
                          setData(function(p) { return Object.assign({}, p, { industry: newVal }); });
                        }}
                          style={{ padding: "4px 9px", borderRadius: 99, fontSize: 11, fontWeight: sel ? 700 : 400,
                            background: sel ? "#4338CA" : "#fff", color: sel ? "#fff" : "#666",
                            border: sel ? "none" : "1px solid #E8E5E0", cursor: "pointer" }}>
                          {sel ? "??" : ""}{ind}
                        </button>
                      );
                    })}
                  </div>
                  {/* ì§ì ‘ ?…ë ¥??ì»¤ìŠ¤?€ ?…ì¢… ?œì‹œ */}
                  {(function() {
                    var cur = (data.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                    var custom = cur.filter(function(s) { return INDUSTRY_OPTIONS.indexOf(s) < 0; });
                    if (custom.length === 0) return null;
                    return (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                        {custom.map(function(s) {
                          return (
                            <span key={s} style={{ background: "#0F6E56", color: "#fff", padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                              ??{s}
                              <span onClick={function() {
                                var arr = (data.industry || "").split(",").map(function(x) { return x.trim(); }).filter(Boolean);
                                arr = arr.filter(function(x) { return x !== s; });
                                setData(function(p) { return Object.assign({}, p, { industry: arr.length > 0 ? arr.join(", ") : "" }); });
                              }} style={{ cursor: "pointer", fontSize: 12, opacity: 0.85 }}>??/span>
                            </span>
                          );
                        })}
                      </div>
                    );
                  })()}
                  <input type="text" placeholder="ì§ì ‘ ?…ë ¥ ??Enterë¡?ì¶”ê? (?? ë¶€?™ì‚°?„ë???"
                    onKeyDown={function(e) {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      var v = (e.target.value || "").trim();
                      if (!v) return;
                      var arr = (data.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                      if (arr.indexOf(v) >= 0) { e.target.value = ""; return; }
                      arr.push(v);
                      setData(function(p) { return Object.assign({}, p, { industry: arr.join(", ") }); });
                      e.target.value = "";
                    }}
                    style={{ width: "100%", padding: "5px 8px", border: "1px solid #E8E5E0", borderRadius: 5, fontSize: 11, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>ì§€??/div>
                  <input type="text" value={data.region || ""} placeholder="?? ?œìš¸_ê°•ë‚¨, ê²½ê¸°_?ˆì‚°" onChange={function(e) { var v = e.target.value; setData(function(p) { return Object.assign({}, p, { region: v }); }); }} style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
                </div>
              </div>
              {/* ?´ë‹¹???¤ì¤‘? íƒ */}
              <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>?´ë‹¹??(ë³µìˆ˜ ? íƒ ê°€??</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ASSIGNEES.map(name => {
                    const selected = (data.assignee || "").split(",").map(s => s.trim()).filter(Boolean).includes(name);
                    return (
                      <button key={name} onClick={() => {
                        const current = (data.assignee || "").split(",").map(s => s.trim()).filter(Boolean);
                        const next = selected ? current.filter(a => a !== name) : [...current, name];
                        setData(p => ({ ...p, assignee: next.join(", ") }));
                      }} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 99, border: `1px solid ${selected ? "#1A1917" : "#E8E5E0"}`, background: selected ? "#1A1917" : "#fff", color: selected ? "#fff" : "#555", cursor: "pointer", fontWeight: selected ? 700 : 400 }}>
                        {name}
                      </button>
                    );
                  })}
                </div>
                {data.assignee && <div style={{ fontSize: 11, color: "#555", marginTop: 8, fontWeight: 600 }}>? íƒ: {data.assignee}</div>}
              </div>
              <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "13px 15px", marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 4, fontWeight: 600 }}>ìµœê·¼ 3ê°œë…„ ë§¤ì¶œ??/div>
                <div style={{ fontSize: 10, color: "#AAA", marginBottom: 10 }}>???¨ìœ„ë¡??…ë ¥ (?? 790000000 ??7.9???ë™ ?œì‹œ)</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["2023??, "revenue_2023"], ["2024??, "revenue_2024"], ["2025??, "revenue_2025"]].map(([label, key]) => (
                    <div key={key} style={{ flex: 1, textAlign: "center", background: "#fff", borderRadius: 7, padding: "10px 8px" }}>
                      <div style={{ fontSize: 11, color: "#AAA", marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#4338CA", marginBottom: 4 }}>{formatRevenue(data[key])}</div>
                      <input
                        type="number"
                        placeholder="???¨ìœ„ ?…ë ¥"
                        value={data[key] || ""}
                        onChange={function(e) { var v = e.target.value; setData(function(p) { return Object.assign({}, p, { [key]: v ? parseInt(v) : null }); }); }}
                        style={{ width: "100%", fontSize: 11, textAlign: "center", border: "1px solid #E8E5E0", borderRadius: 5, padding: "4px", outline: "none", boxSizing: "border-box" }} />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "13px 15px" }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 8, fontWeight: 600 }}>?˜ìˆ˜ë£??„í™©</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["ë¯¸ìˆ˜??,"ê³„ì•½ê¸ˆìˆ˜??,"?˜ìˆ˜ë£Œìˆ˜?¹ì™„ë£?].map(s => (
                    <button key={s} onClick={() => setData(p => ({ ...p, fee_status: s }))}
                      style={{ flex: 1, padding: "7px 4px", borderRadius: 7, border: `1px solid ${data.fee_status === s ? "#1A1917" : "#E8E5E0"}`, background: data.fee_status === s ? "#1A1917" : "#fff", color: data.fee_status === s ? "#fff" : "#888", fontSize: 11, cursor: "pointer", fontWeight: data.fee_status === s ? 700 : 400 }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "docs" && (
            <div>
              <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>?˜ë ¹ ?„ë£Œ ?œë¥˜ (ë³µìˆ˜ ? íƒ ê°€??</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {DOC_LIST.map(function(doc) {
                    const selected = (data.received_docs || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean).includes(doc);
                    return (
                      <button key={doc} onClick={function() {
                        const current = (data.received_docs || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                        const next = selected ? current.filter(function(a) { return a !== doc; }) : [...current, doc];
                        setData(function(p) { return { ...p, received_docs: next.join(", ") }; });
                      }} style={{ fontSize: 11, padding: "6px 11px", borderRadius: 99, border: selected ? "1px solid #15803D" : "1px solid #E8E5E0", background: selected ? "#15803D" : "#fff", color: selected ? "#fff" : "#555", cursor: "pointer", fontWeight: selected ? 700 : 400 }}>
                        {doc}
                      </button>
                    );
                  })}
                </div>
                {data.received_docs ? (
                  <div style={{ fontSize: 11, color: "#15803D", marginTop: 10, fontWeight: 600 }}>
                    ?˜ë ¹?„ë£Œ: {data.received_docs.split(",").filter(Boolean).length}ê°?                  </div>
                ) : null}
              </div>
              <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>ë¯¸ìˆ˜???œë¥˜</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {DOC_LIST.filter(function(doc) {
                    return !(data.received_docs || "").split(",").map(function(s) { return s.trim(); }).includes(doc);
                  }).map(function(doc) {
                    return <span key={doc} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 99, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>{doc}</span>;
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === "history" && (
            <>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 600 }}>?„ì¬ ?´ìŠˆ</div>
                <textarea value={data.issue || ""} onChange={function(e) { var v = e.target.value; setData(function(p) { return { ...p, issue: v }; }); }}
                  style={{ width: "100%", padding: "11px 13px", border: "1px solid #FED7AA", borderRadius: 8, fontSize: 13, resize: "vertical", minHeight: 80, background: "#FFF7ED", color: "#92400E", boxSizing: "border-box", outline: "none" }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 600 }}>ì°¨ê¸° ?…ë¬´ / ?¤ìŒ ?¡ì…˜</div>
                <textarea value={data.next_action || ""} onChange={function(e) { var v = e.target.value; setData(function(p) { return { ...p, next_action: v }; }); }}
                  style={{ width: "100%", padding: "11px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, resize: "vertical", minHeight: 80, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div style={{ background: "#F7F6F3", border: "1px solid #E8E5E0", borderRadius: 8, padding: "13px 15px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: "#555" }}>?“‹ ì¹´í†¡ ê³µìœ ???Œí†µ ?‘ì‹</div>
                <textarea
                  value={kakaoText}
                  onChange={function(e) { setKakaoText(e.target.value); }}
                  placeholder={"?ˆì‹œ)\n[" + (data.name||"?…ì²´ëª?) + "] / " + (data.representative||"?€?œì") + " ?€??n?„ì¬?¨ê³„: " + (data.stage||"") + "\n?´ìŠˆ: \n?¤ìŒ?¡ì…˜: \nê¸°í•œ: \n?´ë‹¹: " + (data.assignee||"")}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 12, lineHeight: 1.9, fontFamily: "monospace", resize: "vertical", minHeight: 130, background: "#fff", boxSizing: "border-box", outline: "none" }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={function() {
                    var defaultTxt = "[" + data.name + "] / " + data.representative + " ?€??n?„ì¬?¨ê³„: " + data.stage + "\n?´ìŠˆ: " + (data.issue||"") + "\n?¤ìŒ?¡ì…˜: " + (data.next_action||"") + "\nê¸°í•œ: " + (data.next_contact||"") + "\n?´ë‹¹: " + (data.assignee||"");
                    setKakaoText(defaultTxt);
                  }} style={{ fontSize: 12, color: "#888", background: "none", border: "1px solid #E8E5E0", borderRadius: 6, padding: "5px 12px", cursor: "pointer" }}>ê¸°ë³¸ê°?ë¶ˆëŸ¬?¤ê¸°</button>
                  <button onClick={function() { navigator.clipboard?.writeText(kakaoText).then(function() {}); }}
                    style={{ fontSize: 12, color: "#4338CA", background: "none", border: "1px solid #C7D2FE", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                    <Icon name="copy" size={13} color="#4338CA" /> ë³µì‚¬?˜ê¸°
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ê¸°ê?ë³?ì§„í–‰?„í™© ??*/}
          {tab === "agency" && (
            <div>
              {loadingExtra ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#AAA", fontSize: 13 }}>ë¶ˆëŸ¬?¤ëŠ” ì¤?..</div>
              ) : agencyCases.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#CCC", fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>?“‹</div>
                  ê¸°ê?ë³?ì§„í–‰ ?°ì´?°ê? ?†ì–´??                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {agencyCases.map(function(c, i) {
                    var grpObj = AGENCY_GROUPS.find(function(g) { return g.id === c.agency_group; });
                    var grpColor = grpObj ? grpObj.color : "#4338CA";
                    return (
                      <div key={c.id} style={{ background: "#F7F6F3", borderRadius: 10, padding: "14px 16px", border: "1px solid #E8E5E0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: grpColor, color: "#fff", fontWeight: 700 }}>{c.agency_group}</span>
                            {c.agency_sub && <span style={{ fontSize: 11, color: "#888" }}>{c.agency_sub}</span>}
                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#fff", color: "#555", border: "1px solid #E8E5E0" }}>{c.status || "ì§„í–‰ì¤?}</span>
                          </div>
                          <span style={{ fontSize: 11, color: "#AAA" }}>{c.month}??/span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                          {[
                            { label: "? ì²­ê¸ˆì•¡", value: c.request_amount },
                            { label: "? ì²­?í’ˆ", value: c.request_fund },
                            { label: "?´ë‹¹??, value: c.assignee },
                            { label: "? ì²­??, value: c.application_date },
                            { label: "?¹ì¸ê²°ê³¼", value: c.approval_result },
                            { label: "?¹ì¸ê¸ˆì•¡", value: c.approved_amount },
                          ].map(function(item) {
                            return item.value ? (
                              <div key={item.label} style={{ background: "#fff", borderRadius: 6, padding: "7px 10px" }}>
                                <div style={{ fontSize: 10, color: "#AAA", marginBottom: 2 }}>{item.label}</div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>{item.value}</div>
                              </div>
                            ) : null;
                          })}
                        </div>
                        {c.notes && <div style={{ marginTop: 8, fontSize: 12, color: "#666", background: "#EEF2FF", borderRadius: 6, padding: "7px 10px" }}>{c.notes}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ?•ì‚°?„í™© ??*/}
          {tab === "settlement" && (
            <div>
              {loadingExtra ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#AAA", fontSize: 13 }}>ë¶ˆëŸ¬?¤ëŠ” ì¤?..</div>
              ) : settlements.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#CCC", fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>?’°</div>
                  ?•ì‚° ?°ì´?°ê? ?†ì–´??                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {settlements.map(function(s) {
                    return (
                      <div key={s.id} style={{ background: "#F7F6F3", borderRadius: 10, padding: "14px 16px", border: "1px solid #E8E5E0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1917" }}>{s.agency_group || "-"} Â· {s.month}??/span>
                          <div style={{ display: "flex", gap: 5 }}>
                            {s.invoice_issued && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "#ECFDF5", color: "#047857", fontWeight: 600 }}>?¸ê¸ˆê³„ì‚°??ë°œí–‰</span>}
                            {s.fee_received && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "#EEF2FF", color: "#4338CA", fontWeight: 600 }}>?…ê¸ˆ?„ë£Œ</span>}
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                          {[
                            { label: "? ì²­ê¸ˆì•¡", value: s.request_amount, color: "#333" },
                            { label: "ê³„ì•½ê¸?, value: s.contract_fee, color: "#333" },
                            { label: "?˜ìˆ˜ë£?, value: s.commission_fee, color: "#7C3AED" },
                            { label: "?…ê¸ˆê¸ˆì•¡", value: s.received_amount, color: "#047857" },
                            { label: "ê³„ì•½??, value: s.contract_date, color: "#555" },
                            { label: "?…ê¸ˆ??, value: s.fee_received_date, color: "#555" },
                          ].map(function(item) {
                            return item.value ? (
                              <div key={item.label} style={{ background: "#fff", borderRadius: 6, padding: "7px 10px" }}>
                                <div style={{ fontSize: 10, color: "#AAA", marginBottom: 2 }}>{item.label}</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.value}</div>
                              </div>
                            ) : null;
                          })}
                        </div>
                        {s.settlement_notes && <div style={{ marginTop: 8, fontSize: 12, color: "#666", background: "#FFF7ED", borderRadius: 6, padding: "7px 10px" }}>{s.settlement_notes}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ?Œí†µ?´ì—­ ??*/}
          {tab === "comm" && (
            <div>
              {/* ?Œí†µ ?…ë ¥ */}
              <div style={{ background: "#F7F6F3", borderRadius: 10, padding: "14px", marginBottom: 16, border: "1px solid #E8E5E0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 8 }}>?Œí†µ ?´ìš© ê¸°ë¡</div>
                <textarea value={commInput} onChange={function(e) { var v = e.target.value; setCommInput(v); }}
                  placeholder="?µí™” ê²°ê³¼, ë°©ë¬¸ ?´ìš©, ë©”ëª¨ ???ìœ ë¡?²Œ ?…ë ¥?˜ì„¸??.."
                  rows={3} style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, resize: "none", boxSizing: "border-box", outline: "none", lineHeight: 1.6 }} />
                <button onClick={saveCommLog} disabled={!commInput.trim()}
                  style={{ width: "100%", marginTop: 8, padding: "10px", background: commInput.trim() ? "#1A1917" : "#E8E5E0", color: commInput.trim() ? "#F7F6F3" : "#AAA", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: commInput.trim() ? "pointer" : "not-allowed" }}>
                  ?€??                </button>
              </div>
              {/* ?Œí†µ ë¡œê·¸ ëª©ë¡ */}
              {loadingExtra ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#AAA", fontSize: 13 }}>ë¶ˆëŸ¬?¤ëŠ” ì¤?..</div>
              ) : commLogs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#CCC", fontSize: 13 }}>?„ì§ ?Œí†µ ?´ì—­???†ì–´??/div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {commLogs.map(function(log, i) {
                    var d = new Date(log.created_at);
                    var ts = d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
                    return (
                      <div key={log.id} style={{ display: "flex", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1A1917", color: "#F7F6F3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {(log.assignee || log.logged_by || "?")[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{log.assignee || log.logged_by || "-"}</span>
                            <span style={{ fontSize: 11, color: "#AAA" }}>{ts}</span>
                          </div>
                          <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6, background: "#F7F6F3", borderRadius: 8, padding: "9px 12px" }}>
                            {log.memo || log.note || "-"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ?€??ë²„íŠ¼ */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #E8E5E0", display: "flex", gap: 8 }}>
          <button onClick={() => onSave({ ...data, name: nameInput || data.name }, company)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            <Icon name="save" size={15} color="#F7F6F3" /> DB???€??          </button>
          <button onClick={async function() {
            if (!data.agency) { alert("?´ë‹¹ê¸°ê???? íƒ?´ì£¼?¸ìš”!"); return; }
            var AGENCY_MAP = {
              "?Œìƒê³µì¸?œì¥ì§„í¥ê³µë‹¨": "?Œìƒê³µì¸?œì¥ì§„í¥ê³µë‹¨",
              "ì¤‘ì†Œë²¤ì²˜ê¸°ì—…ì§„í¥ê³µë‹¨": "ì¤‘ì†Œë²¤ì²˜ê¸°ì—…ì§„í¥ê³µë‹¨",
              "? ìš©ë³´ì¦ê¸°ê¸ˆ": "? ìš©ë³´ì¦ê¸°ê¸ˆ",
              "ê¸°ìˆ ë³´ì¦ê¸°ê¸ˆ": "ê¸°ìˆ ë³´ì¦ê¸°ê¸ˆ",
              "? ìš©ë³´ì¦?¬ë‹¨": "? ìš©ë³´ì¦?¬ë‹¨",
              "?œë?ê¸ˆìœµì§„í¥??: "? ìš©ë³´ì¦?¬ë‹¨",
              "êµ¬ì¡°?ì‹ &?¬ì—…?„í™˜": "êµ¬ì¡°?ì‹ &?¬ì—…?„í™˜",
              "ê¸°í?": "ê¸°í?",
            };
            var companyName = nameInput || data.name;
            var rawAgencies = data.agency.split(",").map(function(a) { return a.trim(); }).filter(Boolean);
            var mappedGroups = [];
            rawAgencies.forEach(function(a) {
              var g = AGENCY_MAP[a];
              if (g && mappedGroups.indexOf(g) === -1) mappedGroups.push(g);
            });
            if (mappedGroups.length === 0) { alert("ë§¤í•‘??ê¸°ê????†ì–´??"); return; }

            // ê¸°ê?ë³„ë¡œ ?±ë¡ ???…ë ¥ë°›ê¸°
            var nowDate = new Date();
            var defaultYM = nowDate.getFullYear() + "-" + String(nowDate.getMonth() + 1).padStart(2, "0");
            // ê¸°ë³¸ê°? data.application_monthê°€ ?ˆìœ¼ë©?ê·¸ê±¸, ?†ìœ¼ë©??´ë²ˆ ??            var baseDefault = data.application_month || defaultYM;
            var agencyMonths = {}; // { ê¸°ê?ëª? "2026-05" }
            for (var ai = 0; ai < mappedGroups.length; ai++) {
              var agName = mappedGroups[ai];
              var promptMsg = "[" + agName + "]\n?´ëŠ ?”ì— ?±ë¡? ê¹Œ??\n?•ì‹: YYYY-MM (?? 2026-05)";
              if (mappedGroups.length > 1) {
                promptMsg = "(" + (ai + 1) + "/" + mappedGroups.length + ") " + promptMsg;
              }
              var inputYM = prompt(promptMsg, baseDefault);
              if (inputYM === null) return; // ì·¨ì†Œ ???„ì²´ ?±ë¡ ì·¨ì†Œ
              inputYM = inputYM.trim() || baseDefault;
              if (!/^\d{4}-\d{2}$/.test(inputYM)) {
                alert("?•ì‹???¬ë°”ë¥´ì? ?ŠìŠµ?ˆë‹¤. ?? 2026-05\n?±ë¡??ì·¨ì†Œ?©ë‹ˆ??");
                return;
              }
              var mNum = parseInt(inputYM.split("-")[1], 10);
              if (mNum < 1 || mNum > 12) {
                alert("?”ì? 1~12 ?¬ì´?¬ì•¼ ?©ë‹ˆ??\n?±ë¡??ì·¨ì†Œ?©ë‹ˆ??");
                return;
              }
              agencyMonths[agName] = inputYM;
              baseDefault = inputYM; // ?¤ìŒ ê¸°ê? ê¸°ë³¸ê°’ì„ ì§ì „???…ë ¥??ê°’ìœ¼ë¡?            }

            // ê¸°ê?ë³„ë¡œ ê°ê° ?±ë¡
            var addedCount = 0;
            var skippedCount = 0;
            var errorMessages = [];
            var registeredGroups = []; // ì²?ë²ˆì§¸ ?±ë¡??ê¸°ê?/??(?´ë™??
            for (var gi = 0; gi < mappedGroups.length; gi++) {
              var agencyGroup = mappedGroups[gi];
              var ym = agencyMonths[agencyGroup];
              var monthNum = parseInt(ym.split("-")[1], 10);
              var yearNum = parseInt(ym.split("-")[0], 10);
              // ì¤‘ë³µ ì²´í¬
              var existing = await supabase.from("agency_cases")
                .select("id")
                .eq("business_name", companyName)
                .eq("agency_group", agencyGroup)
                .eq("month", monthNum)
                .eq("year", yearNum)
                .is("deleted_at", null);
              if (existing.data && existing.data.length > 0) {
                skippedCount++;
                continue;
              }
              var insertData = {
                business_name: companyName,
                agency_group: agencyGroup,
                month: monthNum,
                year: yearNum,
                assignee: Array.isArray(data.assignee) ? data.assignee.join(", ") : (data.assignee || ""),
                representative: data.representative || null,
                business_number: data.business_number || null,
                region: data.region || null,
                notes: data.issue || null,
                contract_date: data.contract_date || null,
                status: "?œì‘ ??,
              };
              var ins = await supabase.from("agency_cases").insert(insertData);
              if (!ins.error) {
                addedCount++;
                if (registeredGroups.length === 0) {
                  registeredGroups.push({ group: agencyGroup, month: monthNum });
                }
              } else {
                errorMessages.push(agencyGroup + ": " + ins.error.message);
              }
            }
            if (errorMessages.length > 0) {
              alert("???±ë¡ ?¤íŒ¨!\n" + errorMessages.join("\n"));
              return;
            }
            // ?±ë¡ ê²°ê³¼ ë©”ì‹œì§€ (ê¸°ê?ë³????œì‹œ)
            var detailMsg = mappedGroups.map(function(g) { return g + " ??" + agencyMonths[g]; }).join("\n");
            var msg = "";
            if (addedCount > 0) msg += "ê¸°ê?ë³„í˜„?©ì— " + addedCount + "ê±??±ë¡?ì–´??\n\n" + detailMsg + "\n";
            if (skippedCount > 0) msg += "\n(?´ë? ?±ë¡??" + skippedCount + "ê±´ì? ê±´ë„ˆ?°ì—ˆ?´ìš”)\n";
            if (!msg) { alert("?±ë¡??ê±´ì´ ?†ì–´??(ëª¨ë‘ ì¤‘ë³µ)"); return; }
            msg += "\n?•ì¸???„ë¥´ë©?ê¸°ê?ë³??„í™©?¼ë¡œ ?´ë™?©ë‹ˆ??";
            alert(msg);
            // ?½ê°„ ê¸°ë‹¤ë¦????˜ì´ì§€ ?´ë™ (DB ë°˜ì˜ ?€ê¸?
            await new Promise(function(r) { setTimeout(r, 300); });
            if (registeredGroups.length > 0) {
              window.location.href = window.location.origin + "?view=agency&month=" + registeredGroups[0].month + "&group=" + encodeURIComponent(registeredGroups[0].group);
            }
          }}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: "#4338CA", color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <Icon name="building" size={15} color="#fff" /> ê¸°ê?ë³„í˜„?©ì— ?±ë¡
          </button>
          <button onClick={onClose}
            style={{ padding: "12px 18px", background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
            ?«ê¸°
          </button>
        </div>
      </div>
    </div>
  );
}

// ?€?€ ? ê·œ ?±ë¡ ëª¨ë‹¬ ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
function AddModal({ onClose, onAdd, assignees }) {
  // ë¹ ë¥¸ ?±ë¡ ëª¨ë‹¬ - ?„ìˆ˜ ?•ë³´ë§?ë°›ê³ , ?˜ë¨¸ì§€???ì„¸ ?”ë©´?ì„œ ?…ë ¥
  const [form, setForm] = useState({
    name: "", type: "ë²•ì¸", representative: "", phone: "",
    stage: "?ë‹´/ì§„ë‹¨?„ë£Œ", assignee: "", agency_list: [],
    business_type: "ë²•ì¸?¬ì—…??, industry: "",
  });
  const set = function(k, v) { setForm(function(p) { return Object.assign({}, p, { [k]: v }); }); };
  const toggleAgency = function(a) {
    setForm(function(p) {
      var cur = p.agency_list || [];
      var next = cur.includes(a) ? cur.filter(function(x) { return x !== a; }) : cur.concat([a]);
      return Object.assign({}, p, { agency_list: next });
    });
  };
  const toggleAssignee = function(a) {
    setForm(function(p) {
      var cur = (p.assignee || "").split(", ").filter(Boolean);
      var next = cur.includes(a) ? cur.filter(function(x) { return x !== a; }) : cur.concat([a]);
      return Object.assign({}, p, { assignee: next.join(", ") });
    });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 14, width: 460, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>ë¹ ë¥¸ ? ê·œ ?±ë¡</h2>
            <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>?„ìˆ˜ ?•ë³´ë§??…ë ¥?˜ë©´ ?ì„¸ ?”ë©´???´ë ¤??/div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="x" size={18} color="#888" /></button>
        </div>
        <div style={{ padding: "18px 24px" }}>
          {/* ?…ì²´ëª?*/}
          <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>?…ì²´ëª?*</div>
            <input value={form.name} onChange={function(e) { set("name", e.target.value); }} autoFocus
              style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
          </div>

          {/* ?€?œì + ?°ë½ì²?*/}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>?€?œìëª?*</div>
              <input value={form.representative} onChange={function(e) { set("representative", e.target.value); }}
                style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
            </div>
            <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>?°ë½ì²?/div>
              <input value={form.phone} placeholder="01012345678" onChange={function(e) { set("phone", formatPhone(e.target.value)); }}
                style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
            </div>
          </div>

          {/* ?¬ì—…??? í˜• */}
          <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>?¬ì—…??? í˜•</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["ê°œì¸?¬ì—…??,"ë²•ì¸?¬ì—…??].map(function(t) {
                var sel = form.business_type === t;
                return (
                  <button key={t} onClick={function() { set("business_type", t); set("type", t === "ë²•ì¸?¬ì—…?? ? "ë²•ì¸" : "ê°œì¸"); }}
                    style={{ flex: 1, padding: "6px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                      background: sel ? (t === "ë²•ì¸?¬ì—…?? ? "#4338CA" : "#0F6E56") : "#fff", color: sel ? "#fff" : "#888" }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ?…ì¢… (ë³µìˆ˜ ? íƒ ê°€?? */}
          <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>?…ì¢… (ë³µìˆ˜ ? íƒ ê°€??</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
              {INDUSTRY_OPTIONS.map(function(ind) {
                var cur = (form.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                var sel = cur.indexOf(ind) >= 0;
                return (
                  <button key={ind} onClick={function() {
                    var arr = (form.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                    var idx = arr.indexOf(ind);
                    if (idx >= 0) arr.splice(idx, 1);
                    else arr.push(ind);
                    set("industry", arr.length > 0 ? arr.join(", ") : "");
                  }}
                    style={{ padding: "4px 9px", borderRadius: 99, fontSize: 11, fontWeight: sel ? 700 : 400, border: sel ? "none" : "1px solid #E8E5E0", cursor: "pointer",
                      background: sel ? "#4338CA" : "#fff", color: sel ? "#fff" : "#666" }}>
                    {sel ? "??" : ""}{ind}
                  </button>
                );
              })}
            </div>
            {(function() {
              var cur = (form.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
              var custom = cur.filter(function(s) { return INDUSTRY_OPTIONS.indexOf(s) < 0; });
              if (custom.length === 0) return null;
              return (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                  {custom.map(function(s) {
                    return (
                      <span key={s} style={{ background: "#0F6E56", color: "#fff", padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        ??{s}
                        <span onClick={function() {
                          var arr = (form.industry || "").split(",").map(function(x) { return x.trim(); }).filter(Boolean);
                          arr = arr.filter(function(x) { return x !== s; });
                          set("industry", arr.length > 0 ? arr.join(", ") : "");
                        }} style={{ cursor: "pointer", fontSize: 12, opacity: 0.85 }}>??/span>
                      </span>
                    );
                  })}
                </div>
              );
            })()}
            <input type="text" placeholder="ì§ì ‘ ?…ë ¥ ??Enterë¡?ì¶”ê? (?? ë¶€?™ì‚°?„ë???"
              onKeyDown={function(e) {
                if (e.key !== "Enter") return;
                e.preventDefault();
                var v = (e.target.value || "").trim();
                if (!v) return;
                var arr = (form.industry || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                if (arr.indexOf(v) >= 0) { e.target.value = ""; return; }
                arr.push(v);
                set("industry", arr.join(", "));
                e.target.value = "";
              }}
              style={{ width: "100%", padding: "5px 8px", border: "1px solid #E8E5E0", borderRadius: 5, fontSize: 11, outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* ì§„í–‰ ?¨ê³„ */}
          <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>ì§„í–‰ ?¨ê³„</div>
            <select value={form.stage} onChange={function(e) { set("stage", e.target.value); }}
              style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none", cursor: "pointer" }}>
              {STAGES.map(function(s) { return <option key={s}>{s}</option>; })}
            </select>
          </div>

          {/* ?´ë‹¹ ê¸°ê? (ë³µìˆ˜ ? íƒ) */}
          <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>?´ë‹¹ ê¸°ê? (ë³µìˆ˜ ? íƒ ê°€??</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {AGENCIES.map(function(a) {
                var sel = (form.agency_list || []).includes(a);
                return (
                  <button key={a} onClick={function() { toggleAgency(a); }}
                    style={{ padding: "5px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
                      background: sel ? "#4338CA" : "#fff", color: sel ? "#fff" : "#888" }}>{a}</button>
                );
              })}
            </div>
          </div>

          {/* ?´ë‹¹??(ë³µìˆ˜ ? íƒ) */}
          <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>?´ë‹¹??(ë³µìˆ˜ ? íƒ ê°€??</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {assignees.map(function(a) {
                var sel = (form.assignee || "").split(", ").filter(Boolean).includes(a);
                return (
                  <button key={a} onClick={function() { toggleAssignee(a); }}
                    style={{ padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                      background: sel ? "#1A1917" : "#fff", color: sel ? "#fff" : "#888" }}>{a}</button>
                );
              })}
            </div>
          </div>

          <div style={{ background: "#FEF3C7", borderRadius: 8, padding: "10px 13px", marginBottom: 12, fontSize: 11, color: "#B45309", lineHeight: 1.5 }}>
            ?’¡ ?±ë¡ ??ê³§ë°”ë¡??ì„¸ ?”ë©´???´ë ¤??<br />ë§¤ì¶œ, ? ìš©?ìˆ˜, ì§€?????˜ë¨¸ì§€ ?•ë³´??ê±°ê¸°???…ë ¥?˜ì„¸??
          </div>

          <button onClick={function() {
            if (!form.name || !form.name.trim()) { alert("?…ì²´ëª…ì„ ?…ë ¥?´ì£¼?¸ìš”."); return; }
            if (!form.representative || !form.representative.trim()) { alert("?€?œìëª…ì„ ?…ë ¥?´ì£¼?¸ìš”."); return; }
            var formToSend = Object.assign({}, form, {
              agency: (form.agency_list && form.agency_list[0]) || "",
              agency_list_str: (form.agency_list || []).join(", "),
            });
            onAdd(formToSend);
          }} style={{ width: "100%", padding: "13px", background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            ?±ë¡?˜ê³  ?ì„¸ ?•ë³´ ?…ë ¥?˜ê¸° ??          </button>
        </div>
      </div>
    </div>
  );
}



// ?€?€ ?œë™ ë¡œê·¸ ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
function ActivityLogView() {
  const [logs, setLogs] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAssignee, setFilterAssignee] = useState("?„ì²´");
  const [filterAgency, setFilterAgency] = useState("?„ì²´");
  const [filterType, setFilterType] = useState("?„ì²´");
  // ?˜ë™ ë©”ëª¨ ?…ë ¥
  const [memoInput, setMemoInput] = useState("");
  const [memoAssignee, setMemoAssignee] = useState("");
  const [memoAgency, setMemoAgency] = useState("");
  const [memoSuggestions, setMemoSuggestions] = useState([]);
  const [memoSaving, setMemoSaving] = useState(false);

  useEffect(function() { fetchAll(); }, []);

  var fetchAll = async function() {
    setLoading(true);
    var r1 = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(200);
    var r2 = await supabase.from("agency_cases").select("id,business_name,agency_group,assignee").is("deleted_at", null).limit(10000);
    if (!r1.error) setLogs(r1.data || []);
    if (!r2.error) setCases(r2.data || []);
    setLoading(false);
  };

  // ?ë™?„ì„± - ?¬ì—…?ëª… ?…ë ¥ ??agency_cases ê²€??  var handleMemoNameInput = function(val) {
    setMemoInput(val);
    if (val.length < 1) { setMemoSuggestions([]); return; }
    var matches = cases.filter(function(c) {
      return c.business_name && c.business_name.includes(val);
    }).slice(0, 6);
    setMemoSuggestions(matches);
  };

  var selectSuggestion = function(c) {
    setMemoInput(c.business_name);
    setMemoAgency(c.agency_group || "");
    setMemoAssignee(c.assignee || "");
    setMemoSuggestions([]);
  };

  var saveMemo = async function() {
    if (!memoInput.trim()) { alert("?¬ì—…?ëª…???…ë ¥?´ì£¼?¸ìš”."); return; }
    if (!memoAssignee) { alert("?´ë‹¹?ë? ? íƒ?´ì£¼?¸ìš”."); return; }
    setMemoSaving(true);
    var r = await supabase.from("activity_logs").insert({
      business_name: memoInput.trim(),
      agency_group: memoAgency || null,
      assignee: memoAssignee,
      log_type: "manual_memo",
      logged_by: memoAssignee,
    });
    if (!r.error) {
      setMemoInput(""); setMemoAgency(""); setMemoAssignee(""); setMemoSuggestions([]);
      fetchAll();
    }
    setMemoSaving(false);
  };

  // ?„í„°
  var filtered = useMemo(function() {
    return logs.filter(function(l) {
      if (filterAssignee !== "?„ì²´" && l.assignee !== filterAssignee) return false;
      if (filterAgency !== "?„ì²´" && l.agency_group !== filterAgency) return false;
      if (filterType === "?ë™") return l.log_type === "status_change";
      if (filterType === "?˜ë™") return l.log_type === "manual_memo";
      return true;
    });
  }, [logs, filterAssignee, filterAgency, filterType]);

  // ? ì§œ ?¬ë§·
  var fmtTime = function(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    var now = new Date();
    var diff = now - d;
    var mins = Math.floor(diff / 60000);
    var hours = Math.floor(diff / 3600000);
    var days = Math.floor(diff / 86400000);
    if (mins < 1) return "ë°©ê¸ˆ ??;
    if (mins < 60) return mins + "ë¶???;
    if (hours < 24) return hours + "?œê°„ ??;
    if (days === 1) return "?´ì œ";
    if (days < 7) return days + "????;
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  var fmtDate = function(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
  };

  // ? ì§œ ê·¸ë£¹??  var groupedLogs = useMemo(function() {
    var groups = {};
    filtered.forEach(function(l) {
      var d = l.created_at ? new Date(l.created_at).toDateString() : "unknown";
      if (!groups[d]) groups[d] = { dateStr: fmtDate(l.created_at), items: [] };
      groups[d].items.push(l);
    });
    return Object.values(groups);
  }, [filtered]);

  // KPI
  var today = new Date().toDateString();
  var thisWeekStart = new Date(); thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  var todayLogs = logs.filter(function(l) { return l.created_at && new Date(l.created_at).toDateString() === today; });
  var weekLogs = logs.filter(function(l) { return l.created_at && new Date(l.created_at) >= thisWeekStart; });

  // ?´ë‹¹?ë³„ ?œë™??(?´ë²ˆ ì£?
  var staffStats = useMemo(function() {
    var map = {};
    weekLogs.forEach(function(l) {
      if (!l.assignee) return;
      if (!map[l.assignee]) map[l.assignee] = 0;
      map[l.assignee]++;
    });
    return Object.entries(map).sort(function(a,b) { return b[1]-a[1]; });
  }, [weekLogs]);
  var maxStaff = staffStats.length > 0 ? staffStats[0][1] : 1;

  // ê¸°ê?ë³??¤ëŠ˜ ?œë™
  var agencyToday = useMemo(function() {
    var map = {};
    todayLogs.forEach(function(l) {
      if (!l.agency_group) return;
      if (!map[l.agency_group]) map[l.agency_group] = 0;
      map[l.agency_group]++;
    });
    return Object.entries(map).sort(function(a,b) { return b[1]-a[1]; });
  }, [todayLogs]);

  // ?íƒœ ë³€ê²?ë°°ì? ??  var STATUS_COLORS_MAP = {
    "?¹ì¸": { bg: "#ECFDF5", text: "#047857" }, "?½ì •": { bg: "#ECFDF5", text: "#047857" }, "?„ë£Œ": { bg: "#ECFDF5", text: "#047857" },
    "?¬ì‚¬ì¤?: { bg: "#EEF2FF", text: "#4338CA" }, "ìµœì¢…?œì¶œ": { bg: "#EEF2FF", text: "#4338CA" }, "ì§„í–‰ ì¤?: { bg: "#EEF2FF", text: "#4338CA" },
    "ë¶€ê²?: { bg: "#FEF2F2", text: "#DC2626" }, "ë°˜ë ¤": { bg: "#FEF2F2", text: "#DC2626" }, "ì§„í–‰ë¶ˆê?": { bg: "#FEF2F2", text: "#DC2626" },
    "ë³´ë¥˜": { bg: "#F5F3FF", text: "#7C3AED" }, "ì¤‘ë‹¨": { bg: "#F5F3FF", text: "#7C3AED" },
  };
  var statusBadge = function(s) {
    var sc = STATUS_COLORS_MAP[s] || { bg: "#F7F6F3", text: "#888" };
    return <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: sc.bg, color: sc.text, fontWeight: 600 }}>{s}</span>;
  };

  // ê¸°ê? ë°°ì? ??  var agencyColor = function(ag) {
    var map = { "?Œìƒê³µì¸?œì¥ì§„í¥ê³µë‹¨": "#4338CA", "? ìš©ë³´ì¦ê¸°ê¸ˆ": "#0F6E56", "? ìš©ë³´ì¦?¬ë‹¨": "#B45309", "ì¤‘ì†Œë²¤ì²˜ê¸°ì—…ì§„í¥ê³µë‹¨": "#7C3AED", "êµ¬ì¡°?ì‹ &?¬ì—…?„í™˜": "#BE123C", "ê²½ì •ì²?µ¬": "#0369A1" };
    return map[ag] || "#888";
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #E8E5E0", borderTopColor: "#1A1917", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <span style={{ color: "#888", fontSize: 13 }}>?œë™ ë¡œê·¸ ë¶ˆëŸ¬?¤ëŠ” ì¤?..</span>
    </div>
  );

  return (
    <div>
      {/* ?¤ë” */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>?œë™ ë¡œê·¸</h1>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>?íƒœ ë³€ê²??ë™ ê¸°ë¡ Â· ?˜ë™ ë©”ëª¨</p>
        </div>
        <button onClick={fetchAll} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#555", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
          <Icon name="refresh" size={13} color="#555" /> ?ˆë¡œê³ ì¹¨
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "?¤ëŠ˜ ?œë™", value: todayLogs.length + "ê±?, sub: "?ë™ " + todayLogs.filter(function(l){return l.log_type==="status_change";}).length + " Â· ?˜ë™ " + todayLogs.filter(function(l){return l.log_type==="manual_memo";}).length, color: "#4338CA" },
          { label: "?´ë²ˆ ì£??œë™", value: weekLogs.length + "ê±?, sub: "?íƒœë³€ê²?ë©”ëª¨ ?©ì‚°", color: "#047857" },
          { label: "?´ë²ˆ ì£??íƒœë³€ê²?, value: weekLogs.filter(function(l){return l.log_type==="status_change";}).length + "ê±?, sub: "?ë™ ê¸°ë¡", color: "#7C3AED" },
          { label: "?´ë²ˆ ì£?ë©”ëª¨", value: weekLogs.filter(function(l){return l.log_type==="manual_memo";}).length + "ê±?, sub: "?˜ë™ ?‘ì„±", color: "#B45309" },
        ].map(function(k, i) {
          return (
            <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "16px 18px", border: "1px solid #E8E5E0" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 11, color: "#AAA", marginTop: 3 }}>{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ?„í„° */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#888" }}>? í˜•:</span>
          {["?„ì²´","?ë™","?˜ë™"].map(function(t) {
            return <div key={t} onClick={function(){setFilterType(t);}} style={{ padding: "4px 12px", borderRadius: 99, cursor: "pointer", fontSize: 12, background: filterType===t ? "#1A1917" : "#fff", color: filterType===t ? "#fff" : "#666", border: filterType===t ? "none" : "1px solid #E8E5E0" }}>{t}</div>;
          })}
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#888" }}>ê¸°ê?:</span>
          {["?„ì²´","?Œìƒê³µì¸?œì¥ì§„í¥ê³µë‹¨","? ìš©ë³´ì¦ê¸°ê¸ˆ","? ìš©ë³´ì¦?¬ë‹¨","ì¤‘ì†Œë²¤ì²˜ê¸°ì—…ì§„í¥ê³µë‹¨","êµ¬ì¡°?ì‹ &?¬ì—…?„í™˜"].map(function(a) {
            return <div key={a} onClick={function(){setFilterAgency(a);}} style={{ padding: "4px 12px", borderRadius: 99, cursor: "pointer", fontSize: 12, background: filterAgency===a ? "#1A1917" : "#fff", color: filterAgency===a ? "#fff" : "#666", border: filterAgency===a ? "none" : "1px solid #E8E5E0" }}>{a}</div>;
          })}
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#888" }}>?´ë‹¹??</span>
          {["?„ì²´"].concat(ASSIGNEES).map(function(a) {
            return <div key={a} onClick={function(){setFilterAssignee(a);}} style={{ padding: "4px 12px", borderRadius: 99, cursor: "pointer", fontSize: 12, background: filterAssignee===a ? "#1A1917" : "#fff", color: filterAssignee===a ? "#fff" : "#666", border: filterAssignee===a ? "none" : "1px solid #E8E5E0" }}>{a}</div>;
          })}
        </div>
      </div>

      {/* ë©”ì¸ ?ˆì´?„ì›ƒ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start" }}>

        {/* ?€?„ë¼??*/}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E5E0", overflow: "hidden" }}>
          {/* ?˜ë™ ë©”ëª¨ ?…ë ¥ì°?*/}
          <div style={{ padding: "16px 20px", borderBottom: "2px solid #E8E5E0", background: "#FAFAF8" }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#333" }}>?ï¸ ?˜ë™ ë©”ëª¨ ?¨ê¸°ê¸?/div>
            <div style={{ position: "relative", marginBottom: 8 }}>
              <input
                value={memoInput}
                onChange={function(e) { handleMemoNameInput(e.target.value); }}
                placeholder="?¬ì—…?ëª… ê²€???ëŠ” ì§ì ‘ ?…ë ¥..."
                style={{ width: "100%", padding: "9px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }}
              />
              {memoSuggestions.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #E8E5E0", borderRadius: 8, zIndex: 100, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", overflow: "hidden" }}>
                  {memoSuggestions.map(function(c) {
                    return (
                      <div key={c.id} onClick={function() { selectSuggestion(c); }}
                        style={{ padding: "9px 13px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid #F0EDE8", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        onMouseEnter={function(e) { e.currentTarget.style.background = "#F7F6F3"; }}
                        onMouseLeave={function(e) { e.currentTarget.style.background = ""; }}>
                        <span style={{ fontWeight: 600 }}>{c.business_name}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          {c.agency_group && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "#EEF2FF", color: "#4338CA", fontWeight: 600 }}>{c.agency_group}</span>}
                          {c.assignee && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "#F7F6F3", color: "#888" }}>{c.assignee}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <select value={memoAssignee} onChange={function(e) { setMemoAssignee(e.target.value); }}
                style={{ padding: "9px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                <option value="">?´ë‹¹??? íƒ</option>
                {ASSIGNEES.map(function(a) { return <option key={a} value={a}>{a}</option>; })}
              </select>
              <select value={memoAgency} onChange={function(e) { setMemoAgency(e.target.value); }}
                style={{ padding: "9px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                <option value="">ê¸°ê? ? íƒ (? íƒ?¬í•­)</option>
                {["?Œìƒê³µì¸?œì¥ì§„í¥ê³µë‹¨","? ìš©ë³´ì¦ê¸°ê¸ˆ","? ìš©ë³´ì¦?¬ë‹¨","ì¤‘ì†Œë²¤ì²˜ê¸°ì—…ì§„í¥ê³µë‹¨","êµ¬ì¡°?ì‹ &?¬ì—…?„í™˜","ê²½ì •ì²?µ¬","ê¸°í?"].map(function(a) { return <option key={a} value={a}>{a}</option>; })}
              </select>
            </div>
            <button onClick={saveMemo} disabled={memoSaving}
              style={{ width: "100%", padding: "10px", background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: memoSaving ? "not-allowed" : "pointer", opacity: memoSaving ? 0.7 : 1 }}>
              {memoSaving ? "?€??ì¤?.." : "ë©”ëª¨ ?€??}
            </button>
          </div>

          {/* ?€?„ë¼??ëª©ë¡ */}
          {filtered.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "#AAA", fontSize: 13 }}>
              ?œë™ ê¸°ë¡???†ìŠµ?ˆë‹¤.<br/>
              <span style={{ fontSize: 12 }}>ê¸°ê?ë³??„í™©?ì„œ ?íƒœë¥?ë³€ê²½í•˜ê±°ë‚˜ ë©”ëª¨ë¥??¨ê²¨ë³´ì„¸??</span>
            </div>
          ) : (
            <div style={{ padding: "16px 20px" }}>
              {groupedLogs.map(function(group, gi) {
                return (
                  <div key={gi} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#AAA", letterSpacing: "0.05em", marginBottom: 12, textTransform: "uppercase" }}>{group.dateStr}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {group.items.map(function(log, li) {
                        var isAuto = log.log_type === "status_change";
                        var isLast = li === group.items.length - 1 && gi === groupedLogs.length - 1;
                        return (
                          <div key={log.id} style={{ display: "flex", gap: 12, paddingBottom: 16, position: "relative" }}>
                            {!isLast && <div style={{ position: "absolute", left: 14, top: 30, bottom: 0, width: 1, background: "#E8E5E0" }} />}
                            {/* ?„ì´ì½?*/}
                            <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: isAuto ? "#EEF2FF" : "#FFF7ED", fontSize: 13 }}>
                              {isAuto ? "?”„" : "?ï¸"}
                            </div>
                            {/* ?´ìš© */}
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                                <div style={{ fontSize: 13, fontWeight: 700 }}>
                                  {log.assignee || "-"}
                                  <span style={{ fontWeight: 400, color: "#888", marginLeft: 5 }}>Â· {log.business_name || "-"}</span>
                                </div>
                                <div style={{ fontSize: 11, color: "#AAA", whiteSpace: "nowrap", marginLeft: 8 }}>{fmtTime(log.created_at)}</div>
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                                {log.agency_group && (
                                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "#EEF2FF", color: agencyColor(log.agency_group), fontWeight: 600 }}>{log.agency_group}</span>
                                )}
                                {isAuto ? (
                                  <>
                                    {log.old_status && statusBadge(log.old_status)}
                                    <span style={{ fontSize: 11, color: "#AAA" }}>??/span>
                                    {log.new_status && statusBadge(log.new_status)}
                                    <span style={{ fontSize: 11, color: "#888" }}>?íƒœ ë³€ê²?/span>
                                  </>
                                ) : (
                                  <>
                                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "#FFF7ED", color: "#C2410C", fontWeight: 600 }}>?˜ë™ ë©”ëª¨</span>
                                    {log.memo && <span style={{ fontSize: 12, color: "#555" }}>{log.memo}</span>}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ?¤ë¥¸ìª??¬ì´??*/}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* ?´ë‹¹?ë³„ ?œë™??*/}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E5E0", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #E8E5E0", fontSize: 13, fontWeight: 700 }}>
              ?´ë‹¹?ë³„ ?œë™??<span style={{ fontSize: 11, color: "#AAA", fontWeight: 400 }}>?´ë²ˆ ì£?/span>
            </div>
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {staffStats.length === 0 ? (
                <div style={{ fontSize: 12, color: "#AAA", textAlign: "center", padding: "16px 0" }}>?´ë²ˆ ì£??œë™ ?†ìŒ</div>
              ) : staffStats.map(function(s) {
                var pct = Math.round(s[1] / maxStaff * 100);
                return (
                  <div key={s[0]} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1A1917", color: "#F7F6F3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{s[0][0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{s[0]}</span>
                        <span style={{ fontSize: 11, color: "#888" }}>{s[1]}ê±?/span>
                      </div>
                      <div style={{ height: 4, background: "#E8E5E0", borderRadius: 99 }}>
                        <div style={{ height: 4, background: "#1A1917", borderRadius: 99, width: pct + "%" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ?¤ëŠ˜ ê¸°ê?ë³??”ì•½ */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E5E0", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #E8E5E0", fontSize: 13, fontWeight: 700 }}>
              ?¤ëŠ˜ ê¸°ê?ë³??œë™ <span style={{ fontSize: 11, color: "#AAA", fontWeight: 400 }}>ê±´ìˆ˜</span>
            </div>
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
              {agencyToday.length === 0 ? (
                <div style={{ fontSize: 12, color: "#AAA", textAlign: "center", padding: "16px 0" }}>?¤ëŠ˜ ?œë™ ?†ìŒ</div>
              ) : agencyToday.map(function(a) {
                return (
                  <div key={a[0]} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#F7F6F3", borderRadius: 8 }}>
                    <span style={{ fontSize: 12, color: "#555" }}>{a[0]}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: agencyColor(a[0]) }}>{a[1]}ê±?/span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ?€?€ ?…ë¬´?¸íŠ¸ ?˜ì • ì¹´ë“œ (?…ë¦½ ì»´í¬?ŒíŠ¸ - ?…ë ¥ë²„ê·¸ ë°©ì?) ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
function NoteEditCard({ note, editNote, setEditNote, saveEdit, onCancel }) {
  // contentê°€ ë³€ê²½ë˜ë©?checkItems?€ freeTextë¡?ë¶„ë¦¬
  // editNote.checkItemsê°€ ?´ë? ?ˆìœ¼ë©?ê·¸ê±¸ ?°ì„  ?¬ìš© (?¬ìš©?ê? ?¸ì§‘ ì¤‘ì¸ ?íƒœ)
  
  function parseContent(text) {
    if (!text) return { items: [], freeText: "" };
    var lines = text.split("\n");
    var items = [];
    var freeLines = [];
    lines.forEach(function(line) {
      var m = line.match(/^(\s*)- \[([ x])\]\s*(.*)$/i);
      if (m) {
        var textFull = m[3].trim();
        var dateStr = null;
        var displayText = textFull;
        var bracketMatch = textFull.match(/\[(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2})\]/);
        var arrowMatch = !bracketMatch && textFull.match(/??s*(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2})\s*$/);
        if (bracketMatch || arrowMatch) {
          var raw = (bracketMatch ? bracketMatch[1] : arrowMatch[1]);
          if (raw.indexOf("-") >= 0) {
            dateStr = raw;
          } else {
            var parts = raw.split("/");
            var year = new Date().getFullYear();
            dateStr = year + "-" + parts[0].padStart(2,"0") + "-" + parts[1].padStart(2,"0");
          }
          displayText = textFull.replace(/\[\d{4}-\d{2}-\d{2}\]|\[\d{1,2}\/\d{1,2}\]/, "").replace(/??s*\d{4}-\d{2}-\d{2}\s*$|??s*\d{1,2}\/\d{1,2}\s*$/, "").trim();
        }
        items.push({ checked: m[2].toLowerCase() === "x", text: displayText, dueDate: dateStr || "" });
      } else {
        freeLines.push(line);
      }
    });
    return { items: items, freeText: freeLines.join("\n").trim() };
  }

  // ì²˜ìŒ ??ë²ˆë§Œ ?Œì‹± - editNote.checkItemsê°€ ?†ìœ¼ë©?content?ì„œ ì¶”ì¶œ
  useEffect(function() {
    if (editNote && editNote.id && (editNote.checkItems === undefined || editNote.checkItems === null)) {
      var parsed = parseContent(editNote.content || "");
      setEditNote(function(p) {
        return Object.assign({}, p, { 
          checkItems: parsed.items,
          freeContent: parsed.freeText
        });
      });
    }
  }, [editNote.id]);

  var checkItems = editNote.checkItems || [];
  var freeContent = editNote.freeContent !== undefined ? editNote.freeContent : (editNote.content || "");

  return (
    <div style={{ background: "#F0FDF4", border: "2px solid #86EFAC", borderRadius: 12, padding: "18px 20px" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D", marginBottom: 12 }}>?ï¸ ?¸íŠ¸ ?˜ì •</div>
      <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={editNote.is_todo || false} onChange={function(e) { setEditNote(function(p) { return Object.assign({}, p, { is_todo: e.target.checked }); }); }} />
          ?“‹ ???¼ë¡œ ?±ë¡
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
          <input type="checkbox" checked={editNote.pinned || false} onChange={function(e) { setEditNote(function(p) { return Object.assign({}, p, { pinned: e.target.checked }); }); }} />
          ?“Œ ?ë‹¨ ê³ ì •
        </label>
      </div>
      <input value={editNote.title || ""} placeholder="?œëª© (? íƒ?¬í•­)" onChange={function(e) { var v = e.target.value; setEditNote(function(p) { return Object.assign({}, p, { title: v }); }); }}
        style={{ width: "100%", padding: "10px 13px", border: "1px solid #86EFAC", borderRadius: 8, fontSize: 14, fontWeight: 600, boxSizing: "border-box", outline: "none", marginBottom: 10, background: "#fff" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <label style={{ fontSize: 12, color: "#15803D", fontWeight: 600, whiteSpace: "nowrap" }}>?“… ë§ˆê°??/label>
        <input type="date" value={editNote.due_date || ""} onChange={function(e) { var v = e.target.value; setEditNote(function(p) { return Object.assign({}, p, { due_date: v }); }); }}
          style={{ width: "auto", padding: "7px 10px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 12, background: "#fff", outline: "none" }} />
        {editNote.due_date && <button onClick={function() { setEditNote(function(p) { return Object.assign({}, p, { due_date: "" }); }); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#AAA", fontSize: 14 }}>??/button>}
      </div>
      {/* ì²´í¬ë¦¬ìŠ¤????ª©??*/}
      {checkItems.length > 0 && (
        <div style={{ border: "1px solid #86EFAC", borderRadius: 8, padding: "10px 12px", marginBottom: 8, background: "#fff" }}>
          {checkItems.map(function(item, idx) {
            return (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <input type="checkbox" checked={item.checked || false} onChange={function(e) { var ck = e.target.checked; setEditNote(function(p) { var items = (p.checkItems || []).slice(); items[idx] = Object.assign({}, items[idx], { checked: ck }); return Object.assign({}, p, { checkItems: items }); }); }} style={{ width: 15, height: 15, flexShrink: 0, cursor: "pointer" }} />
                <input type="text" value={item.text || ""} placeholder={"??ª© " + (idx + 1) + " (?? ?¤í¬ë¦½íŠ¸ ?‘ì„±)"}
                  onChange={function(e) { var v = e.target.value; setEditNote(function(p) { var items = (p.checkItems || []).slice(); items[idx] = Object.assign({}, items[idx], { text: v }); return Object.assign({}, p, { checkItems: items }); }); }}
                  style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", textDecoration: item.checked ? "line-through" : "none", color: item.checked ? "#AAA" : "#333" }} />
                <input type="date" value={item.dueDate || ""} title="????ª©??ë§ˆê°??(? íƒ)"
                  onChange={function(e) { var v = e.target.value; setEditNote(function(p) { var items = (p.checkItems || []).slice(); items[idx] = Object.assign({}, items[idx], { dueDate: v }); return Object.assign({}, p, { checkItems: items }); }); }}
                  style={{ padding: "3px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 11, color: "#4338CA", outline: "none", width: 130 }} />
                <button onClick={function() { setEditNote(function(p) { var items = (p.checkItems || []).filter(function(_, i) { return i !== idx; }); return Object.assign({}, p, { checkItems: items }); }); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#CCC", fontSize: 16, padding: "0 4px", lineHeight: 1 }}>Ã—</button>
              </div>
            );
          })}
        </div>
      )}
      {/* ì²´í¬ë¦¬ìŠ¤??ë²„íŠ¼ + textarea */}
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        <button onClick={function() {
          setEditNote(function(p) {
            var items = (p.checkItems || []).concat([{ text: "", checked: false, dueDate: "" }]);
            return Object.assign({}, p, { checkItems: items, is_todo: true });
          });
        }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "#fff", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 12, color: "#15803D", fontWeight: 600, cursor: "pointer" }}>
          ?‘ï¸ ì²´í¬ë¦¬ìŠ¤????ª© ì¶”ê?
        </button>
        <span style={{ fontSize: 10, color: "#888", alignSelf: "center", lineHeight: 1.4 }}>
          ?’¡ ì§ì ‘ ?…ë ¥ ?? <code style={{ background: "#F0EDE8", padding: "1px 4px", borderRadius: 3, fontSize: 10 }}>- [ ] ? ì¼ [5/30]</code> ?ëŠ” <code style={{ background: "#F0EDE8", padding: "1px 4px", borderRadius: 3, fontSize: 10 }}>- [ ] ? ì¼ ??5/30</code>
        </span>
      </div>
      <textarea value={freeContent} placeholder={checkItems.length > 0 ? "ì¶”ê? ë©”ëª¨ (? íƒ?¬í•­)..." : "?´ìš©???ìœ ë¡?²Œ ?…ë ¥?˜ì„¸??.."} 
        onChange={function(e) { var v = e.target.value; setEditNote(function(p) { return Object.assign({}, p, { freeContent: v }); }); }} 
        rows={checkItems.length > 0 ? 4 : 8}
        style={{ width: "100%", padding: "12px 13px", border: "1px solid #86EFAC", borderRadius: 8, fontSize: 13, lineHeight: 1.75, resize: "vertical", boxSizing: "border-box", outline: "none", background: "#fff", minHeight: 120 }} />
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={saveEdit} style={{ background: "#15803D", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>?€??/button>
        <button onClick={onCancel} style={{ background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 8, padding: "10px 16px", fontSize: 13, cursor: "pointer" }}>ì·¨ì†Œ</button>
      </div>
    </div>
  );
}

// ?€?€ ?…ë¬´?¸íŠ¸ ì¹´ë“œ (?…ë¦½ ì»´í¬?ŒíŠ¸ - ?…ë ¥ë²„ê·¸ ë°©ì?) ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
function NoteCard({ note, editingId, editNote, setEditNote, saveEdit, setEditingId, toggleDone, togglePin, deleteNote, fmtDate, currentUserName, onChecklistChange }) {
  var isEditing = editingId === note.id;
  var isMyNote = true;

  // ì²´í¬ë¦¬ìŠ¤???Œì‹±: "- [ ] ??ª©" ?ëŠ” "- [x] ??ª©" ?•ì‹
  var parseChecklist = function(content) {
    if (!content) return null;
    var lines = content.split("\n");
    var hasChecklist = lines.some(function(l) { return /^- \[[ x]\]/.test(l.trim()); });
    if (!hasChecklist) return null;
    return lines.map(function(line, idx) {
      var m = line.trim().match(/^- \[([ x])\] (.+)/);
      if (m) return { idx: idx, checked: m[1] === "x", text: m[2], isCheck: true };
      return { idx: idx, text: line, isCheck: false };
    });
  };

  var checklist = parseChecklist(note.content);
  var checkedCount = checklist ? checklist.filter(function(i) { return i.isCheck && i.checked; }).length : 0;
  var totalCount = checklist ? checklist.filter(function(i) { return i.isCheck; }).length : 0;

  var toggleCheckItem = function(lineIdx) {
    var lines = (note.content || "").split("\n");
    var line = lines[lineIdx];
    if (/^- \[ \]/.test(line.trim())) {
      lines[lineIdx] = line.replace("- [ ]", "- [x]");
    } else if (/^- \[x\]/.test(line.trim())) {
      lines[lineIdx] = line.replace("- [x]", "- [ ]");
    }
    var newContent = lines.join("\n");
    if (onChecklistChange) onChecklistChange(note.id, newContent);
  };

  if (isEditing) {
    // ?¸ì§‘ ì¤‘ì—??ê·¸ë¦¬?œì—??ë¹ ì§ (?ë‹¨ ?„ì²´ ??œ¼ë¡?ë³„ë„ ?Œë”ë§?
    return null;
  }

  return (
    <div style={{ background: note.pinned ? "#FFFBEB" : "#fff", border: note.pinned ? "1px solid #FDE68A" : "1px solid #E8E5E0", borderRadius: 12, padding: "16px 18px", opacity: note.is_done ? 0.6 : 1, transition: "opacity 0.2s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {note.is_todo && (
            <input type="checkbox" checked={note.is_done || false} onChange={function() { toggleDone(note); }}
              style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#1A1917" }} />
          )}
          {note.pinned && <span style={{ fontSize: 14 }}>?“Œ</span>}
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1917", textDecoration: note.is_done ? "line-through" : "none" }}>
            {note.title || <span style={{ color: "#CCC", fontWeight: 400 }}>?œëª© ?†ìŒ</span>}
          </span>
          {note.is_todo && (
            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: note.is_done ? "#ECFDF5" : "#EEF2FF", color: note.is_done ? "#047857" : "#4338CA", fontWeight: 600 }}>
              {note.is_done ? "?„ë£Œ" : "? ì¼"}
            </span>
          )}
          {totalCount > 0 && (
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: checkedCount === totalCount ? "#ECFDF5" : "#F3F4F6", color: checkedCount === totalCount ? "#047857" : "#555", fontWeight: 600 }}>
              ??{checkedCount}/{totalCount}
            </span>
          )}
        </div>
        {isMyNote && (
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={function() { togglePin(note); }} title={note.pinned ? "ê³ ì • ?´ì œ" : "ê³ ì •"}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, fontSize: 14, opacity: note.pinned ? 1 : 0.4 }}>?“Œ</button>
            <button onClick={function() { setEditingId(note.id); setEditNote(Object.assign({}, note)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="edit" size={14} color="#888" /></button>
            <button onClick={function() { deleteNote(note.id); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="x" size={14} color="#CCC" /></button>
          </div>
        )}
      </div>

      {/* ë§ˆê°???œì‹œ */}
      {note.due_date && (function() {
        var today = new Date().toISOString().slice(0, 10);
        var dday = Math.ceil((new Date(note.due_date) - new Date(today)) / 86400000);
        var ddayLabel = dday === 0 ? "D-Day" : dday > 0 ? "D-" + dday : "D+" + Math.abs(dday);
        var ddayColor = dday < 0 ? "#DC2626" : dday === 0 ? "#EA580C" : dday <= 3 ? "#B45309" : "#15803D";
        var ddayBg = dday < 0 ? "#FEE2E2" : dday === 0 ? "#FFF7ED" : dday <= 3 ? "#FEF3C7" : "#F0FDF4";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: "#888" }}>?“… ë§ˆê°:</span>
            <span style={{ fontSize: 11, color: "#555" }}>{note.due_date}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: ddayColor, background: ddayBg, padding: "1px 6px", borderRadius: 99 }}>{ddayLabel}</span>
          </div>
        );
      })()}

      {/* ì²´í¬ë¦¬ìŠ¤??or ?¼ë°˜ ?´ìš© */}
      {note.content && (
        checklist ? (
          <div style={{ marginBottom: 10 }}>
            {checklist.map(function(item) {
              if (!item.isCheck) {
                return item.text ? (
                  <div key={item.idx} style={{ fontSize: 13, color: "#888", lineHeight: 1.75, paddingLeft: 4 }}>{item.text}</div>
                ) : null;
              }
              return (
                <label key={item.idx} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 0", cursor: "pointer" }}>
                  <input type="checkbox" checked={item.checked} onChange={function() { toggleCheckItem(item.idx); }}
                    style={{ width: 15, height: 15, marginTop: 2, cursor: "pointer", accentColor: "#1A1917", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: item.checked ? "#AAA" : "#333", textDecoration: item.checked ? "line-through" : "none", lineHeight: 1.6 }}>{item.text}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "#555", lineHeight: 1.75, whiteSpace: "pre-wrap", marginBottom: 10, textDecoration: note.is_done ? "line-through" : "none" }}>
            {note.content}
          </div>
        )
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#1A1917", color: "#F7F6F3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{(note.assignee || "?")[0]}</div>
          <span style={{ fontSize: 11, color: "#AAA" }}>{note.assignee}</span>
        </div>
        <span style={{ fontSize: 11, color: "#CCC" }}>{fmtDate(note.updated_at || note.created_at)}</span>
      </div>
    </div>
  );
}

// ?€?€ ?…ë¬´ ?¸íŠ¸ ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
// ?€?€ ë¸Œë¼?°ì? ?¸ì‹œ ?Œë¦¼ ?¨ìˆ˜ ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
async function sendPushToUser(userName, payload) {
  try {
    var subs = await supabase.from("push_subscriptions").select("subscription").eq("user_name", userName);
    if (!subs.data || subs.data.length === 0) return; // êµ¬ë… ?•ë³´ ?†ìœ¼ë©??¨ìŠ¤
    for (var i = 0; i < subs.data.length; i++) {
      var sub = subs.data[i].subscription;
      if (sub && sub.endpoint) {
        // ?¸ì‹œ API ì§ì ‘ ?¸ì¶œ (?´ë¼?´ì–¸?¸ì—??Notification API ?œìš©)
        if ("serviceWorker" in navigator && "PushManager" in window) {
          // ë¡œì»¬ ?Œë¦¼?¼ë¡œ ?€ì²?(ê°™ì? PC?ì„œë§??‘ë™)
          if (Notification.permission === "granted") {
            var n = new Notification(payload.title, {
              body: payload.body,
              icon: "/favicon.ico",
              tag: "crm-worknote",
              requireInteraction: false,
            });
            n.onclick = function() { window.focus(); };
          }
        }
      }
    }
  } catch(e) {
    // ?¸ì‹œ ?¤íŒ¨?´ë„ ?€?¥ì? ?„ë£Œ
  }
}

function WorkNotesView({ profile, onBadgeUpdate }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAssignee, setFilterAssignee] = useState("?„ì²´");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newNote, setNewNote] = useState({ title: "", content: "", is_todo: false, pinned: false, target_assignee: "", checkItems: [], due_date: "" });
  const [editNote, setEditNote] = useState({});
  const [filterType, setFilterType] = useState("?„ì²´"); // ?„ì²´ / ë©”ëª¨ / ? ì¼
  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [showTrash, setShowTrash] = useState(false);
  const [trashedNotes, setTrashedNotes] = useState([]);

  const [companiesList, setCompaniesList] = useState([]);
  const [pushEnabled, setPushEnabled] = useState(false);

  // ë¸Œë¼?°ì? ?¸ì‹œ ?Œë¦¼ ê¶Œí•œ ?”ì²­
  useEffect(function() {
    if (!profile?.name) return;
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        // ?ë™?¼ë¡œ ê¶Œí•œ ?”ì²­ (ì²˜ìŒ ?‘ì† ??
        Notification.requestPermission().then(function(perm) {
          if (perm === "granted") {
            setPushEnabled(true);
            // êµ¬ë… ?•ë³´ DB???€??(ê°„ë‹¨ ë²„ì „: endpointë§??€??
            supabase.from("push_subscriptions").upsert({
              user_name: profile.name,
              subscription: { endpoint: "browser-" + profile.name, type: "notification" }
            }, { onConflict: "user_name" });
          }
        });
      } else if (Notification.permission === "granted") {
        setPushEnabled(true);
        supabase.from("push_subscriptions").upsert({
          user_name: profile.name,
          subscription: { endpoint: "browser-" + profile.name, type: "notification" }
        }, { onConflict: "user_name" });
      }
    }
  }, [profile?.name]);

  useEffect(function() {
    fetchNotes();
    fetchCompaniesList();
  }, []);

  // ê¸°ì—… ëª©ë¡ ê°€?¸ì˜¤ê¸?(?ë™ ê°ì???
  var fetchCompaniesList = async function() {
    var r = await supabase.from("companies").select("id, name").is("deleted_at", null);
    if (!r.error) setCompaniesList(r.data || []);
  };

  // ?ìŠ¤?¸ì—??ê¸°ì—…ëª??ë™ ê°ì?
  var detectCompaniesInText = function(text) {
    if (!text || !companiesList || companiesList.length === 0) return [];
    var found = [];
    companiesList.forEach(function(co) {
      if (co.name && text.indexOf(co.name) >= 0) {
        if (!found.find(function(f) { return f.id === co.id; })) found.push(co);
      }
    });
    return found;
  };

  // ?œë™ë¡œê·¸???ë™ ê¸°ë¡
  var logToActivity = async function(company, memo) {
    if (!company || !memo) return;
    await supabase.from("activity_logs").insert({
      case_id: company.id,
      case_type: "company",
      business_name: company.name,
      assignee: profile?.name || "",
      log_type: "note_auto",
      memo: memo.slice(0, 200),
      logged_by: profile?.name || "",
    });
  };

  var fetchNotes = async function() {
    setLoading(true);
    var r = await supabase.from("work_notes").select("*").is("deleted_at", null).order("pinned", { ascending: false }).order("created_at", { ascending: false });
    if (!r.error) setNotes(r.data || []);
    setLoading(false);
  };

  var fetchTrashedNotes = async function() {
    var r = await supabase.from("work_notes").select("*").not("deleted_at", "is", null).order("deleted_at", { ascending: false });
    if (!r.error) setTrashedNotes(r.data || []);
  };

  var openTrash = function() {
    fetchTrashedNotes();
    setShowTrash(true);
  };

  var restoreNote = async function(id) {
    var r = await supabase.from("work_notes").update({ deleted_at: null }).eq("id", id);
    if (!r.error) {
      setTrashedNotes(function(prev) { return prev.filter(function(n) { return n.id !== id; }); });
      fetchNotes();
    }
  };

  var permanentDeleteNote = async function(id) {
    if (!window.confirm("?„ì „???? œ?˜ì‹œê² ìŠµ?ˆê¹Œ? ë³µêµ¬?????†ìŠµ?ˆë‹¤.")) return;
    var r = await supabase.from("work_notes").delete().eq("id", id);
    if (!r.error) setTrashedNotes(function(prev) { return prev.filter(function(n) { return n.id !== id; }); });
  };

  var filtered = useMemo(function() {
    return notes.filter(function(n) {
      if (filterAssignee !== "?„ì²´" && n.assignee !== filterAssignee) return false;
      if (filterType === "ë©”ëª¨") return !n.is_todo;
      if (filterType === "? ì¼") return n.is_todo;
      return true;
    });
  }, [notes, filterAssignee, filterType]);

  var pinned = filtered.filter(function(n) { return n.pinned; });
  var unpinned = filtered.filter(function(n) { return !n.pinned; });

  var saveNew = async function() {
    // checkItemsê°€ ?ˆìœ¼ë©?contentë¡?ë³€?˜í•´???©ì¹˜ê¸?(ë§ˆê°??[YYYY-MM-DD] ?¬í•¨)
    var checkContent = (newNote.checkItems && newNote.checkItems.length > 0)
      ? newNote.checkItems.filter(function(i) { return i.text.trim(); }).map(function(i) {
          var line = "- [ ] " + i.text.trim();
          if (i.dueDate) line += " [" + i.dueDate + "]";
          return line;
        }).join("\n")
      : "";
    var finalContent = newNote.content.trim();
    if (checkContent) finalContent = finalContent ? finalContent + "\n" + checkContent : checkContent;
    if (!newNote.title.trim() && !finalContent.trim()) { alert("?œëª© ?ëŠ” ?´ìš©???…ë ¥?´ì£¼?¸ìš”."); return; }
    var assigneeName = newNote.target_assignee || profile?.name || "?„ì²´";
    var insertObj = {
      assignee: assigneeName,
      title: newNote.title.trim(),
      content: finalContent,
      is_todo: newNote.is_todo,
      pinned: newNote.pinned,
      created_by: profile?.name || assigneeName,
    };
    if (newNote.due_date) insertObj.due_date = newNote.due_date;
    var r = await supabase.from("work_notes").insert(insertObj).select().single();
    if (!r.error && r.data) {
      setNotes(function(prev) { return [r.data].concat(prev); });
      setShowAdd(false);
      // ?´ë‹¹?ì—ê²?ë¸Œë¼?°ì? ?¸ì‹œ ?Œë¦¼ ?„ì†¡
      if (assigneeName !== (profile?.name || "")) {
        await sendPushToUser(assigneeName, {
          title: "?“‹ ???…ë¬´ê°€ ë°°ì •?ì–´??,
          body: (newNote.title || finalContent.split("\n")[0] || "???…ë¬´") + (newNote.due_date ? " Â· ë§ˆê°: " + newNote.due_date : ""),
          url: window.location.origin + "?view=worknotes"
        });
      }
      // ê¸°ì—…ëª??ë™ ê°ì? ???œë™ë¡œê·¸ ?ë™ ê¸°ë¡
      var fullText = (newNote.title || "") + " " + finalContent;
      var detected = detectCompaniesInText(fullText);
      for (var i = 0; i < detected.length; i++) {
        await logToActivity(detected[i], "?“ ?…ë¬´?¸íŠ¸: " + (newNote.title || newNote.content.split("\n")[0]));
      }
      setNewNote({ title: "", content: "", is_todo: false, pinned: false, target_assignee: "", checkItems: [], due_date: "" });
      // ?¬ì´?œë°” ë±ƒì? ?…ë°?´íŠ¸
      if (onBadgeUpdate) onBadgeUpdate();
    } else if (r.error) {
      alert("?€???¤íŒ¨: " + r.error.message);
    }
  };

  var addReply = async function(noteId) {
    if (!replyText.trim()) return;
    var note = notes.find(function(n) { return n.id === noteId; });
    var replies = [];
    try { replies = JSON.parse(note.replies || "[]"); } catch(e) { replies = []; }
    replies.push({ by: profile?.name || "", text: replyText.trim(), at: new Date().toISOString() });
    await supabase.from("work_notes").update({ replies: JSON.stringify(replies) }).eq("id", noteId);
    setNotes(function(prev) { return prev.map(function(n) { return n.id === noteId ? Object.assign({}, n, { replies: JSON.stringify(replies) }) : n; }); });
    setReplyId(null);
    setReplyText("");
  };

  var onChecklistChange = async function(noteId, newContent) {
    var r = await supabase.from("work_notes").update({ content: newContent, updated_at: new Date().toISOString() }).eq("id", noteId);
    if (!r.error) {
      setNotes(function(prev) { return prev.map(function(n) { return n.id === noteId ? Object.assign({}, n, { content: newContent }) : n; }); });
      // ë°©ê¸ˆ ì²´í¬ ?„ë£Œ????ª©??ê¸°ì—…ëª…ì´ ?ˆìœ¼ë©??œë™ë¡œê·¸ ê¸°ë¡
      var prevNote = notes.find(function(n) { return n.id === noteId; });
      if (prevNote) {
        var prevLines = (prevNote.content || "").split("\n");
        var newLines = newContent.split("\n");
        for (var i = 0; i < newLines.length; i++) {
          var prevLine = prevLines[i] || "";
          var newLine = newLines[i];
          // ?ˆë¡œ ì²´í¬????ª© (- [ ] ??- [x])
          if (/^- \[x\]/.test(newLine.trim()) && /^- \[ \]/.test(prevLine.trim())) {
            var itemText = newLine.trim().replace(/^- \[x\]\s*/, "");
            var detected = detectCompaniesInText(itemText);
            for (var j = 0; j < detected.length; j++) {
              await logToActivity(detected[j], "???„ë£Œ: " + itemText);
            }
          }
        }
      }
      // ?¬ì´?œë°” ë±ƒì? ?…ë°?´íŠ¸
      if (onBadgeUpdate) onBadgeUpdate();
    }
  };

  var saveEdit = async function() {
    // checkItems + freeContentë¥??¤ì‹œ contentë¡??©ì¹˜ê¸?    var finalContent = editNote.content || "";
    if (editNote.checkItems !== undefined) {
      var checkLines = (editNote.checkItems || []).filter(function(i) { return (i.text || "").trim(); }).map(function(i) {
        var line = "- [" + (i.checked ? "x" : " ") + "] " + i.text.trim();
        if (i.dueDate) line += " [" + i.dueDate + "]";
        return line;
      });
      var freeText = (editNote.freeContent || "").trim();
      var parts = [];
      if (checkLines.length > 0) parts.push(checkLines.join("\n"));
      if (freeText) parts.push(freeText);
      finalContent = parts.join("\n");
    }
    
    var r = await supabase.from("work_notes").update({
      title: editNote.title,
      content: finalContent,
      is_todo: editNote.is_todo,
      pinned: editNote.pinned,
      due_date: editNote.due_date || null,
      updated_at: new Date().toISOString(),
    }).eq("id", editNote.id);
    if (!r.error) {
      setNotes(function(prev) { return prev.map(function(n) { return n.id === editNote.id ? Object.assign({}, n, editNote, { content: finalContent }) : n; }); });
      setEditingId(null); setEditNote({});
      if (onBadgeUpdate) onBadgeUpdate();
    }
  };

  var toggleDone = async function(note) {
    var r = await supabase.from("work_notes").update({ is_done: !note.is_done, updated_at: new Date().toISOString() }).eq("id", note.id);
    if (!r.error) {
      setNotes(function(prev) { return prev.map(function(n) { return n.id === note.id ? Object.assign({}, n, { is_done: !note.is_done }) : n; }); });
      // ?¬ì´?œë°” ë±ƒì? ?…ë°?´íŠ¸
      if (onBadgeUpdate) onBadgeUpdate();
    }
  };

  var togglePin = async function(note) {
    var r = await supabase.from("work_notes").update({ pinned: !note.pinned, updated_at: new Date().toISOString() }).eq("id", note.id);
    if (!r.error) setNotes(function(prev) { return prev.map(function(n) { return n.id === note.id ? Object.assign({}, n, { pinned: !note.pinned }) : n; }); });
  };

  var deleteNote = async function(id) {
    if (!window.confirm("?´ì??µìœ¼ë¡??´ë™?˜ì‹œê² ìŠµ?ˆê¹Œ? (?´ì??µì—??ë³µêµ¬ ê°€??")) return;
    var r = await supabase.from("work_notes").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (!r.error) {
      setNotes(function(prev) { return prev.filter(function(n) { return n.id !== id; }); });
      if (onBadgeUpdate) onBadgeUpdate();
    }
  };

  var fmtDate = function(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    var now = new Date();
    var diff = now - d;
    var mins = Math.floor(diff / 60000);
    var hours = Math.floor(diff / 3600000);
    var days = Math.floor(diff / 86400000);
    if (mins < 1) return "ë°©ê¸ˆ ??;
    if (mins < 60) return mins + "ë¶???;
    if (hours < 24) return hours + "?œê°„ ??;
    if (days === 1) return "?´ì œ";
    if (days < 7) return days + "????;
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #E8E5E0", borderTopColor: "#1A1917", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <span style={{ color: "#888", fontSize: 13 }}>?…ë¬´ ?¸íŠ¸ ë¶ˆëŸ¬?¤ëŠ” ì¤?..</span>
    </div>
  );

  return (
    <div>
      {/* ?¤ë” */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>?…ë¬´ ?¸íŠ¸</h1>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>ë©”ëª¨ Â· ????Â· ?…ë¬´?¼ì?</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={function() { setShowAdd(true); setNewNote({ title: "", content: "", is_todo: false, pinned: false, checkItems: [] }); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Icon name="plus" size={15} color="#F7F6F3" /> ???¸íŠ¸
          </button>
          <button onClick={openTrash}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
            ?—‘ï¸??´ì???          </button>
          <button onClick={fetchNotes} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#555", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
            <Icon name="refresh" size={13} color="#555" />
          </button>
        </div>
      </div>

      {/* ?„í„° */}
      <div style={{ display: "flex", gap: 16, marginBottom: 18, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#888" }}>?´ë‹¹??</span>
          {["?„ì²´"].concat(ASSIGNEES).map(function(a) {
            return (
              <div key={a} onClick={function() { setFilterAssignee(a); }}
                style={{ padding: "5px 13px", borderRadius: 99, cursor: "pointer", fontSize: 12, fontWeight: filterAssignee === a ? 700 : 400,
                  background: filterAssignee === a ? "#1A1917" : "#fff", color: filterAssignee === a ? "#fff" : "#666",
                  border: filterAssignee === a ? "none" : "1px solid #E8E5E0" }}>
                {a}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#888" }}>? í˜•:</span>
          {["?„ì²´","ë©”ëª¨","? ì¼"].map(function(t) {
            return (
              <div key={t} onClick={function() { setFilterType(t); }}
                style={{ padding: "5px 13px", borderRadius: 99, cursor: "pointer", fontSize: 12,
                  background: filterType === t ? "#1A1917" : "#fff", color: filterType === t ? "#fff" : "#666",
                  border: filterType === t ? "none" : "1px solid #E8E5E0" }}>
                {t}
              </div>
            );
          })}
        </div>
      </div>

      {/* ?¸íŠ¸ ?˜ì • ??(?¸ì§‘ ì¤‘ì¼ ???ë‹¨ ?„ì²´ ??œ¼ë¡??œì‹œ) */}
      {editingId && (
        <div style={{ marginBottom: 20 }}>
          <NoteEditCard
            note={notes.find(function(n) { return n.id === editingId; })}
            editNote={editNote}
            setEditNote={setEditNote}
            saveEdit={saveEdit}
            onCancel={function() { setEditingId(null); setEditNote({}); }}
          />
        </div>
      )}

      {/* ???¸íŠ¸ ?‘ì„± ??*/}
      {showAdd && (
        <div style={{ background: "#F0FDF4", border: "2px solid #86EFAC", borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#15803D", marginBottom: 12 }}>?ï¸ ???¸íŠ¸ ?‘ì„±</div>
          <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={newNote.is_todo} onChange={function(e) { setNewNote(function(p) { return Object.assign({}, p, { is_todo: e.target.checked }); }); }} />
              ?“‹ ???¼ë¡œ ?±ë¡
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={newNote.pinned} onChange={function(e) { setNewNote(function(p) { return Object.assign({}, p, { pinned: e.target.checked }); }); }} />
              ?“Œ ?ë‹¨ ê³ ì •
            </label>
          </div>
          <div style={{ marginBottom: 10 }}>
            <select value={newNote.target_assignee || profile?.name || ""} onChange={function(e) { var v = e.target.value; setNewNote(function(p) { return Object.assign({}, p, { target_assignee: v }); }); }}
              style={{ padding: "8px 12px", border: "1px solid #86EFAC", borderRadius: 8, fontSize: 13, background: "#fff", width: "auto" }}>
              <option value="">?´ë‹¹??? íƒ</option>
              {ASSIGNEES.map(function(a) { return <option key={a} value={a}>{a}</option>; })}
            </select>
          </div>
          <input value={newNote.title} placeholder="?œëª© (? íƒ?¬í•­)" onChange={function(e) { var v = e.target.value; setNewNote(function(p) { return Object.assign({}, p, { title: v }); }); }}
            style={{ width: "100%", padding: "10px 13px", border: "1px solid #86EFAC", borderRadius: 8, fontSize: 14, fontWeight: 600, boxSizing: "border-box", outline: "none", marginBottom: 10, background: "#fff" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: "#15803D", fontWeight: 600, whiteSpace: "nowrap" }}>?“… ë§ˆê°??/label>
            <input type="date" value={newNote.due_date || ""} onChange={function(e) { var v = e.target.value; setNewNote(function(p) { return Object.assign({}, p, { due_date: v }); }); }}
              style={{ width: "auto", padding: "7px 10px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 12, background: "#fff", outline: "none" }} />
            {newNote.due_date && <button onClick={function() { setNewNote(function(p) { return Object.assign({}, p, { due_date: "" }); }); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#AAA", fontSize: 14 }}>??/button>}
          </div>
          {/* ì²´í¬ë¦¬ìŠ¤????ª©??*/}
          {newNote.checkItems && newNote.checkItems.length > 0 && (
            <div style={{ border: "1px solid #86EFAC", borderRadius: 8, padding: "10px 12px", marginBottom: 8, background: "#fff" }}>
              {newNote.checkItems.map(function(item, idx) {
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <input type="checkbox" disabled style={{ width: 15, height: 15, flexShrink: 0 }} />
                    <input type="text" value={item.text || ""} placeholder={"??ª© " + (idx + 1) + " (?? ?¤í¬ë¦½íŠ¸ ?‘ì„±)"}
                      onChange={function(e) { var v = e.target.value; setNewNote(function(p) { var items = p.checkItems.slice(); items[idx] = Object.assign({}, items[idx], { text: v }); return Object.assign({}, p, { checkItems: items }); }); }}
                      style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent" }} autoFocus={idx === newNote.checkItems.length - 1} />
                    <input type="date" value={item.dueDate || ""} title="????ª©??ë§ˆê°??(? íƒ)"
                      onChange={function(e) { var v = e.target.value; setNewNote(function(p) { var items = p.checkItems.slice(); items[idx] = Object.assign({}, items[idx], { dueDate: v }); return Object.assign({}, p, { checkItems: items }); }); }}
                      style={{ padding: "3px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 11, color: "#4338CA", outline: "none", width: 130 }} />
                    <button onClick={function() { setNewNote(function(p) { var items = p.checkItems.filter(function(_, i) { return i !== idx; }); return Object.assign({}, p, { checkItems: items }); }); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#CCC", fontSize: 16, padding: "0 4px", lineHeight: 1 }}>Ã—</button>
                  </div>
                );
              })}
            </div>
          )}
          {/* ì²´í¬ë¦¬ìŠ¤??ë²„íŠ¼ + textarea */}
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <button onClick={function() {
              setNewNote(function(p) {
                var items = (p.checkItems || []).concat([{ text: "" }]);
                return Object.assign({}, p, { checkItems: items, is_todo: true });
              });
            }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "#fff", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 12, color: "#15803D", fontWeight: 600, cursor: "pointer" }}>
              ?‘ï¸ ì²´í¬ë¦¬ìŠ¤????ª© ì¶”ê?
            </button>
            <span style={{ fontSize: 10, color: "#888", alignSelf: "center", lineHeight: 1.4 }}>
              ?’¡ ì§ì ‘ ?…ë ¥ ?? <code style={{ background: "#F0EDE8", padding: "1px 4px", borderRadius: 3, fontSize: 10 }}>- [ ] ? ì¼ [5/30]</code> ?ëŠ” <code style={{ background: "#F0EDE8", padding: "1px 4px", borderRadius: 3, fontSize: 10 }}>- [ ] ? ì¼ ??5/30</code>
            </span>
          </div>
          <textarea value={newNote.content} placeholder={newNote.checkItems && newNote.checkItems.length > 0 ? "ì¶”ê? ë©”ëª¨ (? íƒ?¬í•­)..." : "?´ìš©???ìœ ë¡?²Œ ?…ë ¥?˜ì„¸?? ?…ë¬´ ë©”ëª¨, ?¤ëŠ˜ ???? ì£¼ì˜?¬í•­ ??.."} onChange={function(e) { var v = e.target.value; setNewNote(function(p) { return Object.assign({}, p, { content: v }); }); }} rows={newNote.checkItems && newNote.checkItems.length > 0 ? 2 : 6}
            style={{ width: "100%", padding: "12px 13px", border: "1px solid #86EFAC", borderRadius: 8, fontSize: 13, lineHeight: 1.75, resize: "vertical", boxSizing: "border-box", outline: "none", background: "#fff" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={saveNew} style={{ background: "#15803D", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>?€??/button>
            <button onClick={function() { setShowAdd(false); }} style={{ background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 8, padding: "10px 16px", fontSize: 13, cursor: "pointer" }}>ì·¨ì†Œ</button>
          </div>
        </div>
      )}

      {/* ?¸íŠ¸ ëª©ë¡ */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", color: "#CCC", fontSize: 14, padding: "80px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>?“</div>
          ?„ì§ ?‘ì„±???¸íŠ¸ê°€ ?†ì–´??<br />
          <span style={{ fontSize: 13 }}>"???¸íŠ¸" ë²„íŠ¼???ŒëŸ¬ ì²?ë©”ëª¨ë¥??¨ê²¨ë³´ì„¸??</span>
        </div>
      ) : (
        <div>
          {/* ê³ ì • ?¸íŠ¸ */}
          {pinned.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#B45309", letterSpacing: "0.05em", marginBottom: 10 }}>?“Œ ê³ ì •???¸íŠ¸</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                {pinned.map(function(note) { return <NoteCard key={note.id} note={note} editingId={editingId} editNote={editNote} setEditNote={setEditNote} saveEdit={saveEdit} setEditingId={setEditingId} toggleDone={toggleDone} togglePin={togglePin} deleteNote={deleteNote} fmtDate={fmtDate} currentUserName={profile?.name} onChecklistChange={onChecklistChange} />; })}
              </div>
            </div>
          )}
          {/* ?¼ë°˜ ?¸íŠ¸ */}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: "0.05em", marginBottom: 10 }}>?„ì²´ ?¸íŠ¸</div>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                {unpinned.map(function(note) { return <NoteCard key={note.id} note={note} editingId={editingId} editNote={editNote} setEditNote={setEditNote} saveEdit={saveEdit} setEditingId={setEditingId} toggleDone={toggleDone} togglePin={togglePin} deleteNote={deleteNote} fmtDate={fmtDate} currentUserName={profile?.name} onChecklistChange={onChecklistChange} />; })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ?´ì???ëª¨ë‹¬ */}
      {showTrash && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={function(e) { if (e.target === e.currentTarget) setShowTrash(false); }}>
          <div style={{ background: "#fff", borderRadius: 14, width: 560, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>?—‘ï¸??…ë¬´?¸íŠ¸ ?´ì???({trashedNotes.length}ê±?</h2>
              <button onClick={function() { setShowTrash(false); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Icon name="x" size={18} color="#888" />
              </button>
            </div>
            <div style={{ padding: "16px 24px" }}>
              {trashedNotes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#CCC", fontSize: 14 }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>?—‘ï¸?/div>
                  ?´ì??µì´ ë¹„ì–´ ?ˆìŠµ?ˆë‹¤
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {trashedNotes.map(function(note) {
                    var deletedAt = note.deleted_at ? new Date(note.deleted_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
                    return (
                      <div key={note.id} style={{ background: "#F7F6F3", borderRadius: 10, padding: "14px 16px", border: "1px solid #E8E5E0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1917", marginBottom: 2 }}>{note.title || "(?œëª© ?†ìŒ)"}</div>
                            <div style={{ fontSize: 11, color: "#AAA" }}>{note.assignee} Â· ?? œ?? {deletedAt}</div>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={function() { restoreNote(note.id); }}
                              style={{ background: "#EEF2FF", color: "#4338CA", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                              ë³µêµ¬
                            </button>
                            <button onClick={function() { permanentDeleteNote(note.id); }}
                              style={{ background: "#FEF2F2", color: "#DC2626", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                              ?„ì „?? œ
                            </button>
                          </div>
                        </div>
                        {note.content && (
                          <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 60, overflow: "hidden" }}>
                            {note.content}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ?€?€ ?•ì‚°ê´€ë¦??€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
function SettlementView() {
  const [cases, setCases] = useState([]);       // ?ë™ (agency_cases)
  const [manuals, setManuals] = useState([]);   // ?˜ë™ (settlement_manual)
  const [loading, setLoading] = useState(true);
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth() + 1);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [editSource, setEditSource] = useState("auto");
  const [showAddManual, setShowAddManual] = useState(false);
  const [newManual, setNewManual] = useState({});

  useEffect(function() { fetchData(); }, []);

  var fetchData = async function() {
    setLoading(true);
    var r1 = await supabase.from("agency_cases").select("*")
      .in("status", ["?¹ì¸","?½ì •","?„ë£Œ","?ê¸ˆì§‘í–‰?„ë£Œ"])
      .order("created_at", { ascending: false });
    var r2 = await supabase.from("settlement_manual").select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (!r1.error) setCases(r1.data || []);
    if (!r2.error) setManuals(r2.data || []);
    setLoading(false);
  };

  // ?ë™ + ?˜ë™ ?©ì‚° (?„ì¬ ??
  var filteredAuto = useMemo(function() {
    return cases.filter(function(c) { return c.month === activeMonth && c.year === 2026 && !c.deleted_at; });
  }, [cases, activeMonth]);

  var filteredManual = useMemo(function() {
    return manuals.filter(function(m) { return m.month === activeMonth && m.year === 2026; });
  }, [manuals, activeMonth]);

  var allFiltered = useMemo(function() {
    var auto = filteredAuto.map(function(c) { return Object.assign({}, c, { _source: "auto" }); });
    var manual = filteredManual.map(function(m) { return Object.assign({}, m, { _source: "manual" }); });
    return auto.concat(manual);
  }, [filteredAuto, filteredManual]);

  // ????š© - ?°ì´???ˆëŠ” ??  var monthsWithData = useMemo(function() {
    var s = new Set();
    cases.forEach(function(c) { if (c.year === 2026 && !c.deleted_at) s.add(c.month); });
    manuals.forEach(function(m) { if (m.year === 2026) s.add(m.month); });
    return s;
  }, [cases, manuals]);

  var parseAmt = function(v) {
    if (!v) return 0;
    return typeof v === "string" ? parseInt(v.replace(/[^0-9]/g, "")) || 0 : (v || 0);
  };

  var formatAmt = function(v) {
    var n = typeof v === "number" ? v : parseAmt(v);
    if (!n || n === 0) return "-";
    if (n >= 100000000) return (n / 100000000).toFixed(1) + "??;
    if (n >= 10000000) return (n / 10000000).toFixed(0) + "ì²œë§Œ";
    if (n >= 1000000) return (n / 1000000).toFixed(0) + "ë°±ë§Œ";
    if (n >= 10000) return (n / 10000).toFixed(0) + "ë§?;
    return n.toLocaleString() + "??;
  };

  // KPI ?©ì‚°
  var monthSummary = useMemo(function() {
    var totalCommission = 0;
    var totalReceived = 0;
    allFiltered.forEach(function(c) {
      totalCommission += parseAmt(c.commission_fee);
      totalReceived += parseAmt(c.received_amount);
    });
    return {
      total: allFiltered.length,
      autoCount: filteredAuto.length,
      manualCount: filteredManual.length,
      commissionSet: allFiltered.filter(function(c) { return c.commission_fee; }).length,
      depositDone: allFiltered.filter(function(c) { return c.fee_received; }).length,
      totalCommission: totalCommission,
      totalReceived: totalReceived,
    };
  }, [allFiltered, filteredAuto, filteredManual]);

  // ?ë™ ê±??€??  var saveEditAuto = async function() {
    var updates = {
      contract_fee: editData.contract_fee || null,
      contract_date: editData.contract_date || null,
      commission_fee: editData.commission_fee || null,
      received_amount: editData.received_amount || null,
      invoice_issued: editData.invoice_issued || false,
      invoice_date: editData.invoice_date || null,
      fee_received: editData.fee_received || false,
      fee_received_date: editData.fee_received_date || null,
      settlement_notes: editData.settlement_notes || null,
      updated_at: new Date().toISOString(),
    };
    var r = await supabase.from("agency_cases").update(updates).eq("id", editData.id);
    if (!r.error) {
      setCases(function(prev) { return prev.map(function(c) { return c.id === editData.id ? Object.assign({}, c, updates) : c; }); });
      setEditingId(null); setEditData({});
    }
  };

  // ?˜ë™ ê±??€??  var saveEditManual = async function() {
    var updates = {
      business_name: editData.business_name || null,
      agency_group: editData.agency_group || null,
      assignee: editData.assignee || null,
      request_amount: editData.request_amount || null,
      contract_fee: editData.contract_fee || null,
      contract_date: editData.contract_date || null,
      commission_fee: editData.commission_fee || null,
      received_amount: editData.received_amount || null,
      invoice_issued: editData.invoice_issued || false,
      fee_received: editData.fee_received || false,
      fee_received_date: editData.fee_received_date || null,
      settlement_notes: editData.settlement_notes || null,
      updated_at: new Date().toISOString(),
    };
    var r = await supabase.from("settlement_manual").update(updates).eq("id", editData.id);
    if (!r.error) {
      setManuals(function(prev) { return prev.map(function(m) { return m.id === editData.id ? Object.assign({}, m, updates) : m; }); });
      setEditingId(null); setEditData({});
    }
  };

  var saveEdit = function() {
    if (editSource === "manual") saveEditManual();
    else saveEditAuto();
  };

  // ?˜ë™ ê±??? œ
  var deleteManual = async function(id) {
    if (!window.confirm("?? œ?˜ì‹œê² ìŠµ?ˆê¹Œ?")) return;
    var r = await supabase.from("settlement_manual").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (!r.error) setManuals(function(prev) { return prev.filter(function(m) { return m.id !== id; }); });
  };

  // ?˜ë™ ? ê·œ ?±ë¡
  var openAddManual = function() {
    setNewManual({ year: 2026, month: activeMonth, business_name: "", agency_group: "", assignee: "", request_amount: "", contract_fee: "", commission_fee: "", received_amount: "", contract_date: "", invoice_issued: false, fee_received: false, fee_received_date: "", settlement_notes: "" });
    setShowAddManual(true);
  };

  var saveNewManual = async function() {
    if (!newManual.business_name) { alert("?¬ì—…?ëª…?€ ?„ìˆ˜?…ë‹ˆ??"); return; }
    var dataToSave = Object.assign({}, newManual, {
      contract_date: newManual.contract_date || null,
      fee_received_date: newManual.fee_received_date || null,
    });
    var r = await supabase.from("settlement_manual").insert(dataToSave).select().single();
    if (!r.error && r.data) {
      setManuals(function(prev) { return prev.concat([r.data]); });
      setShowAddManual(false);
    } else {
      alert("?€???¤íŒ¨: " + (r.error ? r.error.message : ""));
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #E8E5E0", borderTopColor: "#1A1917", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <span style={{ color: "#888", fontSize: 13 }}>?•ì‚° ?°ì´??ë¶ˆëŸ¬?¤ëŠ” ì¤?..</span>
    </div>
  );

  // ê³µí†µ ?¸ì§‘ ???Œë”ë§?  var renderEditRow = function(row, idx) {
    var isManual = row._source === "manual";
    return (
      <tr key={row.id + "-edit"} style={{ borderBottom: "1px solid #F0EDE8", background: "#FEFCE8" }}>
        <td style={{ padding: "9px 8px", color: "#AAA", fontSize: 11, textAlign: "center" }}>{idx + 1}</td>
        <td style={{ padding: "6px 8px" }}>
          {isManual
            ? <input value={editData.business_name || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { business_name: e.target.value }); }); }} style={{ width: 110, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12 }} />
            : <span style={{ fontWeight: 600, fontSize: 12 }}>{row.business_name}</span>}
        </td>
        <td style={{ padding: "6px 8px" }}>
          {isManual
            ? <select value={editData.agency_group || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { agency_group: e.target.value }); }); }} style={{ width: 80, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 11 }}>
                <option value="">? íƒ</option>
                {AGENCY_GROUPS.map(function(g) { return <option key={g.id} value={g.id}>{g.label}</option>; })}
              </select>
            : <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "#EEF2FF", color: "#4338CA", fontWeight: 600 }}>{row.agency_group}</span>}
        </td>
        <td style={{ padding: "6px 8px" }}>
          {isManual
            ? <select value={editData.assignee || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { assignee: e.target.value }); }); }} style={{ width: 70, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 11 }}>
                <option value="">? íƒ</option>
                {ASSIGNEES.map(function(a) { return <option key={a} value={a}>{a}</option>; })}
              </select>
            : <span style={{ fontSize: 12, color: "#555" }}>{row.assignee || "-"}</span>}
        </td>
        <td style={{ padding: "6px 8px" }}>
          {isManual
            ? <input value={editData.request_amount || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { request_amount: e.target.value }); }); }} style={{ width: 70, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12 }} />
            : <span style={{ fontSize: 12, color: "#555" }}>{row.request_amount || "-"}</span>}
        </td>
        <td style={{ padding: "6px 8px" }}>
          <input value={editData.contract_fee || ""} placeholder="ê³„ì•½ê¸? onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { contract_fee: e.target.value }); }); }} style={{ width: 75, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12 }} />
        </td>
        <td style={{ padding: "6px 8px" }}>
          <input value={editData.commission_fee || ""} placeholder="?˜ìˆ˜ë£? onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { commission_fee: e.target.value }); }); }} style={{ width: 75, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12 }} />
        </td>
        <td style={{ padding: "6px 8px" }}>
          <input value={editData.received_amount || ""} placeholder="?…ê¸ˆê¸ˆì•¡" onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { received_amount: e.target.value }); }); }} style={{ width: 75, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12 }} />
        </td>
        <td style={{ padding: "6px 8px" }}>
          <input type="date" value={editData.contract_date || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { contract_date: e.target.value }); }); }} style={{ width: 115, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12 }} />
        </td>
        <td style={{ padding: "6px 8px", textAlign: "center" }}>
          <input type="checkbox" checked={editData.invoice_issued || false} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { invoice_issued: e.target.checked }); }); }} />
        </td>
        <td style={{ padding: "6px 8px", textAlign: "center" }}>
          <input type="checkbox" checked={editData.fee_received || false} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { fee_received: e.target.checked }); }); }} />
        </td>
        <td style={{ padding: "6px 8px" }}>
          <input type="date" value={editData.fee_received_date || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { fee_received_date: e.target.value }); }); }} style={{ width: 115, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12 }} />
        </td>
        <td style={{ padding: "6px 8px" }}>
          <input value={editData.settlement_notes || ""} placeholder="ë©”ëª¨" onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { settlement_notes: e.target.value }); }); }} style={{ width: 85, padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12 }} />
        </td>
        <td style={{ padding: "6px 8px", textAlign: "center" }}>
          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
            <button onClick={saveEdit} style={{ background: "#15803D", color: "#fff", border: "none", borderRadius: 4, padding: "3px 8px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>?€??/button>
            <button onClick={function() { setEditingId(null); setEditData({}); }} style={{ background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 4, padding: "3px 6px", fontSize: 11, cursor: "pointer" }}>ì·¨ì†Œ</button>
          </div>
        </td>
      </tr>
    );
  };

  // ?½ê¸° ???Œë”ë§?  var renderReadRow = function(row, idx) {
    var isManual = row._source === "manual";
    return (
      <tr key={row.id} style={{ borderBottom: "1px solid #F0EDE8", background: idx % 2 === 0 ? "#fff" : "#FAFAF8" }}>
        <td style={{ padding: "9px 8px", color: "#AAA", fontSize: 11, textAlign: "center" }}>
          {isManual
            ? <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 99, background: "#FFF7ED", color: "#C2410C", fontWeight: 700 }}>?˜ë™</span>
            : idx + 1}
        </td>
        <td style={{ padding: "9px 8px", fontWeight: 600, whiteSpace: "nowrap" }}>{row.business_name || "-"}</td>
        <td style={{ padding: "9px 8px" }}>
          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "#EEF2FF", color: "#4338CA", fontWeight: 600 }}>{row.agency_group || "-"}</span>
        </td>
        <td style={{ padding: "9px 8px", fontSize: 12, color: "#555" }}>{row.assignee || "-"}</td>
        <td style={{ padding: "9px 8px", fontSize: 12, color: "#555" }}>{row.request_amount || "-"}</td>
        <td style={{ padding: "9px 8px" }}>
          {row.contract_fee ? <span style={{ fontSize: 12, fontWeight: 700, color: "#333" }}>{row.contract_fee}</span> : <span style={{ fontSize: 11, color: "#CCC" }}>ë¯¸ì…??/span>}
        </td>
        <td style={{ padding: "9px 8px" }}>
          {row.commission_fee ? <span style={{ fontSize: 12, fontWeight: 700, color: "#7C3AED" }}>{row.commission_fee}</span> : <span style={{ fontSize: 11, color: "#CCC" }}>ë¯¸ì…??/span>}
        </td>
        <td style={{ padding: "9px 8px" }}>
          {row.received_amount ? <span style={{ fontSize: 12, fontWeight: 700, color: "#047857" }}>{row.received_amount}</span> : <span style={{ fontSize: 11, color: "#CCC" }}>ë¯¸ì…??/span>}
        </td>
        <td style={{ padding: "9px 8px", fontSize: 11, color: "#888" }}>{row.contract_date || "-"}</td>
        <td style={{ padding: "9px 8px", textAlign: "center" }}>
          {row.invoice_issued
            ? <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#ECFDF5", color: "#047857", fontWeight: 600 }}>ë°œí–‰?„ë£Œ</span>
            : <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#F7F6F3", color: "#AAA" }}>ë¯¸ë°œ??/span>}
        </td>
        <td style={{ padding: "9px 8px", textAlign: "center" }}>
          {row.fee_received
            ? <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#ECFDF5", color: "#047857", fontWeight: 600 }}>?…ê¸ˆ?„ë£Œ</span>
            : <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#FFF7ED", color: "#C2410C" }}>ë¯¸ì…ê¸?/span>}
        </td>
        <td style={{ padding: "9px 8px", fontSize: 11, color: "#888" }}>{row.fee_received_date || "-"}</td>
        <td style={{ padding: "9px 8px", fontSize: 11, color: "#555", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.settlement_notes || "-"}</td>
        <td style={{ padding: "9px 8px", textAlign: "center" }}>
          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
            <button onClick={function() { setEditingId(row.id); setEditData(Object.assign({}, row)); setEditSource(isManual ? "manual" : "auto"); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <Icon name="edit" size={14} color="#888" />
            </button>
            {isManual && (
              <button onClick={function() { deleteManual(row.id); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <Icon name="x" size={14} color="#CCC" />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>?•ì‚°ê´€ë¦?/h1>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>ê³„ì•½ê¸?Â· ?˜ìˆ˜ë£?Â· ?¸ê¸ˆê³„ì‚°??ê´€ë¦?/p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={openAddManual} style={{ display: "flex", alignItems: "center", gap: 6, background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Icon name="plus" size={15} color="#F7F6F3" /> ì§ì ‘ ?±ë¡
          </button>
          <button onClick={fetchData} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#555", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
            <Icon name="refresh" size={13} color="#555" /> ?ˆë¡œê³ ì¹¨
          </button>
        </div>
      </div>

      {/* ????*/}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, flexWrap: "wrap" }}>
        {MONTHS_LIST.map(function(m) {
          var isActive = activeMonth === m;
          var has = monthsWithData.has(m);
          return (
            <div key={m} onClick={function() { setActiveMonth(m); setEditingId(null); setEditData({}); setShowAddManual(false); }}
              style={{ padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: isActive ? 700 : 400,
                background: isActive ? "#1A1917" : has ? "#fff" : "#F7F6F3",
                color: isActive ? "#fff" : has ? "#333" : "#CCC",
                border: isActive ? "none" : has ? "1px solid #E8E5E0" : "1px solid #EDEBE8" }}>
              {m}??has && !isActive ? " ?? : ""}
            </div>
          );
        })}
      </div>

      {/* KPI ì¹´ë“œ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "ì´?ê±´ìˆ˜", value: monthSummary.total + "ê±?, color: "#4338CA", sub: "?ë™ " + monthSummary.autoCount + " Â· ?˜ë™ " + monthSummary.manualCount },
          { label: "?˜ìˆ˜ë£??¤ì •", value: monthSummary.commissionSet + "ê±?, color: "#047857", sub: "?˜ìˆ˜ë£??…ë ¥ ?„ë£Œ" },
          { label: "?…ê¸ˆ ?„ë£Œ", value: monthSummary.depositDone + "ê±?, color: "#7C3AED", sub: "?˜ìˆ˜ë£??˜ë ¹ ?„ë£Œ" },
          { label: "?ˆìƒ ??ë§¤ì¶œ", value: formatAmt(monthSummary.totalCommission), color: "#B45309", sub: "?˜ìˆ˜ë£??©ì‚°" },
          { label: "?¤ì œ ?…ê¸ˆ??, value: formatAmt(monthSummary.totalReceived), color: "#047857", sub: "?…ê¸ˆê¸ˆì•¡ ?©ì‚°" },
        ].map(function(k, i) {
          return (
            <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "16px 18px", border: "1px solid #E8E5E0" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 11, color: "#AAA", marginTop: 3 }}>{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ?Œì´ë¸?*/}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E5E0", overflow: "hidden" }}>
        {allFiltered.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#AAA", fontSize: 13 }}>
            {activeMonth}???°ì´?°ê? ?†ìŠµ?ˆë‹¤. ì§ì ‘ ?±ë¡?˜ê±°??ê¸°ê?ë³??„í™©?ì„œ ?¹ì¸ ?íƒœë¡?ë³€ê²½í•´ì£¼ì„¸??
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#F7F6F3", borderBottom: "2px solid #E8E5E0" }}>
                  {["#","?¬ì—…?ëª…","ê¸°ê?","?´ë‹¹??,"? ì²­ê¸ˆì•¡","ê³„ì•½ê¸?,"?˜ìˆ˜ë£?,"?…ê¸ˆê¸ˆì•¡","ê³„ì•½??,"?¸ê¸ˆê³„ì‚°??,"?…ê¸ˆ?„ë£Œ","?…ê¸ˆ??,"ë¹„ê³ ","?‘ì—…"].map(function(h) {
                    return <th key={h} style={{ textAlign: "left", padding: "10px 8px", fontWeight: 600, color: "#888", fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {allFiltered.map(function(row, idx) {
                  return editingId === row.id ? renderEditRow(row, idx) : renderReadRow(row, idx);
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ì§ì ‘ ?±ë¡ ëª¨ë‹¬ */}
      {showAddManual && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={function(e) { if (e.target === e.currentTarget) setShowAddManual(false); }}>
          <div style={{ background: "#fff", borderRadius: 14, width: 520, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>?•ì‚° ì§ì ‘ ?±ë¡ ({activeMonth}??</h2>
              <button onClick={function() { setShowAddManual(false); }} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="x" size={18} color="#888" /></button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div style={{ marginBottom: 13 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>?¬ì—…?ëª… *</label>
                <input value={newManual.business_name || ""} onChange={function(e) { setNewManual(function(p) { return Object.assign({}, p, { business_name: e.target.value }); }); }}
                  style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 13 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>ê¸°ê?</label>
                  <select value={newManual.agency_group || ""} onChange={function(e) { setNewManual(function(p) { return Object.assign({}, p, { agency_group: e.target.value }); }); }}
                    style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                    <option value="">? íƒ</option>
                    {AGENCY_GROUPS.map(function(g) { return <option key={g.id} value={g.id}>{g.label}</option>; })}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>?´ë‹¹??/label>
                  <select value={newManual.assignee || ""} onChange={function(e) { setNewManual(function(p) { return Object.assign({}, p, { assignee: e.target.value }); }); }}
                    style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                    <option value="">? íƒ</option>
                    {ASSIGNEES.map(function(a) { return <option key={a} value={a}>{a}</option>; })}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 13 }}>
                {[["? ì²­ê¸ˆì•¡","request_amount"],["ê³„ì•½ê¸?,"contract_fee"],["?˜ìˆ˜ë£?,"commission_fee"]].map(function(f) {
                  return (
                    <div key={f[1]}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>{f[0]}</label>
                      <input value={newManual[f[1]] || ""} placeholder="?? 300ë§? onChange={function(e) { var k = f[1]; setNewManual(function(p) { return Object.assign({}, p, { [k]: e.target.value }); }); }}
                        style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 13 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>?…ê¸ˆê¸ˆì•¡</label>
                  <input value={newManual.received_amount || ""} placeholder="?? 300ë§? onChange={function(e) { setNewManual(function(p) { return Object.assign({}, p, { received_amount: e.target.value }); }); }}
                    style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>ê³„ì•½??/label>
                  <input type="date" value={newManual.contract_date || ""} onChange={function(e) { setNewManual(function(p) { return Object.assign({}, p, { contract_date: e.target.value }); }); }}
                    style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 20, marginBottom: 13 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={newManual.invoice_issued || false} onChange={function(e) { setNewManual(function(p) { return Object.assign({}, p, { invoice_issued: e.target.checked }); }); }} />
                  ?¸ê¸ˆê³„ì‚°??ë°œí–‰?„ë£Œ
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={newManual.fee_received || false} onChange={function(e) { setNewManual(function(p) { return Object.assign({}, p, { fee_received: e.target.checked }); }); }} />
                  ?…ê¸ˆ?„ë£Œ
                </label>
              </div>
              {newManual.fee_received && (
                <div style={{ marginBottom: 13 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>?…ê¸ˆ??/label>
                  <input type="date" value={newManual.fee_received_date || ""} onChange={function(e) { setNewManual(function(p) { return Object.assign({}, p, { fee_received_date: e.target.value }); }); }}
                    style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>ë¹„ê³ </label>
                <textarea value={newManual.settlement_notes || ""} onChange={function(e) { setNewManual(function(p) { return Object.assign({}, p, { settlement_notes: e.target.value }); }); }} rows={2}
                  style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
              </div>
              <button onClick={saveNewManual} style={{ width: "100%", padding: "13px", background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                ?±ë¡?˜ê¸°
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
const MONTHS_LIST = [1,2,3,4,5,6,7,8,9,10,11,12];

// ?€?€ ìº˜ë¦°??(êµ¬ê? ìº˜ë¦°???°ë™ + ?”ë¡œ???Œë¦¼) ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
const GOOGLE_CLIENT_ID = "675906307078-pl29fdq2uuqj2011qn4arjc6u1uvkbq3.apps.googleusercontent.com";
const FOLLOWUP_STAGES = ["ê¸°ê?? ì²­?„ë£Œ/ë°©ë¬¸?„ë£Œ", "?¤íƒœì¡°ì‚¬?„ë£Œ/?½ì •?„ë£Œ", "?¬ì‚¬ì¤??¤íƒœì¡°ì‚¬?€ê¸?];

function CalendarView({ companies, onSelectCompany, profile }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [gConnected, setGConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar"); // calendar | followup
  const [calSheet, setCalSheet] = useState("yangho"); // yangho | director
  const [customEvents, setCustomEvents] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", time: "", memo: "", sheet: "yangho", color: "9" });
  const [gToken, setGToken] = useState("");
  // êµ¬ê? ìº˜ë¦°??ê³µì‹ ?‰ìƒ 11ê°€ì§€ (colorId 1~11)
  const EVENT_COLORS = [
    { id: "1",  label: "?¼ë²¤??,   bg: "#7986CB", light: "#E8EAF6" },
    { id: "2",  label: "?¸ì´ì§€",   bg: "#33B679", light: "#E0F2E9" },
    { id: "3",  label: "ê·¸ë ˆ?´í”„", bg: "#8E24AA", light: "#F3E5F5" },
    { id: "4",  label: "?Œë¼ë°ê³ ", bg: "#E67C73", light: "#FCE4EC" },
    { id: "5",  label: "ë°”ë‚˜??,   bg: "#F6BF26", light: "#FFF8E1" },
    { id: "6",  label: "? ì?ë¦?,   bg: "#F4511E", light: "#FFEBE0" },
    { id: "7",  label: "?¼ì½•",     bg: "#039BE5", light: "#E1F5FE" },
    { id: "8",  label: "ê·¸ë˜?Œì´??, bg: "#616161", light: "#EEEEEE" },
    { id: "9",  label: "ë¸”ë£¨ë² ë¦¬", bg: "#3F51B5", light: "#E8EAF6" },
    { id: "10", label: "ë°”ì§ˆ",     bg: "#0B8043", light: "#E0F2E9" },
    { id: "11", label: "? ë§ˆ??,   bg: "#D50000", light: "#FFEBEE" },
  ];
  const getColorById = function(id) {
    var c = EVENT_COLORS.find(function(x) { return x.id === String(id); });
    return c || EVENT_COLORS[8]; // ê¸°ë³¸: ë¸”ë£¨ë² ë¦¬
  };
  const todayStr = today.toISOString().slice(0, 10);
  const MONTH_NAMES = ["1??,"2??,"3??,"4??,"5??,"6??,"7??,"8??,"9??,"10??,"11??,"12??];
  const DAY_NAMES = ["??,"??,"??,"??,"ëª?,"ê¸?,"??];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // ì»¤ìŠ¤?€ ?¼ì • ë¶ˆëŸ¬?¤ê¸°
  useEffect(function() {
    supabase.from("calendar_events").select("*").order("created_at", { ascending: false })
      .then(function(r) { if (!r.error && r.data) setCustomEvents(r.data); });
  }, []);

  var saveEvent = async function() {
    if (!newEvent.title || !newEvent.date) { alert("?œëª©ê³?? ì§œë¥??…ë ¥?´ì£¼?¸ìš”."); return; }
    var googleEventId = null;
    // êµ¬ê? ìº˜ë¦°?”ì—???™ì‹œ ?±ë¡ (?°ê²°???ˆìœ¼ë©?
    if (gToken) {
      try {
        var startObj, endObj;
        if (newEvent.time) {
          // ?œê°„ ?ˆëŠ” ?¼ì •: 1?œê°„ ê¸°ë³¸
          var startISO = newEvent.date + "T" + newEvent.time + ":00";
          var startD = new Date(startISO);
          var endD = new Date(startD.getTime() + 60 * 60 * 1000);
          startObj = { dateTime: startD.toISOString(), timeZone: "Asia/Seoul" };
          endObj = { dateTime: endD.toISOString(), timeZone: "Asia/Seoul" };
        } else {
          // ì¢…ì¼ ?¼ì •
          startObj = { date: newEvent.date };
          endObj = { date: newEvent.date };
        }
        var gres = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST",
          headers: { Authorization: "Bearer " + gToken, "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: newEvent.title,
            description: newEvent.memo || "",
            start: startObj,
            end: endObj,
            colorId: newEvent.color || "9",
          }),
        });
        var gdata = await gres.json();
        if (gdata.id) googleEventId = gdata.id;
      } catch (err) {}
    }
    var r = await supabase.from("calendar_events").insert({
      title: newEvent.title, date: newEvent.date, time: newEvent.time || null,
      memo: newEvent.memo || null, sheet: newEvent.sheet,
      color: newEvent.color || "9",
      created_by: profile?.name || "",
    }).select().single();
    if (!r.error && r.data) {
      setCustomEvents(function(prev) { return [r.data].concat(prev); });
      // êµ¬ê????±ë¡??ê²½ìš° ì¦‰ì‹œ googleEvents?ë„ ì¶”ê?
      if (googleEventId) {
        setGoogleEvents(function(prev) { return prev.concat([{
          title: newEvent.title, date: newEvent.date, time: newEvent.time || "",
          color: newEvent.color || "9", googleEventId: googleEventId, memo: newEvent.memo || "",
        }]); });
      }
      setNewEvent({ title: "", date: "", time: "", memo: "", sheet: calSheet, color: "9" });
      setShowAddEvent(false);
    } else {
      alert("?€???¤íŒ¨: " + (r.error ? r.error.message : ""));
    }
  };

  // CRM ?¼ì • ?‰ìƒ ?…ë°?´íŠ¸ (êµ¬ê??ë„ ë°˜ì˜)
  var updateEventColor = async function(eventId, colorId) {
    var ev = customEvents.find(function(e) { return e.id === eventId; });
    var r = await supabase.from("calendar_events").update({ color: colorId }).eq("id", eventId);
    if (!r.error) {
      setCustomEvents(function(prev) {
        return prev.map(function(e) { return e.id === eventId ? Object.assign({}, e, { color: colorId }) : e; });
      });
    }
  };

  // êµ¬ê? ìº˜ë¦°???¼ì • ?‰ìƒ ì§ì ‘ ?…ë°?´íŠ¸
  var updateGoogleEventColor = async function(googleEventId, colorId) {
    if (!gToken || !googleEventId) return;
    try {
      var res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events/" + googleEventId, {
        method: "PATCH",
        headers: { Authorization: "Bearer " + gToken, "Content-Type": "application/json" },
        body: JSON.stringify({ colorId: colorId }),
      });
      if (res.ok) {
        setGoogleEvents(function(prev) {
          return prev.map(function(e) { return e.googleEventId === googleEventId ? Object.assign({}, e, { color: colorId }) : e; });
        });
      } else {
        alert("êµ¬ê? ?¼ì • ?‰ìƒ ë³€ê²??¤íŒ¨. ?¤ì‹œ ?°ë™?´ì£¼?¸ìš”.");
      }
    } catch (err) {
      alert("êµ¬ê? ?¼ì • ?‰ìƒ ë³€ê²??¤íŒ¨: " + err.message);
    }
  };

  var deleteEvent = async function(id) {
    if (!window.confirm("???¼ì •???? œ? ê¹Œ??")) return;
    await supabase.from("calendar_events").delete().eq("id", id);
    setCustomEvents(function(prev) { return prev.filter(function(e) { return e.id !== id; }); });
  };

  const prevMonth = () => { if (month === 0) { setYear(y=>y-1); setMonth(11); } else setMonth(m=>m-1); };
  const nextMonth = () => { if (month === 11) { setYear(y=>y+1); setMonth(0); } else setMonth(m=>m+1); };

  // CRM ???°ë½ ?ˆì •???´ë²¤??  const crmEventsByDate = useMemo(() => {
    const map = {};
    companies.forEach(c => {
      if (c.next_contact) {
        if (!map[c.next_contact]) map[c.next_contact] = [];
        map[c.next_contact].push(c);
      }
    });
    return map;
  }, [companies]);

  // ?”ë¡œ???„ìš” ê±?(ê¸°ê?ë°©ë¬¸/?¤íƒœì¡°ì‚¬ ?¤ìŒ??
  const followupList = useMemo(() => {
    return companies.filter(c =>
      FOLLOWUP_STAGES.includes(c.stage) &&
      c.next_contact && c.next_contact <= todayStr
    );
  }, [companies, todayStr]);

  // ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
  // êµ¬ê? ìº˜ë¦°???êµ¬ ?°ë™ (OAuth Code Flow + Supabase DB ? í° ?€??
  // - ?‘í˜¸ ìº˜ë¦°??/ ?´ì‚¬??ìº˜ë¦°??2ê°œë? ë¶„ë¦¬ ?€??  // - calSheet ë³€?˜ì— ?°ë¼ ?ì ˆ??? í° ì¡°íšŒ (yangho ??'?‘í˜¸', director ??'?´ì‚¬??)
  // - refresh_token?¼ë¡œ ?ë™ ê°±ì‹  (?êµ¬ ?°ë™)
  // ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
  const GCAL_REDIRECT_URI = window.location.origin + "/";
  const sheetToUserLabel = function(sheet) {
    return sheet === "director" ? "?´ì‚¬?? : "?‘í˜¸";
  };

  // [1] êµ¬ê? OAuth ?™ì˜ ?”ë©´?¼ë¡œ ?´ë™ (?´ë‹¹ ìº˜ë¦°?”ì˜ ì£¼ì¸??ë¡œê·¸??
  const connectGoogle = function() {
    var userLabel = sheetToUserLabel(calSheet);
    var scope = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email";
    // state??user_label ?¬í•¨?œì¼œ ì½œë°± ???´ë–¤ ìº˜ë¦°???°ë™?¸ì? ?ë³„
    var state = encodeURIComponent(JSON.stringify({ user_label: userLabel, sheet: calSheet }));
    var authUrl = "https://accounts.google.com/o/oauth2/v2/auth"
      + "?client_id=" + GOOGLE_CLIENT_ID
      + "&redirect_uri=" + encodeURIComponent(GCAL_REDIRECT_URI)
      + "&response_type=code"
      + "&scope=" + encodeURIComponent(scope)
      + "&access_type=offline"
      + "&prompt=consent"
      + "&include_granted_scopes=true"
      + "&state=" + state;
    window.location.href = authUrl;
  };

  // [2] DB?ì„œ ? í° ê°€?¸ì˜¤ê¸?+ ë§Œë£Œ???ë™ ê°±ì‹  (Edge Function ?¸ì¶œ)
  var getValidAccessToken = async function(userLabel) {
    try {
      var refreshUrl = SUPABASE_URL + "/functions/v1/google-oauth-refresh";
      var res = await fetch(refreshUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": "Bearer " + SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ user_label: userLabel }),
      });
      var data = await res.json();
      if (!res.ok) {
        return { ok: false, needsConnection: data.needsConnection || false, error: data.error };
      }
      return { ok: true, access_token: data.access_token, google_email: data.google_email };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  };

  // [3] êµ¬ê? ìº˜ë¦°?”ì—???¼ì • ê°€?¸ì˜¤ê¸?  var fetchGoogleEventsForSheet = async function(sheet) {
    var userLabel = sheetToUserLabel(sheet);
    var tokenResult = await getValidAccessToken(userLabel);
    if (!tokenResult.ok) {
      setGConnected(false);
      setGToken("");
      setGoogleEvents([]);
      return;
    }
    setGConnected(true);
    setGToken(tokenResult.access_token);

    var startDate = new Date(year, month, 1).toISOString();
    var endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    try {
      var r = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events"
        + "?timeMin=" + encodeURIComponent(startDate)
        + "&timeMax=" + encodeURIComponent(endDate)
        + "&singleEvents=true&orderBy=startTime&maxResults=250",
        { headers: { Authorization: "Bearer " + tokenResult.access_token } }
      );
      var data = await r.json();
      if (data.items) {
        var evs = data.items.map(function(item) {
          var dateStr = item.start.date || (item.start.dateTime ? item.start.dateTime.slice(0, 10) : "");
          var timeStr = item.start.dateTime ? new Date(item.start.dateTime).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "";
          return {
            title: item.summary || "",
            date: dateStr,
            time: timeStr,
            color: item.colorId || "9",
            googleEventId: item.id,
            memo: item.description || "",
          };
        });
        setGoogleEvents(evs);
      } else {
        setGoogleEvents([]);
      }
    } catch (err) {
      setGoogleEvents([]);
    }
  };

  // [4] OAuth ì½œë°± ì²˜ë¦¬: URL???code=... ë¥?ë°›ì•„??Edge Function?¼ë¡œ êµí™˜
  useEffect(function() {
    var urlParams = new URLSearchParams(window.location.search);
    var code = urlParams.get("code");
    var stateParam = urlParams.get("state");
    if (code && stateParam) {
      var stateData = null;
      try { stateData = JSON.parse(decodeURIComponent(stateParam)); } catch (e) {}
      if (!stateData || !stateData.user_label) {
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }
      // Edge Function??code ë³´ë‚´??? í° êµí™˜ + DB ?€??      var exchangeUrl = SUPABASE_URL + "/functions/v1/smart-handler";
      fetch(exchangeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": "Bearer " + SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          code: code,
          user_label: stateData.user_label,
          redirect_uri: GCAL_REDIRECT_URI,
        }),
      })
      .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
      .then(function(result) {
        if (result.ok) {
          alert("??" + stateData.user_label + " ìº˜ë¦°?”ê? ?êµ¬ ?°ë™?˜ì—ˆ?µë‹ˆ??\n(" + (result.data.google_email || "") + ")");
          if (stateData.sheet) setCalSheet(stateData.sheet);
        } else {
          alert("???°ë™ ?¤íŒ¨: " + (result.data.error || "?????†ëŠ” ?¤ë¥˜"));
        }
        // URL ?•ë¦¬ ??ìº˜ë¦°??ë¡œë“œ
        window.history.replaceState(null, "", window.location.pathname);
        fetchGoogleEventsForSheet(stateData.sheet || calSheet);
      })
      .catch(function(err) {
        alert("???°ë™ ?”ì²­ ?¤íŒ¨: " + err.message);
        window.history.replaceState(null, "", window.location.pathname);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // [5] ??calSheet) ?ëŠ” ??year/month) ë³€ê²????´ë‹¹ ìº˜ë¦°???¼ì • ?¤ì‹œ ë¡œë“œ
  useEffect(function() {
    fetchGoogleEventsForSheet(calSheet);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calSheet, year, month]);

  const selectedDateStr = selectedDate
    ? `${year}-${String(month+1).padStart(2,"0")}-${String(selectedDate).padStart(2,"0")}`
    : null;
  const selectedCrmEvents = selectedDateStr ? (crmEventsByDate[selectedDateStr] || []) : [];
  const selectedGoogleEvents = selectedDateStr
    ? googleEvents.filter(e => e.date === selectedDateStr)
    : [];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>ìº˜ë¦°??/h1>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>?°ë½ ?ˆì • Â· ?”ë¡œ??ê´€ë¦?/p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!gConnected ? (
            <button onClick={connectGoogle}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#fff", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              ?“… êµ¬ê? ìº˜ë¦°???°ë™
            </button>
          ) : (
            <span style={{ fontSize: 12, color: "#15803D", padding: "8px 12px", background: "#F0FDF4", borderRadius: 8, border: "1px solid #86EFAC" }}>??êµ¬ê? ?°ë™??/span>
          )}
        </div>
      </div>

      {/* ??*/}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[
          { id: "calendar", label: "?“… ?¼ì • ìº˜ë¦°?? },
          { id: "followup", label: `?”” ?”ë¡œ???„ìš” ${followupList.length > 0 ? `(${followupList.length})` : ""}` },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: activeTab === t.id ? 700 : 400, background: activeTab === t.id ? "#1A1917" : "#fff", color: activeTab === t.id ? "#fff" : "#666", border: activeTab === t.id ? "none" : "1px solid #E8E5E0" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ìº˜ë¦°???œíŠ¸ ?„í™˜ + ?¼ì •ì¶”ê? */}
      {activeTab === "calendar" && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={() => setCalSheet("yangho")}
              style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: calSheet === "yangho" ? 700 : 400, background: calSheet === "yangho" ? "#4338CA" : "#fff", color: calSheet === "yangho" ? "#fff" : "#666", border: calSheet === "yangho" ? "none" : "1px solid #E8E5E0", cursor: "pointer" }}>
              ê¹€?‘í˜¸ ìº˜ë¦°??            </button>
            <button onClick={() => setCalSheet("director")}
              style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: calSheet === "director" ? 700 : 400, background: calSheet === "director" ? "#7C3AED" : "#fff", color: calSheet === "director" ? "#fff" : "#666", border: calSheet === "director" ? "none" : "1px solid #E8E5E0", cursor: "pointer" }}>
              ?´ì‚¬??ìº˜ë¦°??            </button>
            {/* ?°ë™ ?íƒœ ?œì‹œ */}
            <span style={{ marginLeft: 8, padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: gConnected ? "#DCFCE7" : "#FEE2E2", color: gConnected ? "#166534" : "#991B1B" }}>
              {gConnected ? "??êµ¬ê? ?°ë™?? : "??ë¯¸ì—°??}
            </span>
            {/* ë¯¸ì—°?????°ê²° ë²„íŠ¼ ?¸ì¶œ */}
            {!gConnected && (
              <button onClick={connectGoogle}
                style={{ padding: "6px 12px", background: "#4285F4", color: "#fff", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                title={`${sheetToUserLabel(calSheet)}??êµ¬ê? ê³„ì •?¼ë¡œ ë¡œê·¸?¸í•˜??ìº˜ë¦°???êµ¬ ?°ë™`}>
                ?”— {sheetToUserLabel(calSheet)} êµ¬ê? ê³„ì • ?°ë™
              </button>
            )}
            {/* ?°ë™??ê²½ìš° ?¬ì—°???µì…˜ (ë§Œì•½ ?¤ë¥¸ ê³„ì •?¼ë¡œ ë°”ê¾¸ê³??¶ì„ ?? */}
            {gConnected && (
              <button onClick={connectGoogle}
                style={{ padding: "6px 10px", background: "transparent", color: "#666", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: "pointer" }}
                title="?¤ë¥¸ êµ¬ê? ê³„ì •?¼ë¡œ ?¤ì‹œ ?°ë™">
                ?¬ì—°??              </button>
            )}
          </div>
          <button onClick={() => { setShowAddEvent(true); setNewEvent({ title: "", date: selectedDate ? `${year}-${String(month+1).padStart(2,"0")}-${String(selectedDate).padStart(2,"0")}` : "", time: "", memo: "", sheet: calSheet }); }}
            style={{ padding: "7px 14px", background: "#1A1917", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            + ?¼ì • ì¶”ê?
          </button>
        </div>
      )}

      {activeTab === "calendar" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start" }}>
          {/* ìº˜ë¦°??ë³¸ì²´ */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E8E5E0", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #E8E5E0" }}>
              <button onClick={prevMonth} style={{ background: "none", border: "1px solid #E8E5E0", borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <Icon name="chevronL" size={16} color="#555" />
              </button>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{year}??{MONTH_NAMES[month]}</div>
              <button onClick={nextMonth} style={{ background: "none", border: "1px solid #E8E5E0", borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <Icon name="chevronR" size={16} color="#555" />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #E8E5E0" }}>
              {DAY_NAMES.map((d, i) => (
                <div key={d} style={{ textAlign: "center", padding: "10px 0", fontSize: 12, fontWeight: 600, color: i===0 ? "#DC2626" : i===6 ? "#4338CA" : "#888" }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
              {cells.map((d, i) => {
                if (!d) return <div key={`e-${i}`} style={{ minHeight: 80, borderBottom: "1px solid #F0EDE8", borderRight: "1px solid #F0EDE8" }} />;
                const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                const crmEvs = crmEventsByDate[dateStr] || [];
                const gEvs = googleEvents.filter(e => e.date === dateStr);
                const cEvs = customEvents.filter(e => e.date === dateStr && e.sheet === calSheet);
                const isToday = dateStr === todayStr;
                const isSelected = d === selectedDate;
                const dow = (firstDay + d - 1) % 7;
                const hasFollowup = companies.some(c => FOLLOWUP_STAGES.includes(c.stage) && c.next_contact === dateStr);
                return (
                  <div key={d} onClick={() => setSelectedDate(d)}
                    style={{ minHeight: 80, borderBottom: "1px solid #F0EDE8", borderRight: "1px solid #F0EDE8", padding: "5px", cursor: "pointer", background: isSelected ? "#EEF2FF" : "transparent" }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#F7F6F3"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: isToday ? "#1A1917" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? "#fff" : dow===0 ? "#DC2626" : dow===6 ? "#4338CA" : "#333" }}>{d}</span>
                      </div>
                      {hasFollowup && <span style={{ fontSize: 8, background: "#FEF3C7", color: "#B45309", borderRadius: 3, padding: "1px 3px", fontWeight: 700 }}>?”ë¡œ??/span>}
                    </div>
                    {crmEvs.slice(0, 2).map((ev, ei) => (
                      <div key={ei} style={{ fontSize: 9, background: "#4338CA", color: "#fff", borderRadius: 3, padding: "1px 4px", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.name}</div>
                    ))}
                    {gEvs.slice(0, 1).map((ev, ei) => {
                      var gcol = getColorById(ev.color || "9");
                      return (
                        <div key={ei} style={{ fontSize: 9, background: gcol.bg, color: "#fff", borderRadius: 3, padding: "1px 4px", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>?“… {ev.title}</div>
                      );
                    })}
                    {cEvs.slice(0, 2).map((ev, ei) => {
                      var col = getColorById(ev.color || "blue");
                      return (
                        <div key={`c-${ei}`} style={{ fontSize: 9, background: col.bg, color: "#fff", borderRadius: 3, padding: "1px 4px", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</div>
                      );
                    })}
                    {(crmEvs.length + gEvs.length + cEvs.length) > 3 && <div style={{ fontSize: 9, color: "#888" }}>+{crmEvs.length + gEvs.length + cEvs.length - 3}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ?°ì¸¡ ?¨ë„ */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E8E5E0", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #E8E5E0", background: "#F7F6F3" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedDate ? `${month+1}??${selectedDate}???¼ì •` : "? ì§œë¥?? íƒ?˜ì„¸??}</div>
              {selectedDate && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{selectedCrmEvents.length + selectedGoogleEvents.length}ê±?/div>}
            </div>
            <div style={{ padding: "12px", maxHeight: 500, overflowY: "auto" }}>
              {!selectedDate && <div style={{ textAlign: "center", padding: "40px 0", color: "#CCC", fontSize: 13 }}>?“…<br/>? ì§œë¥??´ë¦­?˜ì„¸??/div>}
              {selectedGoogleEvents.map((ev, i) => {
                var gcol = getColorById(ev.color || "9");
                return (
                  <div key={i} style={{ padding: "10px 12px", borderRadius: 10, borderLeft: "4px solid " + gcol.bg, border: "1px solid " + gcol.light, borderLeftWidth: 4, marginBottom: 8, background: gcol.light }}>
                    <div style={{ fontSize: 11, color: gcol.bg, fontWeight: 700, marginBottom: 2 }}>?“… êµ¬ê? ìº˜ë¦°??/div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{ev.title}</div>
                    {ev.time && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{ev.time}</div>}
                    {ev.memo && <div style={{ fontSize: 12, color: "#555", marginTop: 4, lineHeight: 1.5 }}>{ev.memo}</div>}
                    {/* êµ¬ê? ?¼ì • ?‰ìƒ ë³€ê²?*/}
                    <div style={{ display: "flex", gap: 4, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, color: "#888" }}>?‰ìƒ:</span>
                      {EVENT_COLORS.map(function(c) {
                        var sel = (ev.color || "9") === c.id;
                        return (
                          <button key={c.id} onClick={function() { updateGoogleEventColor(ev.googleEventId, c.id); }}
                            title={c.label}
                            style={{ width: 16, height: 16, borderRadius: "50%", background: c.bg, border: sel ? "2px solid #1A1917" : "1px solid #fff", boxShadow: "0 0 0 1px #E8E5E0", cursor: "pointer", padding: 0 }} />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {selectedCrmEvents.map((ev, i) => {
                const sc = STAGE_COLORS[ev.stage] || {};
                const isFollowup = FOLLOWUP_STAGES.includes(ev.stage);
                return (
                  <div key={i} onClick={() => onSelectCompany(ev)}
                    style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${isFollowup ? "#FED7AA" : "#E8E5E0"}`, marginBottom: 8, cursor: "pointer", background: isFollowup ? "#FFF7ED" : "#fff" }}
                    onMouseEnter={e => e.currentTarget.style.background = isFollowup ? "#FEF3C7" : "#F7F6F3"}
                    onMouseLeave={e => e.currentTarget.style.background = isFollowup ? "#FFF7ED" : "#fff"}>
                    {isFollowup && <div style={{ fontSize: 10, color: "#B45309", fontWeight: 700, marginBottom: 4 }}>?”” ?”ë¡œ???„ìš”</div>}
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{ev.name}</div>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>{ev.assignee} Â· {ev.representative} ?€??/div>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontWeight: 600 }}>{ev.stage}</span>
                  </div>
                );
              })}
              {selectedDate && selectedCrmEvents.length === 0 && selectedGoogleEvents.length === 0 && customEvents.filter(e => e.date === selectedDateStr && e.sheet === calSheet).length === 0 && (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#CCC", fontSize: 13 }}>?????¼ì •???†ì–´??/div>
              )}
              {/* ì»¤ìŠ¤?€ ?¼ì • */}
              {selectedDate && customEvents.filter(e => e.date === selectedDateStr && e.sheet === calSheet).map(function(ev) {
                var col = getColorById(ev.color || "blue");
                return (
                  <div key={ev.id} style={{ padding: "10px 12px", borderRadius: 10, borderLeft: "4px solid " + col.bg, border: "1px solid " + col.light, borderLeftWidth: 4, marginBottom: 8, background: col.light }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{ev.title}</div>
                        {ev.time && <div style={{ fontSize: 11, color: "#888" }}>{ev.time}</div>}
                        {ev.memo && <div style={{ fontSize: 12, color: "#555", marginTop: 4, lineHeight: 1.5 }}>{ev.memo}</div>}
                        <div style={{ fontSize: 10, color: "#AAA", marginTop: 4 }}>{ev.created_by || "-"}</div>
                        {/* ?‰ìƒ ë³€ê²?*/}
                        <div style={{ display: "flex", gap: 4, marginTop: 8, alignItems: "center" }}>
                          <span style={{ fontSize: 10, color: "#888" }}>?‰ìƒ:</span>
                          {EVENT_COLORS.map(function(c) {
                            var sel = (ev.color || "blue") === c.id;
                            return (
                              <button key={c.id} onClick={function() { updateEventColor(ev.id, c.id); }}
                                title={c.label}
                                style={{ width: 16, height: 16, borderRadius: "50%", background: c.bg, border: sel ? "2px solid #1A1917" : "1px solid #fff", boxShadow: "0 0 0 1px #E8E5E0", cursor: "pointer", padding: 0 }} />
                            );
                          })}
                        </div>
                      </div>
                      <button onClick={function() { deleteEvent(ev.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                        <Icon name="x" size={14} color="#CCC" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ?”ë¡œ????*/}
      {activeTab === "followup" && (
        <div>
          <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#92400E", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18 }}>?””</span>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 3 }}>?”ë¡œ?…ì´ ?„ìš”???…ì²´?ˆìš”</div>
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>ê¸°ê? ë°©ë¬¸/?¤íƒœì¡°ì‚¬ ?´í›„ ?¨ê³„???…ì²´?¤ì´?ìš”. ?€?œìê°€ ê¸°ê??????€?‘í–ˆ?”ì?, ì§„í–‰ ?í™©???´ë–¤ì§€ ?•ì¸?´ì£¼?¸ìš”!</div>
            </div>
          </div>
          {followupList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#CCC", fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>?‰</div>
              ?”ë¡œ?…ì´ ?„ìš”???…ì²´ê°€ ?†ì–´??
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
              {followupList.map(function(c) {
                const sc = STAGE_COLORS[c.stage] || {};
                const isVisit = c.stage === "ê¸°ê?? ì²­?„ë£Œ/ë°©ë¬¸?„ë£Œ";
                const isInspect = c.stage === "?¬ì‚¬ì¤??¤íƒœì¡°ì‚¬?€ê¸? || c.stage === "?¤íƒœì¡°ì‚¬?„ë£Œ/?½ì •?„ë£Œ";
                return (
                  <div key={c.id} onClick={() => onSelectCompany(c)}
                    style={{ background: "#fff", borderRadius: 12, border: "1px solid #FED7AA", padding: "16px", cursor: "pointer", transition: "box-shadow 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 3 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{c.representative} ?€??Â· {c.assignee}</div>
                      </div>
                      <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 99, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{c.stage}</span>
                    </div>
                    <div style={{ background: "#FFF7ED", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#B45309", marginBottom: 4 }}>
                        {isVisit ? "?¢ ê¸°ê? ë°©ë¬¸ ???”ë¡œ?? : isInspect ? "?” ?¤íƒœì¡°ì‚¬ ???”ë¡œ?? : "?“‹ ì§„í–‰ ?í™© ?•ì¸"}
                      </div>
                      <div style={{ fontSize: 12, color: "#92400E", lineHeight: 1.6 }}>
                        {isVisit ? "?€?œìê°€ ê¸°ê? ë°©ë¬¸ ???´ë• ?”ì? ?•ì¸?´ì£¼?¸ìš”. ì¶”ê? ?œë¥˜ ?”ì²­???ˆì—ˆ?˜ìš”?" :
                         isInspect ? "?¤íƒœì¡°ì‚¬ ê²°ê³¼ê°€ ?´ë–»ê²??ëŠ”ì§€ ?•ì¸?´ì£¼?¸ìš”. ?¬ì‚¬ê´€???´ë–¤ ?¼ë“œë°±ì„ ì¤¬ë‚˜??" :
                         "?„ì¬ ì§„í–‰ ?í™©???€?œì?ê²Œ ?•ì¸?´ì£¼?¸ìš”."}
                      </div>
                    </div>
                    {c.issue && (
                      <div style={{ fontSize: 11, color: "#666", background: "#F7F6F3", borderRadius: 6, padding: "7px 10px", marginBottom: 8 }}>
                        ?“Œ {c.issue.slice(0, 80)}{c.issue.length > 80 ? "..." : ""}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#AAA" }}>?°ë½ ?ˆì •: {c.next_contact || "-"}</span>
                      <span style={{ fontSize: 11, color: "#4338CA", fontWeight: 600 }}>?ì„¸ë³´ê¸° ??/span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ?¼ì • ì¶”ê? ëª¨ë‹¬ */}
      {showAddEvent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowAddEvent(false)}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "22px", width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>?“… ?¼ì • ì¶”ê?</div>
              <button onClick={() => setShowAddEvent(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Icon name="x" size={18} color="#888" />
              </button>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>ìº˜ë¦°??/div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setNewEvent(function(p) { return Object.assign({}, p, { sheet: "yangho" }); })}
                  style={{ flex: 1, padding: "8px", borderRadius: 7, fontSize: 12, fontWeight: 600, background: newEvent.sheet === "yangho" ? "#4338CA" : "#fff", color: newEvent.sheet === "yangho" ? "#fff" : "#666", border: newEvent.sheet === "yangho" ? "none" : "1px solid #E8E5E0", cursor: "pointer" }}>
                  ê¹€?‘í˜¸
                </button>
                <button onClick={() => setNewEvent(function(p) { return Object.assign({}, p, { sheet: "director" }); })}
                  style={{ flex: 1, padding: "8px", borderRadius: 7, fontSize: 12, fontWeight: 600, background: newEvent.sheet === "director" ? "#7C3AED" : "#fff", color: newEvent.sheet === "director" ? "#fff" : "#666", border: newEvent.sheet === "director" ? "none" : "1px solid #E8E5E0", cursor: "pointer" }}>
                  ?´ì‚¬??                </button>
              </div>
            </div>
            <input value={newEvent.title} onChange={function(e) { var v = e.target.value; setNewEvent(function(p) { return Object.assign({}, p, { title: v }); }); }}
              placeholder="?¼ì • ?œëª© *" style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none", marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input type="date" value={newEvent.date} onChange={function(e) { var v = e.target.value; setNewEvent(function(p) { return Object.assign({}, p, { date: v }); }); }}
                style={{ flex: 1, padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13 }} />
              <input type="time" value={newEvent.time} onChange={function(e) { var v = e.target.value; setNewEvent(function(p) { return Object.assign({}, p, { time: v }); }); }}
                style={{ flex: 1, padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13 }} />
            </div>
            <textarea value={newEvent.memo} onChange={function(e) { var v = e.target.value; setNewEvent(function(p) { return Object.assign({}, p, { memo: v }); }); }}
              placeholder="ë©”ëª¨ (? íƒ)" rows={3}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, resize: "none", boxSizing: "border-box", outline: "none", marginBottom: 12 }} />
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>?‰ìƒ</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {EVENT_COLORS.map(function(c) {
                  var selected = newEvent.color === c.id;
                  return (
                    <button key={c.id} onClick={function() { setNewEvent(function(p) { return Object.assign({}, p, { color: c.id }); }); }}
                      title={c.label}
                      style={{ width: 28, height: 28, borderRadius: "50%", background: c.bg, border: selected ? "3px solid #1A1917" : "2px solid #fff", boxShadow: "0 0 0 1px #E8E5E0", cursor: "pointer", padding: 0 }} />
                  );
                })}
              </div>
            </div>
            <button onClick={saveEvent}
              style={{ width: "100%", padding: "11px", background: "#1A1917", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              ?€??            </button>
          </div>
        </div>
      )}
    </div>
  );
}
const DRIVE_FOLDER_ID = "15noP_C-r-ZTo56xGbjUWFv2gAKDzXMJa";
const DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/15noP_C-r-ZTo56xGbjUWFv2gAKDzXMJa";

const FILE_ICONS = {
  pdf:  { icon: "?“„", color: "#DC2626", bg: "#FEF2F2" },
  xlsx: { icon: "?“Š", color: "#15803D", bg: "#F0FDF4" },
  xls:  { icon: "?“Š", color: "#15803D", bg: "#F0FDF4" },
  hwp:  { icon: "?“", color: "#1D4ED8", bg: "#EFF6FF" },
  hwpx: { icon: "?“", color: "#1D4ED8", bg: "#EFF6FF" },
  docx: { icon: "?“", color: "#1D4ED8", bg: "#EFF6FF" },
  doc:  { icon: "?“", color: "#1D4ED8", bg: "#EFF6FF" },
  pptx: { icon: "?“‘", color: "#EA580C", bg: "#FFF7ED" },
  ppt:  { icon: "?“‘", color: "#EA580C", bg: "#FFF7ED" },
  png:  { icon: "?–¼ï¸?, color: "#7C3AED", bg: "#F5F3FF" },
  jpg:  { icon: "?–¼ï¸?, color: "#7C3AED", bg: "#F5F3FF" },
  jpeg: { icon: "?–¼ï¸?, color: "#7C3AED", bg: "#F5F3FF" },
  mp3:  { icon: "?µ", color: "#B45309", bg: "#FFFBEB" },
  m4a:  { icon: "?µ", color: "#B45309", bg: "#FFFBEB" },
  txt:  { icon: "?“ƒ", color: "#555",    bg: "#F7F6F3" },
  zip:  { icon: "?—œï¸?, color: "#555",    bg: "#F7F6F3" },
};

function getFileIcon(name) {
  var ext = (name || "").split(".").pop().toLowerCase();
  return FILE_ICONS[ext] || { icon: "?“", color: "#888", bg: "#F7F6F3" };
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + "B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + "KB";
  return (bytes / (1024 * 1024)).toFixed(1) + "MB";
}

function ManualView() {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState(DRIVE_FOLDER_ID);
  const [breadcrumb, setBreadcrumb] = useState([{ id: DRIVE_FOLDER_ID, name: "?ë£Œ?? }]);
  const [search, setSearch] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchFiles = useCallback(async (folderId) => {
    setLoading(true);
    setError(null);
    try {
      // Google Drive API - ê³µê°œ ?´ë” ?Œì¼ ëª©ë¡ ì¡°íšŒ
      const apiKey = "AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFmBBY"; // ê³µê°œ??API ???„ìš”
      const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink)&orderBy=name&key=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("API ?¤ë¥˜");
      const data = await res.json();
      const items = data.files || [];
      const folderMime = "application/vnd.google-apps.folder";
      setFolders(items.filter(f => f.mimeType === folderMime));
      setFiles(items.filter(f => f.mimeType !== folderMime));
      setLastRefresh(new Date());
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFiles(currentFolderId);
  }, [currentFolderId, fetchFiles]);

  const goToFolder = (folder) => {
    setCurrentFolderId(folder.id);
    setBreadcrumb(prev => [...prev, { id: folder.id, name: folder.name }]);
    setSearch("");
  };

  const goToBreadcrumb = (idx) => {
    const crumb = breadcrumb[idx];
    setBreadcrumb(prev => prev.slice(0, idx + 1));
    setCurrentFolderId(crumb.id);
    setSearch("");
  };

  const filteredFolders = folders.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));
  const filteredFiles = files.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));

  const fmtDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  return (
    <div>
      {/* ?¤ë” */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>?ë£Œ??/h1>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>Google Drive?€ ?¤ì‹œê°??°ë™ Â· ?…ë¡œ???? œ??Drive?ì„œ</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href={DRIVE_FOLDER_URL} target="_blank" rel="noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#4338CA", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>
            ?“‚ Drive?ì„œ ?Œì¼ ê´€ë¦?          </a>
          <button onClick={() => fetchFiles(currentFolderId)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#555", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
            <Icon name="refresh" size={13} color="#555" /> ?ˆë¡œê³ ì¹¨
          </button>
        </div>
      </div>

      {/* ?ˆë‚´ ë°°ë„ˆ */}
      <div style={{ background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#4338CA", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>?’¡</span>
        <span><strong>?Œì¼ ì¶”ê?/?? œ ë°©ë²•:</strong> ?¤ë¥¸ìª???"Drive?ì„œ ?Œì¼ ê´€ë¦? ë²„íŠ¼ ?´ë¦­ ??Google Drive?ì„œ ?…ë¡œ?œí•˜ê±°ë‚˜ ?? œ ??"?ˆë¡œê³ ì¹¨" ë²„íŠ¼?¼ë¡œ CRM??ë°˜ì˜</span>
      </div>

      {/* ë¸Œë ˆ?œí¬??*/}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {breadcrumb.map((crumb, idx) => (
          <span key={crumb.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {idx > 0 && <span style={{ color: "#CCC", fontSize: 13 }}>??/span>}
            <span
              onClick={() => goToBreadcrumb(idx)}
              style={{ fontSize: 13, fontWeight: idx === breadcrumb.length - 1 ? 700 : 400, color: idx === breadcrumb.length - 1 ? "#1A1917" : "#4338CA", cursor: idx === breadcrumb.length - 1 ? "default" : "pointer", textDecoration: idx === breadcrumb.length - 1 ? "none" : "underline" }}>
              {crumb.name}
            </span>
          </span>
        ))}
        {lastRefresh && (
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#AAA" }}>
            ë§ˆì?ë§??…ë°?´íŠ¸: {lastRefresh.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* ê²€??*/}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><Icon name="search" size={15} color="#AAA" /></div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="?Œì¼ëª?ê²€??.."
          style={{ width: "100%", padding: "10px 14px 10px 36px", border: "1px solid #E8E5E0", borderRadius: 9, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
      </div>

      {/* ë¡œë”© */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh", flexDirection: "column", gap: 14 }}>
          <div style={{ width: 32, height: 32, border: "3px solid #E8E5E0", borderTopColor: "#4338CA", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span style={{ color: "#888", fontSize: 13 }}>?Œì¼ ëª©ë¡ ë¶ˆëŸ¬?¤ëŠ” ì¤?..</span>
        </div>
      )}

      {/* ?¤ë¥˜ - API ???†ëŠ” ê²½ìš° */}
      {!loading && error && (
        <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 12, padding: "28px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>?”—</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#92400E", marginBottom: 8 }}>Google Drive ì§ì ‘ ?‘ì†</div>
          <p style={{ fontSize: 13, color: "#B45309", marginBottom: 20, lineHeight: 1.7 }}>
            Drive API ?°ê²°???„í•œ ì¶”ê? ?¤ì •???„ìš”?´ìš”.<br/>
            ?„ë˜ ë²„íŠ¼?¼ë¡œ Drive??ì§ì ‘ ?‘ì†?´ì„œ ?Œì¼??ê´€ë¦¬í•˜?¸ìš”.
          </p>
          {/* ?´ë” ë°”ë¡œê°€ê¸?ë²„íŠ¼??*/}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 20, textAlign: "left" }}>
            {[
              { name: "?“ ê¸°ìˆ ë³´ì¦ê¸°ê¸ˆ", path: "ê¸°ìˆ ë³´ì¦ê¸°ê¸ˆ" },
              { name: "?“ ë³´ì¦ê¸°ê? ?¹ìŒ ?Œì¼", path: "ë³´ì¦ê¸°ê? ?¹ìŒ ?Œì¼" },
              { name: "?“ ë³´ì¦?¬ë‹¨ ë©”ë‰´??ë°??ë£Œ", path: "ë³´ì¦?¬ë‹¨ ë©”ë‰´??ë°??ë£Œ" },
              { name: "?“ ?Œìƒê³µì¸ ê³µë‹¨", path: "?Œìƒê³µì¸ ê³µë‹¨" },
              { name: "?“ ?¤í¬ë¦½íŠ¸ ê°€?´ë“œ", path: "?¤í¬ë¦½íŠ¸ ê°€?´ë“œ" },
              { name: "?“ ? ìš©ë³´ì¦ê¸°ê¸ˆ", path: "? ìš©ë³´ì¦ê¸°ê¸ˆ" },
              { name: "?“ ì¤‘ì§„ê³?, path: "ì¤‘ì§„ê³? },
              { name: "?“ ì¶”ê??…ì¢… ?œì•ˆ??, path: "ì¶”ê??…ì¢… ?œì•ˆ?? },
            ].map(folder => (
              <a key={folder.name} href={DRIVE_FOLDER_URL} target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#fff", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, color: "#333", textDecoration: "none", fontWeight: 500 }}>
                {folder.name}
              </a>
            ))}
          </div>
          <a href={DRIVE_FOLDER_URL} target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#4338CA", color: "#fff", borderRadius: 9, padding: "12px 24px", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
            ?“‚ Google Drive ?ë£Œ???´ê¸°
          </a>
        </div>
      )}

      {/* ?Œì¼/?´ë” ëª©ë¡ */}
      {!loading && !error && (
        <>
          {/* ?´ë” ëª©ë¡ */}
          {filteredFolders.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#888", letterSpacing: "0.04em", marginBottom: 10 }}>?“ ?´ë”</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {filteredFolders.map(folder => (
                  <div key={folder.id} onClick={() => goToFolder(folder)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 15px", background: "#fff", border: "1px solid #E8E5E0", borderRadius: 10, cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F0F0EC"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                    <span style={{ fontSize: 22 }}>?“</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{folder.name}</div>
                      <div style={{ fontSize: 11, color: "#AAA" }}>{fmtDate(folder.modifiedTime)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ?Œì¼ ëª©ë¡ */}
          {filteredFiles.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#888", letterSpacing: "0.04em", marginBottom: 10 }}>
                ?“„ ?Œì¼ <span style={{ fontWeight: 400 }}>({filteredFiles.length}ê°?</span>
              </div>
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E5E0", overflow: "hidden" }}>
                {filteredFiles.map((file, i) => {
                  const fi = getFileIcon(file.name);
                  return (
                    <div key={file.id}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < filteredFiles.length - 1 ? "1px solid #F0EDE8" : "none", cursor: "pointer", transition: "background 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F7F6F3"}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                      onClick={() => window.open(file.webViewLink, "_blank")}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: fi.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                        {fi.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#1A1917" }}>{file.name}</div>
                        <div style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>
                          {formatFileSize(parseInt(file.size))} {file.size && "Â·"} {fmtDate(file.modifiedTime)}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <a href={file.webViewLink} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                          style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "#EEF2FF", color: "#4338CA", textDecoration: "none", fontWeight: 600 }}>
                          ?´ê¸°
                        </a>
                        {file.webContentLink && (
                          <a href={file.webContentLink} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                            style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "#F0FDF4", color: "#15803D", textDecoration: "none", fontWeight: 600 }}>
                            ?¤ìš´ë¡œë“œ
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredFolders.length === 0 && filteredFiles.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#AAA", fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>?“­</div>
              {search ? "ê²€??ê²°ê³¼ê°€ ?†ì–´?? : "???´ë”ê°€ ë¹„ì–´ ?ˆì–´??}
            </div>
          )}
        </>
      )}
    </div>
  );
}
const BOJUNG_AGENCIES = ["? ìš©ë³´ì¦ê¸°ê¸ˆ", "ê¸°ìˆ ë³´ì¦ê¸°ê¸ˆ"];

const JUNGINGONG_REGIONS = [
  "?œìš¸ì§€??³¸ë¶€", "?œìš¸?™ë?ì§€ë¶€", "?œìš¸?œë?ì§€ë¶€", "?œìš¸?¨ë?ì§€ë¶€",
  "?¸ì²œì§€??³¸ë¶€", "?¸ì²œ?œë?ì§€ë¶€",
  "ê²½ê¸°ì§€??³¸ë¶€", "ê²½ê¸°?™ë?ì§€ë¶€", "ê²½ê¸°?œë?ì§€ë¶€", "ê²½ê¸°?¨ë?ì§€ë¶€", "ê²½ê¸°ë¶ë?ì§€ë¶€",
  "ê°•ì›ì§€??³¸ë¶€", "ê°•ì›?ë™ì§€ë¶€",
  "?€?„ì???³¸ë¶€", "?¸ì¢…ì§€??³¸ë¶€", "ì¶©ë‚¨ì§€??³¸ë¶€", "ì¶©ë¶ì§€??³¸ë¶€", "ì¶©ë¶ë¶ë?ì§€ë¶€",
  "?„ë¶ì§€??³¸ë¶€", "?„ë¶?œë?ì§€ë¶€", "ê´‘ì£¼ì§€??³¸ë¶€", "?„ë‚¨ì§€??³¸ë¶€", "?„ë‚¨?™ë?ì§€ë¶€",
  "?€êµ¬ì???³¸ë¶€",
  "ê²½ë¶ì§€??³¸ë¶€", "ê²½ë¶?™ë?ì§€ë¶€", "ê²½ë¶?¨ë?ì§€ë¶€",
  "ë¶€?°ì???³¸ë¶€", "ë¶€?°ë™ë¶€ì§€ë¶€", "?¸ì‚°ì§€??³¸ë¶€",
  "ê²½ë‚¨ì§€??³¸ë¶€", "ê²½ë‚¨?™ë?ì§€ë¶€", "ê²½ë‚¨?œë?ì§€ë¶€",
  "?œì£¼ì§€??³¸ë¶€"
];

const STATUS_COLORS_MAP = {
  "?¹ì¸": { bg: "#ECFDF5", text: "#047857" }, "?½ì •": { bg: "#ECFDF5", text: "#047857" }, "?„ë£Œ": { bg: "#ECFDF5", text: "#047857" },
  "ìµœì¢…?œì¶œ": { bg: "#EEF2FF", text: "#4338CA" }, "?¬ì‚¬ì¤?: { bg: "#EEF2FF", text: "#4338CA" }, "?¬ì‚¬?€ê¸?: { bg: "#EEF2FF", text: "#4338CA" },
  "ì§„í–‰ ì¤?: { bg: "#EEF2FF", text: "#4338CA" }, "?°ì„ ???‰ê?": { bg: "#EEF2FF", text: "#4338CA" }, "?°ì„ ???‰ê? ?ˆë¹„": { bg: "#EEF2FF", text: "#4338CA" },
  "?„ì‹œ?€??: { bg: "#FFF7ED", text: "#C2410C" }, "ê¸°ê? ë°©ë¬¸ ??: { bg: "#FFF7ED", text: "#C2410C" }, "ê¸°ê? ë°©ë¬¸ ???€ê¸?: { bg: "#FFF7ED", text: "#C2410C" },
  "?¨ë¼??? ì²­ ???€ê¸?: { bg: "#FFF7ED", text: "#C2410C" }, "?¤íƒœ ì¡°ì‚¬ ?ˆì •": { bg: "#FFFBEB", text: "#B45309" }, "?¤íƒœ ì¡°ì‚¬ ?„ë£Œ": { bg: "#FFFBEB", text: "#B45309" },
  "ë¶€ê²?: { bg: "#FEF2F2", text: "#DC2626" }, "ë°˜ë ¤": { bg: "#FEF2F2", text: "#DC2626" }, "ì§„í–‰ë¶ˆê?": { bg: "#FEF2F2", text: "#DC2626" }, "? ì²­ì·¨ì†Œ": { bg: "#FEF2F2", text: "#DC2626" },
  "ë³´ë¥˜": { bg: "#F5F3FF", text: "#7C3AED" }, "ì¤‘ë‹¨": { bg: "#F5F3FF", text: "#7C3AED" },
  "?œì‘ ??: { bg: "#F7F6F3", text: "#888" }, "? ì²­ëª»í•¨": { bg: "#F7F6F3", text: "#888" },
};

const ALL_STATUS_OPTIONS = ["?œì‘ ??,"ì§„í–‰ ì¤?,"ê¸°ê? ë°©ë¬¸ ??,"ê¸°ê? ë°©ë¬¸ ???€ê¸?,"?¨ë¼??? ì²­ ???€ê¸?,"?„ì‹œ?€??,"ìµœì¢…?œì¶œ","?°ì„ ???‰ê? ?ˆë¹„","?°ì„ ???‰ê?","?¤íƒœ ì¡°ì‚¬ ?ˆì •","?¤íƒœ ì¡°ì‚¬ ?„ë£Œ","?¬ì‚¬?€ê¸?,"?¬ì‚¬ì¤?,"?¹ì¸","?½ì •","?„ë£Œ","ë¶€ê²?,"ë°˜ë ¤","ë³´ë¥˜","ì¤‘ë‹¨","ì§„í–‰ë¶ˆê?","? ì²­ì·¨ì†Œ","? ì²­ëª»í•¨"];

function AgencyView({ jumpToMonth, jumpToGroup }) {
  var currentYear = new Date().getFullYear();
  const [activeGroup, setActiveGroup] = useState(jumpToGroup || "?Œìƒê³µì¸?œì¥ì§„í¥ê³µë‹¨");
  const [activeMonth, setActiveMonth] = useState(jumpToMonth || new Date().getMonth() + 1);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showTrash, setShowTrash] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState("?„ì²´");
  const [showAddCase, setShowAddCase] = useState(false);
  const [newCase, setNewCase] = useState({});
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [companiesList, setCompaniesList] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);

  var fetchCases = async function() {
    setLoading(true);
    // Supabase 1000ê±?ê¸°ë³¸ limit ?°íšŒ: rangeë¡??˜ì´ì§?    var allData = [];
    var pageSize = 1000;
    var offset = 0;
    while (true) {
      var result = await supabase.from("agency_cases")
        .select("*")
        .order("created_at", { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (result.error) {
        console.error("fetchCases error:", result.error);
        break;
      }
      if (!result.data || result.data.length === 0) break;
      allData = allData.concat(result.data);
      if (result.data.length < pageSize) break;
      offset += pageSize;
      if (offset > 50000) break; // ?ˆì „?¥ì¹˜
    }
    setCases(allData);
    setLoading(false);
  };

  var fetchCompanies = async function() {
    var result = await supabase.from("companies").select("*").is("deleted_at", null);
    if (!result.error) setCompaniesList(result.data || []);
  };

  useEffect(function() { fetchCases(); fetchCompanies(); }, []);

  useEffect(function() {
    if (jumpToMonth) setActiveMonth(Number(jumpToMonth));
    if (jumpToGroup) setActiveGroup(jumpToGroup);
  }, [jumpToMonth, jumpToGroup]);

  var filtered = useMemo(function() {
    return cases.filter(function(c) {
      return c.agency_group === activeGroup
        && Number(c.month) === Number(activeMonth)
        && Number(c.year) === currentYear
        && !c.deleted_at
        && (filterAssignee === "?„ì²´" || c.assignee === filterAssignee);
    });
  }, [cases, activeGroup, activeMonth, filterAssignee, currentYear]);

  var trashedCases = useMemo(function() {
    return cases.filter(function(c) { return !!c.deleted_at; });
  }, [cases]);

  var monthsWithData = useMemo(function() {
    var s = new Set();
    cases.filter(function(c) {
      return c.agency_group === activeGroup && Number(c.year) === currentYear && !c.deleted_at;
    }).forEach(function(c) { s.add(Number(c.month)); });
    return s;
  }, [cases, activeGroup]);

  var assigneesInGroup = useMemo(function() {
    var s = new Set();
    cases.filter(function(c) {
      return c.agency_group === activeGroup && Number(c.month) === Number(activeMonth) && !c.deleted_at;
    }).forEach(function(c) { if (c.assignee) s.add(c.assignee); });
    return ["?„ì²´"].concat(Array.from(s).sort());
  }, [cases, activeGroup, activeMonth]);

  var summary = useMemo(function() {
    var approved = filtered.filter(function(c) { return ["?¹ì¸","?½ì •","?„ë£Œ"].indexOf(c.status) >= 0; }).length;
    var inProgress = filtered.filter(function(c) { return ["ì§„í–‰ ì¤?,"?¬ì‚¬ì¤?,"?¬ì‚¬?€ê¸?,"ìµœì¢…?œì¶œ","?„ì‹œ?€??,"?°ì„ ???‰ê?","ê¸°ê? ë°©ë¬¸ ??,"ê¸°ê? ë°©ë¬¸ ???€ê¸?,"?¨ë¼??? ì²­ ???€ê¸?,"?¤íƒœ ì¡°ì‚¬ ?ˆì •","?¤íƒœ ì¡°ì‚¬ ?„ë£Œ"].indexOf(c.status) >= 0; }).length;
    var rejected = filtered.filter(function(c) { return ["ë¶€ê²?,"ë°˜ë ¤","ì§„í–‰ë¶ˆê?","? ì²­ì·¨ì†Œ"].indexOf(c.status) >= 0; }).length;
    return { total: filtered.length, approved: approved, inProgress: inProgress, rejected: rejected };
  }, [filtered]);

  var activeGroupObj = AGENCY_GROUPS.find(function(g) { return g.id === activeGroup; });
  var groupColor = activeGroupObj ? activeGroupObj.color : "#4338CA";

  var onBusinessNameChange = function(value) {
    setNewCase(function(p) { return Object.assign({}, p, { business_name: value }); });
    if (!value || value.length < 1) { setCompanySuggestions([]); return; }
    var matches = companiesList.filter(function(co) {
      return (co.name || "").toLowerCase().indexOf(value.toLowerCase()) >= 0;
    }).slice(0, 8);
    setCompanySuggestions(matches);
  };

  var selectCompany = function(co) {
    setNewCase(function(p) {
      return Object.assign({}, p, {
        business_name: co.name || "",
        representative: co.representative || "",
        business_number: co.business_number || "",
        region: co.region || "",
        assignee: co.assignee || "",
        notes: co.issue || "",
      });
    });
    setCompanySuggestions([]);
  };

  var openAddCase = function() {
    setNewCase({
      agency_group: activeGroup, year: currentYear, month: Number(activeMonth),
      business_name: "", representative: "", business_number: "",
      assignee: "", status: "?œì‘ ??, request_amount: "", region: "", notes: "",
    });
    setCompanySuggestions([]);
    setShowAddCase(true);
  };

  var saveNewCase = async function() {
    if (!newCase.business_name) { alert("?¬ì—…?ëª…?€ ?„ìˆ˜?…ë‹ˆ??"); return; }
    var insertData = {
      agency_group: activeGroup,
      year: currentYear,
      month: Number(activeMonth),
      business_name: newCase.business_name,
      representative: newCase.representative || null,
      business_number: newCase.business_number || null,
      assignee: newCase.assignee || null,
      status: newCase.status || "?œì‘ ??,
      request_amount: newCase.request_amount || null,
      region: newCase.region || null,
      notes: newCase.notes || null,
    };
    var result = await supabase.from("agency_cases").insert(insertData).select().single();
    if (!result.error && result.data) {
      setCases(function(prev) { return prev.concat([result.data]); });
      setShowAddCase(false);
      setNewCase({});
      setCompanySuggestions([]);
    } else {
      alert("?€???¤íŒ¨: " + (result.error ? result.error.message : "?????†ëŠ” ?ëŸ¬"));
    }
  };

  var saveEdit = async function() {
    var updates = {
      business_name: editData.business_name, representative: editData.representative,
      assignee: editData.assignee, status: editData.status,
      request_amount: editData.request_amount, region: editData.region,
      agency_sub: editData.agency_sub, notes: editData.notes,
      fund_product: editData.fund_product || null,
      delivered_docs: editData.delivered_docs || [],
      updated_at: new Date().toISOString()
    };
    var result = await supabase.from("agency_cases").update(updates).eq("id", editData.id);
    if (!result.error) {
      setCases(function(prev) { return prev.map(function(c) { return c.id === editData.id ? Object.assign({}, c, updates) : c; }); });
      setEditingId(null); setEditData({});
    }
  };

  var deleteCase = async function(id) {
    if (!window.confirm("?´ì??µìœ¼ë¡??´ë™?˜ì‹œê² ìŠµ?ˆê¹Œ?")) return;
    var now = new Date().toISOString();
    var result = await supabase.from("agency_cases").update({ deleted_at: now }).eq("id", id);
    if (!result.error) setCases(function(prev) { return prev.map(function(c) { return c.id === id ? Object.assign({}, c, { deleted_at: now }) : c; }); });
  };

  var restoreCase = async function(id) {
    var result = await supabase.from("agency_cases").update({ deleted_at: null }).eq("id", id);
    if (!result.error) setCases(function(prev) { return prev.map(function(c) { return c.id === id ? Object.assign({}, c, { deleted_at: null }) : c; }); });
  };

  var permanentDelete = async function(id) {
    if (!window.confirm("?êµ¬ ?? œ?©ë‹ˆ?? ë³µêµ¬?????†ìŠµ?ˆë‹¤.")) return;
    var result = await supabase.from("agency_cases").delete().eq("id", id);
    if (!result.error) setCases(function(prev) { return prev.filter(function(c) { return c.id !== id; }); });
  };

  var GUJOHYEOK_STATUS_OPTIONS = [
    "?œì‘??,"?œë¥˜ ?œì¶œ ?„ë£Œ","?ê?ì§„ë‹¨ ?„ë£Œ","?„ë¬¸ ?„ì› ë°°ì •","?„ë¬¸ ?„ì› ?¤ì‚¬ ?„ë£Œ",
    "ì»¨ì„¤?´íŠ¸ ? ì²­ ?„ë£Œ","ì»¨ì„¤??ì§„í–‰ì¤?,"ì»¨ì„¤??ìµœì¢… ?„ë£Œ","?¹ì¸ ? ì²­???œì¶œ ?„ë£Œ",
    "?ˆì‚° ?Œì§„?¼ë¡œ ì»¨ì„¤?´íŠ¸ ë³´ë¥˜","?ˆì‚° ?Œì§„?¼ë¡œ ?ê¸ˆ ? ì²­ ë³´ë¥˜","?¬ì—…?„í™˜ ?¹ì¸"
  ];
  var GUJOHYEOK_STATUS_COLORS = {
    "?œì‘??:                       { bg: "#F7F6F3", text: "#888" },
    "?œë¥˜ ?œì¶œ ?„ë£Œ":               { bg: "#E6F1FB", text: "#185FA5" },
    "?ê?ì§„ë‹¨ ?„ë£Œ":                { bg: "#E6F1FB", text: "#0C447C" },
    "?„ë¬¸ ?„ì› ë°°ì •":               { bg: "#FAEEDA", text: "#633806" },
    "?„ë¬¸ ?„ì› ?¤ì‚¬ ?„ë£Œ":          { bg: "#FAEEDA", text: "#412402" },
    "ì»¨ì„¤?´íŠ¸ ? ì²­ ?„ë£Œ":           { bg: "#FAEEDA", text: "#412402" },
    "ì»¨ì„¤??ì§„í–‰ì¤?:                { bg: "#FAEEDA", text: "#412402" },
    "ì»¨ì„¤??ìµœì¢… ?„ë£Œ":             { bg: "#EAF3DE", text: "#27500A" },
    "?¹ì¸ ? ì²­???œì¶œ ?„ë£Œ":        { bg: "#EAF3DE", text: "#173404" },
    "?ˆì‚° ?Œì§„?¼ë¡œ ì»¨ì„¤?´íŠ¸ ë³´ë¥˜":  { bg: "#FAC775", text: "#412402" },
    "?ˆì‚° ?Œì§„?¼ë¡œ ?ê¸ˆ ? ì²­ ë³´ë¥˜": { bg: "#FAC775", text: "#412402" },
    "?¬ì—…?„í™˜ ?¹ì¸":                { bg: "#1D9E75", text: "#fff" },
  };
  var DELIVERED_DOCS_OPTIONS = ["ë¶€??ê¸°ì—…","?¹ì¸? ì²­??,"?„ë¬¸?„ì› ?¤í¬ë¦½íŠ¸","ì»¨ì„¤???¤í¬ë¦½íŠ¸","ìµœì¢… ?¤í¬ë¦½íŠ¸"];
  var STATUS_OPTIONS = activeGroup === "êµ¬ì¡°?ì‹ &?¬ì—…?„í™˜"
    ? GUJOHYEOK_STATUS_OPTIONS
    : ["?œì‘ ??,"ì§„í–‰ ì¤?,"?¬ì‚¬ì¤?,"?¬ì‚¬?€ê¸?,"ìµœì¢…?œì¶œ","?°ì„ ???‰ê?","ê¸°ê? ë°©ë¬¸ ??,"ê¸°ê? ë°©ë¬¸ ???€ê¸?,"?¨ë¼??? ì²­ ???€ê¸?,"?¤íƒœ ì¡°ì‚¬ ?ˆì •","?¤íƒœ ì¡°ì‚¬ ?„ë£Œ","?¹ì¸","?½ì •","?„ë£Œ","ë¶€ê²?,"ë°˜ë ¤","ì§„í–‰ë¶ˆê?","? ì²­ì·¨ì†Œ","ë³´ë¥˜"];

  var PRIORITY_CHECKLIST = [
    { category: "ê³ ìš©ì§€??, items: ["ê³ ìš©ì°½ì¶œ ?¤ì  ë³´ìœ ê¸°ì—…","?´ì¼ì±„ìš©ê³µì œ ê°€?????¼ìë¦?? ì? ê¸°ì—…","?¸ì¬?¡ì„±??ì¤‘ì†Œê¸°ì—…","ê°€ì¡±ì¹œ?”ì¸ì¦ê¸°??ì§€??,"ì±„ìš©ê³„íšê¸°ì—…(6ê°œì›” ?´ë‚´)"] },
    { category: "ê¸°ìˆ ì§€???‘ì‚° ??3???´ë‚´)", items: ["?¹í—ˆ,?¤ìš©? ì•ˆ??ì§€?ì¬?°ê¶Œ ë³´ìœ (3???´ë‚´ ?±ë¡)","ê¸°ì—…ë¶€?¤ì—°êµ¬ì†Œ,?°êµ¬ê°œë°œ?„ë‹´ë¶€??ë³´ìœ ","?€?‘ê¶Œ ë³´ìœ (3???´ë‚´ ?±ë¡)","?‘ì‚° 3???´ë‚´ ?œí’ˆ ê°œë°œ?¤ì  ë³´ìœ ","Inno-Biz ?¸ì¦","? ê¸°??NET,NEP) ?¸ì¦","ì§€?ì¬?°ê²½?ì¸ì¦ê¸°??,"?¹ìƒ‰ê¸°ìˆ ?¸ì¦","ë¿Œë¦¬ê¸°ìˆ ?„ë¬¸ê¸°ì—…","ë²¤ì²˜ê¸°ì—…","ë§¤ì¶œ???€ë¹??°êµ¬ê°œë°œë¹„ì¤‘??5% ?´ìƒ"] },
    { category: "ê²½ì˜ì§€??, items: ["Main-Biz ?¸ì¦","ëª…ë¬¸?¥ìˆ˜ê¸°ì—…","ë§¤ì¶œ???ì—…?´ìµë¥ ì´ ?™ì¢…?…ê³„ ?‰ê· ?ì—…?´ìµë¥ ì˜ 2ë°??´ìƒ"] },
    { category: "ê¸°ì—…ê³µê°œ", items: ["5????ì½”ìŠ¤??ì½”ë„¥???ì¥?ˆì •ê¸°ì—…","?¸ë??¬ì? ì¹˜ ?¤ì  ë³´ìœ "] },
    { category: "?˜ì¶œ?¤ì ", items: ["ìµœê·¼ 1?„ê°„ ?˜ì¶œ?¤ì (ê°„ì ‘?¬í•¨)ë³´ìœ "] },
    { category: "ê·¸ë¦°ê¸°ìˆ ", items: ["?¤ì—¼ë¬¼ì§ˆ ?€ê°??¤ë¹„,?€?„ì†ŒÂ·?ë„ˆì§€ ?¨ìœ¨???˜ê²½?¤ì—¼ë°©ì? ?¤ë¹„ ???„ì…","?„ì†Œì¤‘ë¦½???¤ë§ˆ?¸ê³µ??ì§€?ì‚¬???‘ì•½","?ë??ì¬ ?±ì„ ì¹œí™˜ê²??Œì¬ë¡??„í™˜","?„ì†Œì¤‘ë¦½ ê²½ì˜?ì‹  ì»¨ì„¤??? ì •","? ì¬?ì—?ˆì?,?„ì†Œ?€ê°???ê·¸ë¦°ë¶„ì•¼ ?ìœ„ê¸°ì—… ?ëŠ” ê¸°ìˆ  ?¬ì—…??ê¸°ì—…","?„ì†Œì¤‘ë¦½ ?„í™˜ì§€?ì‚¬??? ì •ê¸°ì—…"] },
    { category: "?¤ë§ˆ?¸í™”", items: ["?•ë? ?±ì˜ ?¤ë§ˆ?¸ê³µ??ì§€?ì‚¬??ì°¸ì—¬ê¸°ì—…","?ì‚°?¨ìœ¨?”ë? ?„í•œ ?ë™???œì„¤ ?„ì…"] },
    { category: "?¬ê¸°ì§€??, items: ["?¬ì—…?„í™˜ ê³„íš ?¹ì¸ê¸°ì—…(?¹ì¸?¼ë¡œë¶€??5????","?¬ì—…?„í™˜ ê³„íšê¸°ì—…(?…ë ¥ 3??ì¢…ì—…??5???´ìƒ)","êµ¬ì¡°ê°œì„ ?„ìš©?ê¸ˆ ?”ê±´ ?´ë‹¹ê¸°ì—…","?µìƒë³€?”ë??‘ìœ„?ê¸°??ì§€??ì§€?•ì¼ë¡œë???3????","?ì—…??ê°œì¸ê¸°ì—… ?ëŠ” ë²•ì¸ê¸°ì—… ?´ì˜ê²½í—˜ ë³´ìœ (??ì£¼ì ???±ì? ?œì™¸)","6ê°œì›” ?´ë‚´ ê²½ì˜?ë¡œ ?¼í•´ ë°œìƒê¸°ì—…"] },
    { category: "?•ì±…?°ë?", items: ["?Œë???ê°•ì†Œê¸°ì—… 100Â·?¤í??¸ì—…100Â·ê²½ìŸ?¥ìœ„?íšŒ ì¶”ì²œê¸°ì—…","?„ê¸°? ë‹ˆì½?200","ì§€??˜??? ë„ê¸°ì—… ? ì •","ê¸€ë¡œë²Œ ê°•ì†Œê¸°ì—…","?¬ì„±ê¸°ì—…","ë¬´ëª…???˜ì¶œ?©ì‚¬","?¼íŠ¼???´ìˆ˜ê¸°ì—…","ê¸€ë¡œë²Œ ê°•ì†Œê¸°ì—… 1000+(ê°•ì†Œ?´ìƒ)","?˜ì¶œêµ??¤ë???,"?˜ì¶œ?¤ë???ê³„íšë³´ìœ "] },
    { category: "ì°½ì—…ì¤€ë¹?, items: ["ì¤‘ê¸°ë¶€ ê¸°ìˆ ì°½ì—…?œì„±??ì§€?ì‚¬??ì²?…„ì°½ì—…?¬ê??™êµ ?? ì¡¸ì—… ?ëŠ” ?˜ìƒê¸°ì—…","ì°½ì—…ì§„í¥???ˆë¹„ì°½ì—…?¨í‚¤ì§€ ?¬ì—… ì°¸ì—¬ê¸°ì—…","ì°½ì—…ê¸°ì—…?•ì¸??ë³´ìœ ê¸°ì—…","?ˆë¹„ì°½ì—…???¬ì—…?ë“±ë¡ë²ˆ?¸ê? ?†ëŠ” ?íƒœ)"] },
    { category: "?¬íšŒ??ê²½ì œê¸°ì—…", items: ["?¬íšŒ?ê¸°??,"?ˆë¹„?¬íšŒ?ê¸°??,"ë§ˆì„ê¸°ì—…","?í™œê¸°ì—…","?‘ë™ì¡°í•©(?‘ë™ì¡°í•©ê¸°ë³¸ë²•ì— ê·¼ê±°???‘ë™ì¡°í•©ë§??´ë‹¹)","?Œì…œë²¤ì²˜ê¸°ì—…"] },
  ];

  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [priorityTarget, setPriorityTarget] = useState(null);
  const [priorityChecks, setPriorityChecks] = useState({});

  var openPriority = function(row) {
    setPriorityTarget(row);
    var saved = {};
    try { saved = JSON.parse(row.priority_checks || "{}"); } catch(e) { saved = {}; }
    setPriorityChecks(saved);
    setShowPriorityModal(true);
  };
  var savePriorityChecks = async function() {
    var r = await supabase.from("agency_cases").update({ priority_checks: JSON.stringify(priorityChecks) }).eq("id", priorityTarget.id);
    if (!r.error) {
      setCases(function(prev) { return prev.map(function(c) { return c.id === priorityTarget.id ? Object.assign({}, c, { priority_checks: JSON.stringify(priorityChecks) }) : c; }); });
      setShowPriorityModal(false);
      alert("ì²´í¬ë¦¬ìŠ¤?¸ê? ?€?¥ë?´ìš”!");
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #E8E5E0", borderTopColor: "#1A1917", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <span style={{ color: "#888", fontSize: 13 }}>ê¸°ê?ë³??„í™© ë¶ˆëŸ¬?¤ëŠ” ì¤?..</span>
    </div>
  );

  return (
    <div>
      {/* ?¤ë” */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>ê¸°ê?ë³??„í™©</h1>
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>ê¸°ê? Â· ?”ë³„ ì§„í–‰ê±´ì„ ?œëˆˆ??/p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={openAddCase}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#1A1917", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <Icon name="plus" size={14} color="#fff" /> ? ê·œ ì¶”ê?
          </button>
          <button onClick={function() { setShowTrash(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
            ?—‘ï¸??´ì???trashedCases.length > 0 ? " (" + trashedCases.length + ")" : ""}
          </button>
          <button onClick={function() { fetchCases(); fetchCompanies(); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#555", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
            <Icon name="refresh" size={13} color="#555" /> ?ˆë¡œê³ ì¹¨
          </button>
        </div>
      </div>

      {/* ê¸°ê? ??*/}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {AGENCY_GROUPS.map(function(g) {
          var isActive = activeGroup === g.id;
          return (
            <div key={g.id} onClick={function() { setActiveGroup(g.id); setEditingId(null); setFilterAssignee("?„ì²´"); }}
              style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: isActive ? 700 : 400,
                background: isActive ? g.color : "#fff", color: isActive ? "#fff" : "#555",
                border: isActive ? "none" : "1px solid #E8E5E0", transition: "all 0.15s" }}>
              {g.label}
            </div>
          );
        })}
      </div>

      {/* ????*/}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, flexWrap: "wrap" }}>
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(function(m) {
          var hasData = monthsWithData.has(m);
          var isActive = Number(activeMonth) === m;
          return (
            <div key={m} onClick={function() { setActiveMonth(m); setEditingId(null); setFilterAssignee("?„ì²´"); }}
              style={{ padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: isActive ? 700 : 400,
                background: isActive ? groupColor : hasData ? "#fff" : "#F7F6F3",
                color: isActive ? "#fff" : hasData ? "#333" : "#CCC",
                border: isActive ? "none" : hasData ? "1px solid #E8E5E0" : "1px solid #EDEBE8" }}>
              {m}??hasData && !isActive ? " ?? : ""}
            </div>
          );
        })}
      </div>

      {/* ?”ì•½ ì¹´ë“œ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "ì´?ì§„í–‰", value: summary.total, color: "#1A1917" },
          { label: "?¹ì¸/?½ì •", value: summary.approved, color: "#047857" },
          { label: "ì§„í–‰ì¤?, value: summary.inProgress, color: "#4338CA" },
          { label: "ë¶€ê²?ë°˜ë ¤", value: summary.rejected, color: "#DC2626" },
        ].map(function(s) {
          return (
            <div key={s.label} style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", border: "1px solid #E8E5E0" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}ê±?/div>
            </div>
          );
        })}
      </div>

      {/* ?´ë‹¹???„í„° */}
      {assigneesInGroup.length > 1 && (
        <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
          {assigneesInGroup.map(function(a) {
            return (
              <div key={a} onClick={function() { setFilterAssignee(a); }}
                style={{ padding: "5px 13px", borderRadius: 99, cursor: "pointer", fontSize: 12,
                  background: filterAssignee === a ? "#1A1917" : "#fff", color: filterAssignee === a ? "#fff" : "#666",
                  border: filterAssignee === a ? "none" : "1px solid #E8E5E0" }}>
                {a}
              </div>
            );
          })}
        </div>
      )}

      {/* ?Œì´ë¸?*/}
      {filtered.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 10, padding: "60px 20px", textAlign: "center", color: "#AAA", fontSize: 14, border: "1px solid #E8E5E0" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>?“‹</div>
          {activeGroup} {activeMonth}???°ì´?°ê? ?†ìŠµ?ˆë‹¤<br />
          <span style={{ fontSize: 12 }}>ê¸°ì—… ëª©ë¡?ì„œ ê¸°ê?ê³?? ì²­?”ì„ ?¤ì •?˜ê³  "ê¸°ê?ë³„í˜„?©ì— ?±ë¡" ë²„íŠ¼???ŒëŸ¬ì£¼ì„¸??/span>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E8E5E0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F7F6F3", borderBottom: "2px solid #E8E5E0" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11, width: 30 }}>#</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11 }}>?¬ì—…?ëª…</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11 }}>?€?œì</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11 }}>?´ë‹¹??/th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11 }}>ê¸ˆì•¡</th>
                {(activeGroup === "ì¤‘ì†Œë²¤ì²˜ê¸°ì—…ì§„í¥ê³µë‹¨" || activeGroup === "?Œìƒê³µì¸?œì¥ì§„í¥ê³µë‹¨") && (
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11 }}>? ì²­?í’ˆ</th>
                )}
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11 }}>?…ì¢…</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11 }}>ì§€??/th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: activeGroup === "êµ¬ì¡°?ì‹ &?¬ì—…?„í™˜" ? "#BE123C" : "#888", fontSize: 11 }}>?íƒœ</th>
                {activeGroup === "êµ¬ì¡°?ì‹ &?¬ì—…?„í™˜" && (
                  <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#0F6E56", fontSize: 11, background: "#E1F5EE" }}>?„ë‹¬ ë°??„ë£Œ ?œë¥˜</th>
                )}
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11 }}>? ìš©?ìˆ˜</th>
                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: 11 }}>ë¹„ê³ </th>
                <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, color: "#888", fontSize: 11, width: 80 }}>?‘ì—…</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(function(row, idx) {
                var isEditing = editingId === row.id;
                var sc = STATUS_COLORS_MAP[row.status] || { bg: "#F7F6F3", text: "#888" };
                return (
                  <tr key={row.id} style={{ borderBottom: "1px solid #F0EDE8", background: selectedCase && selectedCase.id === row.id ? "#F0FDF4" : isEditing ? "#FAFFF7" : "transparent", cursor: "pointer" }} onClick={function() { if (!isEditing) setSelectedCase(row); }}>
                    <td style={{ padding: "10px 12px", color: "#AAA", fontSize: 12 }}>{idx + 1}</td>
                    <td style={{ padding: "10px 12px" }}>
                      {isEditing
                        ? <input value={editData.business_name || ""} onChange={function(e) { var v = e.target.value; setEditData(function(p) { return Object.assign({}, p, { business_name: v }); }); }}
                            style={{ padding: "4px 8px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 13, width: "100%", boxSizing: "border-box" }} />
                        : (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontWeight: 600 }}>{row.business_name || "-"}</span>
                            {activeGroup === "ì¤‘ì†Œë²¤ì²˜ê¸°ì—…ì§„í¥ê³µë‹¨" && (
                              <button onClick={function(e) { e.stopPropagation(); openPriority(row); }}
                                style={{ fontSize: 10, padding: "2px 7px", background: "#F3F0FF", color: "#7C3AED", border: "1px solid #DDD6FE", borderRadius: 4, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                                ?“‹ ?°ì„ ??                              </button>
                            )}
                          </div>
                        )}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {isEditing
                        ? <input value={editData.representative || ""} onChange={function(e) { var v = e.target.value; setEditData(function(p) { return Object.assign({}, p, { representative: v }); }); }}
                            style={{ padding: "4px 8px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 12, width: 70, boxSizing: "border-box" }} />
                        : <span style={{ fontSize: 12, color: "#555" }}>{row.representative || "-"}</span>}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {isEditing
                        ? <select value={editData.assignee || ""} onChange={function(e) { var v = e.target.value; setEditData(function(p) { return Object.assign({}, p, { assignee: v }); }); }}
                            style={{ padding: "4px 6px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 12 }}>
                            <option value="">? íƒ</option>
                            {ASSIGNEES.map(function(a) { return <option key={a} value={a}>{a}</option>; })}
                          </select>
                        : <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: "#EEF2FF", color: "#4338CA", fontWeight: 600 }}>{row.assignee || "-"}</span>}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {isEditing
                        ? <input value={editData.request_amount || ""} onChange={function(e) { var v = e.target.value; setEditData(function(p) { return Object.assign({}, p, { request_amount: v }); }); }}
                            style={{ padding: "4px 8px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 12, width: 70, boxSizing: "border-box" }} />
                        : <span style={{ fontSize: 12, color: "#555" }}>{row.request_amount || "-"}</span>}
                    </td>
                    {(activeGroup === "ì¤‘ì†Œë²¤ì²˜ê¸°ì—…ì§„í¥ê³µë‹¨" || activeGroup === "?Œìƒê³µì¸?œì¥ì§„í¥ê³µë‹¨") && (
                      <td style={{ padding: "10px 12px" }}>
                        {isEditing ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <select value={editData.fund_product || ""} onChange={function(e) { var v = e.target.value; setEditData(function(p) { return Object.assign({}, p, { fund_product: v }); }); }}
                              style={{ padding: "4px 6px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 11, maxWidth: 160 }}>
                              <option value="">?í’ˆ ? íƒ</option>
                              {(activeGroup === "ì¤‘ì†Œë²¤ì²˜ê¸°ì—…ì§„í¥ê³µë‹¨" ? JUNGINGONG_PRODUCTS : SOJINGONG_PRODUCTS).map(function(p) { return <option key={p} value={p}>{p}</option>; })}
                            </select>
                            <input value={editData.fund_product || ""} placeholder="ì§ì ‘ ?…ë ¥" onChange={function(e) { var v = e.target.value; setEditData(function(p) { return Object.assign({}, p, { fund_product: v }); }); }}
                              style={{ padding: "4px 6px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 11, maxWidth: 160, boxSizing: "border-box" }} />
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: "#555" }}>{row.fund_product || "-"}</span>
                        )}
                      </td>
                    )}
                    <td style={{ padding: "10px 12px" }}>
                      {(function() {
                        var matchedCo = companiesList.find(function(c) { return c.name === row.business_name; });
                        var ind = matchedCo ? matchedCo.industry : null;
                        return <span style={{ fontSize: 11, padding: ind ? "2px 7px" : 0, borderRadius: 99, background: ind ? "#EEF2FF" : "transparent", color: ind ? "#4338CA" : "#CCC", fontWeight: ind ? 600 : 400 }}>{ind || "-"}</span>;
                      })()}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {isEditing
                        ? <input value={editData.region || ""} onChange={function(e) { var v = e.target.value; setEditData(function(p) { return Object.assign({}, p, { region: v }); }); }}
                            style={{ padding: "4px 8px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 12, width: 80, boxSizing: "border-box" }} />
                        : (
                          <div>
                            <div style={{ fontSize: 12, color: "#555" }}>{row.region || "-"}</div>
                            {(activeGroup === "ì¤‘ì†Œë²¤ì²˜ê¸°ì—…ì§„í¥ê³µë‹¨" || activeGroup === "êµ¬ì¡°?ì‹ &?¬ì—…?„í™˜") && row.region && findJungingongBranch(row.region) && (
                              <div style={{ fontSize: 10, color: "#7C3AED", marginTop: 2, fontWeight: 600 }}>{findJungingongBranch(row.region)}</div>
                            )}
                          </div>
                        )}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {isEditing
                        ? <select value={editData.status || ""} onChange={function(e) { var v = e.target.value; setEditData(function(p) { return Object.assign({}, p, { status: v }); }); }}
                            style={{ padding: "4px 6px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 12 }}>
                            {STATUS_OPTIONS.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
                          </select>
                        : (function() {
                            var gsc = activeGroup === "êµ¬ì¡°?ì‹ &?¬ì—…?„í™˜"
                              ? (GUJOHYEOK_STATUS_COLORS[row.status] || { bg: "#F7F6F3", text: "#888" })
                              : sc;
                            var isApproved = row.status === "?¬ì—…?„í™˜ ?¹ì¸";
                            return (
                              <span style={{ fontSize: 11, padding: isApproved ? "4px 10px" : "3px 8px", borderRadius: 99, background: gsc.bg, color: gsc.text, fontWeight: 600, border: isApproved ? "1.5px solid #0F6E56" : "none", display: "inline-flex", alignItems: "center", gap: 3 }}>
                                {isApproved && "??"}{row.status || "-"}
                              </span>
                            );
                          })()}
                    </td>
                    {activeGroup === "êµ¬ì¡°?ì‹ &?¬ì—…?„í™˜" && (
                      <td style={{ padding: "10px 12px" }}>
                        {isEditing ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {DELIVERED_DOCS_OPTIONS.map(function(doc) {
                              var checked = Array.isArray(editData.delivered_docs) && editData.delivered_docs.indexOf(doc) >= 0;
                              return (
                                <label key={doc} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, cursor: "pointer" }}>
                                  <input type="checkbox" checked={checked} onChange={function() {
                                    var cur = Array.isArray(editData.delivered_docs) ? editData.delivered_docs.slice() : [];
                                    if (checked) { cur = cur.filter(function(d) { return d !== doc; }); }
                                    else { cur.push(doc); }
                                    setEditData(function(p) { return Object.assign({}, p, { delivered_docs: cur }); });
                                  }} style={{ margin: 0 }} />
                                  {doc}
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                            {Array.isArray(row.delivered_docs) && row.delivered_docs.length > 0
                              ? row.delivered_docs.map(function(doc) {
                                  return <span key={doc} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#EAF3DE", color: "#173404" }}>{doc}</span>;
                                })
                              : <span style={{ fontSize: 11, color: "#CCC" }}>-</span>}
                          </div>
                        )}
                      </td>
                    )}
                    <td style={{ padding: "10px 12px" }}>
                      {(function() {
                        var matchedCo = companiesList.find(function(c) { return c.name === row.business_name; });
                        if (!matchedCo || (!matchedCo.credit_score_kcb && !matchedCo.credit_score_nice)) return <span style={{ fontSize: 12, color: "#CCC" }}>-</span>;
                        return <span style={{ fontSize: 12, color: "#555", fontWeight: 600 }}>{(matchedCo.credit_score_kcb || "-") + " / " + (matchedCo.credit_score_nice || "-")}</span>;
                      })()}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {isEditing
                        ? <input value={editData.notes || ""} onChange={function(e) { var v = e.target.value; setEditData(function(p) { return Object.assign({}, p, { notes: v }); }); }}
                            style={{ padding: "4px 8px", border: "1px solid #86EFAC", borderRadius: 6, fontSize: 12, width: "100%", boxSizing: "border-box" }} />
                        : <span style={{ fontSize: 12, color: "#777" }}>{row.notes || "-"}</span>}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                          <button onClick={saveEdit} style={{ background: "#15803D", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>?€??/button>
                          <button onClick={function() { setEditingId(null); setEditData({}); }} style={{ background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 6, padding: "5px 8px", fontSize: 11, cursor: "pointer" }}>ì·¨ì†Œ</button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                          <button onClick={function() { setEditingId(row.id); setEditData(Object.assign({}, row)); }}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="edit" size={14} color="#888" /></button>
                          <button onClick={function() { deleteCase(row.id); }}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="x" size={14} color="#CCC" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ?°ì„ ??ì²´í¬ë¦¬ìŠ¤??ëª¨ë‹¬ */}
      {showPriorityModal && priorityTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={function(e) { if (e.target === e.currentTarget) setShowPriorityModal(false); }}>
          <div style={{ background: "#fff", borderRadius: 16, width: 720, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>?“‹ ?•ì±…?°ì„ ??ì²´í¬ë¦¬ìŠ¤??/h2>
                <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>{priorityTarget.business_name} Â· ì¤‘ì†Œë²¤ì²˜ê¸°ì—…ì§„í¥ê³µë‹¨</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={savePriorityChecks} style={{ background: "#7C3AED", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>?€??/button>
                <button onClick={function() { setShowPriorityModal(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#888" }}>??/button>
              </div>
            </div>
            <div style={{ padding: "20px 24px" }}>
              {(function() {
                var totalItems = 0;
                var checkedItems = 0;
                PRIORITY_CHECKLIST.forEach(function(cat) { cat.items.forEach(function(item) { totalItems++; if (priorityChecks[item]) checkedItems++; }); });
                return (
                  <div style={{ background: "#F3F0FF", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 20, alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#7C3AED" }}>ì´?{totalItems}ê°???ª© ì¤?<span style={{ fontSize: 18 }}>{checkedItems}</span>ê°??´ë‹¹</div>
                    <div style={{ flex: 1, background: "#DDD6FE", borderRadius: 99, height: 8, overflow: "hidden" }}>
                      <div style={{ width: (checkedItems / totalItems * 100) + "%", background: "#7C3AED", height: "100%", borderRadius: 99, transition: "width 0.3s" }} />
                    </div>
                  </div>
                );
              })()}
              {PRIORITY_CHECKLIST.map(function(cat) {
                var catChecked = cat.items.filter(function(item) { return priorityChecks[item]; }).length;
                return (
                  <div key={cat.category} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ background: catChecked > 0 ? "#EDE9FE" : "#F7F6F3", color: catChecked > 0 ? "#7C3AED" : "#AAA", padding: "2px 10px", borderRadius: 6 }}>{cat.category}</span>
                      <span style={{ fontSize: 11, color: "#AAA" }}>{catChecked}/{cat.items.length}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {cat.items.map(function(item) {
                        var checked = !!priorityChecks[item];
                        return (
                          <label key={item} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: checked ? "#F3F0FF" : "#FAFAFA", border: "1px solid " + (checked ? "#DDD6FE" : "#EDEBE8"), cursor: "pointer" }}>
                            <input type="checkbox" checked={checked} onChange={function(e) { var v = e.target.checked; setPriorityChecks(function(p) { var n = Object.assign({}, p); if (v) n[item] = true; else delete n[item]; return n; }); }} style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#7C3AED" }} />
                            <span style={{ fontSize: 12, color: checked ? "#5B21B6" : "#555", fontWeight: checked ? 600 : 400, lineHeight: 1.4 }}>{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ?´ì???ëª¨ë‹¬ */}
      {showTrash && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={function(e) { if (e.target === e.currentTarget) setShowTrash(false); }}>
          <div style={{ background: "#fff", borderRadius: 14, width: 600, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>?—‘ï¸??´ì???({trashedCases.length}ê±?</h2>
              <button onClick={function() { setShowTrash(false); }} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="x" size={18} color="#888" /></button>
            </div>
            <div style={{ padding: "16px 24px" }}>
              {trashedCases.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#CCC", fontSize: 13 }}>?´ì??µì´ ë¹„ì–´ ?ˆìŠµ?ˆë‹¤</div>
              ) : (
                trashedCases.map(function(row) {
                  return (
                    <div key={row.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F0EDE8" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{row.business_name}</div>
                        <div style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>{row.agency_group} Â· {row.month}??Â· {row.assignee}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={function() { restoreCase(row.id); }}
                          style={{ background: "#EEF2FF", color: "#4338CA", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>ë³µêµ¬</button>
                        <button onClick={function() { permanentDelete(row.id); }}
                          style={{ background: "#FEF2F2", color: "#DC2626", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>?êµ¬?? œ</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ? ê·œ ì§„í–‰ê±?ì¶”ê? ëª¨ë‹¬ (?ë™?„ì„± ?¬í•¨) */}
      {showAddCase && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={function(e) { if (e.target === e.currentTarget) { setShowAddCase(false); setCompanySuggestions([]); } }}>
          <div style={{ background: "#fff", borderRadius: 14, width: 520, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>? ê·œ ì§„í–‰ê±?ì¶”ê? ({activeGroup} {activeMonth}??</h2>
              <button onClick={function() { setShowAddCase(false); setCompanySuggestions([]); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Icon name="x" size={18} color="#888" />
              </button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              {/* ?¬ì—…?ëª… + ?ë™?„ì„± */}
              <div style={{ marginBottom: 13, position: "relative" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>
                  ?¬ì—…?ëª… * <span style={{ color: "#4338CA", fontWeight: 400, marginLeft: 6 }}>(ê¸°ì—… ëª©ë¡ {companiesList.length}ê°?ë¡œë“œ?????…ë ¥ ???ë™?„ì„±)</span>
                </label>
                <input value={newCase.business_name || ""} placeholder="?¬ì—…?ëª… ?…ë ¥"
                  onChange={function(e) { onBusinessNameChange(e.target.value); }}
                  style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                {companySuggestions.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #E8E5E0", borderRadius: 8, marginTop: 4, maxHeight: 240, overflowY: "auto", zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                    {companySuggestions.map(function(co) {
                      return (
                        <div key={co.id} onClick={function() { selectCompany(co); }}
                          style={{ padding: "10px 13px", cursor: "pointer", borderBottom: "1px solid #F0EDE8", fontSize: 13 }}
                          onMouseEnter={function(e) { e.currentTarget.style.background = "#F7F6F3"; }}
                          onMouseLeave={function(e) { e.currentTarget.style.background = "#fff"; }}>
                          <div style={{ fontWeight: 700 }}>{co.name}</div>
                          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                            {co.representative ? "?€?? " + co.representative : ""}
                            {co.region ? " Â· " + co.region : ""}
                            {co.assignee ? " Â· ?´ë‹¹: " + co.assignee : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 13 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>?€?œìëª?/label>
                <input value={newCase.representative || ""} onChange={function(e) { var v = e.target.value; setNewCase(function(p) { return Object.assign({}, p, { representative: v }); }); }}
                  style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div style={{ marginBottom: 13 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>?¬ì—…?ë“±ë¡ë²ˆ??/label>
                <input value={newCase.business_number || ""} onChange={function(e) { var v = e.target.value; setNewCase(function(p) { return Object.assign({}, p, { business_number: v }); }); }}
                  style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 13 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>?´ë‹¹??/label>
                  <select value={newCase.assignee || ""} onChange={function(e) { var v = e.target.value; setNewCase(function(p) { return Object.assign({}, p, { assignee: v }); }); }}
                    style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                    <option value="">? íƒ</option>
                    {ASSIGNEES.map(function(a) { return <option key={a} value={a}>{a}</option>; })}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>?íƒœ</label>
                  <select value={newCase.status || "?œì‘ ??} onChange={function(e) { var v = e.target.value; setNewCase(function(p) { return Object.assign({}, p, { status: v }); }); }}
                    style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                    {STATUS_OPTIONS.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 13 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>? ì²­ê¸ˆì•¡</label>
                  <input value={newCase.request_amount || ""} placeholder="?? 1?? 5ì²œë§Œ" onChange={function(e) { var v = e.target.value; setNewCase(function(p) { return Object.assign({}, p, { request_amount: v }); }); }}
                    style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>ì§€??/label>
                  <input value={newCase.region || ""} placeholder="?? ?œìš¸_ê°•ë‚¨" onChange={function(e) { var v = e.target.value; setNewCase(function(p) { return Object.assign({}, p, { region: v }); }); }}
                    style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
                </div>
              </div>
              <div style={{ marginBottom: 13 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>ë¹„ê³  / ë©”ëª¨</label>
                <textarea value={newCase.notes || ""} onChange={function(e) { var v = e.target.value; setNewCase(function(p) { return Object.assign({}, p, { notes: v }); }); }} rows={3}
                  style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
              </div>
              <button onClick={saveNewCase}
                style={{ width: "100%", padding: "13px", background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 6 }}>
                ?±ë¡?˜ê¸°
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ê¸°ê?ë³„í˜„???¬ì´?œíŒ¨??*/}
      {selectedCase && (
        <div style={{ position: "fixed", inset: 0, zIndex: 900 }} onClick={function() { setSelectedCase(null); }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 460, height: "100%", background: "#fff", boxShadow: "-4px 0 30px rgba(0,0,0,0.15)", overflowY: "auto" }}
            onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{selectedCase.business_name}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{activeGroup} Â· {selectedCase.assignee || "-"}</div>
              </div>
              <button onClick={function() { setSelectedCase(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#888" }}>??/button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              {/* ?íƒœ ë³€ê²?*/}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 8 }}>?íƒœ</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(activeGroup === "êµ¬ì¡°?ì‹ &?¬ì—…?„í™˜" ? GUJOHYEOK_STATUS_OPTIONS : ["?œì‘ ??,"ì§„í–‰ ì¤?,"ë³´ë¥˜","ë¶€ê²?,"?¹ì¸","?„ë£Œ"]).map(function(s) {
                    var sc = activeGroup === "êµ¬ì¡°?ì‹ &?¬ì—…?„í™˜"
                      ? (GUJOHYEOK_STATUS_COLORS[s] || { bg: "#F7F6F3", text: "#888" })
                      : (STATUS_COLORS_MAP[s] || { bg: "#F7F6F3", text: "#888" });
                    var isActive = selectedCase.status === s;
                    var isApproved = s === "?¬ì—…?„í™˜ ?¹ì¸";
                    return (
                      <button key={s} onClick={async function() {
                        var r = await supabase.from("agency_cases").update({ status: s, updated_at: new Date().toISOString() }).eq("id", selectedCase.id);
                        if (!r.error) {
                          setCases(function(prev) { return prev.map(function(c) { return c.id === selectedCase.id ? Object.assign({}, c, { status: s }) : c; }); });
                          setSelectedCase(function(p) { return Object.assign({}, p, { status: s }); });
                        }
                      }} style={{ padding: "5px 12px", borderRadius: 99, border: isActive ? (isApproved ? "2px solid #0F6E56" : "2px solid " + sc.text) : "1px solid #E8E5E0", background: isActive ? sc.bg : "#fff", color: isActive ? sc.text : "#888", fontSize: 12, fontWeight: isActive ? 700 : 400, cursor: "pointer" }}>{isApproved ? "??" + s : s}</button>
                    );
                  })}
                </div>
                {activeGroup === "êµ¬ì¡°?ì‹ &?¬ì—…?„í™˜" && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#0F6E56", marginBottom: 8 }}>?„ë‹¬ ë°??„ë£Œ ?œë¥˜</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {DELIVERED_DOCS_OPTIONS.map(function(doc) {
                        var docs = Array.isArray(selectedCase.delivered_docs) ? selectedCase.delivered_docs : [];
                        var checked = docs.indexOf(doc) >= 0;
                        return (
                          <label key={doc} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                            <input type="checkbox" checked={checked} onChange={async function() {
                              var newDocs = checked ? docs.filter(function(d) { return d !== doc; }) : docs.concat([doc]);
                              var r = await supabase.from("agency_cases").update({ delivered_docs: newDocs, updated_at: new Date().toISOString() }).eq("id", selectedCase.id);
                              if (!r.error) {
                                setCases(function(prev) { return prev.map(function(c) { return c.id === selectedCase.id ? Object.assign({}, c, { delivered_docs: newDocs }) : c; }); });
                                setSelectedCase(function(p) { return Object.assign({}, p, { delivered_docs: newDocs }); });
                              }
                            }} style={{ margin: 0, width: 15, height: 15, cursor: "pointer" }} />
                            <span style={{ color: checked ? "#0F6E56" : "#555", fontWeight: checked ? 600 : 400 }}>{doc}</span>
                            {checked && <span style={{ fontSize: 10, color: "#0F6E56" }}>??/span>}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {/* ê¸°ë³¸ ?•ë³´ */}
              <div style={{ marginBottom: 20, background: "#F7F6F3", borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 10 }}>ê¸°ë³¸ ?•ë³´</div>
                {(function() {
                  var matchedCo = companiesList.find(function(c) { return c.name === selectedCase.business_name; });
                  var indVal = matchedCo ? matchedCo.industry : null;
                  var items = [
                    { label: "?€?œì", value: selectedCase.representative },
                    { label: "?¬ì—…?ë“±ë¡ë²ˆ??, value: selectedCase.business_number },
                    { label: "?…ì¢…", value: indVal },
                    { label: "? ì²­ê¸ˆì•¡", value: selectedCase.request_amount },
                    { label: "?¹ì¸ê¸ˆì•¡", value: selectedCase.approved_amount },
                    { label: "ì§€??, value: selectedCase.region },
                    { label: "? ì²­?í’ˆ", value: selectedCase.fund_product },
                  ];
                  return items;
                })().map(function(item) {
                  return item.value ? (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                      <span style={{ color: "#888" }}>{item.label}</span>
                      <span style={{ fontWeight: 600 }}>{item.value}</span>
                    </div>
                  ) : null;
                })}
                {!selectedCase.representative && !selectedCase.business_number && !selectedCase.request_amount && (
                  <div style={{ fontSize: 12, color: "#AAA" }}>ê¸°ë³¸ ?•ë³´ê°€ ?…ë ¥?˜ì? ?Šì•˜?µë‹ˆ??</div>
                )}
              </div>
              {/* ?´ìŠˆ ë©”ëª¨ */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 8 }}>?“ ?´ìŠˆ ë©”ëª¨</div>
                <textarea value={selectedCase.notes || ""}
                  onChange={function(e) { setSelectedCase(function(p) { return Object.assign({}, p, { notes: e.target.value }); }); }}
                  onBlur={async function() {
                    var r = await supabase.from("agency_cases").update({ notes: selectedCase.notes, updated_at: new Date().toISOString() }).eq("id", selectedCase.id);
                    if (!r.error) {
                      setCases(function(prev) { return prev.map(function(c) { return c.id === selectedCase.id ? Object.assign({}, c, { notes: selectedCase.notes }) : c; }); });
                    }
                  }}
                  placeholder="?´ìŠˆ ?´ìš©???…ë ¥?˜ì„¸??.."
                  rows={4} style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} />
                <div style={{ fontSize: 11, color: "#AAA", marginTop: 4 }}>?…ë ¥ ??ì¹?ë°??´ë¦­ ???ë™ ?€??/div>
              </div>

              {/* ?†• ì¶”ê? ?•ë³´ (?„ì´?€, ê³µë‹¨ê³„ì •, ?¸ì¦???? */}
              <div style={{ marginBottom: 20, padding: "14px", background: "#F7F6F3", borderRadius: 10, border: "1px solid #E8E5E0" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1917", marginBottom: 12 }}>?” ì¶”ê? ?•ë³´</div>
                {(function() {
                  // ?¬ì—…?ë²ˆ???ë™ ê°€?¸ì˜¤ê¸?(ê¸°ì—… ëª©ë¡?ì„œ ë§¤ì¹­)
                  var matchedCo = companiesList.find(function(c) { return c.name === selectedCase.business_name; });
                  var autoBizNum = matchedCo ? matchedCo.business_number : null;

                  // ê³µí†µ input ?¤í???                  var inputStyle = { width: "100%", padding: "8px 10px", border: "1px solid #E8E5E0", borderRadius: 6, fontSize: 12, background: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
                  var labelStyle = { fontSize: 10, fontWeight: 700, color: "#888", marginBottom: 4, display: "block" };
                  var rowStyle = { marginBottom: 10 };

                  // ?„ë“œ ?ë™ ?€???¬í¼
                  var saveField = async function(fieldName, value) {
                    var updateObj = {};
                    updateObj[fieldName] = value;
                    updateObj.updated_at = new Date().toISOString();
                    var r = await supabase.from("agency_cases").update(updateObj).eq("id", selectedCase.id);
                    if (!r.error) {
                      setCases(function(prev) { return prev.map(function(c) { if (c.id === selectedCase.id) { var n = Object.assign({}, c); n[fieldName] = value; return n; } return c; }); });
                    }
                  };

                  return (
                    <>
                      {/* ?¬ì—…?ë²ˆ??(?ë™) */}
                      <div style={rowStyle}>
                        <label style={labelStyle}>?¬ì—…?ë²ˆ??(ê¸°ì—… ëª©ë¡?ì„œ ?ë™)</label>
                        <input type="text" value={autoBizNum || "ê¸°ì—… ëª©ë¡???±ë¡?˜ì? ?ŠìŒ"} readOnly
                          style={Object.assign({}, inputStyle, { background: "#F0EDE8", color: autoBizNum ? "#1A1917" : "#AAA", cursor: "not-allowed" })} />
                      </div>

                      {/* ?„ì´?€ ê³„ì • + ë¹„ë²ˆ */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                        <div>
                          <label style={labelStyle}>?„ì´?€ ê³„ì •</label>
                          <input type="text" value={selectedCase.ipin_account || ""}
                            onChange={function(e) { setSelectedCase(function(p) { return Object.assign({}, p, { ipin_account: e.target.value }); }); }}
                            onBlur={function() { saveField("ipin_account", selectedCase.ipin_account || ""); }}
                            placeholder="ID" style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>?„ì´?€ ë¹„ë?ë²ˆí˜¸</label>
                          <input type="text" value={selectedCase.ipin_password || ""}
                            onChange={function(e) { setSelectedCase(function(p) { return Object.assign({}, p, { ipin_password: e.target.value }); }); }}
                            onBlur={function() { saveField("ipin_password", selectedCase.ipin_password || ""); }}
                            placeholder="PW" style={inputStyle} />
                        </div>
                      </div>

                      {/* ì£¼ë??±ë¡ë²ˆí˜¸ */}
                      <div style={rowStyle}>
                        <label style={labelStyle}>ì£¼ë??±ë¡ë²ˆí˜¸</label>
                        <input type="text" value={selectedCase.resident_number || ""}
                          onChange={function(e) { setSelectedCase(function(p) { return Object.assign({}, p, { resident_number: e.target.value }); }); }}
                          onBlur={function() { saveField("resident_number", selectedCase.resident_number || ""); }}
                          placeholder="000000-0000000" style={inputStyle} />
                      </div>

                      {/* ê³µë‹¨ ?„ì´??+ ë¹„ë²ˆ */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                        <div>
                          <label style={labelStyle}>ê³µë‹¨ ?„ì´??/label>
                          <input type="text" value={selectedCase.agency_login_id || ""}
                            onChange={function(e) { setSelectedCase(function(p) { return Object.assign({}, p, { agency_login_id: e.target.value }); }); }}
                            onBlur={function() { saveField("agency_login_id", selectedCase.agency_login_id || ""); }}
                            placeholder="ID" style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>ê³µë‹¨ ë¹„ë?ë²ˆí˜¸</label>
                          <input type="text" value={selectedCase.agency_login_password || ""}
                            onChange={function(e) { setSelectedCase(function(p) { return Object.assign({}, p, { agency_login_password: e.target.value }); }); }}
                            onBlur={function() { saveField("agency_login_password", selectedCase.agency_login_password || ""); }}
                            placeholder="PW" style={inputStyle} />
                        </div>
                      </div>

                      {/* ê°œì¸ ?¸ì¦??+ ?¬ì—…???¸ì¦??ë¹„ë?ë²ˆí˜¸ */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                        <div>
                          <label style={labelStyle}>ê°œì¸ ?¸ì¦??ë¹„ë²ˆ</label>
                          <input type="text" value={selectedCase.personal_cert_password || ""}
                            onChange={function(e) { setSelectedCase(function(p) { return Object.assign({}, p, { personal_cert_password: e.target.value }); }); }}
                            onBlur={function() { saveField("personal_cert_password", selectedCase.personal_cert_password || ""); }}
                            placeholder="ê°œì¸ ?¸ì¦??PW" style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>?¬ì—…???¸ì¦??ë¹„ë²ˆ</label>
                          <input type="text" value={selectedCase.business_cert_password || ""}
                            onChange={function(e) { setSelectedCase(function(p) { return Object.assign({}, p, { business_cert_password: e.target.value }); }); }}
                            onBlur={function() { saveField("business_cert_password", selectedCase.business_cert_password || ""); }}
                            placeholder="?¬ì—…???¸ì¦??PW" style={inputStyle} />
                        </div>
                      </div>

                      {/* ìµœì¢… ì»¨íŒ */}
                      <div style={rowStyle}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "8px 10px", background: selectedCase.final_confirm ? "#ECFDF5" : "#fff", border: "1px solid " + (selectedCase.final_confirm ? "#10B981" : "#E8E5E0"), borderRadius: 6 }}>
                          <input type="checkbox" checked={!!selectedCase.final_confirm}
                            onChange={function(e) { var v = e.target.checked; setSelectedCase(function(p) { return Object.assign({}, p, { final_confirm: v }); }); saveField("final_confirm", v); }}
                            style={{ width: 16, height: 16, cursor: "pointer" }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: selectedCase.final_confirm ? "#047857" : "#888" }}>
                            {selectedCase.final_confirm ? "??ìµœì¢… ì»¨íŒ ?„ë£Œ" : "ìµœì¢… ì»¨íŒ"}
                          </span>
                        </label>
                      </div>

                      {/* ì¶”ê? ë©”ëª¨ */}
                      <div style={{ marginBottom: 4 }}>
                        <label style={labelStyle}>ì¶”ê? ë©”ëª¨</label>
                        <textarea value={selectedCase.extra_notes || ""}
                          onChange={function(e) { setSelectedCase(function(p) { return Object.assign({}, p, { extra_notes: e.target.value }); }); }}
                          onBlur={function() { saveField("extra_notes", selectedCase.extra_notes || ""); }}
                          placeholder="ì¶”ê?ë¡?ê¸°ë¡???´ìš©..."
                          rows={3} style={Object.assign({}, inputStyle, { resize: "vertical", lineHeight: 1.5 })} />
                      </div>

                      <div style={{ fontSize: 10, color: "#AAA", marginTop: 6 }}>ê°??…ë ¥ ??ì¹?ë°??´ë¦­ ???ë™ ?€??/div>
                    </>
                  );
                })()}
              </div>

              {/* ?„ì²´ ?•ë³´ ?˜ì • ë²„íŠ¼ */}
              <button onClick={function() {
                setEditingId(selectedCase.id);
                setEditData(Object.assign({}, selectedCase));
                setSelectedCase(null);
              }} style={{ width: "100%", padding: "11px", background: "#1A1917", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                ?ï¸ ?„ì²´ ?•ë³´ ?˜ì •
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ?€?€ DBë¦¬ìŠ¤??(? ê·œ ê³ ê° ?ë‹´) ?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€?€
const LEAD_STATUSES = ["ë¯¸ì—°??,"?°ê²°","ë¶€??,"ë¯¸íŒ…","ê±°ì ˆ","ë³´ë¥˜","ê³„ì•½"];
const LEAD_STATUS_COLORS = {
  "?°ê²°": { bg: "#EEF2FF", text: "#4338CA" },
  "ë¶€??: { bg: "#FFF7ED", text: "#C2410C" },
  "ë¯¸íŒ…": { bg: "#ECFDF5", text: "#047857" },
  "ê±°ì ˆ": { bg: "#FEF2F2", text: "#DC2626" },
  "ë³´ë¥˜": { bg: "#F5F3FF", text: "#7C3AED" },
  "ë¯¸ì—°??: { bg: "#F7F6F3", text: "#888" },
  "ê³„ì•½": { bg: "#ECFDF5", text: "#047857" },
};

function DBLeadsView() {
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth() + 1);
  const [filterStatus, setFilterStatus] = useState("?„ì²´");
  const [filterWeek, setFilterWeek] = useState("?„ì²´");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLead, setNewLead] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [showLeadTrash, setShowLeadTrash] = useState(false);
  const [trashedLeads, setTrashedLeads] = useState([]);
  const [dbSearch, setDbSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(function() { fetchLeads(); }, []);

  var fetchLeads = async function() {
    setLeadsLoading(true);
    var result = await supabase.from("db_leads").select("*").order("created_at", { ascending: true });
    if (!result.error) setLeads(result.data || []);
    setLeadsLoading(false);
  };
  var fetchTrashedLeads = async function() {
    var r = await supabase.from("db_leads").select("*").not("deleted_at", "is", null).order("deleted_at", { ascending: false });
    if (!r.error) setTrashedLeads(r.data || []);
  };
  var restoreLead = async function(id) {
    var r = await supabase.from("db_leads").update({ deleted_at: null }).eq("id", id);
    if (!r.error) {
      setTrashedLeads(function(prev) { return prev.filter(function(l) { return l.id !== id; }); });
      fetchLeads();
    }
  };
  var permanentDeleteLead = async function(id) {
    if (!window.confirm("?êµ¬ ?? œ?©ë‹ˆ?? ë³µêµ¬?????†ìŠµ?ˆë‹¤.")) return;
    var r = await supabase.from("db_leads").delete().eq("id", id);
    if (!r.error) setTrashedLeads(function(prev) { return prev.filter(function(l) { return l.id !== id; }); });
  };

  // 1ì°¨ì½œ ? ì§œ?ì„œ ì£¼ì°¨ ê³„ì‚°
  var getWeek = function(lead) {
    var d = lead.call_1_date;
    if (!d) {
      // ê¸°ì¡´ call_1 ?ìŠ¤?¸ì—??? ì§œ ì¶”ì¶œ ?œë„
      var txt = lead.call_1 || "";
      var m = txt.match(/(\d{1,2})\/(\d{1,2})/);
      if (m) {
        var day = parseInt(m[2]);
        return Math.ceil(day / 7);
      }
      return null;
    }
    var date = new Date(d);
    return Math.ceil(date.getDate() / 7);
  };

  var filtered = useMemo(function() {
    return leads.filter(function(l) {
      if (l.month !== activeMonth || l.year !== 2026 || l.deleted_at) return false;
      if (filterStatus !== "?„ì²´" && l.status !== filterStatus) return false;
      if (filterWeek !== "?„ì²´") {
        var w = getWeek(l);
        if (w !== parseInt(filterWeek)) return false;
      }
      if (dbSearch.trim()) {
        var s = dbSearch.trim().toLowerCase();
        return (l.business_name || "").toLowerCase().includes(s) ||
               (l.contact || "").includes(s) ||
               (l.assignee || "").toLowerCase().includes(s);
      }
      return true;
    });
  }, [leads, activeMonth, filterStatus, filterWeek, dbSearch]);

  var monthsWithData = useMemo(function() {
    var s = new Set();
    leads.filter(function(l) { return l.year === 2026 && !l.deleted_at; }).forEach(function(l) { s.add(l.month); });
    return s;
  }, [leads]);

  var weeksWithData = useMemo(function() {
    var counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    leads.filter(function(l) { return l.month === activeMonth && l.year === 2026 && !l.deleted_at; }).forEach(function(l) {
      var w = getWeek(l);
      if (w && w >= 1 && w <= 5) counts[w]++;
    });
    return counts;
  }, [leads, activeMonth]);

  var summary = useMemo(function() {
    var all = leads.filter(function(l) { return l.month === activeMonth && l.year === 2026 && !l.deleted_at; });
    return {
      total: all.length,
      connected: all.filter(function(l) { return l.status === "?°ê²°"; }).length,
      absent: all.filter(function(l) { return l.status === "ë¶€??; }).length,
      meeting: all.filter(function(l) { return l.status === "ë¯¸íŒ…"; }).length,
      rejected: all.filter(function(l) { return l.status === "ê±°ì ˆ"; }).length,
      notCalled: all.filter(function(l) { return l.status === "ë¯¸ì—°??; }).length,
    };
  }, [leads, activeMonth]);

  var startEdit = function(row) { setEditingId(row.id); setEditData(Object.assign({}, row)); };
  var cancelEdit = function() { setEditingId(null); setEditData({}); };
  var saveEdit = async function() {
    var updates = { business_name: editData.business_name, contact: formatPhone(editData.contact || ""), assignee: editData.assignee, assigned_by: editData.assigned_by, status: editData.status, call_1: editData.call_1, call_2: editData.call_2, call_3: editData.call_3, call_4: editData.call_4, call_5: editData.call_5, etc: editData.etc, call_1_date: editData.call_1_date || null, call_1_status: editData.call_1_status || null, call_1_memo: editData.call_1_memo || null, call_2_date: editData.call_2_date || null, call_2_status: editData.call_2_status || null, call_2_memo: editData.call_2_memo || null, call_3_date: editData.call_3_date || null, call_3_status: editData.call_3_status || null, call_3_memo: editData.call_3_memo || null, call_4_date: editData.call_4_date || null, call_4_status: editData.call_4_status || null, call_4_memo: editData.call_4_memo || null, call_5_date: editData.call_5_date || null, call_5_status: editData.call_5_status || null, call_5_memo: editData.call_5_memo || null, updated_at: new Date().toISOString() };
    var result = await supabase.from("db_leads").update(updates).eq("id", editData.id);
    if (!result.error) {
      setLeads(function(prev) { return prev.map(function(l) { return l.id === editData.id ? Object.assign({}, l, updates) : l; }); });
      setEditingId(null); setEditData({});
      // ê³„ì•½ ?íƒœë¡?ë³€ê²???ê¸°ì—… ëª©ë¡ ?ë™ ?±ë¡ ?œì•ˆ
      if (editData.status === "ê³„ì•½") {
        var existCheck = await supabase.from("companies").select("id").eq("name", editData.business_name).single();
        if (existCheck.error) {
          var doAdd = window.confirm("\"" + editData.business_name + "\"??ê³„ì•½?ì–´??\nê¸°ì—… ëª©ë¡???ë™?¼ë¡œ ì¶”ê?? ê¹Œ??");
          if (doAdd) {
            await supabase.from("companies").insert({
              name: editData.business_name,
              phone: editData.contact || "",
              assignee: editData.assignee || "",
              stage: "?ë‹´/ì§„ë‹¨?„ë£Œ",
              type: "ë²•ì¸",
              fee: 5,
            });
            alert("ê¸°ì—… ëª©ë¡??ì¶”ê??ì–´?? ê¸°ì—… ëª©ë¡?ì„œ ì¶”ê? ?•ë³´ë¥??…ë ¥?´ì£¼?¸ìš”.");
          }
        }
      }
    }
  };
  var deleteLead = async function(id) {
    if (!window.confirm("?´ì??µìœ¼ë¡??´ë™?˜ì‹œê² ìŠµ?ˆê¹Œ?")) return;
    var now = new Date().toISOString();
    var result = await supabase.from("db_leads").update({ deleted_at: now }).eq("id", id);
    if (!result.error) { setLeads(function(prev) { return prev.map(function(l) { return l.id === id ? Object.assign({}, l, { deleted_at: now }) : l; }); }); }
  };
  var openAddLead = function() {
    setNewLead({ year: 2026, month: activeMonth, business_name: "", contact: "", assignee: "", assigned_by: "", status: "ë¯¸ì—°??, call_1: "", call_2: "", call_3: "", call_4: "", call_5: "", etc: "" });
    setShowAddLead(true);
  };
  var saveNewLead = async function() {
    if (!newLead.business_name) { alert("?¬ì—…?ëª…?€ ?„ìˆ˜?…ë‹ˆ??"); return; }
    var leadData = Object.assign({}, newLead, { contact: formatPhone(newLead.contact || "") });
    var result = await supabase.from("db_leads").insert(leadData).select().single();
    if (!result.error && result.data) { setLeads(function(prev) { return prev.concat([result.data]); }); setShowAddLead(false); }
  };

  if (leadsLoading) return (<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}><div style={{ width: 36, height: 36, border: "3px solid #E8E5E0", borderTopColor: "#1A1917", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><span style={{ color: "#888", fontSize: 13 }}>DBë¦¬ìŠ¤??ë¶ˆëŸ¬?¤ëŠ” ì¤?..</span></div>);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>DBë¦¬ìŠ¤??/h1><p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>? ê·œ ê³ ê° ?ë‹´ Â· ì½?ê´€ë¦?/p></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={openAddLead} style={{ display: "flex", alignItems: "center", gap: 6, background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}><Icon name="plus" size={15} color="#F7F6F3" /> ? ê·œ ?±ë¡</button>
          <button onClick={function() { fetchTrashedLeads(); setShowLeadTrash(true); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>?—‘ï¸??´ì???trashedLeads.length > 0 ? " (" + trashedLeads.length + ")" : ""}</button>
          <button onClick={fetchLeads} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#555", border: "1px solid #E8E5E0", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}><Icon name="refresh" size={13} color="#555" /> ?ˆë¡œê³ ì¹¨</button>
        </div>
      </div>

      {/* ê²€?‰ì°½ */}
      <div style={{ marginBottom: 16, position: "relative" }}>
        <input value={dbSearch} onChange={function(e) { setDbSearch(e.target.value); }}
          placeholder="?” ?…ì²´ëª? ?°ë½ì²? ?´ë‹¹??ê²€??.."
          style={{ width: "100%", padding: "10px 40px 10px 14px", border: "1px solid #E8E5E0", borderRadius: 10, fontSize: 13, boxSizing: "border-box", outline: "none", background: "#fff" }} />
        {dbSearch && <button onClick={function() { setDbSearch(""); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#888" }}>??/button>}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 18, flexWrap: "wrap" }}>
        {MONTHS_LIST.map(function(m) { var hasData = monthsWithData.has(m); var isActive = activeMonth === m; return (<div key={m} onClick={function() { setActiveMonth(m); setFilterStatus("?„ì²´"); }} style={{ padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: isActive ? 700 : 400, background: isActive ? "#1A1917" : hasData ? "#fff" : "#F7F6F3", color: isActive ? "#fff" : hasData ? "#333" : "#CCC", border: isActive ? "none" : hasData ? "1px solid #E8E5E0" : "1px solid #EDEBE8" }}>{m}??hasData && !isActive ? " ?? : ""}</div>); })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 18 }}>
        {[{ label: "?„ì²´", value: summary.total, color: "#1A1917" },{ label: "?°ê²°", value: summary.connected, color: "#4338CA" },{ label: "ë¶€??, value: summary.absent, color: "#C2410C" },{ label: "ë¯¸íŒ…", value: summary.meeting, color: "#047857" },{ label: "ê±°ì ˆ", value: summary.rejected, color: "#DC2626" },{ label: "ë¯¸ì—°??, value: summary.notCalled, color: "#888" }].map(function(k, i) {
          var isOn = filterStatus === k.label || (filterStatus === "?„ì²´" && k.label === "?„ì²´");
          return (<div key={i} onClick={function() { setFilterStatus(k.label === "?„ì²´" ? "?„ì²´" : k.label); }} style={{ background: isOn ? "#1A1917" : "#fff", borderRadius: 10, padding: "12px 14px", border: "1px solid #E8E5E0", cursor: "pointer", textAlign: "center" }}><div style={{ fontSize: 10, color: isOn ? "#999" : "#888", marginBottom: 3 }}>{k.label}</div><div style={{ fontSize: 20, fontWeight: 700, color: isOn ? "#F7F6F3" : k.color }}>{k.value}ê±?/div></div>);
        })}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "#888", marginRight: 4 }}>ì£¼ì°¨ë³?</span>
        {["?„ì²´","1","2","3","4","5"].map(function(w) {
          var label = w === "?„ì²´" ? "?„ì²´" : w + "ì£¼ì°¨";
          var count = w === "?„ì²´" ? "" : (weeksWithData[parseInt(w)] > 0 ? " (" + weeksWithData[parseInt(w)] + ")" : "");
          return (<div key={w} onClick={function() { setFilterWeek(w); }} style={{ padding: "4px 12px", borderRadius: 99, cursor: "pointer", fontSize: 12, background: filterWeek === w ? "#1A1917" : "#fff", color: filterWeek === w ? "#F7F6F3" : "#666", border: filterWeek === w ? "none" : "1px solid #E8E5E0" }}>{label}{count}</div>);
        })}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E8E5E0", overflow: "hidden" }}>
        {filtered.length === 0 ? (<div style={{ padding: "60px 20px", textAlign: "center", color: "#AAA", fontSize: 13 }}>{activeMonth}??DBë¦¬ìŠ¤???°ì´?°ê? ?†ìŠµ?ˆë‹¤</div>) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "2px solid #E8E5E0" }}>
                <th style={{ textAlign: "center", padding: "10px 8px", fontWeight: 600, color: "#888", fontSize: 11, width: 36 }}>#</th>
                <th style={{ textAlign: "left", padding: "10px 8px", fontWeight: 600, color: "#888", fontSize: 11, minWidth: 120 }}>?¬ì—…?ëª…</th>
                <th style={{ textAlign: "left", padding: "10px 8px", fontWeight: 600, color: "#888", fontSize: 11, minWidth: 100 }}>?°ë½ì²?/th>
                <th style={{ textAlign: "left", padding: "10px 8px", fontWeight: 600, color: "#888", fontSize: 11, minWidth: 55 }}>?´ë‹¹??/th>
                <th style={{ textAlign: "left", padding: "10px 8px", fontWeight: 600, color: "#888", fontSize: 11, minWidth: 55 }}>ë°°ì •</th>
                <th style={{ textAlign: "left", padding: "10px 8px", fontWeight: 600, color: "#888", fontSize: 11, minWidth: 70 }}>?íƒœ</th>
                <th style={{ textAlign: "left", padding: "10px 8px", fontWeight: 600, color: "#888", fontSize: 11, minWidth: 200 }}>ìµœê·¼ ì½?/th>
                <th style={{ textAlign: "center", padding: "10px 8px", fontWeight: 600, color: "#888", fontSize: 11, width: 70 }}>?‘ì—…</th>
              </tr></thead>
              <tbody>
                {filtered.map(function(row, idx) {
                  var isEditing = editingId === row.id;
                  var isExpanded = expandedId === row.id;
                  var lastCall = "-";
                  for (var ci = 5; ci >= 1; ci--) {
                    var cd = row["call_" + ci + "_date"];
                    var cs = row["call_" + ci + "_status"];
                    var cm = row["call_" + ci + "_memo"];
                    if (cd || cs || cm) { lastCall = (cd || "") + " " + (cs || "") + " " + (cm || ""); break; }
                    if (row["call_" + ci]) { lastCall = row["call_" + ci]; break; }
                  }
                  var sc = LEAD_STATUS_COLORS[row.status] || { bg: "#F7F6F3", text: "#888" };
                  var CALL_STATUSES = ["?µí™”?„ë£Œ","ë¶€??,"ê±°ì ˆ","ë¬¸ìë°œì†¡","ì¹´í†¡ë°œì†¡","ì½œë°±?”ì²­","ë¯¸íŒ…?ˆì•½","?ë‹´?„ë£Œ","?˜ì‹ ê±°ë?"];
                  return [
                    <tr key={row.id} style={{ borderBottom: isExpanded ? "none" : "1px solid #F0EDE8", background: selectedLead && selectedLead.id === row.id ? "#F0FDF4" : isEditing ? "#FEFCE8" : idx % 2 === 0 ? "#fff" : "#FAFAF8", cursor: "pointer" }} onClick={function() { setSelectedLead(row); }}>
                      <td style={{ textAlign: "center", padding: "9px 8px", color: "#AAA", fontSize: 11 }}>{idx + 1}</td>
                      <td style={{ padding: "9px 8px" }} onClick={function(e) { e.stopPropagation(); }}>
                        {isEditing
                          ? <input value={editData.business_name || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { business_name: e.target.value }); }); }} style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12, width: "100%", boxSizing: "border-box" }} />
                          : <span style={{ fontWeight: 600 }}>{row.business_name || "-"}</span>}
                      </td>
                      <td style={{ padding: "9px 8px" }} onClick={function(e) { e.stopPropagation(); }}>
                        {isEditing
                          ? <input value={editData.contact || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { contact: e.target.value }); }); }} style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12, width: "100%", boxSizing: "border-box" }} />
                          : <span style={{ fontSize: 12, color: "#555" }}>{row.contact || "-"}</span>}
                      </td>
                      <td style={{ padding: "9px 8px" }} onClick={function(e) { e.stopPropagation(); }}>
                        {isEditing
                          ? <select value={editData.assignee || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { assignee: e.target.value }); }); }} style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12, width: "100%" }}><option value="">-</option>{DB_ASSIGNEES.map(function(a) { return <option key={a} value={a}>{a}</option>; })}</select>
                          : <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: "#EEF2FF", color: "#4338CA", fontWeight: 600 }}>{row.assignee || "-"}</span>}
                      </td>
                      <td style={{ padding: "9px 8px" }} onClick={function(e) { e.stopPropagation(); }}>
                        {isEditing
                          ? <select value={editData.assigned_by || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { assigned_by: e.target.value }); }); }} style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12, width: "100%" }}><option value="">-</option>{DB_MANAGERS.map(function(a) { return <option key={a} value={a}>{a}</option>; })}</select>
                          : <span style={{ fontSize: 12, color: "#888" }}>{row.assigned_by || "-"}</span>}
                      </td>
                      <td style={{ padding: "9px 8px" }} onClick={function(e) { e.stopPropagation(); }}>
                        {isEditing
                          ? <select value={editData.status || ""} onChange={function(e) { setEditData(function(p) { return Object.assign({}, p, { status: e.target.value }); }); }} style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 12, width: "100%" }}>{LEAD_STATUSES.map(function(s) { return <option key={s} value={s}>{s}</option>; })}</select>
                          : <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: sc.bg, color: sc.text, fontWeight: 600 }}>{row.status || "-"}</span>}
                      </td>
                      <td style={{ padding: "9px 8px", fontSize: 11, color: "#555", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lastCall}</td>
                      <td style={{ textAlign: "center", padding: "9px 8px" }} onClick={function(e) { e.stopPropagation(); }}>
                        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                          {isEditing ? <>
                            <button onClick={function(e) { e.stopPropagation(); saveEdit(); }} style={{ background: "#15803D", color: "#fff", border: "none", borderRadius: 4, padding: "3px 8px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>?€??/button>
                            <button onClick={function(e) { e.stopPropagation(); cancelEdit(); }} style={{ background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 4, padding: "3px 6px", fontSize: 11, cursor: "pointer" }}>ì·¨ì†Œ</button>
                          </> : <>
                            <button onClick={function() { startEdit(row); setExpandedId(row.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="edit" size={14} color="#888" /></button>
                            <button onClick={function() { deleteLead(row.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon name="x" size={14} color="#CCC" /></button>
                          </>}
                        </div>
                      </td>
                    </tr>,
                    isExpanded && (<tr key={row.id + "-detail"} style={{ borderBottom: "1px solid #F0EDE8", background: "#FAFAF8" }} onClick={function(e) { e.stopPropagation(); }}><td colSpan={8} style={{ padding: "12px 16px 16px 50px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12 }}>
                        {[1,2,3,4,5].map(function(n) {
                          var dateKey = "call_" + n + "_date";
                          var statusKey = "call_" + n + "_status";
                          var memoKey = "call_" + n + "_memo";
                          var oldKey = "call_" + n;
                          var dateVal = isEditing ? (editData[dateKey] || "") : (row[dateKey] || "");
                          var statusVal = isEditing ? (editData[statusKey] || "") : (row[statusKey] || "");
                          var memoVal = isEditing ? (editData[memoKey] || "") : (row[memoKey] || "");
                          var oldVal = row[oldKey] || "";
                          return (<div key={n} style={{ background: "#fff", borderRadius: 8, padding: "10px 12px", border: "1px solid #E8E5E0" }}>
                            <div style={{ fontSize: 10, color: "#888", fontWeight: 600, marginBottom: 6 }}>{n}ì°¨ì½œ</div>
                            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                              <input type="date" value={dateVal}
                                onClick={function(e) { e.stopPropagation(); }}
                                onChange={function(e) { e.stopPropagation(); var k = dateKey; var v = e.target.value; if (!isEditing) { startEdit(row); } setEditData(function(p) { var o = Object.assign({}, p); o[k] = v; return o; }); }}
                                style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 11, flex: 1 }} />
                              <select value={statusVal}
                                onClick={function(e) { e.stopPropagation(); }}
                                onChange={function(e) { e.stopPropagation(); var k = statusKey; var v = e.target.value; if (!isEditing) { startEdit(row); } setEditData(function(p) { var o = Object.assign({}, p); o[k] = v; return o; }); }}
                                style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 11, flex: 1 }}>
                                <option value="">?íƒœ ? íƒ</option>
                                {CALL_STATUSES.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
                              </select>
                            </div>
                            <input value={memoVal} placeholder="ë©”ëª¨ ?…ë ¥"
                              onClick={function(e) { e.stopPropagation(); }}
                              onChange={function(e) { e.stopPropagation(); var k = memoKey; var v = e.target.value; if (!isEditing) { startEdit(row); } setEditData(function(p) { var o = Object.assign({}, p); o[k] = v; return o; }); }}
                              style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 11, width: "100%", boxSizing: "border-box" }} />
                            {oldVal && !dateVal && !memoVal && (<div style={{ marginTop: 3, fontSize: 10, color: "#AAA" }}>ê¸°ì¡´: {oldVal}</div>)}
                          </div>);
                        })}
                        <div style={{ background: "#fff", borderRadius: 8, padding: "8px 12px", border: "1px solid #E8E5E0" }}>
                          <div style={{ fontSize: 10, color: "#888", fontWeight: 600, marginBottom: 3 }}>ê¸°í?</div>
                          <input value={isEditing ? (editData.etc || "") : (row.etc || "")} placeholder="ê¸°í? ë©”ëª¨"
                            onChange={function(e) { var v = e.target.value; if (!isEditing) { startEdit(row); } setEditData(function(p) { return Object.assign({}, p, { etc: v }); }); }}
                            onClick={function(e) { e.stopPropagation(); }}
                            style={{ padding: "4px 6px", border: "1px solid #E8E5E0", borderRadius: 4, fontSize: 11, width: "100%", boxSizing: "border-box" }} />
                        </div>
                        {isEditing && (
                          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, marginTop: 4 }}>
                            <button onClick={function(e) { e.stopPropagation(); saveEdit(); }} style={{ background: "#15803D", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>?€??/button>
                            <button onClick={function(e) { e.stopPropagation(); cancelEdit(); }} style={{ background: "#fff", color: "#888", border: "1px solid #E8E5E0", borderRadius: 6, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>ì·¨ì†Œ</button>
                          </div>
                        )}
                      </div>
                    </td></tr>)
                  ];
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddLead && (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={function(e) { if (e.target === e.currentTarget) setShowAddLead(false); }}>
        <div style={{ background: "#fff", borderRadius: 14, width: 520, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
          <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center" }}><h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>? ê·œ DB ?±ë¡ ({activeMonth}??</h2><button onClick={function() { setShowAddLead(false); }} style={{ background: "none", border: "none", cursor: "pointer" }}><Icon name="x" size={18} color="#888" /></button></div>
          <div style={{ padding: "20px 24px" }}>
            <div style={{ marginBottom: 13 }}><label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>?¬ì—…?ëª… *</label><input value={newLead.business_name || ""} onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { business_name: e.target.value }); }); }} style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 13 }}><div><label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>?°ë½ì²?/label><input value={newLead.contact || ""} onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { contact: e.target.value }); }); }} placeholder="010-0000-0000" style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} /></div><div><label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>?íƒœ</label><select value={newLead.status || "ë¯¸ì—°??} onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { status: e.target.value }); }); }} style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}>{LEAD_STATUSES.map(function(s) { return <option key={s} value={s}>{s}</option>; })}</select></div></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 13 }}><div><label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>?´ë‹¹??/label><select value={newLead.assignee || ""} onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { assignee: e.target.value }); }); }} style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}><option value="">? íƒ</option>{DB_ASSIGNEES.map(function(a) { return <option key={a} value={a}>{a}</option>; })}</select></div><div><label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>ë°°ì • ?´ë‹¹</label><select value={newLead.assigned_by || ""} onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { assigned_by: e.target.value }); }); }} style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}><option value="">? íƒ</option>{DB_MANAGERS.map(function(a) { return <option key={a} value={a}>{a}</option>; })}</select></div></div>
            <div style={{ marginBottom: 13 }}><label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>1ì°¨ì½œ</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <input type="date" value={newLead.call_1_date || ""} onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { call_1_date: e.target.value }); }); }} style={{ flex: 1, padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13 }} />
                <select value={newLead.call_1_status || ""} onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { call_1_status: e.target.value }); }); }} style={{ flex: 1, padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                  <option value="">?íƒœ ? íƒ</option>
                  <option value="?µí™”?„ë£Œ">?µí™”?„ë£Œ</option><option value="ë¶€??>ë¶€??/option><option value="ê±°ì ˆ">ê±°ì ˆ</option><option value="ë¬¸ìë°œì†¡">ë¬¸ìë°œì†¡</option><option value="ì¹´í†¡ë°œì†¡">ì¹´í†¡ë°œì†¡</option><option value="ì½œë°±?”ì²­">ì½œë°±?”ì²­</option><option value="ë¯¸íŒ…?ˆì•½">ë¯¸íŒ…?ˆì•½</option><option value="?ë‹´?„ë£Œ">?ë‹´?„ë£Œ</option><option value="?˜ì‹ ê±°ë?">?˜ì‹ ê±°ë?</option>
                </select>
              </div>
              <input value={newLead.call_1_memo || ""} placeholder="1ì°¨ì½œ ë©”ëª¨ (? íƒ)" onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { call_1_memo: e.target.value }); }); }} style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
            </div>
            <div style={{ marginBottom: 13 }}><label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 5 }}>2ì°¨ì½œ</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <input type="date" value={newLead.call_2_date || ""} onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { call_2_date: e.target.value }); }); }} style={{ flex: 1, padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13 }} />
                <select value={newLead.call_2_status || ""} onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { call_2_status: e.target.value }); }); }} style={{ flex: 1, padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                  <option value="">?íƒœ ? íƒ</option>
                  <option value="?µí™”?„ë£Œ">?µí™”?„ë£Œ</option><option value="ë¶€??>ë¶€??/option><option value="ê±°ì ˆ">ê±°ì ˆ</option><option value="ë¬¸ìë°œì†¡">ë¬¸ìë°œì†¡</option><option value="ì¹´í†¡ë°œì†¡">ì¹´í†¡ë°œì†¡</option><option value="ì½œë°±?”ì²­">ì½œë°±?”ì²­</option><option value="ë¯¸íŒ…?ˆì•½">ë¯¸íŒ…?ˆì•½</option><option value="?ë‹´?„ë£Œ">?ë‹´?„ë£Œ</option><option value="?˜ì‹ ê±°ë?">?˜ì‹ ê±°ë?</option>
                </select>
              </div>
              <input value={newLead.call_2_memo || ""} placeholder="2ì°¨ì½œ ë©”ëª¨ (? íƒ)" onChange={function(e) { setNewLead(function(p) { return Object.assign({}, p, { call_2_memo: e.target.value }); }); }} style={{ width: "100%", padding: "10px 13px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }} />
            </div>
            <button onClick={saveNewLead} style={{ width: "100%", padding: "13px", background: "#1A1917", color: "#F7F6F3", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 6 }}>?±ë¡?˜ê¸°</button>
          </div>
        </div>
      </div>)}

      {/* DBë¦¬ìŠ¤???¬ì´?œíŒ¨??*/}
      {selectedLead && (
        <div style={{ position: "fixed", inset: 0, zIndex: 900 }} onClick={function() { setSelectedLead(null); }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 480, height: "100%", background: "#fff", boxShadow: "-4px 0 30px rgba(0,0,0,0.15)", overflowY: "auto" }}
            onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1917" }}>{selectedLead.business_name || "(ë¯¸ì…??"}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{selectedLead.contact || "-"} Â· {selectedLead.assignee || "-"}</div>
              </div>
              <button onClick={function() { setSelectedLead(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#888" }}>??/button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              {/* ê¸°ë³¸ ?•ë³´ ?˜ì • */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 10, letterSpacing: "0.05em" }}>ê¸°ë³¸ ?•ë³´</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>?¬ì—…?ëª…</div>
                  <input value={selectedLead.business_name || ""}
                    onChange={function(e) { setSelectedLead(function(p) { return Object.assign({}, p, { business_name: e.target.value }); }); }}
                    onBlur={async function() {
                      var r = await supabase.from("db_leads").update({ business_name: selectedLead.business_name, updated_at: new Date().toISOString() }).eq("id", selectedLead.id);
                      if (!r.error) setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, { business_name: selectedLead.business_name }) : l; }); });
                    }}
                    style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
                </div>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>?°ë½ì²?/div>
                  <input value={selectedLead.contact || ""}
                    onChange={function(e) { setSelectedLead(function(p) { return Object.assign({}, p, { contact: formatPhone(e.target.value) }); }); }}
                    onBlur={async function() {
                      var v = formatPhone(selectedLead.contact || "");
                      var r = await supabase.from("db_leads").update({ contact: v, updated_at: new Date().toISOString() }).eq("id", selectedLead.id);
                      if (!r.error) setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, { contact: v }) : l; }); });
                    }}
                    style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none" }} />
                </div>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>?´ë‹¹??/div>
                  <select value={selectedLead.assignee || ""}
                    onChange={async function(e) {
                      var v = e.target.value;
                      var r = await supabase.from("db_leads").update({ assignee: v, updated_at: new Date().toISOString() }).eq("id", selectedLead.id);
                      if (!r.error) {
                        setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, { assignee: v }) : l; }); });
                        setSelectedLead(function(p) { return Object.assign({}, p, { assignee: v }); });
                      }
                    }}
                    style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none", cursor: "pointer" }}>
                    <option value="">? íƒ</option>
                    {DB_ASSIGNEES.map(function(a) { return <option key={a} value={a}>{a}</option>; })}
                  </select>
                </div>
                <div style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 13px" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 5 }}>ë°°ì •??/div>
                  <select value={selectedLead.assigned_by || ""}
                    onChange={async function(e) {
                      var v = e.target.value;
                      var r = await supabase.from("db_leads").update({ assigned_by: v, updated_at: new Date().toISOString() }).eq("id", selectedLead.id);
                      if (!r.error) {
                        setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, { assigned_by: v }) : l; }); });
                        setSelectedLead(function(p) { return Object.assign({}, p, { assigned_by: v }); });
                      }
                    }}
                    style={{ width: "100%", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", outline: "none", cursor: "pointer" }}>
                    <option value="">? íƒ</option>
                    {DB_MANAGERS.map(function(a) { return <option key={a} value={a}>{a}</option>; })}
                  </select>
                </div>
              </div>

              {/* ?íƒœ */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 8, letterSpacing: "0.05em" }}>?íƒœ</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {LEAD_STATUSES.map(function(s) {
                    var sc = LEAD_STATUS_COLORS[s] || { bg: "#F7F6F3", text: "#888" };
                    var isActive = selectedLead.status === s;
                    return (
                      <button key={s} onClick={async function() {
                        var r = await supabase.from("db_leads").update({ status: s, updated_at: new Date().toISOString() }).eq("id", selectedLead.id);
                        if (!r.error) {
                          setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, { status: s }) : l; }); });
                          setSelectedLead(function(p) { return Object.assign({}, p, { status: s }); });
                        }
                      }} style={{ padding: "5px 12px", borderRadius: 99, border: isActive ? "2px solid " + sc.text : "1px solid #E8E5E0", background: isActive ? sc.bg : "#fff", color: isActive ? sc.text : "#888", fontSize: 12, fontWeight: isActive ? 700 : 400, cursor: "pointer" }}>{s}</button>
                    );
                  })}
                </div>
              </div>

              {/* 1~5ì°¨ì½œ */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 10, letterSpacing: "0.05em" }}>ì½?ê¸°ë¡</div>
                {[1,2,3,4,5].map(function(ci) {
                  var dateKey = "call_" + ci + "_date";
                  var statusKey = "call_" + ci + "_status";
                  var memoKey = "call_" + ci + "_memo";
                  return (
                    <div key={ci} style={{ background: "#F7F6F3", borderRadius: 8, padding: "10px 14px", marginBottom: 8, borderLeft: (selectedLead[dateKey] || selectedLead[statusKey] || selectedLead[memoKey]) ? "3px solid #4338CA" : "3px solid #E8E5E0" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#4338CA", marginBottom: 6 }}>{ci}ì°¨ì½œ</div>
                      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                        <input type="date" value={selectedLead[dateKey] || ""}
                          onChange={function(e) { setSelectedLead(function(p) { return Object.assign({}, p, { [dateKey]: e.target.value }); }); }}
                          onBlur={async function() {
                            var u = {}; u[dateKey] = selectedLead[dateKey] || null; u.updated_at = new Date().toISOString();
                            var r = await supabase.from("db_leads").update(u).eq("id", selectedLead.id);
                            if (!r.error) setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, u) : l; }); });
                          }}
                          style={{ flex: 1, padding: "6px 8px", border: "1px solid #fff", borderRadius: 6, fontSize: 12, background: "#fff" }} />
                        <select value={selectedLead[statusKey] || ""}
                          onChange={async function(e) {
                            var v = e.target.value;
                            var u = {}; u[statusKey] = v || null; u.updated_at = new Date().toISOString();
                            var r = await supabase.from("db_leads").update(u).eq("id", selectedLead.id);
                            if (!r.error) {
                              setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, u) : l; }); });
                              setSelectedLead(function(p) { return Object.assign({}, p, { [statusKey]: v }); });
                            }
                          }}
                          style={{ flex: 1, padding: "6px 8px", border: "1px solid #fff", borderRadius: 6, fontSize: 12, background: "#fff" }}>
                          <option value="">?íƒœ ? íƒ</option>
                          <option value="?µí™”?„ë£Œ">?µí™”?„ë£Œ</option><option value="ë¶€??>ë¶€??/option><option value="ê±°ì ˆ">ê±°ì ˆ</option>
                          <option value="ë¬¸ìë°œì†¡">ë¬¸ìë°œì†¡</option><option value="ì¹´í†¡ë°œì†¡">ì¹´í†¡ë°œì†¡</option><option value="ì½œë°±?”ì²­">ì½œë°±?”ì²­</option>
                          <option value="ë¯¸íŒ…?ˆì•½">ë¯¸íŒ…?ˆì•½</option><option value="?ë‹´?„ë£Œ">?ë‹´?„ë£Œ</option><option value="?˜ì‹ ê±°ë?">?˜ì‹ ê±°ë?</option>
                        </select>
                      </div>
                      <input value={selectedLead[memoKey] || ""} placeholder={ci + "ì°¨ì½œ ë©”ëª¨ (? íƒ)"}
                        onChange={function(e) { setSelectedLead(function(p) { return Object.assign({}, p, { [memoKey]: e.target.value }); }); }}
                        onBlur={async function() {
                          var u = {}; u[memoKey] = selectedLead[memoKey] || null; u.updated_at = new Date().toISOString();
                          var r = await supabase.from("db_leads").update(u).eq("id", selectedLead.id);
                          if (!r.error) setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, u) : l; }); });
                        }}
                        style={{ width: "100%", padding: "6px 8px", border: "1px solid #fff", borderRadius: 6, fontSize: 12, boxSizing: "border-box", outline: "none", background: "#fff" }} />
                    </div>
                  );
                })}
              </div>

              {/* ?´ìŠˆ ë©”ëª¨ */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 8 }}>?“ ?´ìŠˆ ë©”ëª¨</div>
                <textarea value={selectedLead.etc || ""} placeholder="?´ìŠˆ ?´ìš©???…ë ¥?˜ì„¸??.."
                  onChange={function(e) { setSelectedLead(function(p) { return Object.assign({}, p, { etc: e.target.value }); }); }}
                  onBlur={async function() {
                    var r = await supabase.from("db_leads").update({ etc: selectedLead.etc, updated_at: new Date().toISOString() }).eq("id", selectedLead.id);
                    if (!r.error) setLeads(function(prev) { return prev.map(function(l) { return l.id === selectedLead.id ? Object.assign({}, l, { etc: selectedLead.etc }) : l; }); });
                  }}
                  rows={4} style={{ width: "100%", padding: "10px 12px", border: "1px solid #E8E5E0", borderRadius: 8, fontSize: 13, lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} />
                <div style={{ fontSize: 11, color: "#AAA", marginTop: 4 }}>?…ë ¥ ??ì¹?ë°??´ë¦­ ???ë™ ?€??/div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DBë¦¬ìŠ¤???´ì???ëª¨ë‹¬ */}
      {showLeadTrash && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={function(e) { if (e.target === e.currentTarget) setShowLeadTrash(false); }}>
          <div style={{ background: "#fff", borderRadius: 14, width: 600, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E8E5E0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>?—‘ï¸?DBë¦¬ìŠ¤???´ì???({trashedLeads.length}ê±?</h2>
              <button onClick={function() { setShowLeadTrash(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#888" }}>??/button>
            </div>
            <div style={{ padding: "16px 24px" }}>
              {trashedLeads.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#CCC", fontSize: 13 }}>?´ì??µì´ ë¹„ì–´ ?ˆìŠµ?ˆë‹¤</div>
              ) : (
                trashedLeads.map(function(lead) {
                  var deletedAt = lead.deleted_at ? new Date(lead.deleted_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
                  return (
                    <div key={lead.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F0EDE8" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{lead.business_name}</div>
                        <div style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>?? œ?? {deletedAt} Â· {lead.assignee || "-"}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={function() { restoreLead(lead.id); }} style={{ background: "#EEF2FF", color: "#4338CA", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>ë³µêµ¬</button>
                        <button onClick={function() { permanentDeleteLead(lead.id); }} style={{ background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>?êµ¬?? œ</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
