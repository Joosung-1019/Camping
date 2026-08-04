"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import FilterBar from "@/components/FilterBar";
import HomeLocationPicker from "@/components/HomeLocationPicker";
import CampsiteDetail from "@/components/CampsiteDetail";
import CampsiteList from "@/components/CampsiteList";
import { haversineKm } from "@/lib/distance";

const KakaoMap = dynamic(() => import("@/components/KakaoMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-zinc-400">
      지도를 불러오는 중...
    </div>
  ),
});

const HOME_STORAGE_KEY = "campingmap:home";

export default function Home() {
  const [campsites, setCampsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [homeLocation, setHomeLocation] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = window.localStorage.getItem(HOME_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [pickingHome, setPickingHome] = useState(false);

  const [region, setRegion] = useState("");
  const [keyword, setKeyword] = useState("");
  const [sortByDistance, setSortByDistance] = useState(false);
  const [activeTags, setActiveTags] = useState([]);
  const [includeAllTypes, setIncludeAllTypes] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showMobileList, setShowMobileList] = useState(false);

  const toggleTag = useCallback((tagId) => {
    setActiveTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }, []);

  useEffect(() => {
    fetch(`/api/campsites${includeAllTypes ? "?type=all" : ""}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setLoadError(data.error);
        else setCampsites(data.items);
      })
      .catch(() => setLoadError("캠핑장 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [includeAllTypes]);

  const handleSetHome = useCallback((loc) => {
    setHomeLocation(loc);
    setPickingHome(false);
    window.localStorage.setItem(HOME_STORAGE_KEY, JSON.stringify(loc));
  }, []);

  const regions = useMemo(
    () => Array.from(new Set(campsites.map((c) => c.doNm).filter(Boolean))).sort(),
    [campsites]
  );

  const filtered = useMemo(() => {
    let list = campsites;
    if (region) list = list.filter((c) => c.doNm === region);
    if (keyword.trim()) {
      const lower = keyword.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) || c.addr.toLowerCase().includes(lower)
      );
    }
    if (activeTags.length > 0) {
      list = list.filter((c) => activeTags.every((t) => c.tags?.includes(t)));
    }
    if (sortByDistance && homeLocation) {
      list = [...list].sort(
        (a, b) =>
          haversineKm(homeLocation.lat, homeLocation.lng, a.lat, a.lng) -
          haversineKm(homeLocation.lat, homeLocation.lng, b.lat, b.lng)
      );
    }
    return list;
  }, [campsites, region, keyword, activeTags, sortByDistance, homeLocation]);

  const handleSelect = useCallback((c) => {
    setSelected(c);
    setShowMobileList(false);
  }, []);
  const handleClose = useCallback(() => setSelected(null), []);

  return (
    <div className="flex h-dvh flex-col">
      <header className="border-b bg-white">
        <div className="flex items-center justify-between px-4 py-2">
          <h1 className="text-base font-bold">전국 오토캠핑장 지도</h1>
          <HomeLocationPicker
            homeLocation={homeLocation}
            onSetHome={handleSetHome}
            pickingHome={pickingHome}
            onTogglePicking={() => setPickingHome((v) => !v)}
          />
        </div>
        <FilterBar
          regions={regions}
          region={region}
          onRegionChange={setRegion}
          keyword={keyword}
          onKeywordChange={setKeyword}
          sortByDistance={sortByDistance}
          onToggleSort={() => setSortByDistance((v) => !v)}
          activeTags={activeTags}
          onToggleTag={toggleTag}
          includeAllTypes={includeAllTypes}
          onToggleAllTypes={() => setIncludeAllTypes((v) => !v)}
          homeLocation={homeLocation}
          count={filtered.length}
        />
      </header>

      {loadError && (
        <div className="bg-red-50 px-4 py-2 text-sm text-red-600">{loadError}</div>
      )}

      <div className="relative flex flex-1 overflow-hidden">
        <div className="hidden w-80 shrink-0 overflow-y-auto border-r bg-white md:block">
          {selected ? (
            <CampsiteDetail
              key={selected.id}
              campsite={selected}
              homeLocation={homeLocation}
              onClose={handleClose}
            />
          ) : (
            <CampsiteList
              campsites={filtered}
              homeLocation={homeLocation}
              loading={loading}
              onSelect={handleSelect}
            />
          )}
        </div>

        <div className="relative flex-1">
          <KakaoMap
            campsites={filtered}
            homeLocation={homeLocation}
            selected={selected}
            onSelect={handleSelect}
            pickingHome={pickingHome}
            onPickHome={handleSetHome}
          />

          {selected && (
            <div className="absolute inset-x-0 bottom-0 max-h-[65%] overflow-y-auto rounded-t-2xl bg-white shadow-2xl md:hidden">
              <CampsiteDetail
                key={selected.id}
                campsite={selected}
                homeLocation={homeLocation}
                onClose={handleClose}
              />
            </div>
          )}

          {!selected && !showMobileList && (
            <button
              onClick={() => setShowMobileList(true)}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg md:hidden"
            >
              📋 목록 보기 ({filtered.length}곳)
            </button>
          )}

          {showMobileList && !selected && (
            <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col overflow-hidden bg-white md:hidden">
              <div className="flex items-center justify-between border-b px-4 py-2">
                <span className="font-semibold">캠핑장 목록 ({filtered.length}곳)</span>
                <button
                  onClick={() => setShowMobileList(false)}
                  className="text-zinc-400 hover:text-zinc-700"
                  aria-label="닫기"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <CampsiteList
                  campsites={filtered}
                  homeLocation={homeLocation}
                  loading={loading}
                  onSelect={handleSelect}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
