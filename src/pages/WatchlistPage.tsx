import { AlertTriangle, Clock, Heart, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { FitScoreBadge, ListingTypeBadge, RiskBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { useData } from "../context/DataContext";
import { formatCurrency, formatDate, getVehicleTitle, hoursUntil } from "../lib/utils/format";

export function WatchlistPage() {
  const { marketplace, marketplaceVehicles, organisation, watchListing } = useData();
  const watches = marketplace.watchlist.filter((watch) => watch.organisationId === organisation.id);

  const items = watches
    .map((watch) => {
      const listing = marketplace.listings.find((candidate) => candidate.id === watch.listingId);
      const vehicle = listing ? marketplaceVehicles.find((candidate) => candidate.id === listing.vehicleId) : undefined;
      const analysis = listing
        ? marketplace.analyses.find((candidate) => candidate.listingId === listing.id && candidate.buyerOrganisationId === organisation.id)
        : undefined;
      return listing && vehicle ? { watch, listing, vehicle, analysis } : undefined;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Watchlist"
        description="Track price changes, fresh bids, seller updates, ending-soon auctions and AI fit score movement on marketplace stock."
        actions={<Heart className="h-6 w-6 fill-signal-500 text-signal-600" />}
      />

      {items.length ? (
        <div className="grid gap-4">
          {items.map(({ watch, listing, vehicle, analysis }) => (
            <Card key={watch.id}>
              <CardBody>
                <div className="grid gap-4 lg:grid-cols-[140px_1fr_auto] lg:items-center">
                  <img
                    src={vehicle.photos[0]?.publicUrl ?? "/assets/vehicle-placeholder.svg"}
                    alt={getVehicleTitle(vehicle)}
                    className="aspect-[4/3] w-full rounded-md object-cover lg:w-36"
                  />
                  <div className="space-y-3">
                    <div>
                      <Link to={`/app/marketplace/${listing.id}`} className="font-semibold text-slate-950 hover:text-signal-700">
                        {getVehicleTitle(vehicle)}
                      </Link>
                      <p className="mt-1 text-sm text-slate-500">
                        Watched {formatDate(watch.createdAt)} · {vehicle.vrm} · {listing.location}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ListingTypeBadge type={listing.listingType} />
                      {analysis ? <FitScoreBadge score={analysis.fitScore} label={analysis.fitLabel} /> : null}
                      {analysis ? <RiskBadge level={analysis.riskRating} /> : null}
                    </div>
                    <div className="grid gap-2 text-sm md:grid-cols-4">
                      <div className="rounded-md bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase text-slate-500">Price change</p>
                        <p className="mt-1 font-semibold text-emerald-700">No change</p>
                      </div>
                      <div className="rounded-md bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase text-slate-500">New bids</p>
                        <p className="mt-1 font-semibold text-slate-950">{marketplace.bids.filter((bid) => bid.listingId === listing.id).length}</p>
                      </div>
                      <div className="rounded-md bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase text-slate-500">Ending soon</p>
                        <p className="mt-1 font-semibold text-amber-700">{listing.endsAt ? `${hoursUntil(listing.endsAt)}h` : "Open"}</p>
                      </div>
                      <div className="rounded-md bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase text-slate-500">AI fit change</p>
                        <p className="mt-1 font-semibold text-slate-950">Stable</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1"><TrendingUp className="h-4 w-4 text-signal-600" /> Current price {formatCurrency(listing.currentHighestBid ?? listing.askingPrice)}</span>
                      <span className="inline-flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-amber-600" /> Seller updates mocked in marketplace events</span>
                      {listing.endsAt ? <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4 text-slate-500" /> Ends {formatDate(listing.endsAt)}</span> : null}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link to={`/app/marketplace/${listing.id}`}>
                      <Button variant="secondary" className="w-full">Open listing</Button>
                    </Link>
                    <Button variant="ghost" onClick={() => watchListing(listing.id)}>Remove</Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No watched vehicles"
          description="Watch marketplace vehicles to monitor bid movement, seller updates and buyer-fit changes before committing trade money."
          action={
            <Link to="/app/marketplace">
              <Button variant="secondary">Browse marketplace</Button>
            </Link>
          }
        />
      )}

      <Card>
        <CardHeader title="Watch alerts" eyebrow="Mock notifications" />
        <CardBody className="grid gap-3 md:grid-cols-3">
          {["Price drops and guide changes", "New leading bids and outbid alerts", "Ending soon and seller disclosure updates"].map((item) => (
            <div key={item} className="rounded-md bg-slate-50 p-4 text-sm font-medium text-slate-700">{item}</div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
