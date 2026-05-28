import { Save, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Field, TextAreaInput, TextInput } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import type { DealerProfile } from "../types";

function commaList(value: string[]): string {
  return value.join(", ");
}

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function TradeProfilePage() {
  const { marketplace, organisation, updateDealerProfile } = useData();
  const { pushToast } = useToast();
  const profile = marketplace.dealerProfiles.find((candidate) => candidate.organisationId === organisation.id);
  const [draft, setDraft] = useState<DealerProfile | undefined>(profile);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  if (!draft) {
    return <PageHeader title="Trade profile" description="No dealer profile has been configured for this organisation." />;
  }

  function update<K extends keyof DealerProfile>(key: K, value: DealerProfile[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function save() {
    if (!draft) return;
    updateDealerProfile(draft);
    pushToast({ tone: "success", title: "Trade profile saved", message: "Marketplace matching will use the updated profile in this demo workspace." });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trade profile"
        description="Your organisation profile powers marketplace visibility, stock matching and buyer-specific xDealer guidance."
        actions={<Button icon={<Save className="h-4 w-4" />} onClick={save}>Save profile</Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader title="Dealer identity" eyebrow={draft.verifiedStatus} action={<ShieldCheck className="h-5 w-5 text-signal-600" />} />
          <CardBody className="grid gap-4 md:grid-cols-2">
            <Field label="Trading name">
              <TextInput value={draft.tradingName} onChange={(event) => update("tradingName", event.target.value)} />
            </Field>
            <Field label="Company number">
              <TextInput value={draft.companyNumber} onChange={(event) => update("companyNumber", event.target.value)} />
            </Field>
            <Field label="VAT number">
              <TextInput value={draft.vatNumber ?? ""} onChange={(event) => update("vatNumber", event.target.value)} />
            </Field>
            <Field label="FCA status note">
              <TextInput value={draft.fcaStatusNote ?? ""} onChange={(event) => update("fcaStatusNote", event.target.value)} />
            </Field>
            <Field label="Address">
              <TextInput value={draft.address} onChange={(event) => update("address", event.target.value)} />
            </Field>
            <Field label="Postcode area">
              <TextInput value={draft.postcodeArea} onChange={(event) => update("postcodeArea", event.target.value)} />
            </Field>
            <Field label="Contact person">
              <TextInput value={draft.contactName} onChange={(event) => update("contactName", event.target.value)} />
            </Field>
            <Field label="Phone">
              <TextInput value={draft.phone} onChange={(event) => update("phone", event.target.value)} />
            </Field>
            <Field label="Email">
              <TextInput type="email" value={draft.email} onChange={(event) => update("email", event.target.value)} />
            </Field>
            <Field label="Website">
              <TextInput value={draft.website ?? ""} onChange={(event) => update("website", event.target.value)} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Trade terms" eyebrow={`Mock rating ${draft.rating.toFixed(1)} / 5`} />
          <CardBody className="space-y-4">
            <Field label="Trade description">
              <TextAreaInput value={draft.description} onChange={(event) => update("description", event.target.value)} />
            </Field>
            <Field label="Trade terms text">
              <TextAreaInput value={draft.tradeTerms} onChange={(event) => update("tradeTerms", event.target.value)} />
            </Field>
            <div className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-900">
              Verification, KYC, VAT validation and Companies House checks are intentionally mocked for the MVP.
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Stock profile matching" eyebrow="Buyer intelligence" />
        <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Stock wanted">
            <TextAreaInput value={draft.stockWanted} onChange={(event) => update("stockWanted", event.target.value)} />
          </Field>
          <Field label="Stock not wanted">
            <TextAreaInput value={draft.stockNotWanted} onChange={(event) => update("stockNotWanted", event.target.value)} />
          </Field>
          <Field label="Preferred makes">
            <TextInput value={commaList(draft.preferredMakes)} onChange={(event) => update("preferredMakes", parseList(event.target.value))} />
          </Field>
          <Field label="Excluded makes">
            <TextInput value={commaList(draft.excludedMakes)} onChange={(event) => update("excludedMakes", parseList(event.target.value))} />
          </Field>
          <Field label="Preferred body types">
            <TextInput
              value={commaList(draft.preferredBodyTypes)}
              onChange={(event) => update("preferredBodyTypes", parseList(event.target.value) as DealerProfile["preferredBodyTypes"])}
            />
          </Field>
          <Field label="Preferred fuel types">
            <TextInput
              value={commaList(draft.preferredFuelTypes)}
              onChange={(event) => update("preferredFuelTypes", parseList(event.target.value) as DealerProfile["preferredFuelTypes"])}
            />
          </Field>
          <Field label="Preferred age range">
            <div className="grid grid-cols-2 gap-2">
              <TextInput type="number" value={draft.minVehicleAge} onChange={(event) => update("minVehicleAge", Number(event.target.value))} />
              <TextInput type="number" value={draft.maxVehicleAge} onChange={(event) => update("maxVehicleAge", Number(event.target.value))} />
            </div>
          </Field>
          <Field label="Preferred mileage range">
            <div className="grid grid-cols-2 gap-2">
              <TextInput type="number" value={draft.minMileage} onChange={(event) => update("minMileage", Number(event.target.value))} />
              <TextInput type="number" value={draft.maxMileage} onChange={(event) => update("maxMileage", Number(event.target.value))} />
            </div>
          </Field>
          <Field label="Price range">
            <div className="grid grid-cols-2 gap-2">
              <TextInput type="number" value={draft.minPrice} onChange={(event) => update("minPrice", Number(event.target.value))} />
              <TextInput type="number" value={draft.maxPrice} onChange={(event) => update("maxPrice", Number(event.target.value))} />
            </div>
          </Field>
          <Field label="Transport radius miles">
            <TextInput type="number" value={draft.transportRadiusMiles} onChange={(event) => update("transportRadiusMiles", Number(event.target.value))} />
          </Field>
        </CardBody>
      </Card>
    </div>
  );
}
