import "server-only";
import { serverEnv } from "./env";

/**
 * SK TMAP Open API.
 *
 * Endpoint:
 *   GET https://apis.openapi.sk.com/tmap/...
 * Auth:
 *   header `appKey: {APP_KEY}` 또는 query `appKey={KEY}`
 *
 * 주요 사용처:
 * - 주변 카테고리 검색 (좌표+반경+카테고리, 카카오 CE7 대체)
 * - 통합 POI 검색 (키워드)
 * - 지오코딩 (주소→좌표)
 */

export type TmapPoi = {
  id: string;
  name: string;
  category: string;
  address: string;
  roadAddress?: string;
  telephone?: string;
  lat: number;     // WGS84
  lng: number;     // WGS84
  distance?: number; // 미터 (계산 후 채워짐)
};

export type TmapSearchResult = {
  ok: boolean;
  query: string;
  total: number;
  pois: TmapPoi[];
  attempt: {
    httpStatus?: number;
    durationMs: number;
    error?: string;
  };
};

const BASE_URL = "https://apis.openapi.sk.com/tmap";

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** TMAP POI item → 표준 TmapPoi 변환 */
function normalizePoi(raw: Record<string, string>): TmapPoi | null {
  // TMAP 응답은 noorLat/noorLon (도로) 또는 frontLat/frontLon (정문) 둘 다 있음
  const lat = Number(raw.noorLat ?? raw.frontLat ?? raw.lat);
  const lng = Number(raw.noorLon ?? raw.frontLon ?? raw.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  // 주소 조합 (upperAddrName + middleAddrName + lowerAddrName + detailAddrName)
  const addressParts = [
    raw.upperAddrName,
    raw.middleAddrName,
    raw.lowerAddrName,
    raw.detailAddrName
  ].filter(Boolean);
  const roadParts = [raw.upperAddrName, raw.middleAddrName, raw.roadName, raw.firstBuildNo].filter(Boolean);
  return {
    id: raw.id ?? "",
    name: raw.name ?? "",
    category: raw.bizCatName ?? raw.categoryName ?? raw.middleBizName ?? "",
    address: addressParts.join(" "),
    roadAddress: roadParts.length > 0 ? roadParts.join(" ") : undefined,
    telephone: raw.telNo,
    lat,
    lng
  };
}

/**
 * 주변 카테고리 검색 — 좌표+반경+카테고리 코드로 POI 검색.
 * 카페/음식점 같은 카테고리에 가장 적합.
 *
 * @param args.cx       경도 (WGS84)
 * @param args.cy       위도 (WGS84)
 * @param args.radius   반경 (미터, 0~33000)
 * @param args.categories 카테고리명 (예: "카페", "음식점", "초등학교")
 *                       복수 지정 시 세미콜론 구분 (예: "카페;커피전문점")
 */
export async function searchTmapAroundCategory(args: {
  cx: number;
  cy: number;
  radius: number;
  categories: string;
  count?: number;
  page?: number;
  timeoutMs?: number;
}): Promise<TmapSearchResult> {
  const started = Date.now();
  const out: TmapSearchResult = {
    ok: false,
    query: args.categories,
    total: 0,
    pois: [],
    attempt: { durationMs: 0 }
  };

  const key = serverEnv.tmapAppKey;
  if (!key) {
    out.attempt.error = "TMAP_APP_KEY not configured";
    out.attempt.durationMs = Date.now() - started;
    return out;
  }

  // TMAP POI Around: GET /tmap/pois/search/around
  const url = new URL(`${BASE_URL}/pois/search/around`);
  url.searchParams.set("version", "1");
  url.searchParams.set("page", String(args.page ?? 1));
  url.searchParams.set("count", String(Math.min(args.count ?? 50, 200)));
  url.searchParams.set("centerLon", args.cx.toFixed(7));
  url.searchParams.set("centerLat", args.cy.toFixed(7));
  url.searchParams.set("radius", String(Math.min(Math.ceil(args.radius / 1000), 33))); // km, 0~33
  url.searchParams.set("categories", args.categories);
  url.searchParams.set("resCoordType", "WGS84GEO");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), args.timeoutMs ?? 8000);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        appKey: key,
        Accept: "application/json"
      }
    });
    out.attempt.httpStatus = response.status;
    if (!response.ok) {
      const text = await response.text();
      out.attempt.error = `HTTP ${response.status} ${text.slice(0, 80)}`;
      out.attempt.durationMs = Date.now() - started;
      return out;
    }
    const data = (await response.json()) as {
      searchPoiInfo?: {
        totalCount?: string;
        count?: string;
        page?: string;
        pois?: { poi?: Array<Record<string, string>> };
      };
    };
    const info = data.searchPoiInfo;
    const rawPois = info?.pois?.poi ?? [];
    const normalized = rawPois
      .map(normalizePoi)
      .filter((p): p is TmapPoi => p !== null)
      .map((p) => ({ ...p, distance: haversine(args.cy, args.cx, p.lat, p.lng) }))
      .filter((p) => (p.distance ?? Infinity) <= args.radius)
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

    out.ok = true;
    out.pois = normalized;
    out.total = Number(info?.totalCount ?? rawPois.length);
    out.attempt.durationMs = Date.now() - started;
    return out;
  } catch (error) {
    out.attempt.durationMs = Date.now() - started;
    out.attempt.error =
      error instanceof Error
        ? error.name === "AbortError"
          ? `timeout ${args.timeoutMs ?? 8000}ms`
          : error.message
        : "tmap request failed";
    return out;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 통합 POI 검색 — 키워드로 매장 검색.
 */
export async function searchTmapPoi(args: {
  query: string;
  cx?: number;
  cy?: number;
  radius?: number;
  count?: number;
  page?: number;
  timeoutMs?: number;
}): Promise<TmapSearchResult> {
  const started = Date.now();
  const out: TmapSearchResult = {
    ok: false,
    query: args.query,
    total: 0,
    pois: [],
    attempt: { durationMs: 0 }
  };

  const key = serverEnv.tmapAppKey;
  if (!key) {
    out.attempt.error = "TMAP_APP_KEY not configured";
    out.attempt.durationMs = Date.now() - started;
    return out;
  }

  const url = new URL(`${BASE_URL}/pois`);
  url.searchParams.set("version", "1");
  url.searchParams.set("searchKeyword", args.query);
  url.searchParams.set("searchType", "all");
  url.searchParams.set("page", String(args.page ?? 1));
  url.searchParams.set("count", String(Math.min(args.count ?? 50, 200)));
  url.searchParams.set("resCoordType", "WGS84GEO");
  if (args.cx != null && args.cy != null) {
    url.searchParams.set("centerLon", args.cx.toFixed(7));
    url.searchParams.set("centerLat", args.cy.toFixed(7));
    url.searchParams.set("radius", String(Math.min(Math.ceil((args.radius ?? 1000) / 1000), 33)));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), args.timeoutMs ?? 8000);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        appKey: key,
        Accept: "application/json"
      }
    });
    out.attempt.httpStatus = response.status;
    if (!response.ok) {
      const text = await response.text();
      out.attempt.error = `HTTP ${response.status} ${text.slice(0, 80)}`;
      out.attempt.durationMs = Date.now() - started;
      return out;
    }
    const data = (await response.json()) as {
      searchPoiInfo?: {
        totalCount?: string;
        pois?: { poi?: Array<Record<string, string>> };
      };
    };
    const info = data.searchPoiInfo;
    const rawPois = info?.pois?.poi ?? [];
    const normalized = rawPois
      .map(normalizePoi)
      .filter((p): p is TmapPoi => p !== null);

    let final = normalized;
    if (args.cx != null && args.cy != null) {
      final = normalized
        .map((p) => ({ ...p, distance: haversine(args.cy!, args.cx!, p.lat, p.lng) }))
        .filter((p) => (p.distance ?? Infinity) <= (args.radius ?? Infinity))
        .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }

    out.ok = true;
    out.pois = final;
    out.total = Number(info?.totalCount ?? rawPois.length);
    out.attempt.durationMs = Date.now() - started;
    return out;
  } catch (error) {
    out.attempt.durationMs = Date.now() - started;
    out.attempt.error =
      error instanceof Error
        ? error.name === "AbortError"
          ? `timeout ${args.timeoutMs ?? 8000}ms`
          : error.message
        : "tmap request failed";
    return out;
  } finally {
    clearTimeout(timer);
  }
}
