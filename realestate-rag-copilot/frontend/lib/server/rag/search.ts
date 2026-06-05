import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cosineSimilarity, embedQuery } from "./embedder";
import { buildBm25Index, scoreBm25, reciprocalRankFusion, type Bm25Index } from "./bm25";
import { enrichWithGraphRag, type GraphRagHit } from "./graph";
import { getOpenAIClient } from "@/lib/server/openai-client";

export type RagDomain = "law" | "ordinance" | "case" | "contract";

export type RagIndexEntry = {
  id: string;
  domain: RagDomain;
  source: string;          // 원문 경로 (예: "rag-sources/food-sanitation-law.md")
  title: string;            // 문서 표시명
  section?: string;         // 챕터·조항
  text: string;
  embedding: number[];
};

export type RagSearchHit = {
  id: string;
  domain: RagDomain;
  source: string;
  title: string;
  section?: string;
  text: string;
  score: number;
};

export type RagIndex = {
  model: string;
  dim: number;
  builtAt: string;
  entries: RagIndexEntry[];
};

let cached: RagIndex | null = null;
let cacheError: string | null = null;
let bm25Cached: Bm25Index | null = null;

export async function loadRagIndex(): Promise<RagIndex | null> {
  if (cached) return cached;
  if (cacheError) return null;
  try {
    const indexPath = path.join(process.cwd(), "data", "rag-index.json");
    const raw = await readFile(indexPath, "utf-8");
    cached = JSON.parse(raw) as RagIndex;
    // BM25 인덱스 빌드 (한 번만)
    bm25Cached = buildBm25Index(cached.entries.map((e) => ({ id: e.id, text: e.text })));
    return cached;
  } catch (error) {
    cacheError = error instanceof Error ? error.message : "load failed";
    console.warn(`[rag/search] index 로드 실패: ${cacheError}`);
    return null;
  }
}

/**
 * 텍스트 쿼리로 RAG 인덱스에서 top-k 청크 검색.
 *
 * @param query     검색어 (자연어)
 * @param topK      반환 개수
 * @param domains   특정 도메인만 필터링 (옵션)
 * @param minScore  최소 cosine 유사도 (기본 0.3)
 */
/**
 * Phase 3 — Hybrid Search (BM25 + Vector) + RRF + LLM Reranker.
 *
 * Pipeline:
 *   1. BM25 검색 (lexical, 정확한 키워드 매칭)
 *   2. Vector 검색 (semantic, 의미 유사도)
 *   3. RRF (Reciprocal Rank Fusion) 결합
 *   4. LLM Reranker (gpt-4o-mini) — top 20 → top 5 재순위
 */
