"use client";

import { useState } from "react";

function Stars({ value, onChange }) {
  return (
    <div className="flex gap-0.5 text-lg leading-none">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={n <= value ? "text-amber-400" : "text-zinc-300"}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function AddCustomCampsite({
  pickedLocation,
  pickingActive,
  onStartPicking,
  nickname,
  onRequestNickname,
  onSubmit,
  onCancel,
}) {
  const [name, setName] = useState("");
  const [addr, setAddr] = useState("");
  const [rating, setRating] = useState(5);
  const [memo, setMemo] = useState("");
  const [visitedAt, setVisitedAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!nickname) {
      onRequestNickname();
      return;
    }
    if (!name.trim()) {
      setError("캠핑장 이름을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let lat = pickedLocation?.lat ?? null;
      let lng = pickedLocation?.lng ?? null;

      if (lat == null) {
        const candidates = [
          addr.trim(),
          name.trim(),
          [name.trim(), addr.trim()].filter(Boolean).join(" "),
        ].filter(Boolean);

        for (const query of candidates) {
          try {
            const res = await fetch(`/api/geocode?query=${encodeURIComponent(query)}`);
            const geo = await res.json();
            if (!geo.error) {
              lat = geo.lat;
              lng = geo.lng;
              break;
            }
          } catch {
            // 다음 후보로 계속 시도
          }
        }
        // 끝까지 못 찾으면 좌표 없이 저장 (기록은 남고 지도엔 안 뜸)
      }

      await onSubmit({
        name: name.trim(),
        addr: addr.trim(),
        lat,
        lng,
        nickname,
        rating,
        memo,
        visitedAt: visitedAt || null,
      });
    } catch (err) {
      setError(err.message || "저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">캠핑장 직접 추가</h2>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-zinc-700"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">캠핑장 이름 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-zinc-300 px-2 py-1.5"
              placeholder="예: 캠프 올모"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-500">주소</label>
            <input
              type="text"
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              className="w-full rounded border border-zinc-300 px-2 py-1.5"
              placeholder="경기도 가평군 ..."
            />
            <p className="mt-0.5 text-[11px] text-zinc-400">
              저장 시 이름/주소로 위치를 자동으로 찾아요. 다르게 나오면 아래에서 직접 선택하세요.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-500">지도 위치 (직접 선택, 선택사항)</label>
            <button
              type="button"
              onClick={onStartPicking}
              className={`w-full rounded px-2 py-1.5 text-left ${
                pickingActive
                  ? "bg-orange-500 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              {pickingActive
                ? "지도를 클릭해서 위치를 선택하세요"
                : pickedLocation
                ? `📍 위치 선택됨 (${pickedLocation.lat.toFixed(4)}, ${pickedLocation.lng.toFixed(4)})`
                : "지도에서 위치 선택하기"}
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-500">평점</label>
            <Stars value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-500">방문일</label>
            <input
              type="date"
              value={visitedAt}
              onChange={(e) => setVisitedAt(e.target.value)}
              className="w-full rounded border border-zinc-300 px-2 py-1.5"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-500">메모</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              className="w-full rounded border border-zinc-300 px-2 py-1.5"
              placeholder="아이들 반응, 시설 상태 등"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded bg-amber-500 px-3 py-2 text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {nickname ? "저장" : "닉네임 설정하고 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
