import type {
  AnalyzeRequest,
  BusinessType,
  SchoolZoneFinding,
  SchoolZoneImpact
} from "@/lib/types";
import {
  fetchSchools,
  summarizeNeisAttempt,
  type SchoolInfoRow
} from "@/lib/server/neis-api";
import { geocodeAddress, type GeocodeResult } from "@/lib/server/vworld";
import type { TraceRecorder } from "../trace";

/** Haversine 거리 (미터) */
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

const AGENT = "Location Context Agent" as const;
const TOOL = "fetchSchoolsByDistrict" as const;

const OFFICE_CODES: Record<string, string> = {
  서울특별시: "B10",
  서울시: "B10",
  서울: "B10",
  부산광역시: "C10",
  대구광역시: "D10",
  인천광역시: "E10",
  광주광역시: "F10",
  대전광역시: "G10",
  울산광역시: "H10",
  세종특별자치시: "I10",
  경기도: "J10",
  강원특별자치도: "K10",
  충청북도: "M10",
  충청남도: "N10",
  전북특별자치도: "P10",
  전라남도: "Q10",
  경상북도: "R10",
  경상남도: "S10",
  제주특별자치도: "T10"
};

const HIGH_IMPACT: BusinessType[] = ["pc_room", "karaoke"];
const MEDIUM_IMPACT: BusinessType[] = ["restaurant"];

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  restaurant: "음식점",
  cafe: "카페",
  beauty: "미용실·이용원",
  academy: "학원·교습소",
  pc_room: "PC방",
  karaoke: "노래방",
  other: "기타 업종"
};

const schoolCache = new Map<string, { rows: SchoolInfoRow[]; at: number }>();
const CACHE_TTL = 60 * 60 * 1000;

function extractSidoSigungu(address: string): { sido?: string; sigungu?: string; road?: string } {
  const sidoMatch = address.match(
    /(서울특별시|서울시|서울|부산광역시|대구광역시|인천광역시|광주광역시|대전광역시|울산광역시|세종특별자치시|경기도|강원특별자치도|충청북도|충청남도|전북특별자치도|전라남도|경상북도|경상남도|제주특별자치도)/
  );
  const sigunguMatch = address.match(/([가-힣]+(?:특별자치시|광역시|시|군|구))\s/);
  const roadMatch = address.match(/([가-힣A-Za-z0-9]+(?:로|길))\s*\d+/);
  return {
    sido: sidoMatch?.[1],
    sigungu: sigunguMatch && sigunguMatch[1] !== sidoMatch?.[1] ? sigunguMatch[1] : undefined,
    road: roadMatch?.[1]
  };
}

function impactFor(businessType: BusinessType, schoolsInDistrict: number): { level: SchoolZoneImpact; message: string; label: string } {
  const label = BUSINESS_TYPE_LABELS[businessType] ?? "기타 업종";
  if (schoolsInDistrict === 0) {
    return {
      level: "low",
      label,
      message: `이 자치구에서 인근 학교 정보를 찾지 못했습니다 — 정화구역 영향은 별도 확인 필요.`
    };
  }
  if (HIGH_IMPACT.includes(businessType)) {
    return {
      level: "high",
      label,
      message: `${label}은(는) 학교환경위생정화구역(절대 200m · 상대 50m) 내에서 영업 제한·심의 대상입니다. 인근 학교 위치를 정확히 확인하세요.`
    };
  }
  if (MEDIUM_IMPACT.includes(businessType)) {
    return {
      level: "medium",
      label,
      message: `${label}은(는) 정화구역 내 영업이 일반적으로 가능하지만, 소음·악취·청소년 출입 등 시설 기준이 강화될 수 있습니다.`
    };
  }
  return {
    level: "low",
    label,
    message: `${label}은(는) 학교환경위생정화구역 영향이 낮은 편입니다. 단, 청소년 출입 가능 여부는 확인 필요.`
  };
}

