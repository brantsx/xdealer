import { Save } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Field, SelectInput, TextAreaInput, TextInput } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { formatCurrency } from "../lib/utils/format";
import type { OrganisationRules, RiskAppetite, ValueBandRule } from "../types";

function numberValue(value: string): number {
  return Number(value.replace(/[£,\s]/g, "")) || 0;
}

export function RulesPage() {
  const { rules, updateRules } = useData();
  const { pushToast } = useToast();
  const [draft, setDraft] = useState<OrganisationRules>(rules);

  function updateBand(index: number, next: Partial<ValueBandRule>) {
    setDraft((current) => ({
      ...current,
      valueBands: current.valueBands.map((band, bandIndex) => (bandIndex === index ? { ...band, ...next } : band)),
    }));
  }

  function save() {
    updateRules(draft);
    pushToast({ tone: "success", title: "Rules saved", message: "Future decision packs will use the updated strategy." });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rules & Strategy"
        description="Customer-specific commercial rules that influence xDealer decision packs, escalation logic and recommended channels."
        actions={<Button icon={<Save className="h-4 w-4" />} onClick={save}>Save rules</Button>}
      />

      <Card>
        <CardHeader title="Approval and risk appetite" eyebrow="Governance" />
        <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Risk appetite">
            <SelectInput
              value={draft.riskAppetite}
              onChange={(event) => setDraft((current) => ({ ...current, riskAppetite: event.target.value as RiskAppetite }))}
            >
              {["Conservative", "Balanced", "Aggressive"].map((option) => <option key={option}>{option}</option>)}
            </SelectInput>
          </Field>
          <Field label="Senior approval threshold">
            <TextInput
              value={draft.seniorApprovalThreshold}
              onChange={(event) => setDraft((current) => ({ ...current, seniorApprovalThreshold: numberValue(event.target.value) }))}
            />
          </Field>
          <Field label="Minimum confidence for auto-approval">
            <TextInput
              value={draft.minimumConfidenceForAutoApproval}
              onChange={(event) =>
                setDraft((current) => ({ ...current, minimumConfidenceForAutoApproval: numberValue(event.target.value) }))
              }
            />
          </Field>
          <Field label="Retail vs auction margin threshold">
            <TextInput
              value={draft.retailVsAuctionMarginThreshold}
              onChange={(event) =>
                setDraft((current) => ({ ...current, retailVsAuctionMarginThreshold: numberValue(event.target.value) }))
              }
            />
          </Field>
          <Field label="Stock age review days">
            <TextInput
              value={draft.stockAgeReviewDays}
              onChange={(event) => setDraft((current) => ({ ...current, stockAgeReviewDays: numberValue(event.target.value) }))}
            />
          </Field>
          <div className="md:col-span-2 xl:col-span-3">
            <Field label="Excluded makes/models">
              <TextAreaInput
                value={draft.excludedMakesModels.join("\n")}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    excludedMakesModels: event.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean),
                  }))
                }
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Minimum target margin and maximum prep by value band" eyebrow="Commercial guardrails" />
        <CardBody className="space-y-4">
          {draft.valueBands.map((band, index) => (
            <div key={band.label} className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-5">
              <Field label="Band"><TextInput value={band.label} onChange={(event) => updateBand(index, { label: event.target.value })} /></Field>
              <Field label="Min value"><TextInput value={band.minValue} onChange={(event) => updateBand(index, { minValue: numberValue(event.target.value) })} /></Field>
              <Field label="Max value"><TextInput value={band.maxValue ?? ""} onChange={(event) => updateBand(index, { maxValue: event.target.value ? numberValue(event.target.value) : undefined })} /></Field>
              <Field label="Target margin"><TextInput value={band.targetMargin} onChange={(event) => updateBand(index, { targetMargin: numberValue(event.target.value) })} /></Field>
              <Field label="Max prep spend"><TextInput value={band.maxPrepSpend} onChange={(event) => updateBand(index, { maxPrepSpend: numberValue(event.target.value) })} /></Field>
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Preferred channel by age, value and type" eyebrow="Routing rules" />
          <CardBody className="space-y-3">
            {draft.channelRules.map((rule) => (
              <div key={rule.label} className="rounded-md border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{rule.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{rule.condition}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{rule.preferredChannel}</span>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Site-specific prep assumptions" eyebrow="Prep economics" />
          <CardBody className="space-y-3">
            {draft.sitePrepAssumptions.map((site) => (
              <div key={site.siteTeam} className="rounded-md border border-slate-200 p-4">
                <p className="font-semibold text-slate-950">{site.siteTeam}</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  <span>Smart repair: {formatCurrency(site.smartRepair)}</span>
                  <span>Alloy refurb: {formatCurrency(site.alloyRefurb)}</span>
                  <span>Paint per panel: {formatCurrency(site.paintPerPanel)}</span>
                  <span>Mechanical inspection: {formatCurrency(site.mechanicalInspection)}</span>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
