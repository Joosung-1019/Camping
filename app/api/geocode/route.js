const KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
const ADDRESS_URL = "https://dapi.kakao.com/v2/local/search/address.json";

async function tryKeyword(query, headers) {
  const res = await fetch(`${KEYWORD_URL}?query=${encodeURIComponent(query)}`, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  const doc = data.documents?.[0];
  if (!doc) return null;
  return { lat: Number(doc.y), lng: Number(doc.x), matchedName: doc.place_name };
}

async function tryAddress(query, headers) {
  const res = await fetch(`${ADDRESS_URL}?query=${encodeURIComponent(query)}`, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  const doc = data.documents?.[0];
  if (!doc) return null;
  return { lat: Number(doc.y), lng: Number(doc.x), matchedName: doc.address_name };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return Response.json({ error: "query 파라미터가 필요합니다." }, { status: 400 });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "KAKAO_REST_API_KEY 환경변수가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const headers = { Authorization: `KakaoAK ${apiKey}` };

  try {
    const result = (await tryAddress(query, headers)) || (await tryKeyword(query, headers));
    if (!result) {
      return Response.json({ error: "주소를 찾을 수 없습니다." }, { status: 404 });
    }
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
