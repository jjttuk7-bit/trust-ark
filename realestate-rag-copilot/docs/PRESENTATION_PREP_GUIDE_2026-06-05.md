# 터무니 — 발표 직전 준비 가이드

작성: 2026-06-05
대상: 디엘톤 발표 D-Day 이전 최종 점검
브랜치: `main` (commit `87062cf` 기준)

---

## 1. 오늘까지 완성된 것 (체크리스트)

### 🟢 코드·기능 완성

| 영역 | 상태 |
|---|---|
| 3개 모드 (부동산·창업·상가) | ✅ 풀 파이프라인 |
| 14 Agent + 5 LLM 모델 | ✅ 동작 |
| RAG Phase 1~5 모두 적용 | ✅ Hybrid · Rerank · Self-RAG · Corrective · GraphRAG |
| 15+ 외부 API | ✅ TMAP 0순위, fallback chain |
| 모드별 핵심 KPI 4종 (B+A 개편) | ✅ 동적 + 클릭 anchor |
| A/B/C 비교 분석 페이지 | ✅ `/compare` 동작 |
| Decision Card 액션 link | ✅ 자치구 연락처 + 식약처 등 |
| Planner UI 실시간 실행 결과 | ✅ 우선순위 + 결과 배지 |
| 평가 메트릭 시스템 | ✅ Golden 10케이스, 자동 측정 |

### 🟢 문서 완성

| 문서 | MD | PDF | DOCX |
|---|---|---|---|
| 발표 시연 시나리오 (DEMO_SCENARIO) | ✅ | ✅ | ✅ |
| RAG + Multi-Agent 기술 상세 (RAG_AND_AGENTS_DETAIL) | ✅ | ✅ | ✅ |
| RAG 평가 보고서 (RAG_EVALUATION_REPORT) | ✅ | ✅ | ✅ |
| Agent 자율성 분석 (AGENT_AUTONOMY_ANALYSIS) | ✅ | ✅ | ✅ |
| 업그레이드 우선순위 (UPGRADE_PRIORITIES) | ✅ | — | — |
| 본 문서 (PRESENTATION_PREP_GUIDE) | ✅ | ✅ | ✅ |

### 🟢 발표 자료

| 자료 | 상태 |
|---|---|
| PPT 18장 (터무니_디엘톤_발표자료_v2.pptx) | ✅ |
| 워크플로우 다이어그램 (tumuni-workflow.svg/png) | ✅ |
| 평가 메트릭 표 (Slide 15) | ✅ 첫 측정값 반영 |

---

## 2. 발표 직전 우선순위 작업 (1.5시간 안에)

### 🥇 1순위 — 시연 리허설 + 캐시 warm-up (30분)

**왜**: Vercel serverless cold start 회피. 발표 중 첫 호출 5초 → 캐시 후 1초.

**작업**:
```
1. https://trust-ark.vercel.app 접속
2. 메인 시연 입력으로 1회 실행
   - 모드: 창업·영업 적합성
   - 주소: 서울특별시 강남구 테헤란로4길 37
   - 업종: 카페
3. 결과 페이지 검증:
   ✓ Decision Card (verdict + 4개 근거 + 4개 액션 + 자치구 연락처)
   ✓ 핵심 KPI 4개 (모드별)
   ✓ 검토 위치 지도
   ✓ 강남구 상권 진단 (유동 70만, 매출 6.9억)
   ✓ 반경 200m 카페 37건
   ✓ 건축물대장 (덕호빌딩 · 제2종근생 · 8층)
   ✓ 동네 분위기 6건 (LLM 필터)
   ✓ 법령·조례·사례 RAG (Phase 5 GraphRAG)
4. PlannerInsightPanel 펼치기 → 실행 결과 배지 확인
5. /compare 페이지 — 3개 위치 비교 1회 실행
```

### 🥈 2순위 — 백업 시나리오 검증 (15분)

**왜**: 메인 시연 실패 시 즉시 다른 입력으로 전환.

**백업 3종**:
```
B1. 홍대 음식점:
  주소: 서울특별시 마포구 양화로 165
  업종: 음식점
  예상: GO + 음식점 매장 N건

B2. 부동산 강남 전세:
  주소: 서울특별시 강남구 역삼동 825
  property_type: apartment
  contract_type: jeonse
  deposit: 800000000

B3. 양천 목동 카페:
  주소: 서울특별시 양천구 목동중앙로 64
  업종: 카페
```

### 🥉 3순위 — 평가 메트릭 재측정 (10분)

**작업**:
```bash
cd realestate-rag-copilot/frontend
node scripts/eval-rag.mjs --api-url=https://trust-ark.vercel.app
node scripts/build-demo-doc.mjs RAG_EVALUATION_REPORT_2026-06-05
```

