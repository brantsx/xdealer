import { Eye, Filter, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ActionBadge, ChannelBadge, ConfidenceBadge, RiskBadge, StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { SelectInput, TextInput } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { useData } from "../context/DataContext";
import { cx, formatCurrency, formatDate, getVehicleTitle } from "../lib/utils/format";
import type { Channel, RiskLevel, Vehicle, VehicleSource, VehicleStatus } from "../types";

const sources: Array<VehicleSource | "All"> = [
  "All",
  "Part-exchange",
  "Consumer acquisition",
  "Auction entry",
  "Lease return",
  "Fleet disposal",
  "Dealer stock review",
  "Trade purchase",
];

const riskLevels: Array<RiskLevel | "All"> = ["All", "Low", "Medium", "High", "Critical"];
const channels: Array<Channel | "All"> = ["All", "Retail", "Auction", "Trade out", "Wholesale", "Hold"];
const statuses: Array<VehicleStatus | "All"> = [
  "All",
  "Intake",
  "Needs appraisal",
  "Ready to analyse",
  "Analysed",
  "Senior review",
  "Accepted",
  "Overridden",
  "Bought",
  "Not bought",
];

function riskRank(level: RiskLevel): number {
  const order: RiskLevel[] = ["Low", "Medium", "High", "Critical"];
  return order.indexOf(level);
}

function highestRisk(vehicle: Vehicle): RiskLevel {
  return (
    vehicle.decisionPack?.keyRisks.reduce<RiskLevel>(
      (highest, risk) => (riskRank(risk.level) > riskRank(highest) ? risk.level : highest),
      "Low",
    ) ?? "Low"
  );
}

function QuickVehicleDrawer({ vehicle, onClose }: { vehicle: Vehicle | null; onClose: () => void }) {
  if (!vehicle) return null;
  const pack = vehicle.decisionPack;
  return (
    <div className="fixed inset-0 z-40">
      <button className="absolute inset-0 bg-slate-950/40" aria-label="Close vehicle preview" onClick={onClose} />
      <aside className="app-scrollbar absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 border-b border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-signal-600">{vehicle.vrm}</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">{getVehicleTitle(vehicle)}</h2>
            </div>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </div>
        <div className="space-y-5 p-5">
          <img
            src={vehicle.photos[0]?.publicUrl ?? "/assets/vehicle-placeholder.svg"}
            alt={`${vehicle.vrm} vehicle preview`}
            className="aspect-[16/10] w-full rounded-lg object-cover"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Source</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{vehicle.source}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Mileage</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{vehicle.mileage.toLocaleString("en-GB")}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Offer</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(vehicle.proposedOffer)}</p>
            </div>
          </div>
          {pack ? (
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <ActionBadge action={pack.overallRecommendation} />
                <ChannelBadge channel={pack.preferredChannel} />
                <ConfidenceBadge score={pack.confidenceScore} />
                <RiskBadge level={highestRisk(vehicle)} />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-700">{pack.channelRecommendation}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Max offer</p>
                  <p className="mt-1 font-semibold">{formatCurrency(pack.maximumOffer)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Prep</p>
                  <p className="mt-1 font-semibold">{formatCurrency(pack.expectedPrepCost)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Margin</p>
                  <p className="mt-1 font-semibold">{formatCurrency(pack.expectedMargin)}</p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="Not analysed yet" description="Open the vehicle record to generate the first decision pack." />
          )}
          <div className="flex gap-2">
            <Link to={`/app/vehicles/${vehicle.id}`} className="flex-1">
              <Button className="w-full">Open vehicle</Button>
            </Link>
            {pack ? (
              <Link to={`/app/decision-packs/${pack.id}`} className="flex-1">
                <Button variant="secondary" className="w-full">Decision pack</Button>
              </Link>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}

export function VehicleInboxPage() {
  const { vehicles, profiles } = useData();
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<VehicleSource | "All">("All");
  const [risk, setRisk] = useState<RiskLevel | "All">("All");
  const [channel, setChannel] = useState<Channel | "All">("All");
  const [site, setSite] = useState("All");
  const [confidence, setConfidence] = useState("All");
  const [status, setStatus] = useState<VehicleStatus | "All">("All");
  const [preview, setPreview] = useState<Vehicle | null>(null);

  const sites = useMemo(() => ["All", ...new Set(vehicles.map((vehicle) => vehicle.siteTeam))], [vehicles]);
  const filtered = useMemo(
    () =>
      vehicles.filter((vehicle) => {
        const pack = vehicle.decisionPack;
        const text = `${vehicle.vrm} ${getVehicleTitle(vehicle)} ${vehicle.source} ${vehicle.siteTeam}`.toLowerCase();
        if (query && !text.includes(query.toLowerCase())) return false;
        if (source !== "All" && vehicle.source !== source) return false;
        if (risk !== "All" && highestRisk(vehicle) !== risk) return false;
        if (channel !== "All" && pack?.preferredChannel !== channel) return false;
        if (site !== "All" && vehicle.siteTeam !== site) return false;
        if (status !== "All" && vehicle.status !== status) return false;
        if (confidence !== "All") {
          const score = pack?.confidenceScore ?? 0;
          if (confidence === "80+" && score < 80) return false;
          if (confidence === "60-79" && (score < 60 || score > 79)) return false;
          if (confidence === "<60" && score >= 60) return false;
        }
        return true;
      }),
    [channel, confidence, query, risk, site, source, status, vehicles],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle Inbox"
        description="Operational queue of vehicles needing appraisal review, AI analysis, senior review or commercial action."
        actions={
          <Link to="/app/vehicles/new">
            <Button icon={<Plus className="h-4 w-4" />}>New vehicle</Button>
          </Link>
        }
      />

      <Card>
        <CardHeader title="Filters" eyebrow="Queue controls" />
        <CardBody>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            <div className="relative xl:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <TextInput
                className="pl-9"
                placeholder="Search VRM, vehicle, source..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <SelectInput value={source} onChange={(event) => setSource(event.target.value as VehicleSource | "All")}>
              {sources.map((item) => <option key={item}>{item}</option>)}
            </SelectInput>
            <SelectInput value={risk} onChange={(event) => setRisk(event.target.value as RiskLevel | "All")}>
              {riskLevels.map((item) => <option key={item}>{item}</option>)}
            </SelectInput>
            <SelectInput value={channel} onChange={(event) => setChannel(event.target.value as Channel | "All")}>
              {channels.map((item) => <option key={item}>{item}</option>)}
            </SelectInput>
            <SelectInput value={site} onChange={(event) => setSite(event.target.value)}>
              {sites.map((item) => <option key={item}>{item}</option>)}
            </SelectInput>
            <SelectInput value={confidence} onChange={(event) => setConfidence(event.target.value)}>
              {["All", "80+", "60-79", "<60"].map((item) => <option key={item}>{item}</option>)}
            </SelectInput>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Filter className="h-4 w-4 text-slate-400" />
            <SelectInput
              className="max-w-xs"
              value={status}
              onChange={(event) => setStatus(event.target.value as VehicleStatus | "All")}
            >
              {statuses.map((item) => <option key={item}>{item}</option>)}
            </SelectInput>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={`${filtered.length} vehicles`} eyebrow="Inbox" />
        {filtered.length === 0 ? (
          <CardBody>
            <EmptyState title="No vehicles match these filters" description="Adjust the source, risk, channel or confidence filters to widen the queue." />
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-grid w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">VRM</th>
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Site/team</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Recommended action</th>
                  <th className="px-5 py-3">Confidence</th>
                  <th className="px-5 py-3">Expected margin</th>
                  <th className="px-5 py-3">Risk</th>
                  <th className="px-5 py-3">Assigned user</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((vehicle) => {
                  const pack = vehicle.decisionPack;
                  const assigned = profiles.find((profile) => profile.id === vehicle.assignedUserId);
                  return (
                    <tr key={vehicle.id} className={cx("hover:bg-slate-50", vehicle.status === "Senior review" && "bg-amber-50/35")}>
                      <td className="px-5 py-4 font-semibold text-slate-950">
                        <Link to={`/app/vehicles/${vehicle.id}`} className="hover:text-signal-600">
                          {vehicle.vrm}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-slate-700">{getVehicleTitle(vehicle)}</td>
                      <td className="px-5 py-4 text-slate-600">{vehicle.source}</td>
                      <td className="px-5 py-4 text-slate-600">{vehicle.siteTeam}</td>
                      <td className="px-5 py-4"><StatusBadge status={vehicle.status} /></td>
                      <td className="px-5 py-4">
                        {pack ? <ActionBadge action={pack.overallRecommendation} /> : <span className="text-slate-400">Pending</span>}
                      </td>
                      <td className="px-5 py-4">{pack ? <ConfidenceBadge score={pack.confidenceScore} /> : "-"}</td>
                      <td className="px-5 py-4 font-semibold">{pack ? formatCurrency(pack.expectedMargin) : "-"}</td>
                      <td className="px-5 py-4"><RiskBadge level={highestRisk(vehicle)} /></td>
                      <td className="px-5 py-4 text-slate-600">{assigned?.fullName ?? "Unassigned"}</td>
                      <td className="px-5 py-4 text-slate-500">{formatDate(vehicle.createdAt)}</td>
                      <td className="px-5 py-4">
                        <Button variant="ghost" className="px-2" icon={<Eye className="h-4 w-4" />} onClick={() => setPreview(vehicle)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <QuickVehicleDrawer vehicle={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
