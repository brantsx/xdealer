import { ArrowLeft, CheckCircle2, Image, Store } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ActionBadge, ChannelBadge, ConfidenceBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Field, SelectInput, TextAreaInput, TextInput } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { formatCurrency, formatNumber, getVehicleTitle } from "../lib/utils/format";
import type { MarketplaceListing, MarketplaceListingPhoto, MarketplaceListingType, MarketplaceVisibility } from "../types";

const steps = [
  "Confirm vehicle",
  "Listing type",
  "Pricing",
  "Visibility",
  "Condition disclosure",
  "Photos",
  "Publish",
];

const listingTypes: MarketplaceListingType[] = ["Fixed price", "Best offer", "Timed auction", "Buy it now", "Trade-only enquiry"];
const visibilityTypes: MarketplaceVisibility[] = [
  "All approved dealers",
  "Selected dealer groups",
  "Local dealers only",
  "Dealers matching stock profile",
  "Private invite-only",
];

export function MarketplaceListingWizardPage() {
  const { vehicleId } = useParams();
  const { createMarketplaceListing, marketplace, organisation, publishMarketplaceListing, vehicles } = useData();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const vehicle = vehicles.find((candidate) => candidate.id === vehicleId);
  const sellerProfile = marketplace.dealerProfiles.find((profile) => profile.organisationId === organisation.id);
  const recommendation = vehicle?.decisionPack?.marketplaceRecommendation;
  const [step, setStep] = useState(0);
  const [listingType, setListingType] = useState<MarketplaceListingType>(recommendation?.listingType ?? "Best offer");
  const [askingPrice, setAskingPrice] = useState(String(recommendation?.suggestedAskingPrice ?? vehicle?.decisionPack?.suggestedTradePrice ?? ""));
  const [reservePrice, setReservePrice] = useState(String(recommendation?.suggestedReserve ?? vehicle?.decisionPack?.recommendedReserve ?? ""));
  const [minimumOffer, setMinimumOffer] = useState(String(recommendation?.minimumAcceptableOffer ?? vehicle?.decisionPack?.suggestedTradePrice ?? ""));
  const [buyNowPrice, setBuyNowPrice] = useState(String((recommendation?.suggestedAskingPrice ?? 0) + 450 || ""));
  const [bidIncrement, setBidIncrement] = useState("100");
  const [vatNote, setVatNote] = useState("Margin scheme. No VAT qualifying invoice in this demo listing.");
  const [buyerFeeNote, setBuyerFeeNote] = useState("No xDealer buyer fee in MVP; transport and payment handled outside platform.");
  const [visibilityType, setVisibilityType] = useState<MarketplaceVisibility>("All approved dealers");
  const [bodyworkSummary, setBodyworkSummary] = useState(vehicle ? `${vehicle.appraisal.paintwork}. ${vehicle.damageEntries.length} damage entries disclosed.` : "");
  const [interiorSummary, setInteriorSummary] = useState(vehicle ? `${vehicle.appraisal.interior}. ${vehicle.numberOfKeys} key(s).` : "");
  const [mechanicalSummary, setMechanicalSummary] = useState(vehicle?.appraisal.mechanicalNotes ?? "");
  const [knownIssues, setKnownIssues] = useState(vehicle?.motAdvisories.join("; ") ?? "");
  const [prepRecommendation, setPrepRecommendation] = useState(vehicle?.decisionPack?.prepRecommendation ?? "");
  const [description, setDescription] = useState(recommendation?.rationale ?? "Trade listing created from xDealer appraisal and decision pack evidence.");
  const [primaryPhotoId, setPrimaryPhotoId] = useState(vehicle?.photos[0]?.id ?? "");
  const [hiddenPhotoIds, setHiddenPhotoIds] = useState<string[]>([]);
  const [declaration, setDeclaration] = useState(false);

  const canPublish = useMemo(() => {
    return Boolean(
      vehicle &&
        sellerProfile &&
        declaration &&
        Number(askingPrice) >= 0 &&
        Number(reservePrice) >= 0 &&
        Number(minimumOffer) >= 0 &&
        bodyworkSummary.trim().length > 4 &&
        mechanicalSummary.trim().length > 4,
    );
  }, [askingPrice, bodyworkSummary, declaration, mechanicalSummary, minimumOffer, reservePrice, sellerProfile, vehicle]);

  if (!vehicle || !vehicle.decisionPack) {
    return (
      <EmptyState
        title="Vehicle decision pack required"
        description="Analyse the vehicle first so xDealer can pre-fill pricing, prep and disclosure details for the marketplace listing."
        action={
          <Link to="/app/vehicles">
            <Button variant="secondary">Open Vehicle Inbox</Button>
          </Link>
        }
      />
    );
  }

  if (!sellerProfile) {
    return (
      <EmptyState
        title="Trade profile required"
        description="Create a dealer trade profile before publishing marketplace listings."
        action={
          <Link to="/app/trade-profile">
            <Button variant="secondary">Open trade profile</Button>
          </Link>
        }
      />
    );
  }

  const selectedVehicle = vehicle;
  const selectedSellerProfile = sellerProfile;

  function togglePhoto(photoId: string) {
    setHiddenPhotoIds((current) => (current.includes(photoId) ? current.filter((id) => id !== photoId) : [...current, photoId]));
  }

  function publish() {
    const listingId = crypto.randomUUID();
    const now = new Date().toISOString();
    const listing: MarketplaceListing = {
      id: listingId,
      organisationId: selectedVehicle.organisationId,
      vehicleId: selectedVehicle.id,
      sellerProfileId: selectedSellerProfile.id,
      listingType,
      status: "Draft",
      title: `${selectedVehicle.make} ${selectedVehicle.model} ${selectedVehicle.derivative}`,
      description,
      askingPrice: Number(askingPrice),
      reservePrice: Number(reservePrice),
      buyNowPrice: listingType === "Buy it now" ? Number(buyNowPrice) : undefined,
      minimumOffer: Number(minimumOffer),
      bidIncrement: Number(bidIncrement),
      startsAt: now,
      endsAt: listingType === "Timed auction" ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      visibilityType,
      location: selectedSellerProfile.address.split(",").slice(-1)[0]?.trim() ?? selectedSellerProfile.postcodeArea,
      postcodeArea: selectedSellerProfile.postcodeArea,
      vatMarginNote: vatNote,
      buyerFeeNote,
      sellerDeclarationAccepted: declaration,
      bodyworkSummary,
      interiorSummary,
      mechanicalSummary,
      knownIssues,
      prepRecommendation,
      auditNotes: ["Listing pre-filled from xDealer decision pack", "Seller confirmed edited disclosure in listing wizard"],
      documents: ["Mock appraisal PDF", "Mock HPI summary", "Mock V5C status note"],
      views: 0,
      watchers: 0,
      createdAt: now,
      updatedAt: now,
    };
    const listingPhotos: MarketplaceListingPhoto[] = selectedVehicle.photos.map((photo, index) => ({
      id: crypto.randomUUID(),
      listingId,
      vehiclePhotoId: photo.id,
      isPrimary: photo.id === primaryPhotoId,
      isVisible: !hiddenPhotoIds.includes(photo.id),
      sortOrder: index + 1,
      createdAt: now,
    }));
    createMarketplaceListing(listing, listingPhotos);
    publishMarketplaceListing(listingId);
    pushToast({ tone: "success", title: "Marketplace listing published", message: `${selectedVehicle.vrm} is now live for approved dealers.` });
    navigate(`/app/marketplace/${listingId}`);
  }

  return (
    <div className="space-y-6">
      <Link to={`/app/decision-packs/${vehicle.decisionPack.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-signal-600">
        <ArrowLeft className="h-4 w-4" />
        Decision pack
      </Link>

      <PageHeader
        title="List on Marketplace"
        description="Capture the vehicle once, then publish a dealer-to-dealer trade listing with pricing, disclosure, photos and audit trail."
        actions={<Button disabled={!canPublish} onClick={publish} icon={<Store className="h-4 w-4" />}>Publish listing</Button>}
      />

      <div className="grid gap-2 md:grid-cols-7">
        {steps.map((label, index) => (
          <button
            type="button"
            key={label}
            onClick={() => setStep(index)}
            className={
              step === index
                ? "rounded-md bg-ink-950 px-3 py-2 text-left text-sm font-semibold text-white"
                : "rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            }
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      {step === 0 ? (
        <Card>
          <CardHeader title="Confirm vehicle" eyebrow="Decision pack source" />
          <CardBody className="grid gap-4 md:grid-cols-3">
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Vehicle</p>
              <p className="mt-1 font-semibold text-slate-950">{getVehicleTitle(vehicle)}</p>
              <p className="mt-1 text-sm text-slate-500">{vehicle.vrm} · {formatNumber(vehicle.mileage)} miles · {vehicle.source}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Appraisal quality</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{vehicle.decisionPack.appraisalQualityScore}%</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">xDealer recommendation</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <ActionBadge action={vehicle.decisionPack.overallRecommendation} />
                <ChannelBadge channel={vehicle.decisionPack.preferredChannel} />
                <ConfidenceBadge score={vehicle.decisionPack.confidenceScore} />
              </div>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card>
          <CardHeader title="Listing type" eyebrow="Trade route" />
          <CardBody className="grid gap-3 md:grid-cols-5">
            {listingTypes.map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => setListingType(type)}
                className={
                  listingType === type
                    ? "rounded-lg border border-signal-500 bg-emerald-50 p-4 text-left text-sm font-semibold text-emerald-900"
                    : "rounded-lg border border-slate-200 bg-white p-4 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                }
              >
                {type}
              </button>
            ))}
          </CardBody>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader title="Pricing" eyebrow="Trade guardrails" />
          <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Asking price">
              <TextInput type="number" value={askingPrice} onChange={(event) => setAskingPrice(event.target.value)} />
            </Field>
            <Field label="Reserve price">
              <TextInput type="number" value={reservePrice} onChange={(event) => setReservePrice(event.target.value)} />
            </Field>
            <Field label="Minimum acceptable offer">
              <TextInput type="number" value={minimumOffer} onChange={(event) => setMinimumOffer(event.target.value)} />
            </Field>
            <Field label="Buy it now price">
              <TextInput type="number" value={buyNowPrice} onChange={(event) => setBuyNowPrice(event.target.value)} />
            </Field>
            <Field label="Bid increment">
              <TextInput type="number" value={bidIncrement} onChange={(event) => setBidIncrement(event.target.value)} />
            </Field>
            <Field label="VAT/margin scheme note">
              <TextInput value={vatNote} onChange={(event) => setVatNote(event.target.value)} />
            </Field>
            <Field label="Buyer fee note">
              <TextInput value={buyerFeeNote} onChange={(event) => setBuyerFeeNote(event.target.value)} />
            </Field>
          </CardBody>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <CardHeader title="Visibility" eyebrow="Dealer audience" />
          <CardBody className="grid gap-3 md:grid-cols-5">
            {visibilityTypes.map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => setVisibilityType(type)}
                className={
                  visibilityType === type
                    ? "rounded-lg border border-signal-500 bg-emerald-50 p-4 text-left text-sm font-semibold text-emerald-900"
                    : "rounded-lg border border-slate-200 bg-white p-4 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                }
              >
                {type}
              </button>
            ))}
          </CardBody>
        </Card>
      ) : null}

      {step === 4 ? (
        <Card>
          <CardHeader title="Condition disclosure" eyebrow="Seller editable, audit logged" />
          <CardBody className="grid gap-4 md:grid-cols-2">
            <Field label="Bodywork summary">
              <TextAreaInput value={bodyworkSummary} onChange={(event) => setBodyworkSummary(event.target.value)} />
            </Field>
            <Field label="Interior summary">
              <TextAreaInput value={interiorSummary} onChange={(event) => setInteriorSummary(event.target.value)} />
            </Field>
            <Field label="Mechanical notes">
              <TextAreaInput value={mechanicalSummary} onChange={(event) => setMechanicalSummary(event.target.value)} />
            </Field>
            <Field label="Known issues and MOT advisories">
              <TextAreaInput value={knownIssues} onChange={(event) => setKnownIssues(event.target.value)} />
            </Field>
            <Field label="Prep recommendation">
              <TextAreaInput value={prepRecommendation} onChange={(event) => setPrepRecommendation(event.target.value)} />
            </Field>
            <Field label="Listing description">
              <TextAreaInput value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>
          </CardBody>
        </Card>
      ) : null}

      {step === 5 ? (
        <Card>
          <CardHeader title="Photos" eyebrow="Use existing vehicle photos" />
          <CardBody className="grid gap-4 md:grid-cols-3">
            {vehicle.photos.map((photo) => (
              <div key={photo.id} className="rounded-lg border border-slate-200 p-3">
                <img src={photo.publicUrl} alt={photo.caption} className="aspect-[4/3] w-full rounded-md object-cover" />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant={primaryPhotoId === photo.id ? "primary" : "secondary"} icon={<Image className="h-4 w-4" />} onClick={() => setPrimaryPhotoId(photo.id)}>
                    Primary
                  </Button>
                  <Button variant={hiddenPhotoIds.includes(photo.id) ? "secondary" : "ghost"} onClick={() => togglePhoto(photo.id)}>
                    {hiddenPhotoIds.includes(photo.id) ? "Hidden" : "Visible"}
                  </Button>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      {step === 6 ? (
        <Card>
          <CardHeader title="Publish preview" eyebrow="Seller declaration" />
          <CardBody className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Trade listing</p>
                <p className="mt-1 font-semibold text-slate-950">{listingType}</p>
                <p className="mt-1 text-sm text-slate-600">{visibilityType}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Asking / reserve</p>
                <p className="mt-1 font-semibold text-slate-950">{formatCurrency(Number(askingPrice) || 0)} / {formatCurrency(Number(reservePrice) || 0)}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Minimum offer</p>
                <p className="mt-1 font-semibold text-slate-950">{formatCurrency(Number(minimumOffer) || 0)}</p>
              </div>
            </div>
            <label className="flex items-start gap-3 rounded-md border border-slate-200 p-4 text-sm text-slate-700">
              <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-signal-600" checked={declaration} onChange={(event) => setDeclaration(event.target.checked)} />
              <span>I confirm this trade listing is accurate to the best of my knowledge and suitable for dealer-to-dealer trade.</span>
            </label>
            <Button disabled={!canPublish} onClick={publish} icon={<CheckCircle2 className="h-4 w-4" />}>
              Publish to approved dealers
            </Button>
          </CardBody>
        </Card>
      ) : null}

      <div className="flex justify-between gap-3">
        <Button variant="secondary" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>Back</Button>
        <Button disabled={step === steps.length - 1} onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}>Next</Button>
      </div>
    </div>
  );
}
