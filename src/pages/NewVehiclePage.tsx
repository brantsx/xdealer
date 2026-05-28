import { Camera, Plus, Save, Trash2 } from "lucide-react";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Field, SelectInput, TextAreaInput, TextInput } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { uploadVehiclePhotos, type PhotoUploadDraft } from "../lib/supabase/storage";
import type {
  AppraisalCondition,
  BodyType,
  DamageEntry,
  DamageSeverity,
  FuelType,
  HpiStatus,
  RepairCategory,
  ServiceHistory,
  Transmission,
  V5CStatus,
  Vehicle,
  VehiclePhoto,
  VehicleSource,
} from "../types";

interface VehicleForm {
  vrm: string;
  vin: string;
  make: string;
  model: string;
  derivative: string;
  registrationDate: string;
  mileage: string;
  fuelType: FuelType;
  transmission: Transmission;
  bodyType: BodyType;
  colour: string;
  numberOfKeys: string;
  v5cStatus: V5CStatus;
  serviceHistory: ServiceHistory;
  motExpiry: string;
  motAdvisories: string;
  hpiStatus: HpiStatus;
  source: VehicleSource;
  siteTeam: string;
  proposedOffer: string;
  capClean: string;
  capAverage: string;
  capBelow: string;
  retailMarketEstimate: string;
  tradeValueEstimate: string;
  expectedPrepBudget: string;
  tyres: AppraisalCondition;
  alloys: AppraisalCondition;
  glass: AppraisalCondition;
  interior: AppraisalCondition;
  paintwork: AppraisalCondition;
  mechanicalNotes: string;
  warningLights: string;
}

interface DamageDraft {
  id: string;
  panelLocation: string;
  damageType: string;
  severity: DamageSeverity;
  estimatedRepairCategory: RepairCategory;
  estimatedCost: string;
  notes: string;
}

const sourceOptions: VehicleSource[] = [
  "Part-exchange",
  "Consumer acquisition",
  "Auction entry",
  "Lease return",
  "Fleet disposal",
  "Dealer stock review",
  "Trade purchase",
];
const fuelOptions: FuelType[] = ["Petrol", "Diesel", "Hybrid", "Plug-in hybrid", "Electric"];
const transmissionOptions: Transmission[] = ["Manual", "Automatic"];
const bodyOptions: BodyType[] = ["Hatchback", "Saloon", "Estate", "SUV", "Coupe", "Convertible", "MPV", "Van"];
const v5cOptions: V5CStatus[] = ["Present", "Not present", "Awaiting", "Unknown"];
const serviceOptions: ServiceHistory[] = ["Full", "Partial", "Missing", "Main dealer", "Digital", "Unknown"];
const hpiOptions: HpiStatus[] = [
  "Clear",
  "Finance marker",
  "Write-off category N",
  "Write-off category S",
  "Mileage discrepancy",
  "Not checked",
];
const conditionOptions: AppraisalCondition[] = ["Good", "Minor wear", "Needs prep", "Poor", "Unknown"];
const damageSeverityOptions: DamageSeverity[] = ["Light", "Medium", "Heavy", "Structural concern"];
const repairOptions: RepairCategory[] = [
  "Smart repair",
  "Alloy refurb",
  "Paint",
  "Panel repair",
  "Mechanical",
  "Glass",
  "Interior trim",
  "Replace",
];

const initialForm: VehicleForm = {
  vrm: "",
  vin: "",
  make: "",
  model: "",
  derivative: "",
  registrationDate: "",
  mileage: "",
  fuelType: "Petrol",
  transmission: "Manual",
  bodyType: "Hatchback",
  colour: "",
  numberOfKeys: "2",
  v5cStatus: "Present",
  serviceHistory: "Full",
  motExpiry: "",
  motAdvisories: "",
  hpiStatus: "Clear",
  source: "Part-exchange",
  siteTeam: "Group Buying",
  proposedOffer: "",
  capClean: "",
  capAverage: "",
  capBelow: "",
  retailMarketEstimate: "",
  tradeValueEstimate: "",
  expectedPrepBudget: "",
  tyres: "Good",
  alloys: "Good",
  glass: "Good",
  interior: "Good",
  paintwork: "Minor wear",
  mechanicalNotes: "",
  warningLights: "",
};

function numberValue(value: string): number {
  return Number(value.replace(/[£,\s]/g, "")) || 0;
}

