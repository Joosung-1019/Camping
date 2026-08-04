"use client";

export default function HomeLocationPicker({
  homeLocation,
  onSetHome,
  pickingHome,
  onTogglePicking,
}) {
  const useGeolocation = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저는 위치 정보를 지원하지 않습니다.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSetHome({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => alert("위치 정보를 가져올 수 없습니다. '지도에서 집 선택'을 이용해주세요."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
      <span className="hidden font-medium sm:inline">우리집:</span>
      {homeLocation ? (
        <span className="text-blue-600">설정됨</span>
      ) : (
        <span className="text-zinc-400">미설정</span>
      )}
      <button
        onClick={useGeolocation}
        className="rounded bg-blue-600 px-2 py-1 text-white hover:bg-blue-700"
      >
        내 위치 사용
      </button>
      <button
        onClick={onTogglePicking}
        className={`rounded px-2 py-1 ${
          pickingHome ? "bg-orange-500 text-white" : "bg-zinc-200 text-zinc-700"
        }`}
      >
        {pickingHome ? "지도를 클릭하세요" : "지도에서 집 선택"}
      </button>
    </div>
  );
}
