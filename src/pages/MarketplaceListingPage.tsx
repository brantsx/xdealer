import { ArrowLeft, Clock, FileText, Heart, MessageSquare, Send, ShieldCheck, Store, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FitScoreBadge, ListingStatusBadge, ListingTypeBadge, RiskBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { TextAreaInput, TextInput } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { formatCurrency, formatDate, formatNumber, getVehicleTitle, hoursUntil } from "../lib/utils/format";

export function MarketplaceListingPage() {
  const { id } = useParams();
  const {
    analyseMarketplaceListing,
    makeMarketplaceOffer,
    marketplace,
    marketplaceVehicles,
    organisation,
    placeMarketplaceBid,
    watchListing,
  } = useData();
  const { pushToast } = useToast();
  const [offerAmount, setOfferAmount] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [message, setMessage] = useState("");

  const listing = marketplace.listings.find((candidate) => candidate.id === id);
  const vehicle = listing ? marketplaceVehicles.find((candidate) => candidate.id === listing.vehicleId) : undefined;
  const seller = listing ? marketplace.dealerProfiles.find((profile) => profile.id === listing.sellerProfileId) : undefined;
  const analysis = listing
    ? marketplace.analyses.find((candidate) => candidate.listingId === listing.id && candidate.buyerOrganisationId === organisation.id)
    : undefined;
  const questions = listing ? marketplace.questions.filter((question) => question.listingId === listing.id) : [];
  const bids = listing ? marketplace.bids.filter((bid) => bid.listingId === listing.id) : [];
  const offers = listing ? marketplace.offers.filter((offer) => offer.listingId === listing.id) : [];
  const watched = listing ? marketplace.watchlist.some((watch) => watch.listingId === listing.id && watch.organisationId === organisation.id) : false;

  const visiblePhotos = useMemo(() => {
    if (!listing || !vehicle) return [];
    const listingPhotos = marketplace.listingPhotos
      .filter((photo) => photo.listingId === listing.id && photo.isVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return listingPhotos
      .map((photo) => vehicle.photos.find((vehiclePhoto) => vehiclePhoto.id === photo.vehiclePhotoId))
      .filter((photo): photo is NonNullable<typeof photo> => Boolean(photo));
  }, [listing, marketplace.listingPhotos, vehicle]);

  if (!listing || !vehicle) {
    return (
      <EmptyState
        title="Marketplace listing not found"
        description="The listing may have expired, been withdrawn or is not visible to this organisation."
        action={
          <Link to="/app/marketplace">
            <Button variant="secondary">Back to marketplace</Button>
          </Link>
        }
      />
    );
  }

  const selectedListing = listing;
  const selectedVehicle = vehicle;
  const primaryPhoto = visiblePhotos[0]?.publicUrl ?? "/assets/vehicle-placeholder.svg";
  const sellerOwnsListing = selectedListing.organisationId === organisation.id;
  const currentBid = selectedListing.currentHighestBid ?? selectedListing.reservePrice;

  function runAnalysis() {
    const result = analyseMarketplaceListing(selectedListing.id);
    pushToast({
      tone: "success",
      title: "Buyer guidance refreshed",
      message: `xDealer fit score: ${result.fitScore}% with max bid ${formatCurrency(result.recommendedMaxBid)}.`,
    });
  }

  function submitBid() {
    const amount = Number(bidAmount);
    if (!Number.isFinite(amount) || amount < currentBid + selectedListing.bidIncrement) {
      pushToast({ tone: "error", title: "Bid too low", message: `Bid at least ${formatCurrency(currentBid + selectedListing.bidIncrement)}.` });
      return;
    }
    placeMarketplaceBid(selectedListing.id, amount, message || "Bid placed through xDealer marketplace.");
    setBidAmount("");
    setMessage("");
    pushToast({ tone: "success", title: "Bid placed", message: `Your bid of ${formatCurrency(amount)} is now leading in the mock workflow.` });
  }

  function submitOffer() {
    const amount = Number(offerAmount);
    if (!Number.isFinite(amount) || amount < selectedListing.minimumOffer) {
      pushToast({ tone: "error", title: "Offer below minimum", message: `Minimum offer is ${formatCurrency(selectedListing.minimumOffer)}.` });
      return;
    }
    makeMarketplaceOffer(selectedListing.id, amount, message || "Offer submitted through xDealer marketplace.");
    setOfferAmount("");
    setMessage("");
    pushToast({ tone: "success", title: "Offer submitted", message: "Seller notification is mocked for the MVP." });
  }

  return (
    <div className="space-y-6">
      <Link to="/app/marketplace" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-signal-600">
        <ArrowLeft className="h-4 w-4" />
        Marketplace
      </Link>

      <PageHeader
        title={getVehicleTitle(vehicle)}
        description={`${vehicle.vrm} · ${formatNumber(vehicle.mileage)} miles · ${listing.location} · Seller ${seller?.tradingName ?? "Approved dealer"}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <ListingStatusBadge status={listing.status} />
            <ListingTypeBadge type={listing.listingType} />
            {analysis ? <FitScoreBadge score={analysis.fitScore} label={analysis.fitLabel} /> : null}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="overflow-hidden">
          <div className="aspect-[16/9] bg-slate-200">
            <img src={primaryPhoto} alt={getVehicleTitle(vehicle)} className="h-full w-full object-cover" />
          </div>
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-4">
              {visiblePhotos.map((photo) => (
                <img key={photo.id} src={photo.publicUrl} alt={photo.caption} className="aspect-[4/3] rounded-md object-cover" />
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Price and bidding" eyebrow="Trade panel" />
          <CardBody className="space-y-4">
            <div className="rounded-md bg-ink-950 p-4 text-white">
              <p className="text-sm font-semibold uppercase text-emerald-300">
                {listing.listingType === "Timed auction" ? "Current highest bid" : "Asking price"}
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {formatCurrency(listing.listingType === "Timed auction" ? currentBid : listing.buyNowPrice ?? listing.askingPrice)}
              </p>
              {listing.endsAt ? (
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-300">
                  <Clock className="h-4 w-4" />
                  {hoursUntil(listing.endsAt)} hours remaining
                </p>
              ) : null}
            </div>

            {analysis ? (
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-600">Suggested maximum bid</span>
                  <span className="font-semibold text-slate-950">{formatCurrency(analysis.recommendedMaxBid)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-600">Expected margin range</span>
                  <span className="font-semibold text-slate-950">
                    {formatCurrency(analysis.expectedMarginMin)} to {formatCurrency(analysis.expectedMarginMax)}
                  </span>
                </div>
                <RiskBadge level={analysis.riskRating} />
              </div>
            ) : (
              <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-900">
                Generate buyer-specific guidance before bidding so the recommendation reflects your organisation rules and stock profile.
              </div>
            )}

            <Button className="w-full" onClick={runAnalysis} icon={<ShieldCheck className="h-4 w-4" />}>
              Analyse for my dealership
            </Button>
            <Button variant="secondary" className="w-full" icon={<Heart className="h-4 w-4" />} onClick={() => watchListing(listing.id)}>
              {watched ? "Watching" : "Watch vehicle"}
            </Button>

            {!sellerOwnsListing ? (
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <TextInput
                  value={listing.listingType === "Timed auction" ? bidAmount : offerAmount}
                  onChange={(event) => (listing.listingType === "Timed auction" ? setBidAmount(event.target.value) : setOfferAmount(event.target.value))}
                  type="number"
                  min={0}
                  placeholder={listing.listingType === "Timed auction" ? `Bid from ${currentBid + listing.bidIncrement}` : `Offer from ${listing.minimumOffer}`}
                />
                <TextAreaInput value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Add a trade note or collection condition." />
                {listing.listingType === "Timed auction" ? (
                  <Button className="w-full" onClick={submitBid} icon={<Send className="h-4 w-4" />}>
                    Place bid
                  </Button>
                ) : (
                  <Button className="w-full" onClick={submitOffer} icon={<Send className="h-4 w-4" />}>
                    Make offer
                  </Button>
                )}
              </div>
            ) : (
              <Link to="/app/my-listings" className="block">
                <Button variant="secondary" className="w-full">Manage my listing</Button>
              </Link>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="xDealer AI summary" eyebrow="Buyer intelligence" />
          <CardBody className="space-y-5">
            {analysis ? (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Retail fit score</span>
                      <span className="font-semibold">{analysis.retailFitScore}%</span>
                    </div>
                    <ProgressBar value={analysis.retailFitScore} />
                  </div>
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Trade desirability</span>
                      <span className="font-semibold">{analysis.tradeDesirabilityScore}%</span>
                    </div>
                    <ProgressBar value={analysis.tradeDesirabilityScore} />
                  </div>
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Stock profile fit</span>
                      <span className="font-semibold">{analysis.fitScore}%</span>
                    </div>
                    <ProgressBar value={analysis.fitScore} />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-md bg-emerald-50 p-4">
                    <p className="font-semibold text-emerald-950">Why it may fit</p>
                    <ul className="mt-3 space-y-2 text-sm text-emerald-900">
                      {analysis.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-md bg-amber-50 p-4">
                    <p className="font-semibold text-amber-950">Checks before bidding</p>
                    <ul className="mt-3 space-y-2 text-sm text-amber-900">
                      {analysis.risksToCheck.map((riskItem) => (
                        <li key={riskItem}>{riskItem}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                title="No buyer analysis yet"
                description="Run a dealership-specific analysis to compare this listing against your stock profile, prep tolerance and margin rules."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Seller trade profile" eyebrow={seller?.verifiedStatus ?? "Approved"} />
          <CardBody className="space-y-3 text-sm">
            <p className="font-semibold text-slate-950">{seller?.tradingName}</p>
            <p className="leading-6 text-slate-600">{seller?.description}</p>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="font-semibold text-slate-950">Rating {seller?.rating.toFixed(1)} / 5</p>
              <p className="mt-1 text-slate-600">{seller?.postcodeArea} · {seller?.transportRadiusMiles} mile transport radius</p>
            </div>
            <Button variant="secondary" className="w-full" icon={<MessageSquare className="h-4 w-4" />}>
              Contact seller
            </Button>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Condition report" eyebrow="Seller disclosure" />
          <CardBody className="space-y-3 text-sm text-slate-700">
            <p><strong>Bodywork:</strong> {listing.bodyworkSummary}</p>
            <p><strong>Interior:</strong> {listing.interiorSummary}</p>
            <p><strong>Mechanical:</strong> {listing.mechanicalSummary}</p>
            <p><strong>MOT advisories:</strong> {vehicle.motAdvisories.length ? vehicle.motAdvisories.join("; ") : "No advisories recorded."}</p>
            <p><strong>Service history:</strong> {vehicle.serviceHistory}</p>
            <p><strong>Keys:</strong> {vehicle.numberOfKeys}</p>
            <p><strong>V5C:</strong> {vehicle.v5cStatus}</p>
            <p><strong>HPI:</strong> {vehicle.hpiStatus}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Damage entries" eyebrow="Commercialisation" />
          <CardBody className="space-y-3">
            {vehicle.damageEntries.map((entry) => (
              <div key={entry.id} className="rounded-md border border-slate-200 p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <p className="font-semibold text-slate-950">{entry.panelLocation}</p>
                  <p className="font-semibold text-slate-950">{formatCurrency(entry.estimatedCost)}</p>
                </div>
                <p className="mt-1 text-slate-600">{entry.damageType} · {entry.estimatedRepairCategory} · {entry.severity}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Documents" eyebrow="Mocked" />
          <CardBody className="space-y-2">
            {listing.documents.map((documentName) => (
              <div key={documentName} className="flex items-center gap-2 rounded-md bg-slate-50 p-3 text-sm font-medium text-slate-700">
                <FileText className="h-4 w-4 text-signal-600" />
                {documentName}
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Questions and answers" eyebrow={`${questions.length} threads`} />
          <CardBody className="space-y-3">
            {questions.map((question) => (
              <div key={question.id} className="rounded-md bg-slate-50 p-3 text-sm">
                <p className="font-semibold text-slate-950">{question.question}</p>
                <p className="mt-2 text-slate-600">{question.answer ?? "Awaiting seller response."}</p>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Bid and offer history" eyebrow="Workflow" />
          <CardBody className="space-y-3 text-sm">
            {[...bids, ...offers].slice(0, 6).map((activity) => (
              <div key={activity.id} className="rounded-md bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-950">{formatCurrency(activity.amount)}</span>
                  <span className="text-xs font-semibold uppercase text-slate-500">{activity.status}</span>
                </div>
                <p className="mt-1 text-slate-600">{formatDate(activity.createdAt)}</p>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">
              <Truck className="h-4 w-4" />
              Accepted offers create mocked next steps for invoice, transport and completion.
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