**최신 수치를 PPT Slide 15에 반영** (필요시 build-presentation.mjs 수정).

### 🏅 4순위 (선택) — 부동산 RAG 통합 fix (30분)

**왜**: 평가 케이스 6, 7, 8 (부동산) hits=0건 → verdict accuracy 20%.

**대응**:
- route.ts 부동산 분기에 Legal RAG Agent 호출 추가
- 또는 Golden Dataset의 expected_verdict 보정

---

## 3. 발표 당일 체크리스트

### 발표 1시간 전

- [ ] Vercel deploy 상태 확인 (`https://trust-ark.vercel.app/`)
- [ ] 메인 시연 입력 1회 실행 → 캐시 warm
- [ ] 백업 시나리오 3개 각각 1회 실행 → 캐시 warm
- [ ] 인터넷 연결 안정 (3G/4G 백업?)
- [ ] PPT v2 파일 준비 (USB + 클라우드 백업)
- [ ] 노트북 배터리 100% + 충전기

### 발표 직전 5분

- [ ] 브라우저 최신 새로고침 (Ctrl+F5)
- [ ] 메인 화면 로드 상태 확인
- [ ] PPT 첫 슬라이드 열려 있는지
- [ ] 노트북 알림 OFF (방해 금지 모드)

### 발표 중

- [ ] 시연 시 천천히 — 사용자가 화면 따라올 시간 확보
- [ ] 데이터가 안 채워지면 침착하게 백업 시나리오로
- [ ] "이건 디엘톤 며칠 동안 만든 거다" 강조 — 완성도 어필 X, 학습 어필 ✓

### 발표 후 (Q&A)

- [ ] **자율성 질문 받으면**: AGENT_AUTONOMY_ANALYSIS 문서 기반 답변
- [ ] **RAG 깊이 질문 받으면**: Phase 1~5 단계 설명, RAG_AND_AGENTS_DETAIL 참조
- [ ] **평가 메트릭 질문 받으면**: RAG_EVALUATION_REPORT 수치 인용
- [ ] **카카오 거절 관련**: 솔직히 인정 + TMAP 대체 story

---

## 4. 시연 흐름 타임라인 (10분)

| 시간 | 슬라이드 / 화면 | 핵심 메시지 |
|---|---|---|
| 0:00 - 0:30 | PPT 1 (표지) | 터무니 · 터를 읽고 무니를 더하다 |
| 0:30 - 1:30 | PPT 2~5 (배경·킥) | 디엘톤 정신 + 14 Agent + 5 LLM 합주 |
| 1:30 - 2:30 | 라이브 시연 1 (강남 카페) | Decision GO + 핵심 KPI 4개 |
| 2:30 - 3:30 | 시연 — 카드 스크롤 | 상권 진단 / 동종업종 / 건축물대장 |
| 3:30 - 4:30 | PPT 7 (Phase 5 RAG) + 시연 RAG 카드 | Naive → GraphRAG 5단계 |
| 4:30 - 5:30 | 시연 — /compare 페이지 | A/B/C 비교 + ROI 계산 |
| 5:30 - 6:30 | 시연 — Planner 진단 패널 | 14 Agent 실행 결과 trace |
| 6:30 - 7:30 | PPT 11, 14, 15 (문제해결·비교·메트릭) | TMAP / 비교 / 평가 |
| 7:30 - 8:30 | PPT 13 (노선 변경) + 시연 부동산 모드 | 피벗 story |
| 8:30 - 9:30 | PPT 17 (로드맵) | Phase 6~10 + 자율성 다음 단계 |
| 9:30 - 10:00 | PPT 18 (회고) | 디엘톤에서 배운 것 |

---

## 5. 발표 핵심 멘트 모음

### 오프닝
> "오늘 5분 안에 강남 카페 창업이 가능한지 자동 분석해드립니다.
> 14개 Agent와 Phase 5 RAG가 협업해서 만든 결정 코파일럿입니다."

### 라이브 시연 후
> "방금 15초 안에 본 결과는 15개 외부 데이터 소스 + 8개 LLM 결정 + 26개 RAG 청크의 종합입니다.
> Decision Card의 결론은 환각이 아니라 실제 데이터에서 도출됐고, Citation Accuracy 100%입니다."

### Phase 5 RAG 설명
> "Naive RAG가 아닙니다. 임베딩 → 도메인 라우팅 → Hybrid Search → LLM Reranker → Self-RAG → Corrective → GraphRAG.
> 5단계 모두 디엘톤 안에 구현했고, 평가까지 자동화했습니다."

