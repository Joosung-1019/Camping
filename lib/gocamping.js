import fs from "node:fs";
import path from "node:path";
import { computeTags } from "./tags";

const BASE_URL = "https://apis.data.go.kr/B551011/GoCamping/basedList";
const PAGE_SIZE = 500;
const MAX_PAGES = 20;

let localGovCache = null;
function loadLocalGovExtras() {
  if (localGovCache) return localGovCache;
  try {
    const filePath = path.join(process.cwd(), "data", "localgov-campsites.json");
    localGovCache = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    localGovCache = [];
  }
  return localGovCache;
}

function normalize(item) {
  const lat = Number(item.mapY);
  const lng = Number(item.mapX);
  if (!lat || !lng) return null;

  const base = {
    id: item.contentId,
    name: item.facltNm,
    addr: [item.addr1, item.addr2].filter(Boolean).join(" "),
    lat,
    lng,
    tel: item.tel || "",
    homepage: (item.homepage || "").replace(/<[^>]*>/g, "").trim(),
    induty: item.induty || "",
    intro: item.intro || item.lineIntro || "",
    featureNm: item.featureNm || "",
    lctCl: item.lctCl || "",
    image: item.firstImageUrl || "",
    doNm: item.doNm || "",
    sigunguNm: item.sigunguNm || "",
    gnrlSiteCo: item.gnrlSiteCo || "",
    autoSiteCo: item.autoSiteCo || "",
    glampSiteCo: item.glampSiteCo || "",
    caravSiteCo: item.caravSiteCo || "",
    sbrsCl: item.sbrsCl || "",
    posblFcltyCl: item.posblFcltyCl || "",
    animalCmgCl: item.animalCmgCl || "",
    toiletCo: item.toiletCo || "",
    swrmCo: item.swrmCo || "",
  };

  base.tags = computeTags(base);
  return base;
}

async function fetchPage(serviceKey, pageNo) {
  const params = new URLSearchParams({
    serviceKey,
    numOfRows: String(PAGE_SIZE),
    pageNo: String(pageNo),
    MobileOS: "ETC",
    MobileApp: "CampingMap",
    _type: "json",
  });

  const res = await fetch(`${BASE_URL}?${params.toString()}`, {
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!res.ok) {
    throw new Error(`GoCamping API 요청 실패: ${res.status}`);
  }

  const data = await res.json();
  const header = data?.response?.header;
  if (header && header.resultCode !== "0000") {
    throw new Error(`GoCamping API 오류: ${header.resultCode} ${header.resultMsg}`);
  }

  const body = data?.response?.body;
  const rawItems = body?.items?.item;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
  const totalCount = Number(body?.totalCount || 0);

  return { items, totalCount };
}

export async function fetchAllCampsites() {
  const serviceKey = process.env.GOCAMPING_SERVICE_KEY;
  if (!serviceKey) {
    throw new Error("GOCAMPING_SERVICE_KEY 환경변수가 설정되지 않았습니다.");
  }

  let all = [];
  let pageNo = 1;
  let totalCount = Infinity;

  while (all.length < totalCount && pageNo <= MAX_PAGES) {
    const { items, totalCount: tc } = await fetchPage(serviceKey, pageNo);
    totalCount = tc;
    if (items.length === 0) break;
    all = all.concat(items);
    pageNo += 1;
  }

  const gocamping = all.map(normalize).filter(Boolean);
  return [...gocamping, ...loadLocalGovExtras()];
}

export function isAutoCampsite(campsite) {
  return campsite.induty.includes("자동차") || Number(campsite.autoSiteCo) > 0;
}
