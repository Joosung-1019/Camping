const CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

function simplifyCurrent(data) {
  return {
    temp: Math.round(data.main?.temp),
    feelsLike: Math.round(data.main?.feels_like),
    humidity: data.main?.humidity,
    description: data.weather?.[0]?.description || "",
    icon: data.weather?.[0]?.icon || "",
    windSpeed: data.wind?.speed,
  };
}

function simplifyForecast(data) {
  const tzOffsetSec = data.city?.timezone || 0;
  return (data.list || []).map((entry) => {
    const localDate = new Date((entry.dt + tzOffsetSec) * 1000);
    return {
      dt: entry.dt,
      date: localDate.toISOString().slice(0, 10),
      hour: localDate.getUTCHours(),
      temp: Math.round(entry.main?.temp),
      tempMin: Math.round(entry.main?.temp_min),
      tempMax: Math.round(entry.main?.temp_max),
      description: entry.weather?.[0]?.description || "",
      icon: entry.weather?.[0]?.icon || "",
      pop: entry.pop,
    };
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return Response.json({ error: "lat, lon 파라미터가 필요합니다." }, { status: 400 });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OPENWEATHER_API_KEY 환경변수가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const roundedLat = lat.toFixed(2);
  const roundedLon = lon.toFixed(2);
  const commonParams = `lat=${roundedLat}&lon=${roundedLon}&appid=${apiKey}&units=metric&lang=kr`;

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${CURRENT_URL}?${commonParams}`, { next: { revalidate: 1800 } }),
      fetch(`${FORECAST_URL}?${commonParams}`, { next: { revalidate: 1800 } }),
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      return Response.json({ error: "날씨 API 요청 실패" }, { status: 502 });
    }

    const [currentData, forecastData] = await Promise.all([
      currentRes.json(),
      forecastRes.json(),
    ]);

    return Response.json({
      current: simplifyCurrent(currentData),
      forecast: simplifyForecast(forecastData),
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
