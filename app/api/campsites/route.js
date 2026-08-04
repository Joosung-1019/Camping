import { fetchAllCampsites, isAutoCampsite } from "@/lib/gocamping";

export const revalidate = 86400;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");
  const includeAll = searchParams.get("type") === "all";
  const keyword = searchParams.get("q");

  let campsites;
  try {
    campsites = await fetchAllCampsites();
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }

  let filtered = includeAll ? campsites : campsites.filter(isAutoCampsite);

  if (region) {
    filtered = filtered.filter((c) => c.doNm === region);
  }

  if (keyword) {
    const lower = keyword.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.addr.toLowerCase().includes(lower)
    );
  }

  return Response.json({ count: filtered.length, items: filtered });
}
