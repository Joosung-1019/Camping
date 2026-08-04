"use client";

import { TAG_DEFS } from "@/lib/tags";

export default function FilterBar({
  regions,
  region,
  onRegionChange,
  keyword,
  onKeywordChange,
  sortByDistance,
  onToggleSort,
  activeTags,
  onToggleTag,
  includeAllTypes,
  onToggleAllTypes,
  homeLocation,
  count,
}) {
  return (
    <div className="border-t px-4 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={region}
          onChange={(e) => onRegionChange(e.target.value)}
          className="rounded border border-zinc-300 px-2 py-1"
        >
          <option value="">전체 지역</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="캠핑장 이름/주소 검색"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          className="min-w-[140px] flex-1 rounded border border-zinc-300 px-2 py-1"
        />

        <label className="flex items-center gap-1 text-zinc-600">
          <input
            type="checkbox"
            checked={sortByDistance}
            onChange={onToggleSort}
            disabled={!homeLocation}
          />
          거리순
        </label>

        <label className="flex items-center gap-1 text-zinc-600">
          <input type="checkbox" checked={includeAllTypes} onChange={onToggleAllTypes} />
          모든 유형 보기(글램핑·카라반·일반야영장 포함)
        </label>

        <span className="text-zinc-400">{count}곳</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {TAG_DEFS.map((tag) => {
          const active = activeTags.includes(tag.id);
          return (
            <button
              key={tag.id}
              onClick={() => onToggleTag(tag.id)}
              className={`rounded-full border px-2 py-1 text-xs ${
                active
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-zinc-300 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {tag.icon} {tag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
