const TMAP_ROUTES_URL = "https://apis.openapi.sk.com/tmap/routes?version=1";
const OSRM_ROUTES_URL = "https://router.project-osrm.org/route/v1/driving";

async function tryTmap({ startLat, startLng, endLat, endLng }) {
  const appKey = process.env.TMAP_APP_KEY;
  if (!appKey) return null;

  const res = await fetch(TMAP_ROUTES_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      appKey,
    },
    body: JSON.stringify({
      startX: String(startLng),
      startY: String(startLat),
      endX: String(endLng),
      endY: String(endLat),
      startName: encodeURIComponent("출발"),
      endName: encodeURIComponent("도착"),
      reqCoordType: "WGS84GEO",
      resCoordType: "WGS84GEO",
      searchOption: "0",
    }),
    next: { revalidate: 3600 },
  });

  if (!res.ok) return null;

  const data = await res.json();
  const props = data?.features?.[0]?.properties;
  if (!props || !props.totalDistance || !props.totalTime) return null;

  return {
    distanceKm: Math.round((props.totalDistance / 1000) * 10) / 10,
    durationMin: Math.round(props.totalTime / 60),
    source: "tmap",
  };
}

async function tryOsrm({ startLat, startLng, endLat, endLng }) {
  const url = `${OSRM_ROUTES_URL}/${startLng},${startLat};${endLng},${endLat}?overview=false`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;

  const data = await res.json();
  const route = data?.routes?.[0];
  if (!route) return null;

  return {
    distanceKm: Math.round((route.distance / 1000) * 10) / 10,
    durationMin: Math.round(route.duration / 60),
    source: "osrm",
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const startLat = Number(searchParams.get("startLat"));
  const startLng = Number(searchParams.get("startLng"));
  const endLat = Number(searchParams.get("endLat"));
  const endLng = Number(searchParams.get("endLng"));

  if (
    ![startLat, startLng, endLat, endLng].every((n) => Number.isFinite(n))
  ) {
    return Response.json(
      { error: "startLat, startLng, endLat, endLng 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  const coords = { startLat, startLng, endLat, endLng };

  try {
    const result =
      (await tryTmap(coords).catch(() => null)) ||
      (await tryOsrm(coords).catch(() => null));

    if (!result) {
      return Response.json({ error: "이동시간 정보를 가져오지 못했습니다." }, { status: 502 });
    }

    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
