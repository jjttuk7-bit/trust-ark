/**
 * 서울 25개 자치구의 시군구 코드 매핑.
 *
 * - LAWD_CD: 국토부 실거래가 API (앞 5자리 시군구코드)
 * - signguCd: 행정안전부 표준 시군구 코드 (동일 5자리)
 *
 * 추후 전국 확장 시 별도 모듈로 분리.
 */
/** 자치구별 중심 좌표 (자치구청 또는 자치구 대표 상권 좌표).
 *  좌표 API 외곽 데이터 누락 시 fallback용. */
export const SEOUL_SIGUNGU_CENTER: Record<string, { lat: number; lng: number }> = {
  종로구: { lat: 37.5735, lng: 126.9788 },
  중구: { lat: 37.5641, lng: 126.9979 },
  용산구: { lat: 37.5326, lng: 126.9904 },
  성동구: { lat: 37.5634, lng: 127.0369 },
  광진구: { lat: 37.5384, lng: 127.0826 },
  동대문구: { lat: 37.5743, lng: 127.0395 },
  중랑구: { lat: 37.6065, lng: 127.0926 },
  성북구: { lat: 37.5894, lng: 127.0167 },
  강북구: { lat: 37.6396, lng: 127.0257 },
  도봉구: { lat: 37.6688, lng: 127.0471 },
  노원구: { lat: 37.6541, lng: 127.0568 },
  은평구: { lat: 37.6027, lng: 126.9291 },
  서대문구: { lat: 37.5791, lng: 126.9368 },
  마포구: { lat: 37.5663, lng: 126.9019 },
  양천구: { lat: 37.5169, lng: 126.8665 }, // 목동중심상권
  강서구: { lat: 37.5509, lng: 126.8495 },
  구로구: { lat: 37.4955, lng: 126.8874 },
  금천구: { lat: 37.4569, lng: 126.8956 },
  영등포구: { lat: 37.5264, lng: 126.8963 },
  동작구: { lat: 37.5124, lng: 126.9393 },
  관악구: { lat: 37.4784, lng: 126.9516 },
  서초구: { lat: 37.4836, lng: 127.0327 },
  강남구: { lat: 37.5172, lng: 127.0473 },
  송파구: { lat: 37.5145, lng: 127.1056 },
  강동구: { lat: 37.5301, lng: 127.1238 }
};

/** 자치구별 공식 홈페이지 + 위생과 연락처 (창업 인허가 사전 컨설팅 link).
 *  전화번호는 자치구 위생과 대표번호 (변경 가능성 있음, 사용자 자체 확인 필요).
 */
export const SEOUL_DISTRICT_RESOURCES: Record<string, { website: string; phone: string; sanitation_path: string }> = {
  종로구: { website: "https://www.jongno.go.kr", phone: "02-2148-1114", sanitation_path: "/health" },
  중구:   { website: "https://www.junggu.seoul.kr", phone: "02-3396-4114", sanitation_path: "/health" },
  용산구: { website: "https://www.yongsan.go.kr", phone: "02-2199-7114", sanitation_path: "/health" },
  성동구: { website: "https://www.sd.go.kr", phone: "02-2286-5000", sanitation_path: "/health" },
  광진구: { website: "https://www.gwangjin.go.kr", phone: "02-450-7000", sanitation_path: "/health" },
  동대문구: { website: "https://www.ddm.go.kr", phone: "02-2127-4114", sanitation_path: "/health" },
  중랑구: { website: "https://www.jungnang.go.kr", phone: "02-2094-1114", sanitation_path: "/health" },
  성북구: { website: "https://www.sb.go.kr", phone: "02-2241-1114", sanitation_path: "/health" },
  강북구: { website: "https://www.gangbuk.go.kr", phone: "02-901-6000", sanitation_path: "/health" },
  도봉구: { website: "https://www.dobong.go.kr", phone: "02-2091-2000", sanitation_path: "/health" },
  노원구: { website: "https://www.nowon.kr", phone: "02-2116-3114", sanitation_path: "/health" },
  은평구: { website: "https://www.ep.go.kr", phone: "02-351-6000", sanitation_path: "/health" },
  서대문구: { website: "https://www.sdm.go.kr", phone: "02-330-1114", sanitation_path: "/health" },
  마포구: { website: "https://www.mapo.go.kr", phone: "02-3153-8114", sanitation_path: "/health" },
  양천구: { website: "https://www.yangcheon.go.kr", phone: "02-2620-3114", sanitation_path: "/health" },
  강서구: { website: "https://www.gangseo.seoul.kr", phone: "02-2600-6114", sanitation_path: "/health" },
  구로구: { website: "https://www.guro.go.kr", phone: "02-860-2114", sanitation_path: "/health" },
  금천구: { website: "https://www.geumcheon.go.kr", phone: "02-2627-1000", sanitation_path: "/health" },
  영등포구: { website: "https://www.ydp.go.kr", phone: "02-2670-3114", sanitation_path: "/health" },
  동작구: { website: "https://www.dongjak.go.kr", phone: "02-820-1114", sanitation_path: "/health" },
  관악구: { website: "https://www.gwanak.go.kr", phone: "02-879-5000", sanitation_path: "/health" },
  서초구: { website: "https://www.seocho.go.kr", phone: "02-2155-6114", sanitation_path: "/health" },
  강남구: { website: "https://www.gangnam.go.kr", phone: "02-3423-5114", sanitation_path: "/health" },
  송파구: { website: "https://www.songpa.go.kr", phone: "02-2147-2000", sanitation_path: "/health" },
  강동구: { website: "https://www.gangdong.go.kr", phone: "02-3425-5114", sanitation_path: "/health" }
};

export const SEOUL_SIGUNGU_CODE: Record<string, string> = {
  종로구: "11110",
  중구: "11140",
  용산구: "11170",
  성동구: "11200",
  광진구: "11215",
  동대문구: "11230",
  중랑구: "11260",
  성북구: "11290",
  강북구: "11305",
  도봉구: "11320",
  노원구: "11350",
  은평구: "11380",
  서대문구: "11410",
  마포구: "11440",
  양천구: "11470",
  강서구: "11500",
  구로구: "11530",
  금천구: "11545",
  영등포구: "11560",
  동작구: "11590",
  관악구: "11620",
  서초구: "11650",
  강남구: "11680",
  송파구: "11710",
  강동구: "11740"
};

export function extractSeoulSigungu(address: string): {
  sigungu?: string;
  signguCd?: string;
  center?: { lat: number; lng: number };
} {
  const sigunguMatch = address.match(/([가-힣]+구)\s/);
  const sigungu = sigunguMatch?.[1];
  if (!sigungu) return {};
  return {
    sigungu,
    signguCd: SEOUL_SIGUNGU_CODE[sigungu],
    center: SEOUL_SIGUNGU_CENTER[sigungu]
  };
}
