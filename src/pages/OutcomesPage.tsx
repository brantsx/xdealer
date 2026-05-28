import { Save } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ChannelBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Field, SelectInput, TextAreaInput, TextInput } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { formatCurrency, getVehicleTitle } from "../lib/utils/format";
import type { Channel, Outcome } from "../types";

interface OutcomeForm {
  vehicleId: string;
  actualPurchasePrice: string;
  actualPrepCost: string;
  actualChannel: Channel;
  actualReserve: string;
  actualHammerPrice: string;
  actualRetailSalePrice: string;
  actualDaysToSale: string;
  priceReductions: string;
  buyerVendorDisputes: string;
  reappraisalAdjustments: string;
  notes: string;
}

function numberValue(value: string): number {
  return Number(value.replace(/[£,\s]/g, "")) || 0;
}

export function OutcomesPage() {
  const { vehicles, saveOutcome, organisation } = useData();
  const { pushToast } = useToast();
  const analysed = vehicles.filter((vehicle) => vehicle.decisionPack);
  const [form, setForm] = useState<OutcomeForm>({
    vehicleId: analysed[0]?.id ?? "",
    actualPurchasePrice: "",
    actualPrepCost: "",
    actualChannel: "Retail",
    actualReserve: "",
    actualHammerPrice: "",
    actualRetailSalePrice: "",
    actualDaysToSale: "",
    priceReductions: "0",
    buyerVendorDisputes: "0",
    reappraisalAdjustments: "0",
    notes: "",
  });

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === form.vehicleId);
  const outcomes = vehicles.filter((vehicle) => vehicle.outcome);
  const actualMargin = useMemo(() => {
    const saleValue = numberValue(form.actualRetailSalePrice) || numberValue(form.actualHammerPrice) || numberValue(form.actualReserve);
    return saleValue - numberValue(form.actualPurchasePrice) - numberValue(form.actualPrepCost) - numberValue(form.priceReductions);
  }, [form.actualHammerPrice, form.actualPrepCost, form.actualPurchasePrice, form.actualReserve, form.actualRetailSalePrice, form.priceReductions]);

  function update<K extends keyof OutcomeForm>(key: K, value: OutcomeForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
    if (!form.vehicleId && analysed[0]) {
      setForm((current) => ({ ...current, vehicleId: analysed[0].id }));
    }
  }, [analysed, form.vehicleId]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedVehicle?.decisionPack) {
      pushToast({ tone: "error", title: "Select an analysed vehicle", message: "Outcomes require an existing decision pack." });
      return;
    }
    const timestamp = new Date().toISOString();
    const outcome: Outcome = {
      id: selectedVehicle.outcome?.id ?? crypto.randomUUID(),
      organisationId: organisation.id,
      vehicleId: selectedVehicle.id,
      decisionPackId: selectedVehicle.decisionPack.id,
      actualPurchasePrice: numberValue(form.actualPurchasePrice),
      actualPrepCost: numberValue(form.actualPrepCost),
      actualChannel: form.actualChannel,
      actualReserve: numberValue(form.actualReserve) || undefined,
      actualHammerPrice: numberValue(form.actualHammerPrice) || undefined,
      actualRetailSalePrice: numberValue(form.actualRetailSalePrice) || undefined,
      actualDaysToSale: numberValue(form.actualDaysToSale),
      actualMargin,
      priceReductions: numberValue(form.priceReductions),
      buyerVendorDisputes: numberValue(form.buyerVendorDisputes),
      reappraisalAdjustments: numberValue(form.reappraisalAdjustments),
      notes: form.notes,
      createdAt: selectedVehicle.outcome?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    saveOutcome(outcome);
    pushToast({ tone: "success", title: "Outcome saved", message: "Dashboard metrics now include the actual result." });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outcomes"
        description="Track actual purchase price, prep, disposal route, sale result, days to sale and margin variance."
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader title="Record outcome" eyebrow="Actual result" action={<Button type="submit" icon={<Save className="h-4 w-4" />}>Save outcome</Button>} />
          <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Vehicle">
              <SelectInput value={form.vehicleId} onChange={(event) => update("vehicleId", event.target.value)}>
                {analysed.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>{vehicle.vrm} · {getVehicleTitle(vehicle)}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Actual purchase price"><TextInput value={form.actualPurchasePrice} onChange={(event) => update("actualPurchasePrice", event.target.value)} /></Field>
            <Field label="Actual prep cost"><TextInput value={form.actualPrepCost} onChange={(event) => update("actualPrepCost", event.target.value)} /></Field>
            <Field label="Actual channel">
              <SelectInput value={form.actualChannel} onChange={(event) => update("actualChannel", event.target.value as Channel)}>
                {["Retail", "Auction", "Trade out", "Wholesale", "Hold"].map((option) => <option key={option}>{option}</option>)}
              </SelectInput>
            </Field>
            <Field label="Actual reserve"><TextInput value={form.actualReserve} onChange={(event) => update("actualReserve", event.target.value)} /></Field>
            <Field label="Actual hammer price"><TextInput value={form.actualHammerPrice} onChange={(event) => update("actualHammerPrice", event.target.value)} /></Field>
            <Field label="Actual retail sale price"><TextInput value={form.actualRetailSalePrice} onChange={(event) => update("actualRetailSalePrice", event.target.value)} /></Field>
            <Field label="Actual days to sale"><TextInput value={form.actualDaysToSale} onChange={(event) => update("actualDaysToSale", event.target.value)} /></Field>
            <Field label="Price reductions"><TextInput value={form.priceReductions} onChange={(event) => update("priceReductions", event.target.value)} /></Field>
            <Field label="Buyer/vendor disputes"><TextInput value={form.buyerVendorDisputes} onChange={(event) => update("buyerVendorDisputes", event.target.value)} /></Field>
            <Field label="Reappraisal adjustments"><TextInput value={form.reappraisalAdjustments} onChange={(event) => update("reappraisalAdjustments", event.target.value)} /></Field>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Calculated actual margin</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">{formatCurrency(actualMargin)}</p>
            </div>
            <div className="md:col-span-2 xl:col-span-4">
              <Field label="Notes"><TextAreaInput value={form.notes} onChange={(event) => update("notes", event.target.value)} /></Field>
            </div>
          </CardBody>
        </Card>
      </form>

      <Card>
        <CardHeader title="Tracked outcomes" eyebrow="Margin learning loop" />
        {outcomes.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-5 py-3">Channel</th>
                  <th className="px-5 py-3">Purchase</th>
                  <th className="px-5 py-3">Prep</th>
                  <th className="px-5 py-3">Days</th>
                  <th className="px-5 py-3">Actual margin</th>
                  <th className="px-5 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outcomes.map((vehicle) => {
                  const outcome = vehicle.outcome;
                  if (!outcome) return null;
                  return (
                    <tr key={outcome.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-semibold">{vehicle.vrm} · {getVehicleTitle(vehicle)}</td>
                      <td className="px-5 py-4"><ChannelBadge channel={outcome.actualChannel} /></td>
                      <td className="px-5 py-4">{formatCurrency(outcome.actualPurchasePrice)}</td>
                      <td className="px-5 py-4">{formatCurrency(outcome.actualPrepCost)}</td>
                      <td className="px-5 py-4">{outcome.actualDaysToSale}</td>
                      <td className="px-5 py-4 font-semibold">{formatCurrency(outcome.actualMargin)}</td>
                      <td className="px-5 py-4 text-slate-600">{outcome.notes || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <CardBody>
            <EmptyState title="No outcomes recorded yet" description="Add a sale, hammer or trade result to close the loop between recommendation and actual margin." />
          </CardBody>
        )}
      </Card>
    </div>
  );
}
