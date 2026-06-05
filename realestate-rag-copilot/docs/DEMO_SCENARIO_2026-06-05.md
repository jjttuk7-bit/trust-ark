# 터무니 (Trust Ark) 발표 시연 시나리오

작성: 2026-06-05
대상: 디엘톤 발표 (10분 데모)
브랜치: `main` (commit `9201fdc` 기준)

---

## 1. 현재 구현 상태 한눈에

### 3개 모드 통합 서비스
| 모드 | 상태 | Agent 수 |
|---|---|---|
| **부동산 임차·매수** (real_estate) | ✅ 풀 파이프라인 | 13 Agent |
| **창업·영업 적합성** (business_permit) | ✅ 8 Agent + Decision LLM | 8 + 1 |
| **상가 활용성** (commercial_use) | ✅ 5 Agent + Decision LLM | 5 + 1 |

### 활성 데이터 소스 (15+)
**공공 API**
- VWorld (지오코딩, POI)
- 국토부 실거래가 (data.go.kr)
- 건축HUB 건축물대장
- LURIS 토지이용계획
- 소상공인 상권정보 (data.go.kr B553077)
- 서울 상권분석 (4개 endpoint: 유동인구·매출·점포·신규폐업)
- 서울 일반음식점 인허가
- NEIS 학교알리미
- 법제처 / ELIS 자치법규

**민간 / 상용**
- Naver Maps (지오코딩)
- Naver Search (웹·뉴스·로컬)
- X API v2
- CODEF (등기부등본)

**자체 / LLM**
- 내부 Agentic RAG 인덱스 (26 청크 / 5개 문서)
- OpenAI Planner gpt-4o-mini
- OpenAI Summarizer gpt-4o
- OpenAI Decision gpt-4o-mini
- OpenAI Query Rewriter gpt-4o-mini
- OpenAI text-embedding-3-small

### Agentic RAG 인덱스
| 문서 | 도메인 | 청크 수 |
|---|---|---|
| 식품위생법 (음식점·카페) | law | 5 |
| 풍속법 + 청소년보호법 | law | 5 |
| 자치구 조례 (강남·서초·양천·송파) | ordinance | 5 |
| 표준임대차계약 + 보호법 | contract | 5 |
| 전세사기 주요 패턴 + 사례 | case | 6 |

**Pipeline**: Planner 의도 → 도메인 라우팅 → LLM 쿼리 리라이팅 → cosine top-5

### 카드 위계 (재정렬 완료)
1. ⚡ Decision Card (GO/CONDITIONAL/STOP + 핵심근거 + 즉시할일)
2. 🗺️ 검토 위치 지도
3. 📊 상권 진단 (유동인구·매출·인구구조·피크)
4. 🏪 동종업종 밀집도 (데이터 있을 때만)
5. 🏢 건축물대장
6. 💰 상가 시세 (commercial_use 모드)
7. 🏫 학교 정화구역 (있을 때만)
8. 📚 법령·조례·사례 RAG
9. 📰 동네 분위기 (Naver/X)
10. 🔧 Agent 진단 (개발자 모드, 접힘)

---

## 2. 발표 시연 시나리오 (10분)

### 추천 입력 — 메인 시연
| 항목 | 값 |
|---|---|
| 모드 | 창업·영업 적합성 |
| 주소 | `서울특별시 강남구 테헤란로4길 37` |
| 업종 | 카페 |
| 사용자 질문 | (선택) "이 자리에서 카페 차리려는데 가능?" |

**왜 이 입력**:
- 강남 = 데이터 풍부 (상권 51만명/일, 매출 6.9억 검증)
- 카페 = RAG 매칭률 가장 높은 업종 (식품위생법 인덱스 풍부)
- 테헤란로4길 = 실제 도로명, 건축물대장 매칭 검증

### 시연 흐름 (10분 = 600초)

#### 0:00–0:30 — 인트로 + 입력 화면 (30초)
- 터무니 슬로건: **"터를 읽고 무니를 더하다"**
- 부동산·창업·상가 3개 모드 탭 보여주기
- 창업 모드 선택

