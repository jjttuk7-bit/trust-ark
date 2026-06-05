/**
 * BM25 (Okapi) — Hybrid Search의 키워드 검색 컴포넌트.
 * 라이브러리 없이 순수 TypeScript 구현 (한글 어절 단위 토큰화).
 *
 * Vector 검색과 함께 RRF로 fusion 시 정확도 ↑:
 * - Vector: 의미적 유사도 (semantic) — "음식점 차릴 때 위생 기준" → 식품위생법
 * - BM25:   정확한 키워드 매칭 (lexical) — "식품위생법 제36조" → 정확한 조항
 *
 * 둘 다 잡으려면 hybrid 필수.
 */

const BM25_K1 = 1.5;
const BM25_B = 0.75;

/** 한글·영문·숫자 단위 토큰화 (조사 일부 제거) */
export function tokenize(text: string): string[] {
  if (!text) return [];
  // 한글 어절 + 영문 단어 + 숫자 → 단어 추출
  const tokens = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // 구두점·특수문자 제거
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  // 한글 조사·어미 일부 제거 (간단한 stemming)
  return tokens.map((t) => t.replace(/(은|는|이|가|을|를|에|의|로|와|과|도|만|에서|에게|부터|까지|이다|입니다)$/, "")).filter(Boolean);
}

/** 청크 BM25 인덱스 */
export type Bm25Index = {
  /** 청크 ID → 토큰 → 빈도 */
  tf: Map<string, Map<string, number>>;
  /** 토큰 → 청크 ID 집합 */
  invertedIndex: Map<string, Set<string>>;
  /** 청크 ID → 길이 (토큰 수) */
  docLengths: Map<string, number>;
  /** 평균 청크 길이 */
  avgLength: number;
  /** 총 청크 수 */
  totalDocs: number;
};

export function buildBm25Index(chunks: Array<{ id: string; text: string }>): Bm25Index {
  const tf = new Map<string, Map<string, number>>();
  const invertedIndex = new Map<string, Set<string>>();
  const docLengths = new Map<string, number>();
  let totalLength = 0;

  for (const chunk of chunks) {
    const tokens = tokenize(chunk.text);
    const tfMap = new Map<string, number>();
    for (const token of tokens) {
      tfMap.set(token, (tfMap.get(token) ?? 0) + 1);
      if (!invertedIndex.has(token)) invertedIndex.set(token, new Set());
      invertedIndex.get(token)!.add(chunk.id);
    }
    tf.set(chunk.id, tfMap);
    docLengths.set(chunk.id, tokens.length);
    totalLength += tokens.length;
  }

  return {
    tf,
    invertedIndex,
    docLengths,
    avgLength: chunks.length > 0 ? totalLength / chunks.length : 1,
    totalDocs: chunks.length
  };
}

/** BM25 점수 계산: 쿼리 토큰들에 대해 모든 청크의 점수 산출 */
export function scoreBm25(index: Bm25Index, query: string): Map<string, number> {
  const queryTokens = tokenize(query);
  const scores = new Map<string, number>();

  for (const token of queryTokens) {
    const docsWithToken = index.invertedIndex.get(token);
    if (!docsWithToken || docsWithToken.size === 0) continue;
    const df = docsWithToken.size;
    const idf = Math.log((index.totalDocs - df + 0.5) / (df + 0.5) + 1);

    for (const docId of docsWithToken) {
      const tf = index.tf.get(docId)?.get(token) ?? 0;
      const docLen = index.docLengths.get(docId) ?? index.avgLength;
      const norm = 1 - BM25_B + BM25_B * (docLen / index.avgLength);
      const termScore = idf * ((tf * (BM25_K1 + 1)) / (tf + BM25_K1 * norm));
      scores.set(docId, (scores.get(docId) ?? 0) + termScore);
    }
  }

  return scores;
}

/**
 * Reciprocal Rank Fusion (RRF) — Vector + BM25 결과를 결합.
 * 각 검색의 순위(rank)를 1/(k + rank)로 변환해 합산.
 */
export function reciprocalRankFusion(
  rankings: Array<Map<string, number>>, // 각 검색 방법의 docId→score 맵
  k = 60
): Map<string, number> {
  const combined = new Map<string, number>();

  for (const ranking of rankings) {
    // 점수 내림차순 정렬 → rank 부여
    const sorted = [...ranking.entries()].sort((a, b) => b[1] - a[1]);
    sorted.forEach(([docId], rank) => {
      const rrfScore = 1 / (k + rank + 1);
      combined.set(docId, (combined.get(docId) ?? 0) + rrfScore);
    });
  }

  return combined;
}
