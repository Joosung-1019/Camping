// custom: 캠핑장으로 등록된 리뷰를, 이번에 갱신된 data/localgov-campsites.json의
// 공식 항목과 이름+좌표로 매칭해서 campsiteId를 공식 id로 재연결하는 스크립트.
//
// 사용법:
//   REDIS_URL="redis://..." node scripts/relink-reviews.mjs
//
// 이 스크립트는 raw TCP로 Redis에 접속하므로, TCP 연결이 막힌 원격 샌드박스
// 환경(예: Claude Code 클라우드 세션)에서는 실행할 수 없습니다. 일반 네트워크
// (로컬 PC, Vercel 등)에서 실행해주세요.

import { createClient } from "redis";
import fs from "node:fs";
import path from "node:path";

const REVIEWS_KEY = "camping:reviews";
const EARTH_RADIUS_KM = 6371;
const MATCH_RADIUS_KM = 0.3;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function normStr(s) {
  return (s || "")
    .replace(/[\s\-·,.\(\)"'~!@#$%^&*+=\[\]{}|\\\/:;<>?]/g, "")
    .toLowerCase();
}

function nameSimilar(a, b) {
  const na = normStr(a);
  const nb = normStr(b);
  if (!na || !nb) return false;
  const shorter = na.length <= nb.length ? na : nb;
  const longer = na.length <= nb.length ? nb : na;
  if (shorter.length < 3) return false;
  return longer.includes(shorter);
}

function findMatch(review, localgov) {
  if (review.lat == null || review.lng == null) return null;
  for (const item of localgov) {
    if (!item.lat || !item.lng) continue;
    if (!nameSimilar(review.name, item.name)) continue;
    if (haversineKm(review.lat, review.lng, item.lat, item.lng) <= MATCH_RADIUS_KM) {
      return item;
    }
  }
  return null;
}

async function main() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.error(
      'REDIS_URL 환경변수가 필요합니다. 예) REDIS_URL="redis://..." node scripts/relink-reviews.mjs'
    );
    process.exit(1);
  }

  const localgovPath = path.join(process.cwd(), "data", "localgov-campsites.json");
  const localgov = JSON.parse(fs.readFileSync(localgovPath, "utf8"));
  console.log(`data/localgov-campsites.json 항목 수: ${localgov.length}`);

  const client = createClient({ url });
  client.on("error", (err) => console.error("Redis Client Error", err));
  await client.connect();
  console.log("Redis 연결 성공");

  const raw = await client.get(REVIEWS_KEY);
  const reviews = raw ? JSON.parse(raw) : [];
  console.log(`전체 리뷰 수: ${reviews.length}`);

  let checkedCustom = 0;
  let skippedNoCoord = 0;
  let matchedCount = 0;

  for (const review of reviews) {
    if (!review.campsiteId || !review.campsiteId.startsWith("custom:")) continue;
    checkedCustom++;

    if (review.lat == null || review.lng == null) {
      skippedNoCoord++;
      continue;
    }

    const matched = findMatch(review, localgov);
    if (matched) {
      console.log(`  매칭: "${review.name}" (${review.campsiteId} -> ${matched.id})`);
      review.campsiteId = matched.id;
      matchedCount++;
    }
  }

  console.log(`\ncustom: 리뷰 중 검사 대상: ${checkedCustom}`);
  console.log(`좌표 없어서 건너뜀: ${skippedNoCoord}`);
  console.log(`공식 id로 재연결됨: ${matchedCount}`);

  if (matchedCount > 0) {
    await client.set(REVIEWS_KEY, JSON.stringify(reviews));
    console.log("Redis에 저장 완료");
  } else {
    console.log("변경사항 없음 - 저장 생략");
  }

  await client.quit();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
