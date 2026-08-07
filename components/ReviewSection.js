"use client";

import { useState } from "react";

function Stars({ value, onChange }) {
  return (
    <div className="flex gap-0.5 text-lg leading-none">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={n <= value ? "text-amber-400" : "text-zinc-300"}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({
  campsiteId,
  name,
  addr,
  lat,
  lng,
  reviews,
  nickname,
  onRequestNickname,
  onAddReview,
}) {
  const [rating, setRating] = useState(5);
  const [memo, setMemo] = useState("");
  const [visitedAt, setVisitedAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const campsiteReviews = reviews
    .filter((r) => r.campsiteId === campsiteId)
    .sort((a, b) => b.createdAt - a.createdAt);

  const handleSubmit = async () => {
    if (!nickname) {
      onRequestNickname();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onAddReview({
        campsiteId,
        name,
        addr,
        lat,
        lng,
        nickname,
        rating,
        memo,
        visitedAt: visitedAt || null,
      });
      setMemo("");
      setVisitedAt("");
      setRating(5);
    } catch (err) {
      setError(err.message || "저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 rounded bg-amber-50 p-3 text-sm">
      <h3 className="mb-2 font-semibold">방문 기록</h3>

      {campsiteReviews.length > 0 && (
        <ul className="mb-3 space-y-2">
          {campsiteReviews.map((r) => (
            <li key={r.id} className="border-b border-amber-100 pb-2 last:border-0">
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.nickname}</span>
                <Stars value={r.rating} />
              </div>
              {r.visitedAt && (
                <p className="text-xs text-zinc-500">{r.visitedAt} 방문</p>
              )}
              {r.memo && <p className="text-zinc-600">{r.memo}</p>}
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <Stars value={rating} onChange={setRating} />
        <input
          type="date"
          value={visitedAt}
          onChange={(e) => setVisitedAt(e.target.value)}
          className="w-full rounded border border-zinc-300 px-2 py-1 text-xs"
        />
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="메모 (아이들 반응, 시설 상태 등)"
          rows={2}
          className="w-full rounded border border-zinc-300 px-2 py-1 text-xs"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded bg-amber-500 px-3 py-1.5 text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {nickname ? "기록 저장" : "닉네임 설정하고 저장"}
        </button>
      </div>
    </div>
  );
}