#### 0:30–1:00 — 입력 + "터무니 검토 시작" 버튼 (30초)
- 주소 + 업종 입력
- "추가 정보" 접힘 영역 안 펼침 (입력 마찰 최소화 강조)
- 검토 시작 클릭

#### 1:00–1:45 — 결과 페이지 로드 + Decision Card (45초)
- **메시지**: "13 Agent가 평균 10초 안에 종합 답을 만듭니다"
- ⚡ Decision Card 강조:
  - **"GO · 강남구 카페 창업 가능, 즉시 진행 추천"**
  - 핵심 근거 4개
  - 즉시 할 일 4개
- 멘트: "사용자가 첫 화면에서 '결정'을 받습니다"

#### 1:45–3:00 — 위치 지도 + 상권 진단 (75초)
- 🗺️ 지도에 검토 위치 마커
- 📊 상권 진단 카드:
  - 평일 유동인구 **701,448명/일**
  - 월 추정매출 **6.9억**
  - 주력 연령대 **30대 20.9% / 40대 22.5%**
  - 피크 시간 **06-11시 (출근시간)**, 피크 요일 **목요일**
- 멘트: "서울 상권분석 API 4개 endpoint를 자치구 단위로 종합"

#### 3:00–4:30 — 동종업종 + 건축물대장 (90초)
- 🏪 동종업종 밀집도:
  - 카페 5건 (셀렉티드닉스, 뚜레쥬르, 퍼스트커피랩 ...)
  - 200m 이내 N건 / 1km 이내 M건 (거리 정렬)
- 🏢 건축물대장:
  - **덕호빌딩 · 제2종근린생활시설 · 지상 8층 · 사용승인일 2021.06.09**
- 멘트: "Naver Local + 좌표 거리 계산으로 정확도 확보"

#### 4:30–6:00 — Agentic RAG (90초) ← **차별화 핵심**
- 📚 법령·조례·사례 RAG 카드:
  - 초기 쿼리: "강남구 카페 휴게음식점 인허가 영업 규제"
  - **LLM 리라이트 쿼리**: "강남구 휴게음식점 인허가 규제"
  - 도메인 라우팅 칩: **법령 / 자치법규 / 표준계약**
  - top-5 청크 (식품위생법 휴게음식점 조항 + 강남구 조례 등)
- 멘트: 
  - "단순 키워드 검색이 아닌 **LLM이 질문을 리라이트**합니다"
  - "사용자 모드에 따라 **도메인 자동 라우팅** — 부동산이면 [contract, case], 창업이면 [law, ordinance, contract]"

#### 6:00–7:00 — 동네 분위기 + 진단 패널 (60초)
- 📰 Naver 웹·뉴스 6건
- 🔧 진단 패널 펼치기 (개발자 모드):
  - 14개 Agent trace
  - 각 API 호출 결과 (success/missing/failed)
- 멘트: "실시간 trace로 어떤 데이터가 어디서 왔는지 100% 투명"

#### 7:00–8:30 — 부동산 모드 빠른 시연 (90초)
- 모드 탭 전환 → "부동산 임차·매수"
- 같은 강남 주소 + 전세 1억 / 보증금 + 월세
- Decision + 실거래가 일치율 + 등기 (Mock) + RAG (전세사기 사례)
- 멘트: "같은 인프라가 부동산 모드에서도 13 Agent로 풀 작동"

#### 8:30–9:30 — 상가 모드 빠른 시연 (60초)
- 모드 탭 → "상가 활용성"
- 같은 강남 주소 + 입지 목적
- 인근 시세 + Decision
- 멘트: "3개 모드 통합, 같은 데이터 소스 재활용"

#### 9:30–10:00 — 마무리 (30초)
- **15+ 데이터 소스 + 13 Agent + Agentic RAG가 한 결정으로 종합**
- 슬로건 재강조: "터를 읽고 무니를 더하다"
- Q&A 준비

---

## 3. 차별화 포인트 6개

### 1. 3개 모드 통합 서비스
부동산 임차·매수 + 창업·영업 적합성 + 상가 활용성 = **단일 코파일럿**

