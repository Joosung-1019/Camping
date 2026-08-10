"use client";

function Stars({ value }) {
  return (
    <span className="text-amber-400">
      {"★".repeat(value)}
      <span className="text-zinc-300">{"★".repeat(5 - value)}</span>
    </span>
  );
}

export default function ReviewsOverview({ reviews, campsites, onSelectCampsite, onClose }) {
  const sorted = [...reviews].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-semibold">내 방문 기록 ({sorted.length}건)</h2>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700" aria-label="닫기">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <p className="p-4 text-sm text-zinc-400">
            아직 기록이 없습니다. 캠핑장을 선택해서 방문 기록을 남겨보세요.
          </p>
        ) : (
          <ul className="divide-y">
            {sorted.map((r) => {
              const campsite = campsites.find((c) => c.id === r.campsiteId);
              return (
                <li key={r.id}>
                  <button
                    onClick={() => campsite && onSelectCampsite(campsite)}
                    disabled={!campsite}
                    className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-zinc-50 disabled:cursor-default"
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="font-medium">{r.name}</span>
                      <Stars value={r.rating} />
                    </div>
                    <span className="text-xs text-zinc-500">
                      {r.nickname}
                      {r.visitedAt && ` · ${r.visitedAt} 방문`}
                    </span>
                    {r.memo && <span className="text-sm text-zinc-600">{r.memo}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
