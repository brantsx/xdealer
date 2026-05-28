import { AlertTriangle, BarChart3, Car, ClipboardCheck, Gauge, ShieldAlert, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { ActionBadge, ChannelBadge, ConfidenceBadge, RiskBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { MetricCard } from "../components/ui/MetricCard";
import { PageHeader } from "../components/ui/PageHeader";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useData } from "../context/DataContext";
import { formatCurrency, formatDate, formatNumber, getVehicleTitle } from "../lib/utils/format";
import type { RiskLevel } from "../types";

function highestRisk(vehicleRisks: Array<{ level: RiskLevel }>): RiskLevel {
  const order: RiskLevel[] = ["Low", "Medium", "High", "Critical"];
  return vehicleRisks.reduce<RiskLevel>((highest, risk) => (order.indexOf(risk.level) > order.indexOf(highest) ? risk.level : highest), "Low");
}

export function DashboardPage() {
  const { metrics, vehicles } = useData();
  const recent = vehicles
    .filter((vehicle) => vehicle.decisionPack)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);
  const maxChannelCount = Math.max(...metrics.vehiclesByChannel.map((item) => item.count), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="A live commercial view of analysed vehicles, recommendation quality, margin protection and appraisal risk across the demo organisation."
        actions={
          <Link to="/app/vehicles/new">
            <Button icon={<Car className="h-4 w-4" />}>New vehicle</Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Vehicles analysed this month"
          value={formatNumber(metrics.vehiclesAnalysedThisMonth)}
          helper="Decision packs generated in the current workspace."
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
        <MetricCard
          label="Average recommendation confidence"
          value={`${metrics.averageRecommendationConfidence}%`}
          helper="Weighted by appraisal quality, completeness and risk exposure."
          icon={<Gauge className="h-5 w-5" />}
        />
        <MetricCard
          label="Estimated margin protected"
          value={formatCurrency(metrics.estimatedMarginProtected)}
          helper="Forecast and actual margin captured in decision packs and outcomes."
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          label="High-risk vehicles flagged"
          value={formatNumber(metrics.highRiskVehiclesFlagged)}
          helper="Vehicles with high or critical risk themes."
          icon={<ShieldAlert className="h-5 w-5" />}
        />
        <MetricCard
          label="Appraisal completeness score"
          value={`${metrics.appraisalCompletenessScore}%`}
          helper="Evidence quality before commercial commitment."
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <MetricCard
          label="Human override rate"
          value={`${metrics.humanOverrideRate}%`}
          helper="Tracks governance where buyers move away from AI recommendations."
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader title="Vehicles by recommended channel" eyebrow="Routing" />
          <CardBody className="space-y-4">
            {metrics.vehiclesByChannel.map((item) => (
              <div key={item.channel}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <ChannelBadge channel={item.channel} />
                    <span className="text-slate-500">{item.count} vehicles</span>
                  </div>
                  <span className="font-semibold text-slate-950">{formatCurrency(item.margin)}</span>
                </div>
                <ProgressBar value={(item.count / maxChannelCount) * 100} />
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Top risk themes" eyebrow="Commercial control" />
          <CardBody className="space-y-3">
            {metrics.topRiskThemes.map((risk) => (
              <div key={risk.theme} className="flex items-start justify-between gap-4 rounded-md bg-slate-50 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{risk.theme}</p>
                  <p className="mt-1 text-xs text-slate-500">{risk.count} vehicles flagged</p>
                </div>
                <span className="text-sm font-semibold text-slate-950">{formatCurrency(risk.impact)}</span>
              </div>
            ))}
            {metrics.topRiskThemes.length === 0 ? (
              <div className="flex items-center gap-3 rounded-md bg-emerald-50 p-4 text-sm text-emerald-800">
                <AlertTriangle className="h-5 w-5" />
                No material risks flagged yet.
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Recent decision packs"
          eyebrow="Latest AI trading decisions"
          action={
            <Link to="/app/vehicles">
              <Button variant="secondary">Open inbox</Button>
            </Link>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">VRM</th>
                <th className="px-5 py-3">Vehicle</th>
                <th className="px-5 py-3">Recommendation</th>
                <th className="px-5 py-3">Confidence</th>
                <th className="px-5 py-3">Risk</th>
                <th className="px-5 py-3">Expected margin</th>
                <th className="px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent.map((vehicle) => {
                const pack = vehicle.decisionPack;
                if (!pack) return null;
                return (
                  <tr key={vehicle.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-950">
                      <Link to={`/app/vehicles/${vehicle.id}`} className="hover:text-signal-600">
                        {vehicle.vrm}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{getVehicleTitle(vehicle)}</td>
                    <td className="px-5 py-4">
                      <ActionBadge action={pack.overallRecommendation} />
                    </td>
                    <td className="px-5 py-4">
                      <ConfidenceBadge score={pack.confidenceScore} />
                    </td>
                    <td className="px-5 py-4">
                      <RiskBadge level={highestRisk(pack.keyRisks)} />
                    </td>
                    <td className="px-5 py-4 font-semibold">{formatCurrency(pack.expectedMargin)}</td>
                    <td className="px-5 py-4 text-slate-500">{formatDate(pack.createdAt)}</td>
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
