import { FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ActionBadge, ChannelBadge, ConfidenceBadge, RiskBadge, StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { TextInput } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { useData } from "../context/DataContext";
import { formatCurrency, formatDate, getVehicleTitle } from "../lib/utils/format";
import type { RiskLevel, Vehicle } from "../types";

function highestRisk(vehicle: Vehicle): RiskLevel {
  const order: RiskLevel[] = ["Low", "Medium", "High", "Critical"];
  return (
    vehicle.decisionPack?.keyRisks.reduce<RiskLevel>(
      (highest, risk) => (order.indexOf(risk.level) > order.indexOf(highest) ? risk.level : highest),
      "Low",
    ) ?? "Low"
  );
}

export function DecisionPacksListPage() {
  const { vehicles } = useData();
  const [query, setQuery] = useState("");
  const packs = useMemo(
    () =>
      vehicles
        .filter((vehicle) => vehicle.decisionPack)
        .filter((vehicle) => {
          if (!query) return true;
          return `${vehicle.vrm} ${getVehicleTitle(vehicle)} ${vehicle.decisionPack?.overallRecommendation ?? ""}`
            .toLowerCase()
            .includes(query.toLowerCase());
        })
        .sort((a, b) => new Date(b.decisionPack?.createdAt ?? b.updatedAt).getTime() - new Date(a.decisionPack?.createdAt ?? a.updatedAt).getTime()),
    [query, vehicles],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Decision Packs"
        description="Commercial decision packs generated from appraisals, market inputs, rules and risk evidence."
      />

      <Card>
        <CardHeader title="Search packs" eyebrow="Review queue" />
        <CardBody>
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <TextInput
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search VRM, vehicle or recommendation..."
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={`${packs.length} generated packs`} eyebrow="Decision history" />
        {packs.length === 0 ? (
          <CardBody>
            <EmptyState
              title="No decision packs yet"
              description="Analyse a vehicle to create the first Xdealer commercial decision pack."
              action={
                <Link to="/app/vehicles">
                  <Button variant="secondary">Open Vehicle Inbox</Button>
                </Link>
              }
            />
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">VRM</th>
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-5 py-3">Recommendation</th>
                  <th className="px-5 py-3">Channel</th>
                  <th className="px-5 py-3">Confidence</th>
                  <th className="px-5 py-3">Risk</th>
                  <th className="px-5 py-3">Margin</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Generated</th>
                  <th className="px-5 py-3" aria-label="Open" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {packs.map((vehicle) => {
                  const pack = vehicle.decisionPack;
                  if (!pack) return null;
                  return (
                    <tr key={pack.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-semibold text-slate-950">{vehicle.vrm}</td>
                      <td className="px-5 py-4 text-slate-700">{getVehicleTitle(vehicle)}</td>
                      <td className="px-5 py-4"><ActionBadge action={pack.overallRecommendation} /></td>
                      <td className="px-5 py-4"><ChannelBadge channel={pack.preferredChannel} /></td>
                      <td className="px-5 py-4"><ConfidenceBadge score={pack.confidenceScore} /></td>
                      <td className="px-5 py-4"><RiskBadge level={highestRisk(vehicle)} /></td>
                      <td className="px-5 py-4 font-semibold">{formatCurrency(pack.expectedMargin)}</td>
                      <td className="px-5 py-4"><StatusBadge status={vehicle.status} /></td>
                      <td className="px-5 py-4 text-slate-500">{formatDate(pack.createdAt)}</td>
                      <td className="px-5 py-4">
                        <Link to={`/app/decision-packs/${pack.id}`}>
                          <Button variant="ghost" icon={<FileText className="h-4 w-4" />}>Open</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