### 2. Multi-Agent Architecture
- 13개 Agent 풀 파이프라인 (부동산)
- 각 Agent의 도구·결과 traceable
- Planner가 의도 분류 + 실행 계획

### 3. Agentic RAG (Phase 1+2)
- Naive RAG 아님 — LLM 쿼리 리라이팅 + 도메인 자동 라우팅
- 사용자 모드에 따라 검색 도메인 다르게:
  - business_permit → [law, ordinance, contract]
  - commercial_use → [ordinance, contract, law]
  - real_estate → [contract, case]

### 4. LLM Decision Synthesis
gpt-4o-mini가 모든 Agent 결과를 종합 → **GO/CONDITIONAL/STOP + 즉시 할 일 3개**

### 5. 15+ 데이터 소스 동시 종합
공공 (data.go.kr·서울·NEIS·법제처·CODEF) + 민간 (Naver·VWorld) + 자체 RAG + LLM

### 6. 실시간 Trace 진단
Agent 14개의 호출 결과를 개발자 모드에서 즉시 확인 — 어디서 데이터가 왔고, 어디서 실패했는지 100% 투명

---

## 4. 알려진 한계 + 백업 계획

| # | 한계 | 대응 |
|---|---|---|
| 1 | NEIS 학교 API 일시 장애 | 카드 자동 숨김 + "데이터 일시 미확인" 안내 |
| 2 | 외곽 지역 매장 데이터 부족 | Naver Local fallback (동의어 풀로 50건+ 확보) |
| 3 | X API Free tier 한도 | trace에 "한도 소진 — Naver Web/News로 보강" 표시 |
| 4 | 등기부 사용자 결제 필요 | Mock 데이터 + "등기 자동 발급" CTA |
| 5 | 상권분석 일부 메트릭 빈칸 (주말 유동, 신규/폐업) | 빈 필드 자동 숨김 |

### 발표 중 fallback 시나리오

**상황 A — 모든 API 정상**
- 추천 입력 그대로
- 모든 카드 풍부하게 노출

**상황 B — 일부 API 일시 장애**
- 빈 카드 자동 숨김
- Decision Card는 항상 동작 (LLM)
- "데이터 출처가 다양해서 한두 개 장애에도 결정은 흔들리지 않는다"고 어필

**상황 C — 시연 중 분석이 너무 느림**
- 부동산 모드는 ~15초 소요
- 창업 모드는 더 빠름 (~8-10초)
- 미리 한 번 실행해서 캐시 warm-up (Vercel serverless cold start 회피)

---

## 5. 발표 후 로드맵 (Phase 3·4·5)

### Phase 3 — Hybrid + Reranking (1주)
- 벡터 검색 + BM25 (PostgreSQL TS_RANK)
- RRF (Reciprocal Rank Fusion)
- Cohere rerank-multilingual-v3 또는 BGE-reranker
- 법령 조항·번호 매칭 정확도 ↑

### Phase 4 — Self-RAG / Corrective RAG (1주)
- 검색 결과 confidence 낮으면 자동 재검색
- 외부 검색(Naver/X)으로 RAG 보강
- Planner Agent가 RAG 도구 자동 선택

### Phase 5 — GraphRAG (1–2주)
- 법령 ↔ 조례 ↔ 판례 ↔ 사례 노드 그래프
- 한 질문에서 그래프 traversal로 연관 문서 모두 발견
- 부동산·창업 같은 규제 도메인에서 매우 강력

### 데이터 / 인프라 보강 (병행)
- 카카오 로컬 API 재신청
- NEIS 학교 좌표 정적 인덱싱
- 등기부 결제 흐름 통합
- 상가 활용성 모드 추가 Agent (Cap Rate, Vacancy Trend, Possible Business)

### UI / UX 개선
- Decision 액션의 구청 연락처 / 법령 링크 구체화
- 상권 진단 + 동네 분위기 통합
- 비교 분석 모드 (위치 2~3개 동시 비교)

---

## 6. 발표 직전 체크리스트

