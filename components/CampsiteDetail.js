"use client";

import { useEffect, useMemo, useState } from "react";
import { haversineKm, formatDistanceKm } from "@/lib/distance";
import { getTagDef } from "@/lib/tags";
import ReviewSection from "./ReviewSection";

function todayKST() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

export default function CampsiteDetail({
  campsite,
  homeLocation,
  onClose,
  reviews,
  nickname,
  onRequestNickname,
  onAddReview,
}) {
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(null);
  const loadingWeather = !weather && !weatherError;
  const [selectedDate, setSelectedDate] = useState(todayKST());

  const [driving, setDriving] = useState(null);
  const [drivingError, setDrivingError] = useState(null);
  const loadingDriving = Boolean(homeLocation) && !driving && !drivingError;

  useEffect(() => {
    if (!campsite) return;
    fetch(`/api/weather?lat=${campsite.lat}&lon=${campsite.lng}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setWeatherError(data.error);
        else setWeather(data);
      })
      .catch(() => setWeatherError("날씨 정보를 가져오지 못했습니다."));
  }, [campsite]);

  useEffect(() => {
    if (!campsite || !homeLocation) return;
    const params = new URLSearchParams({
      startLat: String(homeLocation.lat),
      startLng: String(homeLocation.lng),
      endLat: String(campsite.lat),
      endLng: String(campsite.lng),
    });
    fetch(`/api/directions?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setDrivingError(data.error);
        else setDriving(data);
      })
      .catch(() => setDrivingError("이동시간 정보를 가져오지 못했습니다."));
  }, [campsite, homeLocation]);

  const availableDates = useMemo(
    () => [...new Set((weather?.forecast || []).map((e) => e.date))].sort(),
    [weather]
  );
  const today = todayKST();
  const minDate = availableDates[0] || today;
  const maxDate = availableDates[availableDates.length - 1] || today;
  const dayEntries = useMemo(
    () => (weather?.forecast || []).filter((e) => e.date === selectedDate),
    [weather, selectedDate]
  );

  if (!campsite) return null;

  const distance = homeLocation
    ? haversineKm(homeLocation.lat, homeLocation.lng, campsite.lat, campsite.lng)
    : null;

  const camfitUrl = `https://camfit.co.kr/search?keyword=${encodeURIComponent(
    campsite.name
  )}`;
  const thankqUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `site:thankqcamping.com ${campsite.name}`
  )}`;

  const facts = [
    campsite.autoSiteCo && `자동차야영 사이트 ${campsite.autoSiteCo}면`,
    campsite.gnrlSiteCo && `일반야영 사이트 ${campsite.gnrlSiteCo}면`,
    campsite.toiletCo && `화장실 ${campsite.toiletCo}개`,
    campsite.swrmCo && `샤워장 ${campsite.swrmCo}개`,
    campsite.sbrsCl && `부대시설: ${campsite.sbrsCl}`,
    campsite.posblFcltyCl && `주변시설: ${campsite.posblFcltyCl}`,
    campsite.animalCmgCl && `반려동물: ${campsite.animalCmgCl}`,
  ].filter(Boolean);

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-bold">
          {campsite.name}
          {campsite.induty && (
            <span className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 align-middle text-xs font-normal text-zinc-500">
              {campsite.induty}
            </span>
          )}
        </h2>
        <button
          onClick={onClose}
          className="shrink-0 text-zinc-400 hover:text-zinc-700"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>

      {campsite.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={campsite.image}
          alt={campsite.name}
          className="mt-2 h-40 w-full rounded object-cover"
        />
      )}

      {campsite.tags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {campsite.tags.map((tagId) => {
            const tag = getTagDef(tagId);
            if (!tag) return null;
            return (
              <span
                key={tagId}
                className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
              >
                {tag.icon} {tag.label}
              </span>
            );
          })}
        </div>
      )}

      <div className="mt-3 space-y-1 text-sm text-zinc-600">
        <p>{campsite.addr}</p>
        {campsite.tel && <p>전화: {campsite.tel}</p>}
        {distance !== null && (
          <p className="font-medium text-blue-600">
            우리집에서 직선거리 약 {formatDistanceKm(distance)}
          </p>
        )}
        {loadingDriving && <p className="text-zinc-400">자동차 이동시간 계산 중...</p>}
        {drivingError && <p className="text-zinc-400">{drivingError}</p>}
        {driving && (
          <p className="font-medium text-blue-600">
            자동차로 약 {driving.durationMin}분 ({driving.distanceKm}km)
          </p>
        )}
      </div>

      <div className="mt-3 rounded bg-zinc-50 p-3 text-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="font-semibold">날씨</h3>
          {weather && (
            <input
              type="date"
              value={selectedDate}
              min={minDate}
              max={maxDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded border border-zinc-300 px-2 py-1 text-xs"
            />
          )}
        </div>

        {loadingWeather && <p className="text-zinc-400">불러오는 중...</p>}
        {weatherError && <p className="text-red-500">{weatherError}</p>}

        {weather && selectedDate === today && (
          <div className="mb-2">
            <p>
              현재 {weather.current.temp}°C (체감 {weather.current.feelsLike}°C),{" "}
              {weather.current.description}
            </p>
            <p className="text-zinc-500">
              습도 {weather.current.humidity}% · 바람 {weather.current.windSpeed}m/s
            </p>
          </div>
        )}

        {weather && dayEntries.length > 0 && (
          <div>
            <p className="mb-1 font-medium">
              {selectedDate} 예보: 최저{" "}
              {Math.min(...dayEntries.map((e) => e.tempMin))}°C / 최고{" "}
              {Math.max(...dayEntries.map((e) => e.tempMax))}°C
            </p>
            <ul className="space-y-0.5 text-zinc-600">
              {dayEntries.map((e) => (
                <li key={e.dt}>
                  {String(e.hour).padStart(2, "0")}시 · {e.temp}°C · {e.description}
                  {typeof e.pop === "number" && ` · 강수확률 ${Math.round(e.pop * 100)}%`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {weather && dayEntries.length === 0 && selectedDate !== today && (
          <p className="text-zinc-400">
            이 날짜의 예보는 제공되지 않습니다 (무료 API 특성상 최대 {maxDate}까지만 제공돼요).
          </p>
        )}
      </div>

      <ReviewSection
        campsiteId={campsite.id}
        name={campsite.name}
        addr={campsite.addr}
        lat={campsite.lat}
        lng={campsite.lng}
        reviews={reviews}
        nickname={nickname}
        onRequestNickname={onRequestNickname}
        onAddReview={onAddReview}
      />

      {facts.length > 0 && (
        <div className="mt-3 text-sm">
          <h3 className="mb-1 font-semibold">시설 정보</h3>
          <ul className="list-inside list-disc text-zinc-600">
            {facts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {campsite.homepage && (
          <a
            href={campsite.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-zinc-300 px-3 py-2 text-center text-sm hover:bg-zinc-50"
          >
            공식 홈페이지
          </a>
        )}
        <a
          href={camfitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-emerald-600 px-3 py-2 text-center text-sm text-white hover:bg-emerald-700"
        >
          캠핏에서 예약하기
        </a>
        <a
          href={thankqUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-sky-600 px-3 py-2 text-center text-sm text-white hover:bg-sky-700"
        >
          땡큐캠핑에서 찾아보기
        </a>
      </div>
    </div>
  );
}
