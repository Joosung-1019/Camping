export const TAG_DEFS = [
  { id: "sea", label: "바다", icon: "🌊" },
  { id: "valley", label: "계곡", icon: "🏞️" },
  { id: "river", label: "강/호수", icon: "🚣" },
  { id: "mountain", label: "산", icon: "⛰️" },
  { id: "pool", label: "수영장", icon: "🏊" },
  { id: "playground", label: "놀이터", icon: "🛝" },
  { id: "kids", label: "키즈", icon: "🧒" },
  { id: "pet", label: "애견동반", icon: "🐾" },
  { id: "fishing", label: "낚시", icon: "🎣" },
  { id: "trail", label: "산책/등산로", icon: "🥾" },
  { id: "wifi", label: "와이파이", icon: "📶" },
  { id: "glamping", label: "글램핑", icon: "🏕️" },
  { id: "caravan", label: "카라반", icon: "🚐" },
];

const TAG_MAP = Object.fromEntries(TAG_DEFS.map((t) => [t.id, t]));

export function getTagDef(id) {
  return TAG_MAP[id];
}

export function computeTags(c) {
  const loc = c.lctCl || "";
  const nearby = c.posblFcltyCl || "";
  const onsite = c.sbrsCl || "";
  const pet = c.animalCmgCl || "";
  const text = `${c.featureNm || ""} ${c.intro || ""}`;

  const tags = [];
  if (loc.includes("바다") || nearby.includes("해수욕")) tags.push("sea");
  if (loc.includes("계곡") || nearby.includes("계곡")) tags.push("valley");
  if (loc.includes("강") || loc.includes("호수")) tags.push("river");
  if (loc.includes("산")) tags.push("mountain");
  if (onsite.includes("수영장") || onsite.includes("물놀이장") || nearby.includes("수영장"))
    tags.push("pool");
  if (onsite.includes("놀이터")) tags.push("playground");
  if (/키즈|어린이|아이들/.test(text)) tags.push("kids");
  if (pet.includes("가능") && !pet.includes("불가능")) tags.push("pet");
  if (nearby.includes("낚시")) tags.push("fishing");
  if (nearby.includes("등산로") || nearby.includes("산책로")) tags.push("trail");
  if (onsite.includes("와이파이") || onsite.includes("무선인터넷")) tags.push("wifi");
  if (Number(c.glampSiteCo) > 0) tags.push("glamping");
  if (Number(c.caravSiteCo) > 0) tags.push("caravan");
  return tags;
}