- [ ] Vercel deploy 완료 확인 (`https://trust-ark.vercel.app/`)
- [ ] OPENAI_API_KEY 잔액 확인 (Decision + Summarizer + Planner 호출 시 비용)
- [ ] 시연 입력 미리 한 번 실행 (cold start warm-up)
- [ ] 진단 패널이 너무 길지 않은지 확인 (현재 14개 trace)
- [ ] 모드 탭 3개 모두 정상 표시
- [ ] 발표 PPT — 카드별 핵심 메시지 슬라이드 준비

---

## 7. Q&A 예상 질문 + 답변 준비

### Q1. 직방·다방·호갱노노 같은 기존 부동산 서비스와 무엇이 다른가요?

**A.** 기존 서비스는 **매물 검색**에 초점이 맞춰져 있습니다 — "어떤 매물이 있나" 보여주는 카탈로그입니다.
터무니는 사용자가 이미 검토하는 **특정 매물·위치에 대한 의사결정**을 돕는 코파일럿입니다.
- 차별점 1: **사전 검토 단계 자동화** — 매물 찾기 이후의 "이 자리, 이 가격, 이 조건이 정말 괜찮은가?"
- 차별점 2: **3개 모드 통합** — 부동산 임차·창업 적합성·상가 활용성. 같은 좌표에서 다른 관점 분석
- 차별점 3: **법령·조례 자동 인용** — RAG로 식품위생법·자치구 조례를 사용자 모드에 맞춰 자동 매칭
- 차별점 4: **GO/CONDITIONAL/STOP 결론** — 단순 데이터 나열이 아닌 LLM 종합 판단

### Q2. Decision Card의 결론은 얼마나 신뢰할 수 있나요?

**A.** Decision Agent는 입력 데이터에서 **도출 가능한 결론만** 생성하도록 시스템 프롬프트로 엄격히 제약합니다.
- LLM(gpt-4o-mini)은 **건축물대장·상권분석·동종업종·법령 RAG**의 raw 데이터를 모두 받습니다
- "도출 불가능한 추측"은 생성 금지 — 데이터가 없으면 `data_quality` 필드에 명시
- 실시간 trace로 어느 Agent가 어떤 데이터를 줬는지 100% 투명 (개발자 모드)
- 사용자는 결론과 함께 그 근거 4개를 동시에 확인 → 검증 가능

비유: 의사가 "수술 가능합니다"라고 할 때 검사 결과 5개를 같이 보여주는 것과 같습니다.

### Q3. LLM 환각(Hallucination)은 어떻게 방지하나요?

**A.** 4중 방어선:
1. **Grounding** — LLM은 자유 생성이 아닌 **Agent 결과(JSON)에서만 답변 도출**. 시스템 프롬프트로 강제
2. **Structured Output** — JSON 스키마 강제 (`verdict`, `reasons[]`, `next_actions[]`). 자유 텍스트 금지
3. **RAG 인용** — 법령 조항은 인덱스의 실제 청크 텍스트를 그대로 노출. 사용자가 원문 검증 가능
4. **Trace 투명성** — 각 Agent의 출력을 진단 패널에 노출. 사용자가 직접 검증 가능

특히 Decision Card의 "즉시 할 일"은 **건축물대장·법령 RAG 매칭**에서만 도출되므로 환각 거의 불가능.

### Q4. 데이터 갱신 주기는 어떻게 되나요?

**A.** 데이터 소스별 자동 갱신:
| 데이터 | 갱신 주기 | 비고 |
|---|---|---|
| 실거래가 (국토부) | 30분 (real-time) | data.go.kr API 호출 시점 |
| 서울 상권분석 | 분기 | 가장 최근 분기 자동 선택 |
| 소상공인 상권 | 월 1회 | API 측 자동 갱신 |
| 건축물대장 | 일 (real-time) | 건축HUB |
| 학교 정보 (NEIS) | 학기 | 학사일정 반영 |
| 자치구 조례 (ELIS) | 변경 시 즉시 | API 호출 |
| **RAG 인덱스** | 수동 (재빌드) | `npm run rag:index` 명령 |
| Naver 검색 | 실시간 | 검색 시점 |

RAG 인덱스만 우리가 수동 관리. 법령 개정 시 마크다운 업데이트 → 1분 빌드.

### Q5. 사용자 데이터·민감정보는 어떻게 보호되나요?