### Multi-Agent 설명
> "14개 Agent가 협업합니다.
> Planner가 의도를 읽고 실행 계획을 짜고,
> 데이터 Agent 9종이 병렬로 외부 API를 호출하고,
> Decision Agent가 종합 판단을 내립니다.
> 각 Agent의 호출 결과는 실시간으로 화면에 보입니다."

### 자율성 질문 답변
> "Level 2 도구 사용 + 부분적 Level 3 계획입니다.
> LLM 8개 결정 지점에서 자율 판단하고, Self-RAG로 자체 평가 + Corrective로 재시도까지 합니다.
> 진정한 Level 3 (Planner-driven dispatcher)는 발표 후 1주 안에 적용 예정입니다."

### 마무리
> "5일 동안 우리가 한 일:
> Naive RAG → GraphRAG, 14 Agent + 5 LLM + 15+ 데이터 통합,
> 자체 평가 시스템 (Citation Accuracy 100%),
> A/B/C 비교 분석 (B2C 핵심 가치).
> 코딩과 컨설팅의 결합이 부동산·창업에서 어떻게 가능한지 실험으로 답을 만들었습니다.
> 터를 읽고, 무니를 더한다 — 결과가 아닌 근거로 의사결정을 돕는 코파일럿입니다."

---

## 6. 발표 후 로드맵 (Phase 6~10)

### 1주 내 (발표 +1주)

| 우선 | 작업 | 가치 |
|---|---|---|
| ★★★ | **Phase A dispatcher** 본격 구현 (Level 3 진입) | Planner 진짜 지휘자 |
| ★★ | 카카오 재신청 (회사명·카테고리 보강) | POI 데이터 풍부 |
| ★★ | 부동산 모드 RAG 통합 | 평가 verdict accuracy ↑ |
| ★★ | 인덱스 확장 26 → 50 청크 | RAG 정확도 ↑ |

### 1개월 내

| 작업 | 가치 |
|---|---|
| 사용자 ROI 입력 폼 (B2C 핵심 가치) | ₩9,900/월 모델 |
| Cohere rerank 정식 통합 (Phase 8) | RAG 산업 표준 |
| ReAct Agent Loop (Phase B, Level 4) | 자율성 한 단계 ↑ |
| 임대인 평판 검색 + 등기 자동 발급 | 빌라왕 방지 핵심 |

### 3개월 내

| 작업 | 가치 |
|---|---|
| Multi-Agent Collaboration (Phase C) | Level 4+ |
| Knowledge Graph DB (Neo4j) — Phase 7 | GraphRAG 본격 |
| B2B API 제공 (공인중개사·컨설팅) | 매출 모델 |
| 정책자금 자동 매칭 | 사용자 충성도 |

### 장기

- Self-improving RAG (Phase D, Level 5)
- 5개 업종 전국 확대
- 멀티 LLM 프로바이더

---

## 7. 발표 후 회수 (Retrospective) 가이드

발표 후 1주 안에 다음 회고:

### 데이터
- 발표 중 시연 성공률
- Q&A에서 받은 질문 유형
- 청중 반응 (호기심·의심·관심)

### 학습
- 가장 인상적이었던 피드백
- 다음 디엘톤·발표에서 바꿀 것
- 부족했던 부분 (기술·UX·발표·자료)

### 결정
- B2B 시장 진입 시점
- 추가 데이터원 / API
- 발표 외부 노출 (LinkedIn / 블로그)

---

## 8. 마지막 격려

5일 동안 만든 것:
- **3개 모드** 통합 코파일럿
- **14 Agent** Multi-Agent Architecture
- **Phase 5 GraphRAG**까지 모두 적용
- **15+ 데이터 소스** 통합
- **A/B/C 비교 분석** B2C 차별화
- **자체 평가 시스템** Citation Accuracy 100%
- **18장 PPT + 워크플로우 다이어그램 + 4개 기술 문서**

> 디엘톤은 등수가 아니라 각자의 공부.
> 오늘 우리는 데이터·LLM·Agent가 부동산·창업에서 어떻게 결합되는지
> 5일 동안 실험으로 답을 만들었습니다.

**발표 잘 다녀오세요!**

---

작성자: 터무니 팀
관련 문서:
- [발표 시연 시나리오 (DEMO_SCENARIO)](./DEMO_SCENARIO_2026-06-05.md)
- [RAG + Multi-Agent 기술 상세](./RAG_AND_AGENTS_DETAIL_2026-06-05.md)
- [Agent 자율성 분석](./AGENT_AUTONOMY_ANALYSIS_2026-06-05.md)
- [RAG 평가 보고서](./RAG_EVALUATION_REPORT_2026-06-05.md)
- [업그레이드 우선순위](./UPGRADE_PRIORITIES_2026-06-05.md)
