import { deleteReview } from "@/lib/reviews";

export async function DELETE(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const nickname = searchParams.get("nickname");

  if (!nickname) {
    return Response.json({ error: "nickname 파라미터가 필요합니다." }, { status: 400 });
  }

  try {
    const ok = await deleteReview(id, nickname);
    if (!ok) {
      return Response.json(
        { error: "삭제할 기록을 찾을 수 없거나 작성자만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
