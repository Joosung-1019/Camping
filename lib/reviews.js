import { createClient } from "redis";

const REVIEWS_KEY = "camping:reviews";

let clientPromise = null;

function getClient() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL 환경변수가 설정되지 않았습니다.");
  }
  if (!clientPromise) {
    const client = createClient({ url });
    client.on("error", (err) => console.error("Redis Client Error", err));
    clientPromise = client.connect().then(() => client);
  }
  return clientPromise;
}

export async function getReviews() {
  const client = await getClient();
  const raw = await client.get(REVIEWS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addReview(review) {
  const client = await getClient();
  const reviews = await getReviews();
  const newReview = {
    id: crypto.randomUUID(),
    campsiteId: review.campsiteId ?? null,
    name: review.name,
    addr: review.addr ?? "",
    lat: review.lat ?? null,
    lng: review.lng ?? null,
    nickname: review.nickname,
    rating: review.rating,
    memo: review.memo ?? "",
    visitedAt: review.visitedAt ?? null,
    createdAt: Date.now(),
  };
  reviews.push(newReview);
  await client.set(REVIEWS_KEY, JSON.stringify(reviews));
  return newReview;
}

export async function deleteReview(id, nickname) {
  const client = await getClient();
  const reviews = await getReviews();
  const idx = reviews.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  if (reviews[idx].nickname !== nickname) return false;
  reviews.splice(idx, 1);
  await client.set(REVIEWS_KEY, JSON.stringify(reviews));
  return true;
}
