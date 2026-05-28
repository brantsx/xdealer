import { ArrowLeft, ClipboardCheck, FileText, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ActionBadge, ChannelBadge, ConfidenceBadge, RiskBadge, StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { formatCurrency, formatDate, formatNumber, getVehicleTitle } from "../lib/utils/format";
import type { RiskLevel } from "../types";

function highestRisk(levels: RiskLevel[]): RiskLevel {
  const order: RiskLevel[] = ["Low", "Medium", "High", "Critical"];
  return levels.reduce<RiskLevel>((highest, level) => (order.indexOf(level) > order.indexOf(highest) ? level : highest), "Low");
}

export function VehicleDetailPage() {
  const { id } = useParams();
  const { vehicles, analyseVehicle, isAnalysing } = useData();
  const { pushToast } = useToast();
  const vehicle = vehicles.find((candidate) => candidate.id === id);

  if (!vehicle) {
    return (
      <EmptyState
        title="Vehicle not found"
        description="The vehicle may have been removed or the link is no longer valid."
        action={
          <Link to="/app/vehicles">
            <Button variant="secondary">Back to inbox</Button>
          </Link>
        }
      />
    );
  }

  const pack = vehicle.decisionPack;
  const selectedVehicle = vehicle;

  async function handleAnalyse() {
    try {
      await analyseVehicle(selectedVehicle.id);
      pushToast({ tone: "success", title: "Decision pack generated", message: "The AI analysis has been saved to the vehicle." });
    } catch (caught) {
      pushToast({
        tone: "error",
        title: "Analysis failed",
        message: caught instanceof Error ? caught.message : "Unable to generate decision pack.",
      });
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/app/vehicles" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-signal-600">
        <ArrowLeft className="h-4 w-4" />
        Vehicle Inbox
      </Link>

      <PageHeader
        title={`${vehicle.vrm} · ${getVehicleTitle(vehicle)}`}
        description={`${vehicle.source} from ${vehicle.siteTeam}. ${formatNumber(vehicle.mileage)} miles, ${vehicle.fuelType.toLowerCase()}, ${vehicle.transmission.toLowerCase()}.`}
        actions={
          <>
            <Button icon={<Sparkles className="h-4 w-4" />} onClick={handleAnalyse} disabled={isAnalysing}>
              {isAnalysing ? "Analysing..." : "Analyse vehicle"}
            </Button>
            {pack ? (
              <Link to={`/app/decision-packs/${pack.id}`}>
                <Button variant="secondary" icon={<FileText className="h-4 w-4" />}>Open decision pack</Button>
              </Link>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader title="Vehicle record" eyebrow="Intake details" action={<StatusBadge status={vehicle.status} />} />
          <CardBody>
            <img
              src={vehicle.photos[0]?.publicUrl ?? "/assets/vehicle-placeholder.svg"}
              alt={`${vehicle.vrm} vehicle`}
              className="aspect-[16/10] w-full rounded-lg object-cover"
            />
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ["Registration date", formatDate(vehicle.registrationDate)],
                ["MOT expiry", formatDate(vehicle.motExpiry)],
                ["V5C", vehicle.v5cStatus],
                ["Service history", vehicle.serviceHistory],
                ["HPI status", vehicle.hpiStatus],
                ["Keys", String(vehicle.numberOfKeys)],
                ["CAP Clean", formatCurrency(vehicle.marketInput.capClean)],
                ["Proposed offer/reserve", formatCurrency(vehicle.proposedOffer)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-slate-50 p-3">
                  <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-950">{value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Decision summary" eyebrow="AI decision pack" />
          <CardBody>
            {pack ? (
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <ActionBadge action={pack.overallRecommendation} />
                  <ChannelBadge channel={pack.preferredChannel} />
                  <ConfidenceBadge score={pack.confidenceScore} />
                  <RiskBadge level={highestRisk(pack.keyRisks.map((risk) => risk.level))} />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase text-slate-500">Offer range</p>
                    <p className="mt-1 font-semibold">{formatCurrency(pack.recommendedOfferMin)}-{formatCurrency(pack.recommendedOfferMax)}</p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase text-slate-500">Maximum offer</p>
                    <p className="mt-1 font-semibold">{formatCurrency(pack.maximumOffer)}</p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase text-slate-500">Expected margin</p>
                    <p className="mt-1 font-semibold">{formatCurrency(pack.expectedMargin)}</p>
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">Appraisal quality</span>
                    <span className="font-semibold text-slate-950">{pack.appraisalQualityScore}%</span>
                  </div>
                  <ProgressBar value={pack.appraisalQualityScore} />
                </div>
                <p className="rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">{pack.channelRecommendation}</p>
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">Key risks</h3>
                  <div className="mt-3 space-y-3">
                    {pack.keyRisks.map((risk) => (
                      <div key={risk.title} className="rounded-md border border-slate-200 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold">{risk.title}</p>
                          <RiskBadge level={risk.level} />
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{risk.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No decision pack yet"
                description="Run AI analysis to create a structured commercial decision pack."
                action={<Button icon={<Sparkles className="h-4 w-4" />} onClick={handleAnalyse}>Analyse vehicle</Button>}
              />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Appraisal" eyebrow="Condition" />
          <CardBody className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-5">
              {[
                ["Tyres", vehicle.appraisal.tyres],
                ["Alloys", vehicle.appraisal.alloys],
                ["Glass", vehicle.appraisal.glass],
                ["Interior", vehicle.appraisal.interior],
                ["Paintwork", vehicle.appraisal.paintwork],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Mechanical notes</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{vehicle.appraisal.mechanicalNotes || "No notes recorded."}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Warning lights</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{vehicle.appraisal.warningLights || "None recorded."}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Damage and MOT advisories" eyebrow="Prep risk" />
          <CardBody className="space-y-4">
            {vehicle.damageEntries.length ? (
              vehicle.damageEntries.map((entry) => (
                <div key={entry.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{entry.panelLocation}</p>
                      <p className="mt-1 text-sm text-slate-600">{entry.damageType} · {entry.estimatedRepairCategory}</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(entry.estimatedCost)}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{entry.notes}</p>
                </div>
              ))
            ) : (
              <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">No damage entries logged.</p>
            )}
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">MOT advisories</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {vehicle.motAdvisories.length ? vehicle.motAdvisories.map((item) => <li key={item}>{item}</li>) : <li>None recorded.</li>}
              </ul>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Photo gallery" eyebrow="Storage metadata" action={<ClipboardCheck className="h-5 w-5 text-slate-400" />} />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(vehicle.photos.length ? vehicle.photos : [{ id: "placeholder", publicUrl: "/assets/vehicle-placeholder.svg", caption: "No uploaded photos yet" }]).map((photo) => (
              <div key={photo.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <img src={photo.publicUrl} alt={photo.caption} className="aspect-[4/3] w-full object-cover" />
                <p className="truncate p-2 text-xs font-medium text-slate-600">{photo.caption}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
