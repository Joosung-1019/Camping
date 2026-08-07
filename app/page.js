"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import FilterBar from "@/components/FilterBar";
import HomeLocationPicker from "@/components/HomeLocationPicker";
import CampsiteDetail from "@/components/CampsiteDetail";
import CampsiteList from "@/components/CampsiteList";
import NicknameBar from "@/components/NicknameBar";
import AddCustomCampsite from "@/components/AddCustomCampsite";
import ReviewsOverview from "@/components/ReviewsOverview";
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
const NICKNAME_STORAGE_KEY = "campingmap:nickname";

export default function Home() {
  const [campsites, setCampsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [reviews, setReviews] = useState([]);

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

  const [nickname, setNickname] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return window.localStorage.getItem(NICKNAME_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });

  const [region, setRegion] = useState("");
  const [keyword, setKeyword] = useState("");
  const [sortByDistance, setSortByDistance] = useState(false);
  const [activeTags, setActiveTags] = useState([]);
  const [includeAllTypes, setIncludeAllTypes] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showMobileList, setShowMobileList] = useState(false);

  const [showAddCustom, setShowAddCustom] = useState(false);
  const [pickingCustom, setPickingCustom] = useState(false);
  const [pickedCustomLocation, setPickedCustomLocation] = useState(null);
  const [showReviewsOverview, setShowReviewsOverview] = useState(false);

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

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setReviews(data.items || []);
      })
      .catch(() => {});
  }, []);

  const handleSetHome = useCallback((loc) => {
    setHomeLocation(loc);
    setPickingHome(false);
    window.localStorage.setItem(HOME_STORAGE_KEY, JSON.stringify(loc));
  }, []);

  const handleSetNickname = useCallback((value) => {
    setNickname(value);
    window.localStorage.setItem(NICKNAME_STORAGE_KEY, value);
  }, []);

  const requestNickname = useCallback(() => {
    const value = window.prompt(
      "닉네임을 입력해주세요 (방문 기록 작성자 구분용)",
      nickname || ""
    );
    if (value && value.trim()) {
      handleSetNickname(value.trim());
    }
  }, [nickname, handleSetNickname]);

  const handleAddReview = useCallback(async (data) => {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || "저장에 실패했습니다.");
    }
    setReviews((prev) => [...prev, result]);
    return result;
  }, []);

  const handleStartPickingCustom = useCallback(() => {
    setPickingHome(false);
    setPickingCustom(true);
  }, []);

  const handlePick = useCallback(
    (loc) => {
      if (pickingCustom) {
        setPickedCustomLocation(loc);
        setPickingCustom(false);
      } else {
        handleSetHome(loc);
      }
    },
    [pickingCustom, handleSetHome]
  );

  const handleSubmitCustomCampsite = useCallback(
    async (data) => {
      const campsiteId = `custom:${data.name}`;
      await handleAddReview({ ...data, campsiteId });
      setShowAddCustom(false);
      setPickedCustomLocation(null);
    },
    [handleAddReview]
  );

  const customPins = useMemo(() => {
    const seen = new Map();
    for (const r of reviews) {
      if (r.campsiteId?.startsWith("custom:") && r.lat && r.lng && !seen.has(r.campsiteId)) {
        seen.set(r.campsiteId, {
          id: r.campsiteId,
          name: r.name,
          addr: r.addr || "",
          lat: r.lat,
          lng: r.lng,
          tel: "",
          homepage: "",
          induty: "직접 추가",
          intro: "",
          featureNm: "",
          lctCl: "",
          image: "",
          doNm: "",
          sigunguNm: "",
          gnrlSiteCo: "",
          autoSiteCo: "",
          glampSiteCo: "",
          caravSiteCo: "",
          sbrsCl: "",
          posblFcltyCl: "",
          animalCmgCl: "",
          toiletCo: "",
          swrmCo: "",
          tags: [],
        });
      }
    }
    return Array.from(seen.values());
  }, [reviews]);

  const allCampsites = useMemo(
    () => [...campsites, ...customPins],
    [campsites, customPins]
  );

  const regions = useMemo(
    () => Array.from(new Set(campsites.map((c) => c.doNm).filter(Boolean))).sort(),
    [campsites]
  );

  const filtered = useMemo(() => {
    let list = allCampsites;
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
  }, [allCampsites, region, keyword, activeTags, sortByDistance, homeLocation]);

  const handleSelect = useCallback((c) => {
    setSelected(c);
    setShowMobileList(false);
    setShowReviewsOverview(false);
  }, []);
  const handleClose = useCallback(() => setSelected(null), []);

  const pickingActive = pickingHome || pickingCustom;

  return (
    <div className="flex h-dvh flex-col">
      <header className="border-b bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
          <h1 className="text-base font-bold">전국 오토캠핑장 지도</h1>
          <div className="flex flex-wrap items-center gap-2">
            <NicknameBar nickname={nickname} onRequestNickname={requestNickname} />
            <button
              onClick={() => setShowReviewsOverview(true)}
              className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-700 hover:bg-amber-200"
            >
              ⭐ 내 기록 ({reviews.length})
            </button>
            <button
              onClick={() => {
                setShowAddCustom(true);
                setPickedCustomLocation(null);
              }}
              className="rounded bg-zinc-900 px-2 py-1 text-xs text-white hover:bg-zinc-700"
            >
              + 캠핑장 직접 추가
            </button>
            <HomeLocationPicker
              homeLocation={homeLocation}
              onSetHome={handleSetHome}
              pickingHome={pickingHome}
              onTogglePicking={() => {
                setPickingCustom(false);
                setPickingHome((v) => !v);
              }}
            />
          </div>
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
              reviews={reviews}
              nickname={nickname}
              onRequestNickname={requestNickname}
              onAddReview={handleAddReview}
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
            pickingActive={pickingActive}
            onPick={handlePick}
          />

          {selected && (
            <div className="absolute inset-x-0 bottom-0 max-h-[65%] overflow-y-auto rounded-t-2xl bg-white shadow-2xl md:hidden">
              <CampsiteDetail
                key={selected.id}
                campsite={selected}
                homeLocation={homeLocation}
                onClose={handleClose}
                reviews={reviews}
                nickname={nickname}
                onRequestNickname={requestNickname}
                onAddReview={handleAddReview}
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

      {showAddCustom && (
        <div className={pickingCustom ? "hidden" : ""}>
          <AddCustomCampsite
            pickedLocation={pickedCustomLocation}
            pickingActive={pickingCustom}
            onStartPicking={handleStartPickingCustom}
            nickname={nickname}
            onRequestNickname={requestNickname}
            onSubmit={handleSubmitCustomCampsite}
            onCancel={() => {
              setShowAddCustom(false);
              setPickingCustom(false);
              setPickedCustomLocation(null);
            }}
          />
        </div>
      )}

      {showReviewsOverview && (
        <ReviewsOverview
          reviews={reviews}
          campsites={allCampsites}
          onSelectCampsite={handleSelect}
          onClose={() => setShowReviewsOverview(false)}
        />
      )}
    </div>
  );
}
