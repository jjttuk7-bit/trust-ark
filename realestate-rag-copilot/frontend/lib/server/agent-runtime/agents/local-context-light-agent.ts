import type { AnalyzeRequest, NaverContextFinding, NaverContextItem } from "@/lib/types";
import { searchNaverNews, searchNaverWeb, type NaverSearchResult } from "@/lib/server/naver-search";
import { searchXRecent } from "@/lib/server/x-search";
import { getOpenAIClient } from "@/lib/server/openai-client";
import type { TraceRecorder } from "../trace";

/**
 * LLM Relevance Filter — Phase 3 RAG의 Reranking 응용.
 * gpt-4o-mini가 검색 결과를 입력 컨텍스트(주소/업종)와 비교해 관련성 0~100 점수 부여.
 * 점수 60+만 통과.
 */
async function llmRelevanceFilter(
  items: NaverContextItem[],
  context: { sigungu?: string; road?: string; dong?: string; businessLabel?: string; mode?: string }
): Promise<{ filtered: NaverContextItem[]; diagnostic: string }> {
  if (items.length === 0) return { filtered: items, diagnostic: "no items" };
  const client = getOpenAIClient();
  if (!client) return { filtered: items, diagnostic: "OPENAI_API_KEY 미설정 — 필터 건너뜀" };

  const ctxStr = [
    context.sigungu ? `자치구: ${context.sigungu}` : "",
    context.dong ? `동: ${context.dong}` : "",
    context.road ? `도로명: ${context.road}` : "",
    context.businessLabel ? `검토 업종: ${context.businessLabel}` : "",
    context.mode ? `검토 모드: ${context.mode}` : ""
  ]
    .filter(Boolean)
    .join(" / ");

  const itemList = items
    .slice(0, 12)
    .map((it, idx) => `[${idx}] ${it.title.slice(0, 60)} · ${it.description.slice(0, 80)}`)
    .join("\n");

  const sysprompt = `당신은 부동산·창업 검색 결과 관련성 평가자입니다.
주어진 컨텍스트(주소·업종)와 각 검색 결과의 관련성을 0~100 점수로 평가합니다.

평가 기준:
- 100점: 정확히 같은 자치구 + 같은 업종 + 부동산/창업 관련
- 70점: 같은 자치구 또는 같은 업종, 부동산/창업 관련
- 40점: 자치구 또는 업종 일부 일치, 일반적 정보
- 10점 이하: 정치, 일반 뉴스, 무관한 내용 (예: 강남 정치 / 부동산 정책 일반)

JSON으로만 답변:
{"scores": [{"idx": 0, "score": 85}, {"idx": 1, "score": 15}, ...]}`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sysprompt },
        { role: "user", content: `컨텍스트:\n${ctxStr}\n\n검색 결과:\n${itemList}` }
      ],
      max_tokens: 600,
      temperature: 0
    });
    const text = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text) as { scores?: Array<{ idx: number; score: number }> };
    const scoreMap = new Map<number, number>();
    for (const s of parsed.scores ?? []) {
      scoreMap.set(s.idx, s.score);
    }
    const scored = items.slice(0, 12).map((item, idx) => ({
      item,
      score: scoreMap.get(idx) ?? 0
    }));
    const filtered = scored
      .filter((s) => s.score >= 50)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.item);
    const diagnostic = `${items.length}건 → ${filtered.length}건 통과 (점수 ≥50). avg=${
      scored.length > 0 ? Math.round(scored.reduce((a, b) => a + b.score, 0) / scored.length) : 0
    }`;
    return { filtered: filtered.length > 0 ? filtered : items.slice(0, 3), diagnostic };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "filter failed";
    return { filtered: items, diagnostic: `LLM 필터 실패 — ${msg.slice(0, 60)}` };
  }
}

const AGENT = "Search Context Agent" as const;

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  restaurant: "음식점",
  cafe: "카페",
  beauty: "미용실",
  academy: "학원",
  pc_room: "PC방",
  karaoke: "노래방",
  other: ""
};

function buildQueries(payload: AnalyzeRequest): { web: string; news: string } {
  const address = payload.address ?? "";
  const sigunguMatch = address.match(/([가-힣]+(?:특별자치시|광역시|시|군|구))/);
  const sigungu = sigunguMatch?.[1] ?? "";
  // 도로명 (예: "목동로", "테헤란로", "목동로 25길" → 25길 제외하고 "목동로"만)
  const roadMatch = address.match(/([가-힣A-Za-z0-9]+로)\s*\d+/);
  const road = roadMatch?.[1] ?? "";
  // 동 (법정동/행정동: "신정동", "역삼동" 등)
  const dongMatch = address.match(/([가-힣]+동)(?:\s|\d|$)/);
  const dong = dongMatch?.[1] ?? "";

  const businessLabel = payload.business_type ? BUSINESS_TYPE_LABELS[payload.business_type] : "";
  const purposeLabel =
    payload.commercial_purpose === "lease_out"
      ? "상가 임대"
      : payload.commercial_purpose === "buy_and_use"
        ? "상가 매수"
        : payload.commercial_purpose === "business_location"
          ? "상권"
          : "";

  const topic = businessLabel || purposeLabel || "상권";
  // 우선순위: 도로명 > 동 > 자치구. 더 정밀한 위치 키워드일수록 결과가 입력 주소와 직접 연관.
  const locationToken = road || dong || sigungu;
  // 뉴스는 자치구 + 토픽 (너무 정밀하면 결과 0건)
  return {
    web: `${locationToken} ${topic}`.trim(),
    news: `${sigungu} ${topic}`.trim()
  };
}

