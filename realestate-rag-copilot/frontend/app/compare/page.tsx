import { ComparisonView } from "@/components/ComparisonView";

export const metadata = {
  title: "터무니 · 비교 분석 (A/B/C)",
  description: "최대 3개 위치를 동시 분석해 한 화면에서 비교"
};

export default function ComparePage() {
  return <ComparisonView />;
}
