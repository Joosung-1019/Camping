import { getReviews, addReview } from "@/lib/reviews";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const campsiteId = searchParams.get("campsiteId");
  const nickname = searchParams.get("nickname");

  try {
    let reviews = await getReviews();
    if (campsiteId) {
      reviews = reviews.filter((r) => r.campsiteId === campsiteId);
    }
    // 닉네임이 지정되면 본인 기록만 반환 (정식 인증은 아니고, 닉네임 문자열 일치 기준)
    if (nickname) {
      reviews = reviews.filter((r) => r.nickname === nickname);
    } else {
      reviews = [];
    }
    return Response.json({ items: reviews });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { name, nickname, rating } = body;
  if (!name || !nickname || !Number.isFinite(Number(rating))) {
    return Response.json(
      { error: "name, nickname, rating은 필수입니다." },
      { status: 400 }
    );
  }

  const rating5 = Math.min(5, Math.max(1, Math.round(Number(rating))));

  try {
    const review = await addReview({
      campsiteId: body.campsiteId ?? null,
      name,
      addr: body.addr ?? "",
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      nickname,
      rating: rating5,
      memo: body.memo ?? "",
      visitedAt: body.visitedAt ?? null,
    });
    return Response.json(review, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
