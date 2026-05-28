import { Download, Send, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ActionBadge, ChannelBadge, ConfidenceBadge, RiskBadge, StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { SelectInput } from "../components/ui/Field";
import { MetricCard } from "../components/ui/MetricCard";
import { PageHeader } from "../components/ui/PageHeader";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { formatCurrency, getVehicleTitle, toCsv } from "../lib/utils/format";
import type { Channel, RiskLevel, Vehicle, VehicleSource } from "../types";

function riskRank(level: RiskLevel): number {
  const order: RiskLevel[] = ["Low", "Medium", "High", "Critical"];
  return order.indexOf(level);
}

function highestRisk(vehicle: Vehicle): RiskLevel {
  return vehicle.decisionPack?.keyRisks.reduce<RiskLevel>(
    (highest, risk) => (riskRank(risk.level) > riskRank(highest) ? risk.level : highest),
    "Low",
  ) ?? "Low";
}

export function BatchReviewPage() {
  const { vehicles, bulkApproveLowRisk, bulkSendHighRiskToReview } = useData();
  const { pushToast } = useToast();
  const [confidence, setConfidence] = useState("All");
  const [risk, setRisk] = useState<RiskLevel | "All">("All");
  const [source, setSource] = useState<VehicleSource | "All">("All");
  const [channel, setChannel] = useState<Channel | "All">("All");
  const [site, setSite] = useState("All");

  const analysed = vehicles.filter((vehicle) => vehicle.decisionPack);
  const sites = useMemo(() => ["All", ...new Set(vehicles.map((vehicle) => vehicle.siteTeam))], [vehicles]);
  const filtered = analysed.filter((vehicle) => {
    const pack = vehicle.decisionPack;
    if (!pack) return false;
    if (confidence === "80+" && pack.confidenceScore < 80) return false;
    if (confidence === "60-79" && (pack.confidenceScore < 60 || pack.confidenceScore > 79)) return false;
    if (confidence === "<60" && pack.confidenceScore >= 60) return false;
    if (risk !== "All" && highestRisk(vehicle) !== risk) return false;
    if (source !== "All" && vehicle.source !== source) return false;
    if (channel !== "All" && pack.preferredChannel !== channel) return false;
    if (site !== "All" && vehicle.siteTeam !== site) return false;
    return true;
  });
  const totalMargin = filtered.reduce((sum, vehicle) => sum + (vehicle.decisionPack?.expectedMargin ?? 0), 0);
  const lowRiskCount = filtered.filter((vehicle) => highestRisk(vehicle) === "Low").length;
  const highRiskCount = filtered.filter((vehicle) => ["High", "Critical"].includes(highestRisk(vehicle))).length;
  const byAction = filtered.reduce<Record<string, number>>((acc, vehicle) => {
    const action = vehicle.decisionPack?.overallRecommendation ?? "Pending";
    acc[action] = (acc[action] ?? 0) + 1;
    return acc;
  }, {});

  function handleApprove() {
    const count = bulkApproveLowRisk();
    pushToast({ tone: "success", title: "Bulk approval complete", message: `${count} low-risk recommendations accepted.` });
  }

  function handleSeniorReview() {
    const count = bulkSendHighRiskToReview();
    pushToast({ tone: "warning", title: "Senior review queue updated", message: `${count} high-risk vehicles sent for review.` });
  }

  function exportCsv() {
    const csv = toCsv(
      filtered.map((vehicle) => ({
        vrm: vehicle.vrm,
        vehicle: getVehicleTitle(vehicle),
        source: vehicle.source,
        site: vehicle.siteTeam,
        action: vehicle.decisionPack?.overallRecommendation,
        confidence: vehicle.decisionPack?.confidenceScore,
        risk: highestRisk(vehicle),
        channel: vehicle.decisionPack?.preferredChannel,
        expected_margin: vehicle.decisionPack?.expectedMargin,
      })),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `xdealer-batch-review-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    pushToast({ tone: "info", title: "CSV exported", message: "Filtered batch review data downloaded." });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batch Review"
        description="High-volume review of analysed vehicles with bulk approval, escalation and CSV export."
        actions={
          <>
            <Button icon={<ShieldCheck className="h-4 w-4" />} onClick={handleApprove}>Bulk approve low-risk</Button>
            <Button variant="secondary" icon={<Send className="h-4 w-4" />} onClick={handleSeniorReview}>Send high-risk to senior review</Button>
            <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={exportCsv}>Export CSV</Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Filtered vehicles" value={String(filtered.length)} helper="Analysed vehicles in current view." />
        <MetricCard label="Total expected margin" value={formatCurrency(totalMargin)} helper="Sum of expected margin in view." />
        <MetricCard label="Low-risk candidates" value={String(lowRiskCount)} helper="Suitable for controlled bulk approval." />
        <MetricCard label="High-risk vehicles" value={String(highRiskCount)} helper="Need senior review before action." />
      </div>

      <Card>
        <CardHeader title="Batch filters" eyebrow="Control set" />
        <CardBody className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <SelectInput value={confidence} onChange={(event) => setConfidence(event.target.value)}>
            {["All", "80+", "60-79", "<60"].map((option) => <option key={option}>{option}</option>)}
          </SelectInput>
          <SelectInput value={risk} onChange={(event) => setRisk(event.target.value as RiskLevel | "All")}>
            {["All", "Low", "Medium", "High", "Critical"].map((option) => <option key={option}>{option}</option>)}
          </SelectInput>
          <SelectInput value={source} onChange={(event) => setSource(event.target.value as VehicleSource | "All")}>
            {["All", "Part-exchange", "Consumer acquisition", "Auction entry", "Lease return", "Fleet disposal", "Dealer stock review", "Trade purchase"].map((option) => <option key={option}>{option}</option>)}
          </SelectInput>
          <SelectInput value={channel} onChange={(event) => setChannel(event.target.value as Channel | "All")}>
            {["All", "Retail", "Auction", "Trade out", "Wholesale", "Hold"].map((option) => <option key={option}>{option}</option>)}
          </SelectInput>
          <SelectInput value={site} onChange={(event) => setSite(event.target.value)}>
            {sites.map((option) => <option key={option}>{option}</option>)}
          </SelectInput>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Analysed vehicles"
          eyebrow="Decision distribution"
          action={
            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              {Object.entries(byAction).map(([action, count]) => (
                <span key={action} className="rounded-full bg-slate-100 px-3 py-1 font-semibold">{action}: {count}</span>
              ))}
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">VRM</th>
                <th className="px-5 py-3">Vehicle</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Channel</th>
                <th className="px-5 py-3">Confidence</th>
                <th className="px-5 py-3">Risk</th>
                <th className="px-5 py-3">Margin</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((vehicle) => {
                const pack = vehicle.decisionPack;
                if (!pack) return null;
                return (
                  <tr key={vehicle.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold">
                      <Link to={`/app/vehicles/${vehicle.id}`} className="hover:text-signal-600">{vehicle.vrm}</Link>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{getVehicleTitle(vehicle)}</td>
                    <td className="px-5 py-4"><ActionBadge action={pack.overallRecommendation} /></td>
                    <td className="px-5 py-4"><ChannelBadge channel={pack.preferredChannel} /></td>
                    <td className="px-5 py-4"><ConfidenceBadge score={pack.confidenceScore} /></td>
                    <td className="px-5 py-4"><RiskBadge level={highestRisk(vehicle)} /></td>
                    <td className="px-5 py-4 font-semibold">{formatCurrency(pack.expectedMargin)}</td>
                    <td className="px-5 py-4"><StatusBadge status={vehicle.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