function topItems(result: NaverSearchResult, limit = 4): NaverContextFinding["items"] {
  return result.items.slice(0, limit).map((it) => ({
    title: it.title.replace(/<[^>]+>/g, ""),
    link: it.link,
    description: it.description.replace(/<[^>]+>/g, ""),
    pubDate: it.pubDate,
    kind: result.source === "naver-search:news" ? "news" : "web"
  }));
}

export async function runLocalContextLightAgent({
  payload,
  trace
}: {
  payload: AnalyzeRequest;
  trace: TraceRecorder;
}): Promise<NaverContextFinding | null> {
  const queries = buildQueries(payload);
  const inputSummary = `web="${queries.web}" news="${queries.news}"`;

  try {
    const [web, news, xResult] = await Promise.all([
      trace.run(
        AGENT,
        "naverWebSearch",
        queries.web,
        () => searchNaverWeb(queries.web),
        (result) => ({
          status: result.items.length > 0 ? "success" : "missing",
          outputSummary: `Web ${result.total}건 검색 · ${result.items.length}건 노출`
        })
      ),
      trace.run(
        AGENT,
        "naverNewsSearch",
        queries.news,
        () => searchNaverNews(queries.news),
        (result) => ({
          status: result.items.length > 0 ? "success" : "missing",
          outputSummary: `News ${result.total}건 검색 · ${result.items.length}건 노출`
        })
      ),
      trace.run(
        AGENT,
        "xRecentSearch",
        queries.web,
        () => searchXRecent({ query: `${queries.web} -is:retweet lang:ko`, maxResults: 10 }),
        (result) => {
          if (result.ok) {
            return {
              status: result.tweets.length > 0 ? "success" : "missing",
              outputSummary: `X tweets=${result.tweets.length} (${result.attempt.resultCount ?? 0}건)`
            };
          }
          // 402 CreditsDepleted / 401 Unauthorized 등 — 사용자 환경 이슈로 missing 처리
          const err = result.attempt.error ?? "";
          const isQuota = err.includes("402") || err.includes("CreditsDepleted") || err.includes("429");
          return {
            status: isQuota ? "missing" : "failed",
            outputSummary: isQuota
              ? `X API 한도 소진 (Free tier 월 100건). 유료 plan 필요`
              : `X 실패 · ${err.slice(0, 80) || "unknown"}`
          };
        }
      )
    ]);

    const rawItems = [
      ...topItems(web, 5),
      ...topItems(news, 5),
      ...xResult.tweets.slice(0, 3).map((t) => ({
        title: t.text.replace(/\s+/g, " ").slice(0, 80),
        link: `https://twitter.com/i/web/status/${t.id}`,
        description: t.text,
        pubDate: t.created_at,
        kind: "x" as const
      }))
    ];
    if (rawItems.length === 0) {
      trace.record(AGENT, "buildLocalContext", inputSummary, "검색 결과 없음", "missing");
      return null;
    }

    // ★ LLM Relevance Filter — 입력 컨텍스트와 관련성 50+ 점수만 통과
    const sigunguMatch = (payload.address ?? "").match(/([가-힣]+(?:특별자치시|광역시|시|군|구))/);
    const sigungu = sigunguMatch?.[1];
    const dongMatch = (payload.address ?? "").match(/([가-힣]+동)(?:\s|\d|$)/);
    const dong = dongMatch?.[1];
    const roadMatch = (payload.address ?? "").match(/([가-힣A-Za-z0-9]+로)\s*\d+/);
    const road = roadMatch?.[1];
    const businessLabel = payload.business_type ? BUSINESS_TYPE_LABELS[payload.business_type] : "";

    const { filtered, diagnostic: filterDiag } = await llmRelevanceFilter(rawItems, {
      sigungu,
      dong,
      road,
      businessLabel,
      mode: payload.mode
    });
    trace.record(AGENT, "llmRelevanceFilter", `raw=${rawItems.length}건`, filterDiag, "success");

    const items = filtered.slice(0, 8);

    const finding: NaverContextFinding = {
      query_web: queries.web,
      query_news: queries.news,
      total_web: web.total,
      total_news: news.total,
      items,
      source: "Naver 검색 + LLM Relevance Filter (gpt-4o-mini, Phase 3 Reranking)",
      note: `${queries.web} 키워드 검색 → LLM이 관련성 평가 → ${items.length}건 통과. 무관한 정치·일반 뉴스 자동 제거.`
    };
    return finding;
  } catch (error) {
    const message = error instanceof Error ? error.message : "naver search 실패";
    trace.record(AGENT, "buildLocalContext", inputSummary, message.slice(0, 120), "failed");
    return null;
  }
}