**A.** 3가지 원칙:
1. **최소 입력** — 가입·로그인 없이 즉시 분석. 입력값은 주소 + 업종 정도 (개인정보 없음)
2. **등기부 자동 마스킹** — 소유자명/주민번호/연락처는 응답 단계에서 마스킹 (`홍**` 형태)
3. **결제 단계만 인증** — 등기부 자동 발급(CODEF) 시에만 본인인증 + ₩1,000 결제. 일반 분석은 무인증

서버 측 저장:
- 분석 결과는 **저장하지 않음** (stateless)
- API 키만 서버 환경변수 (Vercel)에 암호화 저장
- 사용자 로그는 익명 통계만 (Vercel Analytics)

### Q6. 비용 구조는 어떻게 되나요?

**A.** 분석 1회당 LLM 비용 (gpt-4o-mini + gpt-4o + embedding):
- Planner: ~300 토큰 × $0.15/1M = **₩0.05**
- Decision: ~1,500 토큰 × $0.15/1M = **₩0.30**
- Summarizer (부동산): ~3,000 토큰 × $2.5/1M = **₩10**
- Embedding (RAG): ~200 토큰 × $0.02/1M = **₩0.01**
- **총 LLM 비용: 분석 1회당 ₩10~50**

공공 API는 **모두 무료** (data.go.kr / 서울 / NEIS / 법제처 / VWorld).
Naver 검색: Free tier 일 25,000건.
등기부 CODEF: ₩1,000/건 (사용자 부담).

**손익 분기점**: 광고 또는 프리미엄 구독 ₩9,900/월 시 1인당 분석 200회까지 무료 제공 가능.

### Q7. B2B / B2C 어느 시장을 노리나요?

**A.** **B2C부터 시작 → B2B로 확장** 전략:

**B2C (Phase 1, 즉시)**
- 임차 검토하는 일반 사용자 (월 X만명)
- 창업 준비자 (소상공인 신규 진입자)
- 무료 분석 + 등기부 자동 발급 결제 모델

**B2B (Phase 2, 6개월 후)**
- **공인중개사 / 부동산 플랫폼**: API 제공 (분석 결과 매물 카드에 임베드)
- **소상공인 컨설팅 기관**: 입지 분석 도구 라이센스
- **금융권 (대출 심사)**: 담보 부동산 risk score 제공

핵심 가치 — **"데이터 종합 + Agentic RAG"의 인프라**는 사용자 인터페이스만 바꾸면 다양한 B2B 활용 가능.

---

## 부록 A. 기술 스택 요약

### Frontend
- Next.js 16 (App Router, RSC)
- React 19
- TypeScript 5.7
- TailwindCSS 3.4
- Vercel 배포

### Backend / Agent Runtime
- Next.js API routes (serverless)
- OpenAI SDK 6.41
- 자체 Agent Runtime (Planner, Trace Recorder)
- 자체 RAG (cosine similarity, JSON 인덱스)

### LLM
- OpenAI gpt-4o-mini (Planner, Decision, Query Rewriter)
- OpenAI gpt-4o (Summarizer)
- OpenAI text-embedding-3-small (RAG)

### 외부 API
- 공공: data.go.kr, 서울 OpenAPI, NEIS, 법제처/ELIS, VWorld, CODEF
- 민간: Naver Maps, Naver Search, X API

---

## 부록 B. 관련 문서

- [업그레이드 우선순위 (2026-06-05)](./UPGRADE_PRIORITIES_2026-06-05.md)
- [터무니 브랜드·대시보드 디자인 (2026-06-04)](./TUMUNI_BRAND_AND_DASHBOARD_DESIGN_2026-06-04.md)
- [모드 활성화 계획 (2026-06-04)](./MODE_ACTIVATION_PLAN_2026-06-04.md)
- [창업 인허가 계획 (2026-06-04)](./STARTUP_PERMIT_PLAN_2026-06-04.md)
- [터무니 아키텍처 다이어그램](./TRUST_ARK_ARCHITECTURE_DIAGRAMS.md)

---

작성자: 터무니 팀
최종 업데이트: 2026-06-05
