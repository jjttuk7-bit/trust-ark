/**
 * Phase 5 — GraphRAG.
 *
 * RAG 청크 간 연관 관계(edges)를 정의해 검색 결과에 연관 청크를 함께 노출.
 * 부동산·창업 같은 규제 도메인에서 강력:
 *   식품위생법 제36조 → 학교환경위생정화구역 → 자치구 조례 → 판례
 *
 * 구현 방식 (단순):
 * - chunk ID prefix 기반 도메인 매칭
 * - 키워드 기반 cross-document edges
 * - 검색 결과의 각 hit에 1~3개 연관 청크 첨부
 */

import type { RagDomain, RagIndexEntry, RagSearchHit } from "./search";

/** 청크 → 연관 청크 매핑 규칙
 *  키워드 기반 cross-document 연결. 향후 LLM이 자동 생성하도록 확장 가능.
 */
const GRAPH_EDGES: Array<{
  /** 매칭할 청크 텍스트 키워드 */
  keywords: RegExp;
  /** 연결할 도메인·키워드 (해당 도메인 청크에서 추가 키워드 매칭) */
  related: Array<{ domain: RagDomain; keywords: RegExp }>;
}> = [
  // 식품위생법 ↔ 자치구 조례 (위생 영업 관련)
  {
    keywords: /(휴게음식점|일반음식점|영업신고|위생교육|식품위생)/,
    related: [
      { domain: "ordinance", keywords: /(영업|위생|음식점|카페|간판)/ },
      { domain: "law", keywords: /(학교환경위생|정화구역|청소년)/ }
    ]
  },
  // 풍속법 ↔ 정화구역 ↔ 자치구 조례
  {
    keywords: /(풍속|노래방|PC방|유흥|단란|청소년)/,
    related: [
      { domain: "law", keywords: /(학교환경위생|정화구역|청소년)/ },
      { domain: "ordinance", keywords: /(영업제한|학원가|특별구역)/ }
    ]
  },
  // 학교 정화구역 ↔ 업종별 영업 제한
  {
    keywords: /(학교환경위생|정화구역|절대보호|상대보호)/,
    related: [
      { domain: "law", keywords: /(휴게음식점|PC방|노래방|유흥|풍속)/ },
      { domain: "ordinance", keywords: /(영업제한|학교|교육특구)/ }
    ]
  },
  // 표준임대차계약 ↔ 전세사기 사례
  {
    keywords: /(임대차|보증금|확정일자|전입신고|대항력|우선변제)/,
    related: [
      { domain: "case", keywords: /(전세사기|빌라왕|깡통전세|신탁)/ },
      { domain: "contract", keywords: /(상가건물|권리금|갱신요구)/ }
    ]
  },
  // 전세사기 사례 ↔ 표준계약 보호 조항
  {
    keywords: /(전세사기|빌라왕|깡통전세|신탁|보증보험)/,
    related: [
      { domain: "contract", keywords: /(보증금 보호|대항력|우선변제권|HUG)/ }
    ]
  }
];

/**
 * 한 청크가 주어졌을 때 GRAPH_EDGES에 정의된 연관 청크를 찾는다.
 * 최대 limit개의 연관 청크 반환 (중복 제외).
 */
export function findRelatedChunks(
  chunk: RagIndexEntry | RagSearchHit,
  allEntries: RagIndexEntry[],
  excludeIds: Set<string>,
  limit = 2
): RagIndexEntry[] {
  const matched: RagIndexEntry[] = [];

  for (const edge of GRAPH_EDGES) {
    if (!edge.keywords.test(chunk.text)) continue;

    for (const relation of edge.related) {
      // 같은 도메인 + 키워드 매칭 청크 찾기
      const candidates = allEntries.filter(
        (e) => e.id !== chunk.id && !excludeIds.has(e.id) && e.domain === relation.domain && relation.keywords.test(e.text)
      );
      for (const cand of candidates) {
        if (!matched.find((m) => m.id === cand.id)) {
          matched.push(cand);
          if (matched.length >= limit) return matched;
        }
      }
    }
  }

  return matched;
}

export type GraphRagHit = RagSearchHit & {
  /** 이 청크에 연결된 연관 청크들 */
  related_chunks?: Array<{
    id: string;
    domain: RagDomain;
    title: string;
    text: string;
    edge_reason: string;
  }>;
};

/**
 * 검색 결과를 GraphRAG로 보강: 각 hit에 연관 청크 1~2개 첨부.
 */
export function enrichWithGraphRag(
  hits: RagSearchHit[],
  allEntries: RagIndexEntry[]
): GraphRagHit[] {
  const hitIds = new Set(hits.map((h) => h.id));

  return hits.map<GraphRagHit>((hit) => {
    const related = findRelatedChunks(hit, allEntries, hitIds, 2);
    if (related.length === 0) return hit;

    return {
      ...hit,
      related_chunks: related.map((r) => ({
        id: r.id,
        domain: r.domain,
        title: r.title,
        text: r.text.slice(0, 240),
        edge_reason: inferEdgeReason(hit.text, r.text, r.domain)
      }))
    };
  });
}

/** 두 청크가 왜 연결됐는지 사람이 읽을 만한 사유 추정 */
function inferEdgeReason(srcText: string, dstText: string, dstDomain: RagDomain): string {
  if (/(학교환경위생|정화구역)/.test(srcText) || /(학교환경위생|정화구역)/.test(dstText)) {
    return "학교 정화구역 ↔ 업종별 영업 제한";
  }
  if (/(휴게음식점|영업신고)/.test(srcText) && dstDomain === "ordinance") {
    return "식품위생법 ↔ 자치구 영업 조례";
  }
  if (/(임대차|보증금|확정일자)/.test(srcText) && dstDomain === "case") {
    return "표준계약 보호 조항 ↔ 전세사기 사례";
  }
  if (/(전세사기|빌라왕|신탁)/.test(srcText) && dstDomain === "contract") {
    return "전세사기 사례 ↔ 보증금 보호 조항";
  }
  if (/(풍속|노래방|PC방)/.test(srcText)) {
    return "풍속업 ↔ 정화구역·자치구 영업제한";
  }
  return `${dstDomain} 도메인 관련 청크`;
}
