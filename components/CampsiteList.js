"use client";

import { haversineKm, formatDistanceKm } from "@/lib/distance";
import { getTagDef } from "@/lib/tags";

export default function CampsiteList({ campsites, homeLocation, loading, onSelect }) {
  if (loading) {
    return <p className="p-4 text-sm text-zinc-400">캠핑장 정보를 불러오는 중...</p>;
  }
  if (campsites.length === 0) {
    return <p className="p-4 text-sm text-zinc-400">조건에 맞는 캠핑장이 없습니다.</p>;
  }

  return (
    <ul className="divide-y">
      {campsites.map((c) => {
        const distance = homeLocation
          ? haversineKm(homeLocation.lat, homeLocation.lng, c.lat, c.lng)
          : null;
        return (
          <li key={c.id}>
            <button
              onClick={() => onSelect(c)}
              className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-zinc-50"
            >
              <span className="font-medium">
                {c.name}
                {c.induty && (
                  <span className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-normal text-zinc-500">
                    {c.induty}
                  </span>
                )}
              </span>
              <span className="text-xs text-zinc-500">{c.addr}</span>
              {c.tags?.length > 0 && (
                <span className="text-xs">
                  {c.tags
                    .map((tagId) => getTagDef(tagId)?.icon)
                    .filter(Boolean)
                    .join(" ")}
                </span>
              )}
              {distance !== null && (
                <span className="text-xs font-medium text-blue-600">
                  약 {formatDistanceKm(distance)}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