async function loadSchools(officeCode: string): Promise<{ rows: SchoolInfoRow[]; diagnostic: string }> {
  const now = Date.now();
  const cached = schoolCache.get(officeCode);
  if (cached && now - cached.at < CACHE_TTL && cached.rows.length > 0) {
    return { rows: cached.rows, diagnostic: `cache hit (${cached.rows.length})` };
  }
  // pSize 1000으로 5페이지까지 = 5000건. 서울 전체 학교 약 2400건 커버.
  const result = await fetchSchools({ officeCode, maxPages: 5 });
  const diagnostic = `${summarizeNeisAttempt(result.attempt)} · loaded=${result.rows.length}`;
  if (result.ok && result.rows.length > 0) {
    schoolCache.set(officeCode, { rows: result.rows, at: now });
  }
  return { rows: result.rows, diagnostic };
}

export async function runSchoolZoneAgent({
  payload,
  geocode,
  trace
}: {
  payload: AnalyzeRequest;
  /** 사용자 위치 좌표 (200m/50m 정화구역 거리 계산용). 없으면 도로명·동 텍스트 매칭만 */
  geocode?: GeocodeResult | null;
  trace: TraceRecorder;
}): Promise<SchoolZoneFinding | null> {
  const { sido, sigungu, road } = extractSidoSigungu(payload.address ?? "");
  const officeCode = sido ? OFFICE_CODES[sido] : undefined;

  const inputSummary = `sido=${sido ?? "?"} sigungu=${sigungu ?? "?"} road=${road ?? "?"} office=${officeCode ?? "?"}`;

  if (!officeCode || !sigungu) {
    trace.record(
      AGENT,
      TOOL,
      inputSummary,
      `시도/자치구 추출 실패 — 학교 검색 생략`,
      "missing"
    );
    return null;
  }

  const businessType = (payload.business_type ?? "other") as BusinessType;

  try {
    return await trace.run(
      AGENT,
      TOOL,
      inputSummary,
      async () => {
        const { rows, diagnostic } = await loadSchools(officeCode);
        // 매칭: ORG_RDNMA(도로명) + LCTN_SC_NM(시도명)에서 sigungu 텍스트 검색.
        // 사용자 sigungu가 "양천구"라면 "서울 양천구..." / "서울특별시 양천구..." 모두 매칭.
        const districtSchools = rows.filter((r) => {
          const addr = `${r.ORG_RDNMA ?? ""} ${r.LCTN_SC_NM ?? ""} ${r.JU_ORG_NM ?? ""}`;
          return addr.includes(sigungu);
        });
        const sameRoadSchools = road
          ? districtSchools.filter((r) => (r.ORG_RDNMA ?? "").includes(road))
          : [];
        const sampleAddresses = rows
          .slice(0, 3)
          .map((r) => r.ORG_RDNMA?.slice(0, 30) ?? "?")
          .join(" | ");
        const diagnosticExtra = `${diagnostic} · sample=[${sampleAddresses}]`;

        const kindCounts = districtSchools.reduce<Record<string, number>>((acc, s) => {
          const kind = s.SCHUL_KND_SC_NM ?? "기타";
          acc[kind] = (acc[kind] ?? 0) + 1;
          return acc;
        }, {});

        // ★ 사용자 좌표 있을 때 — 학교 주소 vworld geocode → Haversine 거리 계산
        // 자치구 학교 전체를 geocode하기엔 너무 많아서 같은 도로 + 가까운 20개 우선
        const userLat = geocode?.result?.lat;
        const userLng = geocode?.result?.lng;
        const hasUserCoord = typeof userLat === "number" && typeof userLng === "number";

        type EnrichedSchool = {
          row: SchoolInfoRow;
          name: string;
          kind: string;
          address: string;
          distance?: number;
        };

        let enriched: EnrichedSchool[] = [];
        let inAbsoluteZone = 0; // 50m 이내
        let inRelativeZone = 0; // 200m 이내

        if (hasUserCoord) {
          // 우선 같은 도로 학교부터, 그 다음 자치구 학교 무작위 상위 20개
          const candidates = sameRoadSchools.length > 0
            ? [...sameRoadSchools, ...districtSchools.filter((s) => !sameRoadSchools.includes(s))].slice(0, 25)
            : districtSchools.slice(0, 20);

          const results = await Promise.all(
            candidates.map(async (s) => {
              const address = s.ORG_RDNMA ?? "";
              const enrichedItem: EnrichedSchool = {
                row: s,
                name: s.SCHUL_NM ?? "(이름 없음)",
                kind: s.SCHUL_KND_SC_NM ?? "기타",
                address
              };
              if (!address) return enrichedItem;
              try {
                const g = await geocodeAddress(address);
                if (g.result) {
                  enrichedItem.distance = haversine(userLat, userLng, g.result.lat, g.result.lng);
                }
              } catch {}
              return enrichedItem;
            })
          );

          enriched = results
            .filter((e) => typeof e.distance === "number")
            .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

          inAbsoluteZone = enriched.filter((e) => (e.distance ?? Infinity) <= 50).length;
          inRelativeZone = enriched.filter((e) => (e.distance ?? Infinity) <= 200).length;
        }

        // nearby_schools 구성 — 거리 정렬 (좌표 있을 때) 또는 같은 도로/자치구 (없을 때)
        const nearby = hasUserCoord && enriched.length > 0
          ? enriched.slice(0, 10).map<SchoolZoneFinding["nearby_schools"][number]>((e) => {
              const d = e.distance ?? Infinity;
              const matchedBy: SchoolZoneFinding["nearby_schools"][number]["matchedBy"] =
                d <= 50 ? "absolute_zone" : d <= 200 ? "relative_zone" : "same_district";
              return {
                name: e.name,
                kind: e.kind,
                address: e.address,
                matchedBy,
                distance_meters: Math.round(d)
              };
            })
          : (sameRoadSchools.length > 0 ? sameRoadSchools : districtSchools.slice(0, 5)).map((s) => ({
              name: s.SCHUL_NM ?? "(이름 없음)",
              kind: s.SCHUL_KND_SC_NM ?? "기타",
              address: s.ORG_RDNMA ?? "",
              matchedBy: (sameRoadSchools.length > 0 ? "same_road" : "same_district") as "same_road" | "same_district"
            }));

        // 영향도 — 절대보호구역(50m) 안에 학교 있으면 한 단계 상향
        const baseImpact = impactFor(businessType, districtSchools.length);
        const upgradeImpact = (hasUserCoord && inAbsoluteZone > 0 && (businessType === "pc_room" || businessType === "karaoke"))
          ? { ...baseImpact, level: "high" as const, message: `${baseImpact.label}이(가) 50m 이내 학교 ${inAbsoluteZone}건의 절대보호구역에 위치 — 영업 사실상 불가.` }
          : baseImpact;

        const finding: SchoolZoneFinding = {
          district: sigungu,
          total_schools_in_district: districtSchools.length,
          nearby_schools: nearby,
          school_kind_counts: kindCounts,
          in_absolute_zone: hasUserCoord ? inAbsoluteZone : undefined,
          in_relative_zone: hasUserCoord ? inRelativeZone : undefined,
          business_type_label: upgradeImpact.label,
          impact_level: upgradeImpact.level,
          impact_message: upgradeImpact.message,
          source: "NEIS 학교알리미 schoolInfo + VWorld geocode",
          diagnostic: hasUserCoord
            ? `${diagnosticExtra} · enriched=${enriched.length} · absolute(50m)=${inAbsoluteZone} relative(200m)=${inRelativeZone}`
            : diagnosticExtra,
          note: hasUserCoord
            ? inRelativeZone > 0
              ? `상대보호구역(200m) 내 학교 ${inRelativeZone}건 · 절대보호구역(50m) 내 ${inAbsoluteZone}건. 정확한 거리는 인근 학교 카드 참고.`
              : `반경 200m 내 학교 없음. ${sigungu} 전체 ${districtSchools.length}건 중 가까운 학교 카드 참고.`
            : sameRoadSchools.length > 0
              ? `같은 도로(${road})에 학교 ${sameRoadSchools.length}건 — 정확한 거리는 좌표 매칭 후 보강.`
              : `${sigungu} 전체 학교 ${districtSchools.length}건 — 좌표 미확보로 거리 측정 불가.`
        };
        return finding;
      },
      (finding) => ({
        status: finding && finding.total_schools_in_district > 0 ? "success" : "missing",
        outputSummary: finding
          ? `${finding.district} 학교 ${finding.total_schools_in_district}건 · ${finding.business_type_label} 영향=${finding.impact_level} · ${finding.diagnostic.slice(0, 150)}`
          : "학교 정보 없음"
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "school zone 조회 실패";
    trace.record(AGENT, TOOL, inputSummary, message.slice(0, 120), "failed");
    return null;
  }
}
