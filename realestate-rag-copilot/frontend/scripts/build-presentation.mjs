#!/usr/bin/env node
/**
 * 디엘톤 발표 PPTX 생성.
 *
 * 사용:
 *   node scripts/build-presentation.mjs
 *
 * 출력:
 *   ../../docs/터무니_디엘톤_발표자료_v2.pptx
 *
 * 디자인 컨셉:
 * - 터무니 브랜드 컬러: moss (#2D4F3A) · brass (#C9A455) · clay (#A66060) · ink (#1A1A1A) · cream (#FAF7F0)
 * - 슬라이드 비율 16:9 (10 × 5.625 inch)
 * - 한글 폰트: 맑은 고딕 / Noto Sans KR 폴백
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import pptxgen from "pptxgenjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, "..", "..", "docs", "터무니_디엘톤_발표자료_v2.pptx");

// 터무니 컬러 팔레트
const COLORS = {
  moss: "2D4F3A",
  brass: "C9A455",
  clay: "A66060",
  ink: "1A1A1A",
  cream: "FAF7F0",
  paper: "F0EBDF",
  white: "FFFFFF",
  muted: "8E8B85"
};

const FONT = "맑은 고딕";

const pres = new pptxgen();
pres.defineLayout({ name: "TUMUNI", width: 13.33, height: 7.5 });
pres.layout = "TUMUNI";
pres.title = "터무니 디엘톤 발표자료";
pres.author = "터무니 팀";
pres.company = "복덕방스";

// 공통 슬라이드 footer
function addFooter(slide, pageNum, totalPages) {
  slide.addText("터무니 · Tumuni — DLthon 2026.06", {
    x: 0.5,
    y: 7.0,
    w: 8,
    h: 0.3,
    fontSize: 9,
    fontFace: FONT,
    color: COLORS.muted,
    align: "left"
  });
  slide.addText(`${pageNum} / ${totalPages}`, {
    x: 12.0,
    y: 7.0,
    w: 1,
    h: 0.3,
    fontSize: 9,
    fontFace: FONT,
    color: COLORS.muted,
    align: "right"
  });
}

// 공통 헤더 (페이지 번호 + 제목)
function addHeader(slide, pageNum, mainTitle, subTitle) {
  slide.addText(String(pageNum).padStart(2, "0"), {
    x: 0.5,
    y: 0.3,
    w: 1,
    h: 0.5,
    fontSize: 36,
    fontFace: FONT,
    bold: true,
    color: COLORS.brass,
    align: "left"
  });
  slide.addText(mainTitle, {
    x: 1.6,
    y: 0.35,
    w: 11.5,
    h: 0.5,
    fontSize: 22,
    fontFace: FONT,
    bold: true,
    color: COLORS.ink,
    align: "left"
  });
  if (subTitle) {
    slide.addText(subTitle, {
      x: 1.6,
      y: 0.95,
      w: 11.5,
      h: 0.4,
      fontSize: 14,
      fontFace: FONT,
      color: COLORS.moss,
      align: "left",
      italic: true
    });
  }
}

const TOTAL = 18; // 표지 + 17장

// ─────────────────────────────────────────────────
// Slide 1 — 표지
// ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COLORS.cream };

  s.addText("터무니 · Tumuni", {
    x: 1, y: 2.2, w: 11, h: 1,
    fontSize: 56, fontFace: FONT, bold: true, color: COLORS.ink, align: "left"
  });
  s.addText("터를 읽고, 무니를 더하다", {
    x: 1, y: 3.3, w: 11, h: 0.6,
    fontSize: 22, fontFace: FONT, color: COLORS.moss, align: "left"
  });
  s.addText("위치 기반 RAG · 멀티 에이전트 의사결정 코파일럿", {
    x: 1, y: 4.0, w: 11, h: 0.5,
    fontSize: 18, fontFace: FONT, color: COLORS.ink, align: "left"
  });

  s.addShape(pres.ShapeType.line, {
    x: 1, y: 5.0, w: 4, h: 0,
    line: { color: COLORS.brass, width: 3 }
  });
  s.addText("DLthon 2026.06 · 부동산에서 창업·상가까지 의사결정을 종합한다", {
    x: 1, y: 5.2, w: 11, h: 0.4,
    fontSize: 14, fontFace: FONT, color: COLORS.muted, align: "left"
  });
  s.addText("복덕방스 (Bokdeokbangs) — 부동산·창업 분야의 컨설팅 & 데이터 통합 실험", {
    x: 1, y: 5.7, w: 11, h: 0.4,
    fontSize: 12, fontFace: FONT, color: COLORS.muted, align: "left", italic: true
  });
}

// ─────────────────────────────────────────────────
// Slide 2 — 디엘톤 정신
// ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COLORS.cream };
  addHeader(s, 2, "복덕방스의 전제", "결과가 아니라 과정이 90%");

  s.addText("이번 디엘톤은 등수가 아니라 '각자의 공부'를 위해 달렸습니다", {
    x: 1, y: 1.8, w: 11.5, h: 0.6,
    fontSize: 18, fontFace: FONT, color: COLORS.ink, align: "left", italic: true
  });

  const points = [
    "• 평가 6가지 항목(EDA · 전처리 · 모델 · 성능 · Metric · 시도) 각각을 \"우리 식으로\" 다시 정의",
    "• 데이터 한계 = 패배가 아니라 다음 학습 — 4일차에 노선 변경 (Trust Ark → 터무니)",
    "• 발표는 \"우리가 무엇을 시도했고 무엇을 배웠나\"의 회고",
    "• 코드와 컨설팅의 결합 — 부동산·창업 도메인에서 데이터·LLM·Agent가 어떻게 결합되는지 실험"
  ];
  s.addText(points.join("\n\n"), {
    x: 1, y: 2.8, w: 11.5, h: 3.5,
    fontSize: 15, fontFace: FONT, color: COLORS.ink, align: "left", paraSpaceAfter: 8
  });

  addFooter(s, 2, TOTAL);
}

// ─────────────────────────────────────────────────
// Slide 3 — 주제 선정
// ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COLORS.cream };
  addHeader(s, 3, "주제 선정 — 투표가 아닌 정밀 분석", "평가 ① EDA");

  s.addText("RAG를 가장 효과적으로 쓸 6개 후보를 하나씩 뜯어봤다", {
    x: 1, y: 1.8, w: 11.5, h: 0.5,
    fontSize: 16, fontFace: FONT, italic: true, color: COLORS.moss
  });

  const table = [
    ["#", "후보 주제", "RAG 적합성", "데이터 가용성", "선정 사유"],
    ["1", "부동산 임차 안전 검토", "★★★★★", "★★★★", "✅ 선정 — 법령·등기·실거래 RAG"],
    ["2", "창업 인허가·규제 검토", "★★★★★", "★★★★", "✅ 추가 — 식품위생·풍속 법령 풍부"],
    ["3", "상가 활용성 분석", "★★★★", "★★★", "✅ 추가 — 공통 인프라 재활용"],
    ["4", "주식 종목 분석", "★★★", "★★★★★", "❌ RAG 효과 약함"],
    ["5", "건강·의료 상담", "★★★★", "★★", "❌ 데이터 윤리"],
    ["6", "법률 자문 봇", "★★★★", "★★", "❌ 책임 부담"]
  ];
  s.addTable(table, {
    x: 1, y: 2.5, w: 11.3, h: 3.5,
    fontSize: 12, fontFace: FONT,
    border: { type: "solid", pt: 1, color: "D0D0D0" },
    fill: { color: COLORS.white },
    color: COLORS.ink,
    rowH: 0.5
  });

  addFooter(s, 3, TOTAL);
}

// ─────────────────────────────────────────────────
// Slide 4 — 데이터·API 수집
// ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COLORS.cream };
  addHeader(s, 4, "데이터·API 수집 — 첫날부터 쉬는 날까지", "평가 ② 전처리");

  s.addText("각자 맡은 공공 API를 긁어모으는 데만 3일", {
    x: 1, y: 1.8, w: 11.5, h: 0.5,
    fontSize: 16, fontFace: FONT, italic: true, color: COLORS.moss
  });

  const table = [
    ["분류", "데이터 / API", "용도"],
    ["위치·좌표", "Naver Geocoding · VWorld · TMAP POI · 법정동코드", "주소 → 좌표·POI 변환"],
    ["시세", "data.go.kr 실거래가 (전월세·매매)", "ROI 추정"],
    ["건축물", "건축HUB 표제부 + LURIS 토지이용계획", "용도·층수·정화구역"],
    ["등기", "CODEF 등기부등본 자동 발급", "근저당·신탁·압류"],
    ["상권", "서울 상권분석 4 endpoint (유동·매출·점포·신규폐업)", "지역 평균 데이터"],
    ["매장", "소상공인 상권정보 + TMAP + Naver Local", "동종업종 N건"],
    ["학교", "NEIS 학교알리미 + VWorld POI", "정화구역 50/200m"],
    ["법령·조례", "법제처 OC · ELIS 자치법규 · 자체 RAG 인덱스 5문서", "Agentic RAG 인용"],
    ["외부 분위기", "Naver 웹·뉴스·로컬 · X API", "동네 분위기·이슈"]
  ];
  s.addTable(table, {
    x: 1, y: 2.5, w: 11.3, h: 3.8,
    fontSize: 11, fontFace: FONT,
    border: { type: "solid", pt: 1, color: "D0D0D0" },
    fill: { color: COLORS.white },
    color: COLORS.ink,
    rowH: 0.35
  });
  s.addText("총 15+ 외부 API + 5 LLM 모델 + 자체 RAG 인덱스 26 청크", {
    x: 1, y: 6.4, w: 11.5, h: 0.4,
    fontSize: 13, fontFace: FONT, bold: true, color: COLORS.brass, align: "center"
  });

  addFooter(s, 4, TOTAL);
}

// ─────────────────────────────────────────────────
// Slide 5 — 우리의 킥 (14 Agent + 5 LLM 합주)
// ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COLORS.cream };
  addHeader(s, 5, "우리의 킥 — 14 Agent + 5 LLM 합주", "RAG 위에 Agent를 얹은 '샌드위치' 구조");

  // 5단 계층
  const blocks = [
    { y: 1.7, color: COLORS.moss, label: "입력 LLM", desc: "① Planner — 의도 분류 + 실행계획 (gpt-4o-mini · forced function-call)" },
    { y: 2.45, color: COLORS.brass, label: "지식 LLM", desc: "② Agentic RAG — Phase 1~5 모두 적용 (도메인 라우팅·쿼리 리라이팅·Hybrid·Self·Graph)" },
    { y: 3.2, color: COLORS.ink, label: "결정론 수집", desc: "③ 데이터 Agent 9종 — 좌표·시세·건축·등기·상권·매장·학교·법령·외부검색" },
    { y: 3.95, color: COLORS.clay, label: "종합 LLM", desc: "④ Decision (gpt-4o-mini) — go/conditional/stop · ⑤ Summarizer (gpt-4o) — 자연어 요약" },
    { y: 4.7, color: COLORS.muted, label: "검증·기록", desc: "⑥ Validation — 단정 차단 · ⑦ Trace Recorder — 14 Agent 호출 로그 실시간 공개" }
  ];
  blocks.forEach((b) => {
    s.addShape(pres.ShapeType.rect, {
      x: 1, y: b.y, w: 11.3, h: 0.6,
      fill: { color: b.color },
      line: { color: b.color }
    });
    s.addText(b.label, {
      x: 1.2, y: b.y, w: 2, h: 0.6,
      fontSize: 13, fontFace: FONT, bold: true, color: COLORS.white, align: "left", valign: "middle"
    });
    s.addText(b.desc, {
      x: 3.2, y: b.y, w: 8.9, h: 0.6,
      fontSize: 12, fontFace: FONT, color: COLORS.white, align: "left", valign: "middle"
    });
  });

  s.addText("LLM은 위·아래에서 의도와 결론만 담당, 가운데는 결정론적 데이터 — 환각 최소화", {
    x: 1, y: 5.6, w: 11.3, h: 0.4,
    fontSize: 13, fontFace: FONT, italic: true, color: COLORS.moss, align: "center"
  });

  addFooter(s, 5, TOTAL);
}

// ─────────────────────────────────────────────────
// Slide 6 — Agent ① Planner + ② Agentic RAG (Phase 1~2)
// ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COLORS.cream };
  addHeader(s, 6, "Agent ① Planner · ② Agentic RAG", "사용자 의도를 읽고, 지식을 똑똑하게 검색한다");

  // 왼쪽 - Planner
  s.addText("① Planner — 너의 생각이 뭐냐?", {
    x: 0.7, y: 1.7, w: 6, h: 0.5,
    fontSize: 16, fontFace: FONT, bold: true, color: COLORS.moss
  });
  s.addText("OpenAI gpt-4o-mini · forced function-call", {
    x: 0.7, y: 2.15, w: 6, h: 0.3,
    fontSize: 11, fontFace: FONT, color: COLORS.muted
  });
  const plannerPoints = [
    "• 사용자 자유 질문 → 의도 분류 (intent_tags)",
    "• 모드별 execution_plan 자동 생성",
    "• 어느 Agent를 어떤 우선순위로 호출할지 결정",
    "• tool calling으로 JSON 강제 (자유 텍스트 X)"
  ];
  s.addText(plannerPoints.join("\n"), {
    x: 0.7, y: 2.5, w: 6, h: 3.5,
    fontSize: 12, fontFace: FONT, color: COLORS.ink, paraSpaceAfter: 6
  });

  // 오른쪽 - Agentic RAG Phase 1+2
  s.addText("② Agentic RAG — Phase 1+2", {
    x: 7, y: 1.7, w: 6, h: 0.5,
    fontSize: 16, fontFace: FONT, bold: true, color: COLORS.brass
  });
  s.addText("Pre-retrieval Advanced", {
    x: 7, y: 2.15, w: 6, h: 0.3,
    fontSize: 11, fontFace: FONT, color: COLORS.muted
  });
  const ragPoints = [
    "• Phase 1: 임베딩 (text-embedding-3-small) + cosine",
    "• Phase 2 - 도메인 자동 라우팅:",
    "    창업 → [law, ordinance, contract]",
    "    상가 → [ordinance, contract, law]",
    "    부동산 → [contract, case]",
    "• Phase 2 - LLM 쿼리 리라이팅:",
    "    \"강남에 카페 차리려는데\" → \"강남구 휴게음식점 인허가 규제\"",
    "• 인덱스 26 청크 (식품위생·풍속·임대차·전세사기·자치구 조례)"
  ];
  s.addText(ragPoints.join("\n"), {
    x: 7, y: 2.5, w: 6, h: 3.8,
    fontSize: 11, fontFace: FONT, color: COLORS.ink, paraSpaceAfter: 4
  });

  s.addText("→ Phase 3·4·5는 다음 슬라이드", {
    x: 7, y: 6.3, w: 6, h: 0.3,
    fontSize: 11, fontFace: FONT, italic: true, color: COLORS.brass
  });

  addFooter(s, 6, TOTAL);
}

// ─────────────────────────────────────────────────
// Slide 7 — Phase 5 RAG 풀스택 (NEW)
// ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COLORS.cream };
  addHeader(s, 7, "Naive에서 GraphRAG까지 — 5단계 모두 적용", "디엘톤 1~2일 안에 Phase 3·4·5 추가 구현");

  const phaseTable = [
    ["Phase", "기술", "효과", "적용 시점"],
    ["1", "Naive RAG — 임베딩 + cosine", "기본 의미 검색", "발표 -3일"],
    ["2", "도메인 라우팅 + LLM 쿼리 리라이팅", "매칭률 30~50% ↑", "발표 -3일"],
    ["3", "★ Hybrid (BM25 + Vector + RRF) + LLM Reranker", "lexical + semantic 양쪽 잡음", "발표 -1일"],
    ["4", "★ Self-RAG (confidence) + Corrective (재검색)", "검색 부족 시 자동 보완", "발표 -1일"],
    ["5", "★ GraphRAG — 청크 그래프 traversal", "법령↔조례↔사례 연관 자동", "발표 -1일"]
  ];
  s.addTable(phaseTable, {
    x: 1, y: 1.9, w: 11.3, h: 3.5,
    fontSize: 12, fontFace: FONT,
    border: { type: "solid", pt: 1, color: "D0D0D0" },
    fill: { color: COLORS.white },
    color: COLORS.ink,
    rowH: 0.55
  });

  // 핵심 메시지
  s.addShape(pres.ShapeType.rect, {
    x: 1, y: 5.7, w: 11.3, h: 0.9,
    fill: { color: COLORS.moss }, line: { color: COLORS.moss }
  });
  s.addText("Naive RAG가 아닌 Phase 5 GraphRAG까지 모두 적용된 Agentic RAG", {
    x: 1.2, y: 5.7, w: 11.0, h: 0.9,
    fontSize: 16, fontFace: FONT, bold: true, color: COLORS.cream, align: "center", valign: "middle"
  });

  addFooter(s, 7, TOTAL);
}

// ─────────────────────────────────────────────────
// Slide 8 — Agent ③ Decision + ④ Summarizer + ⑤ Validation
// ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COLORS.cream };
  addHeader(s, 8, "Agent ③ Decision · ④ Summarizer · ⑤ Validation", "데이터를 종합해 결론을 내고, 사람의 말로 옮기고, 단정은 막는다");

  const decTable = [
    ["Agent", "역할", "사용 모델", "출력"],
    ["③ Decision", "에이전트 결과 종합 → 결정", "gpt-4o-mini (JSON)", "verdict · reasons · next_actions · red_flags"],
    ["④ Summarizer", "자연어 요약 (부동산 모드)", "gpt-4o", "summary 보고서"],
    ["⑤ Validation", "단정 차단 + warnings 첨부", "자체 검증 (deterministic)", "warnings · runtime_fallback 표시"]
  ];
  s.addTable(decTable, {
    x: 1, y: 1.8, w: 11.3, h: 2.3,
    fontSize: 12, fontFace: FONT,
    border: { type: "solid", pt: 1, color: "D0D0D0" },
    fill: { color: COLORS.white },
    color: COLORS.ink,
    rowH: 0.45
  });

  s.addText("Decision Card 출력 예시 (강남 카페 창업)", {
    x: 1, y: 4.5, w: 11.3, h: 0.4,
    fontSize: 14, fontFace: FONT, bold: true, color: COLORS.moss
  });
  const example = [
    'verdict: "go"',
    'headline: "강남구 카페 창업 가능, 즉시 진행 추천"',
    'reasons: ["건축물 제2종근생 ✓", "200m 카페 37건 (경쟁 심함)", "평일 유동 70만", "매출 6.9억"]',
    'next_actions: ["강남구청 위생과 사전 컨설팅", "휴게음식점 영업신고", "위생교육 6시간 수료", "임대인 동의서 확보"]',
    'red_flags: []',
    'action_links: [강남구청 · 식약처 식품안전나라 · 위생교육 · ELIS 자치법규]'
  ];
  s.addText(example.join("\n"), {
    x: 1, y: 5.0, w: 11.3, h: 1.8,
    fontSize: 11, fontFace: "Consolas", color: COLORS.ink,
    fill: { color: COLORS.paper }
  });

  addFooter(s, 8, TOTAL);
}

// ─────────────────────────────────────────────────
// Slide 9 — 모델 선정
// ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COLORS.cream };
  addHeader(s, 9, "모델 선정 — Task에 맞는 모델", "비싸고 좋은 모델 하나가 아니라, 단계별로 다른 모델");

  const modelTable = [
    ["역할", "모델", "이유", "토큰 비용"],
    ["Planner / Decision / Reranker / Self-RAG / Query Rewriter / Relevance Filter", "gpt-4o-mini", "빠르고 저렴 · JSON 출력 강함", "$0.15 / 1M tokens"],
    ["Summarizer (부동산)", "gpt-4o", "긴 문맥 + 자연스러운 한국어", "$2.50 / 1M tokens"],
    ["RAG 임베딩", "text-embedding-3-small", "비용 대비 정확도 최고", "$0.02 / 1M tokens"],
    ["", "", "", ""],
    ["분석 1회 총 비용 추정", "", "₩10~50", "(LLM만, 공공 API 무료)"]
  ];
  s.addTable(modelTable, {
    x: 1, y: 1.8, w: 11.3, h: 3.8,
    fontSize: 11, fontFace: FONT,
    border: { type: "solid", pt: 1, color: "D0D0D0" },
    fill: { color: COLORS.white },
    color: COLORS.ink,
    rowH: 0.5
  });

  s.addText("\"좋은 모델 하나\"가 아니라 \"적합한 모델의 합주\"", {
    x: 1, y: 6.0, w: 11.3, h: 0.5,
    fontSize: 16, fontFace: FONT, italic: true, color: COLORS.moss, align: "center"
  });

  addFooter(s, 9, TOTAL);
}

// ─────────────────────────────────────────────────
// Slide 10 — 성능 향상 (Phase 3·4·5 추가)
// ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COLORS.cream };
  addHeader(s, 10, "성능 향상 — 논리적으로 접근", "평가 ③ 성능 · 정확도가 아니라 '신뢰할 수 있는 답'");

  const points = [
    { label: "검색 품질", desc: "LLM 쿼리 리라이팅 + 도메인 라우팅으로 매칭률 ↑" },
    { label: "Hybrid Search", desc: "BM25 + Vector + RRF — lexical + semantic 양쪽 잡음 ★ Phase 3" },
    { label: "Reranker", desc: "gpt-4o-mini top 20 → top 5 재순위 (Cohere/BGE 대체) ★ Phase 3" },
    { label: "Self-RAG", desc: "confidence 자체 평가 + missing_aspects 추출 ★ Phase 4" },
    { label: "Corrective", desc: "confidence < 0.6 시 쿼리 보강 후 재검색 ★ Phase 4" },
    { label: "GraphRAG", desc: "청크 그래프 — 식품위생법 → 자치구 조례 → 판례 연결 ★ Phase 5" },
    { label: "검색 튜닝", desc: "minScore 0.25~0.3 · top-k=5 — noise와 miss 균형" },
    { label: "정직성", desc: "Mock 누수 차단 — 실패한 데이터는 숫자로 덮지 않고 '없음' 명시" },
    { label: "좌표 정확", desc: "KATEC↔WGS84 변환 + TMAP 통합 — 동종업종 매장 누락 해결" },
    { label: "설명가능성", desc: "점수 분해 (누적 막대) · Agent trace 실시간 공개" }
  ];
  let yPos = 1.7;
  for (const p of points) {
    s.addText(p.label, {
      x: 0.7, y: yPos, w: 2.5, h: 0.35,
      fontSize: 11, fontFace: FONT, bold: true, color: COLORS.brass
    });
    s.addText(p.desc, {
      x: 3.3, y: yPos, w: 9.5, h: 0.35,
      fontSize: 11, fontFace: FONT, color: COLORS.ink
    });
    yPos += 0.42;
  }

  addFooter(s, 10, TOTAL);
}

// ─────────────────────────────────────────────────
// Slide 11 — NEW: 문제 해결 Story (카카오 → TMAP)
// ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COLORS.cream };
  addHeader(s, 11, "문제 해결 Story — 카카오 거절 → TMAP 전환", "단일 데이터원 의존 X · 4단 fallback chain");

  const story = [
    { day: "1일차", event: "카카오 OPEN_MAP_AND_LOCAL 권한 거절", color: COLORS.clay },
    { day: "1일차", event: "→ 즉시 SK TMAP API 발급 (월 50,000건 무료)", color: COLORS.brass },
    { day: "1일차", event: "→ Competition Density 매장 5건 → 37건 (7× 증가)", color: COLORS.moss }
  ];
  let yPos = 1.8;
  for (const e of story) {
    s.addShape(pres.ShapeType.rect, {
      x: 1, y: yPos, w: 11.3, h: 0.7,
      fill: { color: e.color }, line: { color: e.color }
    });
    s.addText(`[${e.day}]`, {
      x: 1.2, y: yPos, w: 1.5, h: 0.7,
      fontSize: 12, fontFace: FONT, bold: true, color: COLORS.white, align: "left", valign: "middle"
    });
    s.addText(e.event, {
      x: 2.8, y: yPos, w: 9.3, h: 0.7,
      fontSize: 13, fontFace: FONT, color: COLORS.white, align: "left", valign: "middle"
    });
    yPos += 0.85;
  }

  s.addText("Competition Density 4단 fallback chain", {
    x: 1, y: 4.5, w: 11.3, h: 0.4,
    fontSize: 14, fontFace: FONT, bold: true, color: COLORS.moss
  });
  const chain = [
    "0순위. ★ SK TMAP POI (좌표+반경+카테고리, 최대 200건)",
    "1순위. Kakao Local (거절 대기 중)",
    "2순위. VWorld Search POI",
    "3순위. 소상공인 상권 API",
    "4순위. Naver Local + vworld geocode (5건 한도 + 거리 필터)"
  ];
  s.addText(chain.join("\n"), {
    x: 1, y: 5.0, w: 11.3, h: 1.7,
    fontSize: 12, fontFace: FONT, color: COLORS.ink, paraSpaceAfter: 4
  });

  addFooter(s, 11, TOTAL);
}

// ─────────────────────────────────────────────────
// Slide 12 — 한계 직면
// ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COLORS.cream };
  addHeader(s, 12, "한계 직면 — 벤치마크 \"내집스캔\"", "우리의 목표: 주소만 넣으면 '들어가도 안전한지' 알려주기");

  s.addText("내집스캔 (열람 ₩12,900)", {
    x: 1, y: 1.8, w: 11.3, h: 0.5,
    fontSize: 16, fontFace: FONT, bold: true, color: COLORS.clay
  });
  const benchmark = [
    "• 근저당 여부 · 보증보험 가입 여부",
    "• 집주인의 '다른 집' 보유 현황",
    "• 대출·전입세대·확정일자 일괄 검증",
    "• 한국감정원·HUG·등기소 등 다수 데이터 직접 연동",
    "",
    "→ 결론: '안전 판정' 자체는 무료로 풀기 어려운 영역",
    "→ 등기·금융권 API 접근은 ₩원당 비용 + 개인정보 동의 필수"
  ];
  s.addText(benchmark.join("\n"), {
    x: 1, y: 2.35, w: 11.3, h: 3,
    fontSize: 13, fontFace: FONT, color: COLORS.ink, paraSpaceAfter: 5
  });

  s.addShape(pres.ShapeType.rect, {
    x: 1, y: 5.6, w: 11.3, h: 0.9,
    fill: { color: COLORS.brass }, line: { color: COLORS.brass }
  });
  s.addText("4일차 — 우리만의 강점이 살아나는 곳으로 노선 변경", {
    x: 1.2, y: 5.6, w: 11.0, h: 0.9,
    fontSize: 15, fontFace: FONT, bold: true, color: COLORS.white, align: "center", valign: "middle"
  });

  addFooter(s, 12, TOTAL);
}

// ─────────────────────────────────────────────────
// Slide 13 — 노선 변경
// ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COLORS.cream };
  addHeader(s, 13, "노선 변경 — Trust Ark에서 터무니로", "4일차, 데이터 한계를 인정하고 강점이 살아나는 곳으로");

  s.addText("무엇을 바꿨나", {
    x: 1, y: 1.8, w: 11.3, h: 0.5,
    fontSize: 16, fontFace: FONT, bold: true, color: COLORS.moss
  });
  const pivot = [
    "• 안전 판정 → 창업·영업 적합성 + 상가 활용성",
    "• \"이 자리에서 카페·음식점·PC방 영업 가능?\" — 인허가 데이터로 답함",
    "• 부동산 임차 검토는 그대로 유지 → 3개 모드 통합",
    "• 같은 코어(좌표·건축물·점수 분해·5 LLM·14 Agent) 공유 → 피벗 비용 최소"
  ];
  s.addText(pivot.join("\n\n"), {
    x: 1, y: 2.3, w: 11.3, h: 2.5,
    fontSize: 13, fontFace: FONT, color: COLORS.ink, paraSpaceAfter: 6
  });

  s.addText("\"터무니\" 의미", {
    x: 1, y: 5.0, w: 11.3, h: 0.4,
    fontSize: 14, fontFace: FONT, bold: true, color: COLORS.brass
  });
  s.addText("터 (땅·자리) + 무니 (근거·이유) — '터를 읽고 무니를 더한다'\n결과가 아닌 근거로 의사결정을 돕는다", {
    x: 1, y: 5.4, w: 11.3, h: 1.2,
    fontSize: 13, fontFace: FONT, italic: true, color: COLORS.moss
  });

  addFooter(s, 13, TOTAL);
}

// ─────────────────────────────────────────────────
// Slide 14 — NEW: A/B/C 비교 분석 (킥 #2)
// ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COLORS.cream };
  addHeader(s, 14, "킥 — A/B/C 위치 교차 비교", "사용자 진짜 가치: '어느 자리가 더 좋은가?'");

  const compTable = [
    ["항목", "A안 (강남)", "B안 (양천)", "C안 (서대문)"],
    ["최종 판단", "CONDITIONAL", "GO ⭐", "CONDITIONAL"],
    ["동종업종 200m", "37건", "15건 ⭐", "30건"],
    ["평일 유동인구", "701,448 ⭐", "516,465", "583,676"],
    ["점포당 월 매출", "3,632만 ⭐", "1,368만", "—"],
    ["예상 월 임대료", "290만", "109만 ⭐", "—"],
    ["예상 월 순익", "1,888만 ⭐", "712만", "—"],
    ["1억 회수기간", "5.3개월 ⭐", "14개월", "—"],
    ["종합 점수", "33/100", "48/100 🏆", "33/100"]
  ];
  s.addTable(compTable, {
    x: 1, y: 1.7, w: 11.3, h: 4.0,
    fontSize: 11, fontFace: FONT,
    border: { type: "solid", pt: 1, color: "D0D0D0" },
    fill: { color: COLORS.white },
    color: COLORS.ink,
    rowH: 0.4
  });

  s.addText("자동 ROI 계산 + 1위 항목 ⭐ 자동 강조 → ₩9,900/월 핵심 가치", {
    x: 1, y: 6.0, w: 11.3, h: 0.5,
    fontSize: 13, fontFace: FONT, italic: true, color: COLORS.moss, align: "center"
  });

  addFooter(s, 14, TOTAL);
}

// ─────────────────────────────────────────────────
// Slide 15 — Metric (자체 평가 수치 추가)
// ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COLORS.cream };
  addHeader(s, 15, "Metric — 무엇으로 잘했다고 말하나", "평가 ④ Metric · 정답 라벨 없는 문제 → 우리만의 지표");

  s.addText("Golden Dataset 10케이스 자체 평가 (gpt-4o-mini as Judge)", {
    x: 1, y: 1.8, w: 11.3, h: 0.4,
    fontSize: 14, fontFace: FONT, bold: true, color: COLORS.moss
  });

  const metricTable = [
    ["메트릭", "값", "해석"],
    ["Success rate", "100%", "10/10 케이스 분석 성공"],
    ["Avg hits", "3.5 / 5", "top-5 평균 결과 수"],
    ["LLM Relevance Score", "52 / 100", "gpt-4o-mini가 매긴 평균 관련성"],
    ["★ Hit@5", "70%", "예상 키워드 top-5 도달률"],
    ["★ Citation Accuracy", "100%", "할루시네이션 0건 (모든 인용 실제 인덱스)"],
    ["Domain Match Rate", "55%", "예상 도메인 등장 비율"],
    ["★ Self-RAG Confidence", "81%", "Phase 4 자체 평가 평균"],
    ["GraphRAG 매칭률", "70%", "Phase 5 연관 청크 첨부"],
    ["Verdict Accuracy", "20%", "부동산 모드 verdict 형식 차이 → 개선 필요"]
  ];
  s.addTable(metricTable, {
    x: 1, y: 2.4, w: 11.3, h: 3.7,
    fontSize: 11, fontFace: FONT,
    border: { type: "solid", pt: 1, color: "D0D0D0" },
    fill: { color: COLORS.white },
    color: COLORS.ink,
    rowH: 0.4
  });

  s.addText("매 배포마다 자동 재측정 → 회귀 방지 · `node scripts/eval-rag.mjs`", {
    x: 1, y: 6.3, w: 11.3, h: 0.4,
    fontSize: 11, fontFace: "Consolas", italic: true, color: COLORS.muted, align: "center"
  });

  addFooter(s, 15, TOTAL);
}

// ─────────────────────────────────────────────────
// Slide 16 — 시스템 구조
// ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COLORS.cream };
  addHeader(s, 16, "시스템 구조 — 하나의 런타임, 세 개의 모드", "Next.js Route Handler + 14 Agent 멀티 파이프라인");

  // 3 모드 박스
  const modes = [
    { x: 1, label: "부동산 임차·매수", agents: "13 Agent", color: COLORS.moss },
    { x: 5.2, label: "창업·영업 적합성", agents: "9 Agent", color: COLORS.brass },
    { x: 9.3, label: "상가 활용성", agents: "6 Agent", color: COLORS.clay }
  ];
  modes.forEach((m) => {
    s.addShape(pres.ShapeType.rect, {
      x: m.x, y: 1.7, w: 3.7, h: 0.9,
      fill: { color: m.color }, line: { color: m.color }
    });
    s.addText(m.label, {
      x: m.x, y: 1.7, w: 3.7, h: 0.5,
      fontSize: 13, fontFace: FONT, bold: true, color: COLORS.white, align: "center", valign: "middle"
    });
    s.addText(m.agents, {
      x: m.x, y: 2.15, w: 3.7, h: 0.4,
      fontSize: 11, fontFace: FONT, color: COLORS.cream, align: "center", valign: "middle"
    });
  });

  // 화살표 아래로
  s.addText("▼ 공통 파이프라인", {
    x: 1, y: 2.85, w: 12, h: 0.4,
    fontSize: 12, fontFace: FONT, italic: true, color: COLORS.muted, align: "center"
  });

  const flow = [
    "입력 (주소 · 조건 · 질문)",
    "▼",
    "Planner — 의도 + 실행계획 (gpt-4o-mini)",
    "▼ 병렬 실행",
    "Location · Building · Market · Trade Area · Competition · School · Local Context (9 데이터 Agent)",
    "▼",
    "Agentic RAG — Phase 1~5 (도메인 라우팅 · 쿼리 리라이팅 · Hybrid · Self · Graph)",
    "▼",
    "Decision (gpt-4o-mini) + Summarizer (gpt-4o)",
    "▼",
    "Validation + Trace Recorder → 최종 응답 + 카드 + 진단 패널"
  ];
  s.addText(flow.join("\n"), {
    x: 1, y: 3.3, w: 11.3, h: 3.0,
    fontSize: 11, fontFace: FONT, color: COLORS.ink, align: "center", paraSpaceAfter: 2
  });

  s.addText("세 모드가 같은 코어를 공유 → 피벗 비용 최소 · 코드 재사용 80%+", {
    x: 1, y: 6.45, w: 11.3, h: 0.4,
    fontSize: 12, fontFace: FONT, italic: true, color: COLORS.moss, align: "center"
  });

  addFooter(s, 16, TOTAL);
}

// ─────────────────────────────────────────────────
// Slide 17 — 더 개선할 점 + 향후 로드맵
// ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COLORS.cream };
  addHeader(s, 17, "더 개선할 점 · 향후 업데이트", "디엘톤 이후 로드맵");

  // 왼쪽 - 이미 해결한 것
  s.addText("✅ 디엘톤 중 해결한 것", {
    x: 0.7, y: 1.7, w: 6, h: 0.4,
    fontSize: 14, fontFace: FONT, bold: true, color: COLORS.moss
  });
  const solved = [
    "✓ 동종업종 매장 누락 (TMAP 통합)",
    "✓ NEIS 학교 API 간헐 오류 (재시도 + VWorld POI fallback)",
    "✓ 빈 카드 정리 (자동 숨김)",
    "✓ 카카오 거절 → TMAP 0순위로 전환",
    "✓ Phase 3·4·5 RAG 모두 적용",
    "✓ A/B/C 비교 분석 MVP",
    "✓ 자체 평가 메트릭 시스템 구축"
  ];
  s.addText(solved.join("\n"), {
    x: 0.7, y: 2.15, w: 6, h: 4,
    fontSize: 11, fontFace: FONT, color: COLORS.ink, paraSpaceAfter: 4
  });

  // 오른쪽 - 발표 후 로드맵
  s.addText("📌 발표 후 로드맵", {
    x: 7, y: 1.7, w: 6, h: 0.4,
    fontSize: 14, fontFace: FONT, bold: true, color: COLORS.brass
  });
  const roadmap = [
    "Phase 6 — 인덱스 26 → 500 청크 확장",
    "Phase 7 — Knowledge Graph DB (Neo4j)",
    "Phase 8 — Cohere rerank 정식 통합",
    "Phase 9 — 자율 에이전트화 (LLM tool-use loop)",
    "Phase 10 — Self-improving RAG (사용자 피드백)",
    "법령·조례 RAG 월 1회 자동 재인덱싱 (cron)",
    "5개 업종 전국 확대 (음식점·카페·미용·학원·PC방)",
    "공인중개사·행정사용 B2B 일괄 검토 모드",
    "ROI 입력 폼 (투자금·메뉴 객단가 → 정확 손익분기)",
    "임대인 평판 검색 (등기 + Naver + 분쟁 이력)"
  ];
  s.addText(roadmap.join("\n"), {
    x: 7, y: 2.15, w: 6, h: 4,
    fontSize: 10, fontFace: FONT, color: COLORS.ink, paraSpaceAfter: 3
  });

  addFooter(s, 17, TOTAL);
}

// ─────────────────────────────────────────────────
// Slide 18 — 회고
// ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: COLORS.cream };
  addHeader(s, 18, "회고 — 우리는 무엇을 배웠나", "복덕방스 · 5일의 학습");

  const lessons = [
    "• 데이터의 '양'보다 '구조적 접근 가능성'이 서비스의 천장을 정한다",
    "• 이길 수 없는 영역은 빨리 인정 — 4일차 피벗이 발표를 살렸다",
    "• RAG는 단일 기법이 아닌 5단계 합주 — Phase 1~5 모두 적용",
    "• Multi-Agent는 \"많은 LLM 호출\"이 아닌 \"역할 분담의 명확한 설계\"",
    "• 정답 라벨이 없는 문제는 우리만의 지표를 만들어 측정",
    "• 외부 데이터원 의존 X — 4단 fallback chain으로 견고성 확보",
    "• 코딩과 컨설팅의 결합 — 부동산·창업에 데이터·LLM·Agent가 어떻게 결합되는지 실험"
  ];
  s.addText(lessons.join("\n\n"), {
    x: 1, y: 1.8, w: 11.3, h: 4.5,
    fontSize: 13, fontFace: FONT, color: COLORS.ink, paraSpaceAfter: 5
  });

  // 마무리 박스
  s.addShape(pres.ShapeType.rect, {
    x: 1, y: 6.0, w: 11.3, h: 0.8,
    fill: { color: COLORS.moss }, line: { color: COLORS.moss }
  });
  s.addText("터를 읽고, 무니를 더한다. — 결과가 아닌 근거로 의사결정을 돕는 코파일럿.", {
    x: 1.2, y: 6.0, w: 11.0, h: 0.8,
    fontSize: 15, fontFace: FONT, bold: true, color: COLORS.cream, align: "center", valign: "middle", italic: true
  });

  addFooter(s, 18, TOTAL);
}

await pres.writeFile({ fileName: OUT_PATH });
console.log(`✓ PPTX 생성 완료: ${OUT_PATH}`);