export async function searchRag(args: {
  query: string;
  topK?: number;
  domains?: RagDomain[];
  minScore?: number;
  /** Phase 3 hybrid 사용 여부 (기본 true) */
  hybrid?: boolean;
  /** LLM Reranker 사용 여부 (기본 true) */
  rerank?: boolean;
}): Promise<RagSearchHit[]> {
  const topK = args.topK ?? 5;
  const minScore = args.minScore ?? 0.3;
  const useHybrid = args.hybrid !== false;
  const useRerank = args.rerank !== false;

  const index = await loadRagIndex();
  if (!index) return [];

  // 도메인 필터
  const filtered = args.domains
    ? index.entries.filter((e) => args.domains!.includes(e.domain))
    : index.entries;

  // === Vector Search ===
  const queryEmbedding = await embedQuery(args.query);
  if (!queryEmbedding) return [];
  const vectorScores = new Map<string, number>();
  for (const entry of filtered) {
    const sim = cosineSimilarity(queryEmbedding, entry.embedding);
    if (sim >= minScore) vectorScores.set(entry.id, sim);
  }

  // === BM25 Search (Phase 3) ===
  let combinedScores = vectorScores;
  if (useHybrid && bm25Cached) {
    const bm25Raw = scoreBm25(bm25Cached, args.query);
    // 도메인 필터 적용
    const filteredIds = new Set(filtered.map((e) => e.id));
    const bm25Filtered = new Map<string, number>();
    for (const [id, score] of bm25Raw) {
      if (filteredIds.has(id)) bm25Filtered.set(id, score);
    }
    // RRF로 결합
    combinedScores = reciprocalRankFusion([vectorScores, bm25Filtered]);
  }

  // 상위 후보 추림 (LLM Reranker 입력용 — Cohere처럼 일반적으로 top 20)
  const candidatesTopK = useRerank ? Math.max(topK * 4, 20) : topK;
  const topCandidates = [...combinedScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, candidatesTopK)
    .map(([id, score]) => {
      const entry = filtered.find((e) => e.id === id)!;
      return { ...entry, score };
    });

  // === LLM Reranker (Phase 3 - Reranking) ===
  if (useRerank && topCandidates.length > topK) {
    const reranked = await llmRerank(args.query, topCandidates, topK);
    return reranked.map<RagSearchHit>((s) => ({
      id: s.id,
      domain: s.domain,
      source: s.source,
      title: s.title,
      section: s.section,
      text: s.text,
      score: s.score
    }));
  }

  return topCandidates.slice(0, topK).map<RagSearchHit>((s) => ({
    id: s.id,
    domain: s.domain,
    source: s.source,
    title: s.title,
    section: s.section,
    text: s.text,
    score: s.score
  }));
}

/**
 * LLM Reranker — gpt-4o-mini가 쿼리·청크 텍스트를 직접 보고 관련성 0~100 점수.
 * Cohere/BGE cross-encoder의 LLM 대체. (정확도는 cross-encoder가 더 높지만 추가 의존성 X)
 */
async function llmRerank(
  query: string,
  candidates: (RagIndexEntry & { score: number })[],
  topK: number
): Promise<(RagIndexEntry & { score: number })[]> {
  const client = getOpenAIClient();
  if (!client || candidates.length === 0) return candidates.slice(0, topK);

  const itemList = candidates
    .slice(0, 20)
    .map((c, idx) => `[${idx}] [${c.domain}] ${c.text.slice(0, 240).replace(/\n/g, " ")}`)
    .join("\n");

  const sysprompt = `당신은 RAG 검색 결과 재순위(reranker)입니다.
쿼리와 각 청크의 관련성을 0~100 점수로 평가합니다.

평가 기준:
- 100점: 쿼리 답변에 직접 사용 가능한 정확한 정보
- 80점: 답변에 강하게 관련됨
- 60점: 부분적 관련
- 40점 이하: 무관

JSON으로만 답변: {"ranking": [{"idx": 0, "score": 92}, ...]}`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sysprompt },
        { role: "user", content: `쿼리: ${query}\n\n청크:\n${itemList}` }
      ],
      max_tokens: 500,
      temperature: 0
    });
    const text = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text) as { ranking?: Array<{ idx: number; score: number }> };
    const scoreMap = new Map<number, number>();
    for (const r of parsed.ranking ?? []) scoreMap.set(r.idx, r.score);

    return candidates
      .slice(0, 20)
      .map((c, idx) => ({ ...c, score: (scoreMap.get(idx) ?? c.score * 100) / 100 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  } catch {
    return candidates.slice(0, topK);
  }
}

export function describeIndex(): { ok: boolean; size: number; builtAt?: string } {
  if (!cached) return { ok: false, size: 0 };
  return { ok: true, size: cached.entries.length, builtAt: cached.builtAt };
}

/**
 * Phase 4 — Self-RAG: 검색 결과의 답변 가능성 평가.
 *
 * gpt-4o-mini가 query + hits를 보고 "이 정보로 답변 가능한가?" 평가.
 * confidence (0~1) + missing_aspects (부족한 측면) 반환.
 */
export type SelfRagAssessment = {
  confidence: number;            // 0~1
  is_sufficient: boolean;        // confidence >= 0.6
  missing_aspects: string[];     // 부족한 측면 (재검색용 키워드)
  reasoning: string;
};

export async function selfRagAssess(args: {
  query: string;
  hits: RagSearchHit[];
}): Promise<SelfRagAssessment> {
  const client = getOpenAIClient();
  if (!client || args.hits.length === 0) {
    return { confidence: 0, is_sufficient: false, missing_aspects: [args.query], reasoning: "no hits or LLM" };
  }

  const hitTexts = args.hits
    .slice(0, 5)
    .map((h, idx) => `[${idx}] [${h.domain}] ${h.text.slice(0, 200).replace(/\n/g, " ")}`)
    .join("\n");

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `당신은 RAG 검색 결과 평가자입니다. 쿼리에 대해 주어진 검색 결과만으로 답변이 충분한지 평가합니다.

JSON으로만 답변: {"confidence": 0.85, "missing_aspects": ["...", "..."], "reasoning": "..."}

기준:
- 0.9~1.0: 매우 충분
- 0.7~0.9: 충분
- 0.5~0.7: 보강 필요
- 0.5 미만: 부족, 재검색 필요

missing_aspects는 부족한 정보 측면 1~3개 (예: ["임대료 정보", "신규 개업률"]).`
        },
        { role: "user", content: `쿼리: ${args.query}\n\n검색 결과:\n${hitTexts}` }
      ],
      max_tokens: 200,
      temperature: 0
    });
    const text = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text) as Partial<SelfRagAssessment>;
    const confidence = typeof parsed.confidence === "number" ? Math.min(Math.max(parsed.confidence, 0), 1) : 0.5;
    return {
      confidence,
      is_sufficient: confidence >= 0.6,
      missing_aspects: Array.isArray(parsed.missing_aspects) ? parsed.missing_aspects.slice(0, 3) : [],
      reasoning: parsed.reasoning ?? "(no reasoning)"
    };
  } catch (error) {
    return {
      confidence: 0.5,
      is_sufficient: true,
      missing_aspects: [],
      reasoning: `평가 실패: ${error instanceof Error ? error.message : "unknown"}`
    };
  }
}

