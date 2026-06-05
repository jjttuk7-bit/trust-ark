"use client";

import { useState } from "react";
import Link from "next/link";
import { Compass, Loader2, MapPin } from "lucide-react";
import type { AnalysisMode, AnalyzeRequest, AnalyzeResponse, BusinessType, CommercialPurpose } from "@/lib/types";
import { analyzeContract } from "@/lib/api";

type Slot = {
  id: string;
  label: string; // A / B / C
  address: string;
  loading: boolean;
  error?: string;
  report?: AnalyzeResponse;
};

const initialSlots = (): Slot[] => [
  { id: "a", label: "A", address: "", loading: false },
  { id: "b", label: "B", address: "", loading: false },
  { id: "c", label: "C", address: "", loading: false }
];

export function ComparisonView() {
  const [mode, setMode] = useState<AnalysisMode>("business_permit");
  const [businessType, setBusinessType] = useState<BusinessType>("cafe");
  const [commercialPurpose, setCommercialPurpose] = useState<CommercialPurpose>("business_location");
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [submitting, setSubmitting] = useState(false);

  const filledSlots = slots.filter((s) => s.address.trim());
  const canSubmit = filledSlots.length >= 2 && !submitting;

  async function analyzeAll() {
    setSubmitting(true);
    const targets = slots.filter((s) => s.address.trim());
    // 우선 로딩 상태로 표시
    setSlots((prev) =>
      prev.map((s) => (targets.some((t) => t.id === s.id) ? { ...s, loading: true, error: undefined, report: undefined } : s))
    );

    await Promise.all(
      targets.map(async (slot) => {
        try {
          const payload: AnalyzeRequest = {
            mode,
            address: slot.address.trim(),
            ...(mode === "business_permit" ? { business_type: businessType } : {}),
            ...(mode === "commercial_use" ? { commercial_purpose: commercialPurpose } : {})
          };
          const report = await analyzeContract(payload);
          setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, loading: false, report } : s)));
        } catch (err) {
          setSlots((prev) =>
            prev.map((s) =>
              s.id === slot.id ? { ...s, loading: false, error: err instanceof Error ? err.message : "분석 실패" } : s
            )
          );
        }
      })
    );
    setSubmitting(false);
  }

  function updateSlot(id: string, address: string) {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, address } : s)));
  }

  function resetAll() {
    setSlots(initialSlots());
  }

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-moss">Tumuni · 비교 분석 (베타)</p>
          <h1 className="mt-1 font-serif text-3xl font-black text-ink">A / B / C 위치 교차 비교</h1>
          <p className="mt-1 text-sm text-ink/65">최대 3개 위치를 동시 분석해 어느 자리가 더 유리한지 한 화면에서 비교합니다.</p>
        </div>
        <Link
          href="/"
          className="rounded-md border border-ink/15 bg-white px-3 py-2 text-xs font-bold text-ink/65 hover:border-moss/40"
        >
          ← 일반 분석으로
        </Link>
      </header>

      <section className="dashboard-panel mb-6 p-5 sm:p-6">
        {/* 모드 + 업종 공통 입력 */}
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-medium">
            <span className="text-xs font-bold text-ink/55">검토 모드</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as AnalysisMode)}
              className="min-h-10 rounded-md border border-ink/15 bg-white px-3 text-sm"
            >
              <option value="business_permit">창업·영업 적합성</option>
              <option value="commercial_use">상가 활용성</option>
              <option value="real_estate">부동산 임차·매수</option>
            </select>
          </label>
          {mode === "business_permit" ? (
            <label className="grid gap-1.5 text-sm font-medium">
              <span className="text-xs font-bold text-ink/55">업종 (3곳 공통)</span>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                className="min-h-10 rounded-md border border-ink/15 bg-white px-3 text-sm"
              >
                <option value="cafe">카페</option>
                <option value="restaurant">음식점</option>
                <option value="beauty">미용실</option>
                <option value="academy">학원</option>
                <option value="pc_room">PC방</option>
                <option value="karaoke">노래방</option>
              </select>
            </label>
          ) : null}
          {mode === "commercial_use" ? (
            <label className="grid gap-1.5 text-sm font-medium">
              <span className="text-xs font-bold text-ink/55">상가 목적</span>
              <select
                value={commercialPurpose}
                onChange={(e) => setCommercialPurpose(e.target.value as CommercialPurpose)}
                className="min-h-10 rounded-md border border-ink/15 bg-white px-3 text-sm"
              >
                <option value="lease_out">임대 목적</option>
                <option value="buy_and_use">매수 후 직접 사용</option>
                <option value="business_location">영업 입지</option>
              </select>
            </label>
          ) : null}
        </div>

        {/* 3개 위치 입력 */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {slots.map((slot) => (
            <label key={slot.id} className="grid gap-1.5 text-sm font-medium">
              <span className="text-xs font-bold text-ink/55">{slot.label} 안 — 검토 주소</span>
              <input
                type="text"
                value={slot.address}
                onChange={(e) => updateSlot(slot.id, e.target.value)}
                placeholder={
                  slot.id === "a"
                    ? "예: 서울특별시 강남구 테헤란로4길 37"
                    : slot.id === "b"
                      ? "예: 서울특별시 마포구 양화로 165"
                      : "예: 서울특별시 서대문구 연세로 23 (선택)"
                }
                className="min-h-11 rounded-md border border-ink/15 bg-white px-3 text-sm"
              />
            </label>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={analyzeAll}
            disabled={!canSubmit}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-ink px-5 text-sm font-bold text-cream disabled:opacity-50"
          >
            {submitting ? <Loader2 aria-hidden="true" size={16} className="animate-spin" /> : <Compass aria-hidden="true" size={16} />}
            {submitting ? "비교 분석 중..." : "비교 분석 시작"}
          </button>
          <button
            type="button"
            onClick={resetAll}
            disabled={submitting}
            className="rounded-md border border-ink/15 bg-white px-4 py-2 text-sm font-bold text-ink/65"
          >
            초기화
          </button>
          <p className="ml-auto text-xs text-ink/55">
            ※ 최소 2곳 입력 시 비교 시작. A/B/C 모두 같은 모드·업종으로 분석.
          </p>
        </div>
      </section>

      {/* 결과 비교 테이블 */}
      {slots.some((s) => s.loading || s.report || s.error) ? <ComparisonResultGrid slots={slots} /> : null}
    </main>
  );
}

function ComparisonResultGrid({ slots }: { slots: Slot[] }) {
  const active = slots.filter((s) => s.loading || s.report || s.error);
  const reports = slots.map((s) => s.report);

  // 종합 추천: GO 점수가 가장 높은 안
  const winnerIdx = active
    .map((s, i) => ({ idx: i, slot: s, score: scoreOf(s.report) }))
    .filter((x) => x.score != null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]?.idx;

  return (
    <section className="dashboard-panel overflow-hidden p-5 sm:p-6">
      <h2 className="font-serif text-xl font-black text-ink">비교 결과</h2>

      {/* 카드 3개 가로 정렬 (모바일은 세로) */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {active.map((slot, idx) => (
          <SlotCard key={slot.id} slot={slot} isWinner={idx === winnerIdx} />
        ))}
      </div>

      {/* 비교 테이블 */}
      {active.filter((s) => s.report).length >= 2 ? (
        <div className="mt-6 overflow-x-auto rounded-md border border-ink/15">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink text-cream">
                <th className="px-3 py-2 text-left font-bold">항목</th>
                {active.map((s) => (
                  <th key={s.id} className="px-3 py-2 text-left font-bold">
                    {s.label}안
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10 bg-white">
              {ROW_DEFS.map((row) => (
                <tr key={row.label}>
                  <td className="px-3 py-2 font-bold text-ink/65">{row.label}</td>
                  {active.map((s) => (
                    <td key={s.id} className="px-3 py-2 text-ink">
                      {s.report ? row.render(s.report) : s.loading ? "분석 중..." : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {winnerIdx !== undefined && active[winnerIdx]?.report ? (
        <div className="mt-5 rounded-md border border-moss/45 bg-moss/10 p-4">
          <p className="text-[0.7rem] font-black uppercase tracking-[0.16em] text-moss">종합 추천</p>
          <p className="mt-1 text-sm leading-6 text-ink">
            <strong className="text-base">{active[winnerIdx].label}안</strong> — Decision 점수와 상권·경쟁 데이터를 종합한 결과 가장 유리한 위치로 판단됩니다.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function SlotCard({ slot, isWinner }: { slot: Slot; isWinner?: boolean }) {
  const verdict = slot.report?.decision?.verdict;
  const verdictTone =
    verdict === "go"
      ? "border-moss/50 bg-moss/10 text-moss"
      : verdict === "stop"
        ? "border-clay/50 bg-clay/10 text-clay"
        : verdict
          ? "border-brass/50 bg-brass/10 text-brass"
          : "border-ink/15 bg-paper text-ink/55";

  return (
    <div className={`rounded-md border-2 p-4 ${isWinner ? "border-moss/60 bg-moss/5" : "border-ink/10 bg-white"}`}>
      <div className="flex items-center justify-between">
        <span className="font-serif text-2xl font-black text-ink">{slot.label}안</span>
        {isWinner ? (
          <span className="rounded-md border border-moss/45 bg-moss/15 px-2 py-1 text-[0.65rem] font-black uppercase text-moss">
            추천
          </span>
        ) : null}
      </div>
      <p className="mt-2 flex items-start gap-1.5 text-sm font-bold text-ink/70">
        <MapPin aria-hidden="true" size={14} className="mt-0.5 shrink-0" />
        <span>{slot.address || "(미입력)"}</span>
      </p>

      {slot.loading ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-ink/65">
          <Loader2 size={14} className="animate-spin" /> 분석 중...
        </p>
      ) : slot.error ? (
        <p className="mt-3 rounded-md border border-clay/40 bg-clay/10 p-2 text-xs text-clay">{slot.error}</p>
      ) : slot.report ? (
        <>
          <span
            className={`mt-3 inline-block rounded-md border px-2 py-1 text-xs font-black uppercase ${verdictTone}`}
          >
            {verdict ? verdict.toUpperCase() : "결정 없음"}
          </span>
          <p className="mt-2 text-xs leading-5 text-ink/75 line-clamp-2">
            {slot.report.decision?.headline ?? slot.report.summary}
          </p>
        </>
      ) : null}
    </div>
  );
}

/** 비교 테이블 row 정의 */
const ROW_DEFS: Array<{ label: string; render: (r: AnalyzeResponse) => string }> = [
  {
    label: "최종 판단",
    render: (r) => (r.decision?.verdict ? r.decision.verdict.toUpperCase() : r.risk_level || "—")
  },
  {
    label: "동종업종 (200m)",
    render: (r) => {
      const c = r.business_findings?.competition;
      if (!c) return "—";
      return `${c.total_stores}건 (전체 ${c.all_stores_in_radius}건)`;
    }
  },
  {
    label: "경쟁 점수",
    render: (r) => `${r.business_findings?.competition?.density_score ?? "—"}`
  },
  {
    label: "평일 유동인구",
    render: (r) => {
      const v = r.business_findings?.trade_area?.metrics.avg_weekday_floating;
      return v ? `${Math.round(v).toLocaleString()}명/일` : "—";
    }
  },
  {
    label: "월 추정매출",
    render: (r) => {
      const v = r.business_findings?.trade_area?.metrics.avg_monthly_sales;
      if (!v) return "—";
      if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억`;
      return `${(v / 10_000).toFixed(0)}만`;
    }
  },
  {
    label: "건축물 용도",
    render: (r) => r.building_register?.mainPurpose ?? "—"
  },
  {
    label: "층수",
    render: (r) => {
      const bg = r.building_register;
      if (!bg) return "—";
      return `지상 ${bg.groundFloors ?? "?"}층 / 지하 ${bg.undergroundFloors ?? "?"}층`;
    }
  },
  {
    label: "정화구역 200m",
    render: (r) => {
      const sz = r.business_findings?.school_zone;
      if (!sz || sz.in_relative_zone === undefined) return "—";
      return `학교 ${sz.in_relative_zone}건 (절대50m ${sz.in_absolute_zone ?? 0}건)`;
    }
  }
];

function scoreOf(report?: AnalyzeResponse): number | undefined {
  if (!report) return undefined;
  // verdict 우선, density_score는 낮을수록 좋음
  const verdictScore = report.decision?.verdict === "go" ? 100 : report.decision?.verdict === "conditional" ? 60 : 20;
  const competitionPenalty = (report.business_findings?.competition?.density_score ?? 0) * 0.3;
  return verdictScore - competitionPenalty;
}
