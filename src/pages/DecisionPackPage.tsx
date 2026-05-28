import { ArrowLeft, CheckCircle2, Flag, HelpCircle, ShoppingCart, Store, UserCheck, XCircle } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ActionBadge, ChannelBadge, ConfidenceBadge, RiskBadge, StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { TextAreaInput } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { formatCurrency, formatDate, getVehicleTitle } from "../lib/utils/format";
import type { DecisionAction, RiskLevel, Vehicle } from "../types";

function highestRisk(vehicle: Vehicle): RiskLevel {
  const order: RiskLevel[] = ["Low", "Medium", "High", "Critical"];
  return (
    vehicle.decisionPack?.keyRisks.reduce<RiskLevel>(
      (highest, risk) => (order.indexOf(risk.level) > order.indexOf(highest) ? risk.level : highest),
      "Low",
    ) ?? "Low"
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody>{children}</CardBody>
    </Card>
  );
}

export function DecisionPackPage() {
  const { id } = useParams();
  const { vehicles, recordDecisionAction } = useData();
  const { pushToast } = useToast();
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  const latestPackVehicle = vehicles.find((vehicle) => vehicle.decisionPack);
  if (id === "latest" && latestPackVehicle?.decisionPack) {
    return <Navigate to={`/app/decision-packs/${latestPackVehicle.decisionPack.id}`} replace />;
  }

  const vehicle = vehicles.find((candidate) => candidate.decisionPack?.id === id || candidate.id === id);
  const pack = vehicle?.decisionPack;

  if (!vehicle || !pack) {
    return (
      <EmptyState
        title="Decision pack not found"
        description="Generate a vehicle analysis first, then return to the decision pack screen."
        action={
          <Link to="/app/vehicles">
            <Button variant="secondary">Open Vehicle Inbox</Button>
          </Link>
        }
      />
    );
  }
  const selectedVehicle = vehicle;

  function action(actionName: DecisionAction["action"], reason?: string) {
    recordDecisionAction(selectedVehicle.id, actionName, reason);
    pushToast({ tone: "success", title: "Feedback captured", message: `${actionName} recorded for ${selectedVehicle.vrm}.` });
    setOverrideOpen(false);
    setOverrideReason("");
  }

  return (
    <div className="space-y-6">
      <Link to={`/app/vehicles/${vehicle.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-signal-600">
        <ArrowLeft className="h-4 w-4" />
        Vehicle record
      </Link>

      <PageHeader
        title={`Decision pack · ${vehicle.vrm}`}
        description={getVehicleTitle(vehicle)}
        actions={
          <div className="flex flex-wrap gap-2">
            <ActionBadge action={pack.overallRecommendation} />
            <ChannelBadge channel={pack.preferredChannel} />
            <ConfidenceBadge score={pack.confidenceScore} />
            <RiskBadge level={highestRisk(vehicle)} />
            <StatusBadge status={vehicle.status} />
          </div>
        }
      />

      <Card className="overflow-hidden border-ink-900">
        <div className="bg-ink-950 p-6 text-white">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Recommendation summary</p>
              <h2 className="mt-2 text-3xl font-semibold">{pack.overallRecommendation}</h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">{pack.channelRecommendation}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-md bg-white/10 p-3">
                <p className="text-xs font-semibold uppercase text-slate-300">Maximum offer</p>
                <p className="mt-1 text-xl font-semibold">{formatCurrency(pack.maximumOffer)}</p>
              </div>
              <div className="rounded-md bg-white/10 p-3">
                <p className="text-xs font-semibold uppercase text-slate-300">Expected margin</p>
                <p className="mt-1 text-xl font-semibold">{formatCurrency(pack.expectedMargin)}</p>
              </div>
              <div className="rounded-md bg-white/10 p-3">
                <p className="text-xs font-semibold uppercase text-slate-300">Days to sale</p>
                <p className="mt-1 text-xl font-semibold">{pack.expectedDaysToSale}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Section title="Commercial decision">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">Offer range</p>
                <p className="mt-1 text-lg font-semibold">{formatCurrency(pack.recommendedOfferMin)} to {formatCurrency(pack.recommendedOfferMax)}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">Recommended reserve</p>
                <p className="mt-1 text-lg font-semibold">{formatCurrency(pack.recommendedReserve)}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">Suggested retail</p>
                <p className="mt-1 text-lg font-semibold">{formatCurrency(pack.suggestedRetailPrice)}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">Suggested trade</p>
                <p className="mt-1 text-lg font-semibold">{formatCurrency(pack.suggestedTradePrice)}</p>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Margin forecast">
          <div className="space-y-4">
            {[
              ["Expected prep cost", pack.expectedPrepCost],
              ["Expected margin", pack.expectedMargin],
              ["CAP Clean", vehicle.marketInput.capClean],
              ["Retail market estimate", vehicle.marketInput.retailMarketEstimate],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                <span className="text-sm text-slate-600">{label}</span>
                <span className="font-semibold text-slate-950">{formatCurrency(Number(value))}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Appraisal quality">
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Data completeness</span>
                <span className="font-semibold">{pack.dataCompletenessScore}%</span>
              </div>
              <ProgressBar value={pack.dataCompletenessScore} />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Appraisal quality</span>
                <span className="font-semibold">{pack.appraisalQualityScore}%</span>
              </div>
              <ProgressBar value={pack.appraisalQualityScore} />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Recommendation confidence</span>
                <span className="font-semibold">{pack.confidenceScore}%</span>
              </div>
              <ProgressBar value={pack.confidenceScore} />
            </div>
          </div>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Channel recommendation">
          <div className="flex flex-wrap gap-2">
            <ChannelBadge channel={pack.preferredChannel} />
            <ChannelBadge channel={pack.alternativeChannel} />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-700">{pack.channelRecommendation}</p>
          {pack.marketplaceRecommendation ? (
            <div className="mt-4 rounded-md bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-950">{pack.marketplaceRecommendation.recommendation}</p>
              <p className="mt-2 text-sm leading-6 text-emerald-900">{pack.marketplaceRecommendation.rationale}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-md bg-white/70 p-3">
                  <p className="text-xs font-semibold uppercase text-emerald-700">Listing type</p>
                  <p className="mt-1 font-semibold text-emerald-950">{pack.marketplaceRecommendation.listingType}</p>
                </div>
                <div className="rounded-md bg-white/70 p-3">
                  <p className="text-xs font-semibold uppercase text-emerald-700">Asking guide</p>
                  <p className="mt-1 font-semibold text-emerald-950">{formatCurrency(pack.marketplaceRecommendation.suggestedAskingPrice)}</p>
                </div>
                <div className="rounded-md bg-white/70 p-3">
                  <p className="text-xs font-semibold uppercase text-emerald-700">Likely buyer</p>
                  <p className="mt-1 font-semibold text-emerald-950">{pack.marketplaceRecommendation.likelyBuyerType}</p>
                </div>
              </div>
            </div>
          ) : null}
        </Section>

        <Section title="Prep recommendation">
          <p className="text-sm leading-6 text-slate-700">{pack.prepRecommendation}</p>
          <p className="mt-4 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">{pack.damageCommercialisationSummary}</p>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Risk flags">
          <div className="space-y-3">
            {pack.keyRisks.length ? (
              pack.keyRisks.map((risk) => (
                <div key={risk.title} className="rounded-md border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{risk.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{risk.detail}</p>
                    </div>
                    <RiskBadge level={risk.level} />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-950">Impact: {formatCurrency(risk.commercialImpact)}</p>
                </div>
              ))
            ) : (
              <p className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-800">No material risk flags.</p>
            )}
          </div>
        </Section>

        <Section title="Missing information">
          {pack.missingInformation.length ? (
            <ul className="space-y-2 text-sm text-slate-700">
              {pack.missingInformation.map((item) => (
                <li key={item} className="rounded-md bg-amber-50 p-3 font-medium text-amber-900">{item}</li>
              ))}
            </ul>
          ) : (
            <p className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-800">No missing critical information.</p>
          )}
        </Section>
      </div>

      <Section title="Market context">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ["CAP Clean", vehicle.marketInput.capClean],
            ["CAP Average", vehicle.marketInput.capAverage],
            ["CAP Below", vehicle.marketInput.capBelow],
            ["Trade estimate", vehicle.marketInput.tradeValueEstimate],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
              <p className="mt-1 text-lg font-semibold">{formatCurrency(Number(value))}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Suggested actions">
          <ul className="space-y-3 text-sm text-slate-700">
            {pack.suggestedNextActions.map((item) => (
              <li key={item} className="flex gap-3 rounded-md bg-slate-50 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-signal-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Draft messages">
          <div className="space-y-3 text-sm leading-6 text-slate-700">
            <div className="rounded-md bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">Customer/vendor</p>
              <p className="mt-2">{pack.draftMessages.customerVendor}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">Internal</p>
              <p className="mt-2">{pack.draftMessages.internal}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">Senior review</p>
              <p className="mt-2">{pack.draftMessages.seniorReview}</p>
            </div>
          </div>
        </Section>
      </div>

      <Section title="Human feedback">
        <div className="flex flex-wrap gap-2">
          <Button icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => action("Accepted")}>Accept recommendation</Button>
          <Button variant="secondary" icon={<Flag className="h-4 w-4" />} onClick={() => setOverrideOpen(true)}>Override recommendation</Button>
          <Button variant="secondary" icon={<UserCheck className="h-4 w-4" />} onClick={() => action("Senior review")}>Send to senior review</Button>
          <Button variant="secondary" icon={<HelpCircle className="h-4 w-4" />} onClick={() => action("More information requested")}>Request more information</Button>
          <Link to={`/app/marketplace/listings/new/${vehicle.id}`}>
            <Button variant="secondary" icon={<Store className="h-4 w-4" />}>List on Marketplace</Button>
          </Link>
          <Button variant="secondary" icon={<ShoppingCart className="h-4 w-4" />} onClick={() => action("Bought")}>Mark as bought</Button>
          <Button variant="danger" icon={<XCircle className="h-4 w-4" />} onClick={() => action("Not bought")}>Mark as not bought</Button>
        </div>
        {overrideOpen ? (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-950">Override reason</p>
            <TextAreaInput
              className="mt-2 bg-white"
              value={overrideReason}
              onChange={(event) => setOverrideReason(event.target.value)}
              placeholder="Explain why the recommendation is being overridden."
            />
            <div className="mt-3 flex gap-2">
              <Button
                onClick={() => action("Overridden", overrideReason)}
                disabled={overrideReason.trim().length < 8}
              >
                Save override
              </Button>
              <Button variant="ghost" onClick={() => setOverrideOpen(false)}>Cancel</Button>
            </div>
          </div>
        ) : null}
      </Section>

      <Section title="Audit trail">
        <div className="space-y-3">
          {pack.auditTrail.map((item) => (
            <div key={item.label} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold text-slate-950">{item.label}</p>
                <span className="text-xs font-semibold uppercase text-slate-500">{item.evidence}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
            </div>
          ))}
          <p className="text-xs text-slate-500">Generated {formatDate(pack.createdAt)}. Decision pack ID {pack.id}.</p>
        </div>
      </Section>
    </div>
  );
}