/**
 * Phase 4 — Corrective RAG: confidence 낮으면 missing_aspects로 재검색.
 * 1회 재검색 + 결과 보강.
 */
export async function correctiveRagSearch(args: {
  query: string;
  topK?: number;
  domains?: RagDomain[];
  /** Phase 5 GraphRAG: 연관 청크 자동 첨부 (기본 true) */
  graphRag?: boolean;
}): Promise<{ hits: GraphRagHit[]; assessment: SelfRagAssessment; usedCorrection: boolean; usedGraphRag: boolean }> {
  const useGraphRag = args.graphRag !== false;
  const initial = await searchRag(args);
  const assessment = await selfRagAssess({ query: args.query, hits: initial });

  let finalHits: RagSearchHit[] = initial;
  let usedCorrection = false;

  if (!assessment.is_sufficient && assessment.missing_aspects.length > 0) {
    // 재검색 — missing_aspects를 쿼리에 보강
    const enrichedQuery = `${args.query} ${assessment.missing_aspects.join(" ")}`;
    const additional = await searchRag({
      ...args,
      query: enrichedQuery,
      topK: (args.topK ?? 5) * 2
    });
    const seen = new Set(initial.map((h) => h.id));
    finalHits = [...initial, ...additional.filter((h) => !seen.has(h.id))].slice(0, args.topK ?? 5);
    usedCorrection = true;
  }

  // Phase 5 GraphRAG — 연관 청크 첨부
  let enriched: GraphRagHit[] = finalHits;
  let graphRagApplied = false;
  if (useGraphRag) {
    const index = await loadRagIndex();
    if (index) {
      enriched = enrichWithGraphRag(finalHits, index.entries);
      graphRagApplied = enriched.some((h) => h.related_chunks && h.related_chunks.length > 0);
    }
  }

  return { hits: enriched, assessment, usedCorrection, usedGraphRag: graphRagApplied };
}
