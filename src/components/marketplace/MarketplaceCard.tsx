import { Clock, Eye, Heart, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { FitScoreBadge, ListingStatusBadge, ListingTypeBadge, RiskBadge } from "../ui/Badge";
import { Button } from "../ui/Button";
import type { DealerProfile, MarketplaceAnalysis, MarketplaceListing, Vehicle } from "../../types";
import { formatCurrency, formatDistanceMiles, formatNumber, getVehicleTitle, hoursUntil } from "../../lib/utils/format";

interface MarketplaceCardProps {
  listing: MarketplaceListing;
  vehicle: Vehicle;
  seller?: DealerProfile;
  analysis?: MarketplaceAnalysis;
  watched: boolean;
  onWatch: (listingId: string) => void;
}

function priceLabel(listing: MarketplaceListing): string {
  if (listing.listingType === "Timed auction") return `Current bid ${formatCurrency(listing.currentHighestBid ?? listing.reservePrice)}`;
  if (listing.listingType === "Best offer") return `Guide ${formatCurrency(listing.askingPrice)}`;
  if (listing.listingType === "Trade-only enquiry") return "Trade enquiry";
  return formatCurrency(listing.buyNowPrice ?? listing.askingPrice);
}

export function MarketplaceCard({ listing, vehicle, seller, analysis, watched, onWatch }: MarketplaceCardProps) {
  const primaryPhoto = vehicle.photos[0]?.publicUrl ?? "/assets/vehicle-placeholder.svg";
  const remainingHours = hoursUntil(listing.endsAt);

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link to={`/app/marketplace/${listing.id}`} className="block">
        <div className="relative aspect-[16/10] bg-slate-200">
          <img src={primaryPhoto} alt={getVehicleTitle(vehicle)} className="h-full w-full object-cover" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <ListingTypeBadge type={listing.listingType} />
            <ListingStatusBadge status={listing.status} />
          </div>
        </div>
      </Link>
      <div className="space-y-4 p-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <Link to={`/app/marketplace/${listing.id}`} className="font-semibold text-slate-950 hover:text-signal-700">
                {getVehicleTitle(vehicle)}
              </Link>
              <p className="mt-1 text-sm text-slate-500">
                {vehicle.vrm} · {formatNumber(vehicle.mileage)} miles · {vehicle.fuelType} · {vehicle.transmission}
              </p>
            </div>
            <button
              type="button"
              className="rounded-md p-2 text-slate-400 hover:bg-emerald-50 hover:text-signal-700"
              aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
              onClick={() => onWatch(listing.id)}
            >
              <Heart className={watched ? "h-5 w-5 fill-signal-500 text-signal-600" : "h-5 w-5"} />
            </button>
          </div>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-md bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Price</p>
            <p className="mt-1 font-semibold text-slate-950">{priceLabel(listing)}</p>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Seller</p>
            <p className="mt-1 font-semibold text-slate-950">{seller?.tradingName ?? "Approved dealer"}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {analysis ? <FitScoreBadge score={analysis.fitScore} label={analysis.fitLabel} /> : null}
          {analysis ? <RiskBadge level={analysis.riskRating} /> : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {listing.location} · {formatDistanceMiles(seller?.transportRadiusMiles ?? 80)} radius
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            {listing.views} views
          </span>
          {listing.endsAt ? (
            <span className="inline-flex items-center gap-1.5 text-amber-700">
              <Clock className="h-4 w-4" />
              {remainingHours}h left
            </span>
          ) : null}
        </div>

        <Link to={`/app/marketplace/${listing.id}`} className="block">
          <Button variant="secondary" className="w-full">
            View trade pack
          </Button>
        </Link>
      </div>
    </article>
  );
}