function averageConditionScore(form: VehicleForm): number {
  const map: Record<AppraisalCondition, number> = {
    Good: 92,
    "Minor wear": 78,
    "Needs prep": 58,
    Poor: 34,
    Unknown: 42,
  };
  const values = [form.tyres, form.alloys, form.glass, form.interior, form.paintwork].map((condition) => map[condition]);
  const notesBonus = form.mechanicalNotes.trim().length > 10 ? 4 : -6;
  return Math.max(0, Math.min(100, Math.round(values.reduce((sum, value) => sum + value, 0) / values.length + notesBonus)));
}

export function NewVehiclePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { addVehicle, organisation } = useData();
  const { pushToast } = useToast();
  const [form, setForm] = useState<VehicleForm>(initialForm);
  const [damageDrafts, setDamageDrafts] = useState<DamageDraft[]>([]);
  const [photoDrafts, setPhotoDrafts] = useState<PhotoUploadDraft[]>([]);
  const [error, setError] = useState("");

  function updateField<K extends keyof VehicleForm>(key: K, value: VehicleForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addDamageDraft() {
    setDamageDrafts((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        panelLocation: "",
        damageType: "",
        severity: "Light",
        estimatedRepairCategory: "Smart repair",
        estimatedCost: "",
        notes: "",
      },
    ]);
  }

  function updateDamageDraft<K extends keyof DamageDraft>(id: string, key: K, value: DamageDraft[K]) {
    setDamageDrafts((current) => current.map((entry) => (entry.id === id ? { ...entry, [key]: value } : entry)));
  }

  function handlePhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const drafts = files.map((file) => ({
      id: crypto.randomUUID(),
      fileName: file.name,
      publicUrl: URL.createObjectURL(file),
      file,
    }));
    setPhotoDrafts((current) => [...current, ...drafts]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const required = [form.vrm, form.make, form.model, form.derivative, form.registrationDate, form.mileage, form.motExpiry];
    if (required.some((value) => value.trim().length === 0)) {
      setError("Complete the VRM, vehicle identity, registration date, mileage and MOT expiry before saving.");
      return;
    }
    const vehicleId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const damageEntries: DamageEntry[] = damageDrafts
      .filter((entry) => entry.panelLocation.trim() || entry.damageType.trim())
      .map((entry) => ({
        id: entry.id,
        organisationId: organisation.id,
        vehicleId,
        panelLocation: entry.panelLocation,
        damageType: entry.damageType,
        severity: entry.severity,
        estimatedRepairCategory: entry.estimatedRepairCategory,
        estimatedCost: numberValue(entry.estimatedCost),
        notes: entry.notes,
        createdAt: timestamp,
        updatedAt: timestamp,
      }));
    let photos: VehiclePhoto[] = [];
    try {
      photos = await uploadVehiclePhotos({
        organisationId: organisation.id,
        vehicleId,
        drafts: photoDrafts,
        timestamp,
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to upload vehicle photos.";
      setError(message);
      return;
    }
    const vehicle: Vehicle = {
      id: vehicleId,
      organisationId: organisation.id,
      vrm: form.vrm.trim().toUpperCase(),
      vin: form.vin.trim() || undefined,
      make: form.make.trim(),
      model: form.model.trim(),
      derivative: form.derivative.trim(),
      registrationDate: form.registrationDate,
      mileage: numberValue(form.mileage),
      fuelType: form.fuelType,
      transmission: form.transmission,
      bodyType: form.bodyType,
      colour: form.colour.trim(),
      numberOfKeys: numberValue(form.numberOfKeys),
      v5cStatus: form.v5cStatus,
      serviceHistory: form.serviceHistory,
      motExpiry: form.motExpiry,
      motAdvisories: form.motAdvisories
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      hpiStatus: form.hpiStatus,
      source: form.source,
      siteTeam: form.siteTeam.trim() || "Group Buying",
      status: "Ready to analyse",
      proposedOffer: numberValue(form.proposedOffer),
      assignedUserId: profile?.id ?? "",
      createdAt: timestamp,
      updatedAt: timestamp,
      appraisal: {
        id: crypto.randomUUID(),
        organisationId: organisation.id,
        vehicleId,
        tyres: form.tyres,
        alloys: form.alloys,
        glass: form.glass,
        interior: form.interior,
        paintwork: form.paintwork,
        mechanicalNotes: form.mechanicalNotes.trim(),
        warningLights: form.warningLights.trim(),
        appraiserId: profile?.id ?? "",
        qualityScore: averageConditionScore(form),
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      damageEntries,
      photos,
      marketInput: {
        id: crypto.randomUUID(),
        organisationId: organisation.id,
        vehicleId,
        capClean: numberValue(form.capClean),
        capAverage: numberValue(form.capAverage),
        capBelow: numberValue(form.capBelow),
        retailMarketEstimate: numberValue(form.retailMarketEstimate),
        tradeValueEstimate: numberValue(form.tradeValueEstimate),
        expectedPrepBudget: numberValue(form.expectedPrepBudget),
        buyerFees: 120,
        vendorFees: 80,
        lastUpdatedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    };
    try {
      await addVehicle(vehicle);
      pushToast({ tone: "success", title: "Vehicle saved", message: "Open the record to generate the decision pack." });
      navigate(`/app/vehicles/${vehicle.id}`);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to save the vehicle.";
      setError(message);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <PageHeader
        title="New Vehicle"
        description="VRM-first intake for appraisal, market inputs, damage evidence and photo uploads."
        actions={
          <Button type="submit" icon={<Save className="h-4 w-4" />}>
            Save vehicle
          </Button>
        }
      />

      {error ? <p className="rounded-md bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}

      <Card>
        <CardHeader title="Vehicle identity" eyebrow="VRM first" />
        <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="VRM"><TextInput value={form.vrm} onChange={(event) => updateField("vrm", event.target.value)} placeholder="AB21 XDL" /></Field>
          <Field label="VIN optional"><TextInput value={form.vin} onChange={(event) => updateField("vin", event.target.value)} /></Field>
          <Field label="Make"><TextInput value={form.make} onChange={(event) => updateField("make", event.target.value)} /></Field>
          <Field label="Model"><TextInput value={form.model} onChange={(event) => updateField("model", event.target.value)} /></Field>
          <Field label="Derivative"><TextInput value={form.derivative} onChange={(event) => updateField("derivative", event.target.value)} /></Field>
          <Field label="Registration date"><TextInput type="date" value={form.registrationDate} onChange={(event) => updateField("registrationDate", event.target.value)} /></Field>
          <Field label="Mileage"><TextInput inputMode="numeric" value={form.mileage} onChange={(event) => updateField("mileage", event.target.value)} /></Field>
          <Field label="Colour"><TextInput value={form.colour} onChange={(event) => updateField("colour", event.target.value)} /></Field>
          <Field label="Fuel type"><SelectInput value={form.fuelType} onChange={(event) => updateField("fuelType", event.target.value as FuelType)}>{fuelOptions.map((option) => <option key={option}>{option}</option>)}</SelectInput></Field>
          <Field label="Transmission"><SelectInput value={form.transmission} onChange={(event) => updateField("transmission", event.target.value as Transmission)}>{transmissionOptions.map((option) => <option key={option}>{option}</option>)}</SelectInput></Field>
          <Field label="Body type"><SelectInput value={form.bodyType} onChange={(event) => updateField("bodyType", event.target.value as BodyType)}>{bodyOptions.map((option) => <option key={option}>{option}</option>)}</SelectInput></Field>
          <Field label="Number of keys"><TextInput inputMode="numeric" value={form.numberOfKeys} onChange={(event) => updateField("numberOfKeys", event.target.value)} /></Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Compliance and source" eyebrow="Evidence" />
        <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="V5C status"><SelectInput value={form.v5cStatus} onChange={(event) => updateField("v5cStatus", event.target.value as V5CStatus)}>{v5cOptions.map((option) => <option key={option}>{option}</option>)}</SelectInput></Field>
          <Field label="Service history"><SelectInput value={form.serviceHistory} onChange={(event) => updateField("serviceHistory", event.target.value as ServiceHistory)}>{serviceOptions.map((option) => <option key={option}>{option}</option>)}</SelectInput></Field>
          <Field label="MOT expiry"><TextInput type="date" value={form.motExpiry} onChange={(event) => updateField("motExpiry", event.target.value)} /></Field>
          <Field label="HPI/finance/write-off status"><SelectInput value={form.hpiStatus} onChange={(event) => updateField("hpiStatus", event.target.value as HpiStatus)}>{hpiOptions.map((option) => <option key={option}>{option}</option>)}</SelectInput></Field>
          <Field label="Source"><SelectInput value={form.source} onChange={(event) => updateField("source", event.target.value as VehicleSource)}>{sourceOptions.map((option) => <option key={option}>{option}</option>)}</SelectInput></Field>
          <Field label="Site/team"><TextInput value={form.siteTeam} onChange={(event) => updateField("siteTeam", event.target.value)} /></Field>
          <div className="md:col-span-2">
            <Field label="MOT advisories"><TextAreaInput value={form.motAdvisories} onChange={(event) => updateField("motAdvisories", event.target.value)} placeholder="One advisory per line" /></Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Commercial inputs" eyebrow="Valuation" />
        <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Current proposed offer or reserve"><TextInput value={form.proposedOffer} onChange={(event) => updateField("proposedOffer", event.target.value)} /></Field>
          <Field label="CAP Clean"><TextInput value={form.capClean} onChange={(event) => updateField("capClean", event.target.value)} /></Field>
          <Field label="CAP Average"><TextInput value={form.capAverage} onChange={(event) => updateField("capAverage", event.target.value)} /></Field>
          <Field label="CAP Below"><TextInput value={form.capBelow} onChange={(event) => updateField("capBelow", event.target.value)} /></Field>
          <Field label="Retail market estimate"><TextInput value={form.retailMarketEstimate} onChange={(event) => updateField("retailMarketEstimate", event.target.value)} /></Field>
          <Field label="Trade value estimate"><TextInput value={form.tradeValueEstimate} onChange={(event) => updateField("tradeValueEstimate", event.target.value)} /></Field>
          <Field label="Expected prep budget"><TextInput value={form.expectedPrepBudget} onChange={(event) => updateField("expectedPrepBudget", event.target.value)} /></Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Appraisal" eyebrow="Condition and notes" />
        <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {(["tyres", "alloys", "glass", "interior", "paintwork"] as const).map((key) => (
            <Field key={key} label={key[0].toUpperCase() + key.slice(1)}>
              <SelectInput value={form[key]} onChange={(event) => updateField(key, event.target.value as AppraisalCondition)}>
                {conditionOptions.map((option) => <option key={option}>{option}</option>)}
              </SelectInput>
            </Field>
          ))}
          <div className="md:col-span-2 xl:col-span-3">
            <Field label="Mechanical notes"><TextAreaInput value={form.mechanicalNotes} onChange={(event) => updateField("mechanicalNotes", event.target.value)} /></Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Warning lights"><TextAreaInput value={form.warningLights} onChange={(event) => updateField("warningLights", event.target.value)} placeholder="Leave blank if none shown" /></Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Damage entries" eyebrow="Prep commercialisation" action={<Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={addDamageDraft}>Add damage</Button>} />
        <CardBody className="space-y-4">
          {damageDrafts.length === 0 ? (
            <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">No damage entries added yet.</p>
          ) : (
            damageDrafts.map((entry) => (
              <div key={entry.id} className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-2 xl:grid-cols-6">
                <Field label="Panel/location"><TextInput value={entry.panelLocation} onChange={(event) => updateDamageDraft(entry.id, "panelLocation", event.target.value)} /></Field>
                <Field label="Damage type"><TextInput value={entry.damageType} onChange={(event) => updateDamageDraft(entry.id, "damageType", event.target.value)} /></Field>
                <Field label="Severity"><SelectInput value={entry.severity} onChange={(event) => updateDamageDraft(entry.id, "severity", event.target.value as DamageSeverity)}>{damageSeverityOptions.map((option) => <option key={option}>{option}</option>)}</SelectInput></Field>
                <Field label="Repair category"><SelectInput value={entry.estimatedRepairCategory} onChange={(event) => updateDamageDraft(entry.id, "estimatedRepairCategory", event.target.value as RepairCategory)}>{repairOptions.map((option) => <option key={option}>{option}</option>)}</SelectInput></Field>
                <Field label="Estimate"><TextInput value={entry.estimatedCost} onChange={(event) => updateDamageDraft(entry.id, "estimatedCost", event.target.value)} /></Field>
                <div className="flex items-end">
                  <Button variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDamageDrafts((current) => current.filter((item) => item.id !== entry.id))}>
                    Remove
                  </Button>
                </div>
                <div className="md:col-span-2 xl:col-span-6">
                  <Field label="Notes"><TextAreaInput value={entry.notes} onChange={(event) => updateDamageDraft(entry.id, "notes", event.target.value)} /></Field>
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Photos" eyebrow="Supabase Storage-ready upload" />
        <CardBody>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:bg-slate-100">
            <Camera className="h-8 w-8 text-slate-400" />
            <span className="mt-3 text-sm font-semibold text-slate-900">Upload appraisal photos</span>
            <span className="mt-1 text-sm text-slate-500">Local previews are shown in mock mode. Supabase Storage paths are generated on save.</span>
            <input type="file" accept="image/*" multiple className="sr-only" onChange={handlePhotos} />
          </label>
          {photoDrafts.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {photoDrafts.map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <img src={photo.publicUrl} alt={photo.fileName} className="aspect-[4/3] w-full object-cover" />
                  <p className="truncate p-2 text-xs font-medium text-slate-600">{photo.fileName}</p>
                </div>
              ))}
            </div>
          ) : null}
        </CardBody>
      </Card>
    </form>
  );
}
