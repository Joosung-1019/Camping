"use client";

import { useEffect, useRef, useState } from "react";

let scriptLoadingPromise = null;

function loadKakaoMapsScript(appKey) {
  if (window.kakao && window.kakao.maps && window.kakao.maps.Map) {
    return Promise.resolve();
  }
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => resolve());
    };
    script.onerror = () =>
      reject(new Error("카카오맵 스크립트를 불러오지 못했습니다. JavaScript 키를 확인해주세요."));
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

function markerImage(color, size) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" stroke="white" stroke-width="2"/></svg>`;
  const url = `data:image/svg+xml;base64,${btoa(svg)}`;
  return new window.kakao.maps.MarkerImage(
    url,
    new window.kakao.maps.Size(size, size),
    { offset: new window.kakao.maps.Point(size / 2, size / 2) }
  );
}

function starPath(cx, cy, outerR, innerR) {
  const points = 5;
  const step = Math.PI / points;
  let d = "";
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1);
  }
  return d + "Z";
}

function starMarkerImage(color, size) {
  const cx = size / 2;
  const cy = size / 2;
  const path = starPath(cx, cy, size / 2 - 1, (size / 2 - 1) * 0.45);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><path d="${path}" fill="${color}" stroke="white" stroke-width="1.5"/></svg>`;
  const url = `data:image/svg+xml;base64,${btoa(svg)}`;
  return new window.kakao.maps.MarkerImage(url, new window.kakao.maps.Size(size, size), {
    offset: new window.kakao.maps.Point(cx, cy),
  });
}

export default function KakaoMap({
  campsites,
  homeLocation,
  selected,
  onSelect,
  pickingActive,
  onPick,
  reviewedIds,
}) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const homeOverlayRef = useRef(null);
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!appKey) return;
    loadKakaoMapsScript(appKey)
      .then(() => {
        if (!mapElRef.current || mapRef.current) return;
        mapRef.current = new window.kakao.maps.Map(mapElRef.current, {
          center: new window.kakao.maps.LatLng(36.5, 127.8),
          level: 12,
        });
        setLoaded(true);
      })
      .catch((err) => setError(err.message));
  }, [appKey]);

  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const listener = window.kakao.maps.event.addListener(
      mapRef.current,
      "click",
      (mouseEvent) => {
        if (pickingActive) {
          onPick({
            lat: mouseEvent.latLng.getLat(),
            lng: mouseEvent.latLng.getLng(),
          });
        }
      }
    );
    return () => window.kakao.maps.event.removeListener(listener);
  }, [loaded, pickingActive, onPick]);

  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = campsites.map((c) => {
      const isSelected = selected?.id === c.id;
      const isReviewed = reviewedIds?.has(c.id);
      const image = isSelected
        ? markerImage("#f97316", 22)
        : isReviewed
        ? starMarkerImage("#f59e0b", 20)
        : markerImage("#16a34a", 15);
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(c.lat, c.lng),
        map: mapRef.current,
        image,
        zIndex: isSelected ? 100 : isReviewed ? 10 : 1,
        title: c.name,
      });
      window.kakao.maps.event.addListener(marker, "click", () => onSelect(c));
      return marker;
    });
  }, [loaded, campsites, selected, onSelect, reviewedIds]);

  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    if (homeOverlayRef.current) {
      homeOverlayRef.current.setMap(null);
      homeOverlayRef.current = null;
    }
    if (homeLocation) {
      homeOverlayRef.current = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(homeLocation.lat, homeLocation.lng),
        content:
          '<div style="background:#2563eb;color:white;font-size:11px;padding:2px 8px;border-radius:12px;border:2px solid white;white-space:nowrap">우리집</div>',
        yAnchor: 1.4,
        zIndex: 200,
      });
      homeOverlayRef.current.setMap(mapRef.current);
    }
  }, [loaded, homeLocation]);

  useEffect(() => {
    if (!loaded || !mapRef.current || !selected) return;
    mapRef.current.panTo(new window.kakao.maps.LatLng(selected.lat, selected.lng));
  }, [loaded, selected]);

  if (!appKey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-red-50 p-4 text-center text-sm text-red-600">
        NEXT_PUBLIC_KAKAO_MAP_APP_KEY 환경변수가 설정되지 않았습니다.
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-red-50 p-4 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={mapElRef}
      className={`h-full w-full ${pickingActive ? "cursor-crosshair" : ""}`}
      style={{ filter: "contrast(1.25) saturate(1.4) brightness(0.97)" }}
    />
  );
}
