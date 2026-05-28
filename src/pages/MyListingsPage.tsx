import { Eye, FileClock, RotateCcw, Store, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ListingStatusBadge, ListingTypeBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { formatCurrency, formatNumber, getVehicleTitle, hoursUntil } from "../lib/utils/format";

export function MyListingsPage() {
  const { marketplace, marketplaceVehicles, organisation, publishMarketplaceListing, withdrawMarketplaceListing } = useData();
  const { pushToast } = useToast();
  const listings = marketplace.listings.filter((listing) => listing.organisationId === organisation.id);
  const buckets = ["Draft", "Live", "Under offer", "Reserved", "Sold", "Expired", "Withdrawn"].map((status) => ({
    status,
    count: listings.filter((listing) => listing.status === status).length,
  }));

  function publish(listingId: string) {
    publishMarketplaceListing(listingId);
    pushToast({ tone: "success", title: "Listing published", message: "The trade listing is now visible to approved dealers in the mock marketplace." });
  }

  function withdraw(listingId: string) {
    withdrawMarketplaceListing(listingId);
    pushToast({ tone: "success", title: "Listing withdrawn", message: "The listing has been removed from live marketplace stock." });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My listings"
        description="Manage draft, live, under-offer, reserved, sold and withdrawn marketplace stock from your xDealer vehicle records."
        actions={
          <Link to="/app/vehicles">
            <Button icon={<Store className="h-4 w-4" />}>List from vehicle</Button>
          </Link>
        }
      />

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
        {buckets.map((bucket) => (
          <div key={bucket.status} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">{bucket.status}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{bucket.count}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader title="Seller listing management" eyebrow="Action required" />
        {listings.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-5 py-3">Listing type</th>
                  <th className="px-5 py-3">Asking/current bid</th>
                  <th className="px-5 py-3">Views</th>
                  <th className="px-5 py-3">Watchers</th>
                  <th className="px-5 py-3">Bids/offers</th>
                  <th className="px-5 py-3">Highest bid</th>
                  <th className="px-5 py-3">Time remaining</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Action required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listings.map((listing) => {
                  const vehicle = marketplaceVehicles.find((candidate) => candidate.id === listing.vehicleId);
                  const bidCount = marketplace.bids.filter((bid) => bid.listingId === listing.id).length;
                  const offerCount = marketplace.offers.filter((offer) => offer.listingId === listing.id).length;
                  return (
                    <tr key={listing.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <Link to={`/app/marketplace/${listing.id}`} className="font-semibold text-slate-950 hover:text-signal-700">
                          {vehicle ? getVehicleTitle(vehicle) : listing.title}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">{vehicle?.vrm}</p>
                      </td>
                      <td className="px-5 py-4"><ListingTypeBadge type={listing.listingType} /></td>
                      <td className="px-5 py-4 font-semibold">{formatCurrency(listing.currentHighestBid ?? listing.askingPrice)}</td>
                      <td className="px-5 py-4">{formatNumber(listing.views)}</td>
                      <td className="px-5 py-4">{formatNumber(listing.watchers)}</td>
                      <td className="px-5 py-4">{bidCount + offerCount}</td>
                      <td className="px-5 py-4">{listing.currentHighestBid ? formatCurrency(listing.currentHighestBid) : "No bids"}</td>
                      <td className="px-5 py-4">{listing.endsAt ? `${hoursUntil(listing.endsAt)}h` : "Open"}</td>
                      <td className="px-5 py-4"><ListingStatusBadge status={listing.status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/app/marketplace/${listing.id}`}>
                            <Button variant="secondary" icon={<Eye className="h-4 w-4" />}>View</Button>
                          </Link>
                          {listing.status === "Draft" ? (
                            <Button icon={<FileClock className="h-4 w-4" />} onClick={() => publish(listing.id)}>Publish</Button>
                          ) : null}
                          {listing.status === "Live" || listing.status === "Under offer" ? (
                            <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => withdraw(listing.id)}>Withdraw</Button>
                          ) : null}
                          {listing.status === "Expired" || listing.status === "Withdrawn" ? (
                            <Button variant="secondary" icon={<RotateCcw className="h-4 w-4" />} onClick={() => publish(listing.id)}>Relist</Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No seller listings yet" description="Publish a decision-packed vehicle to start receiving trade interest from approved dealers." />
        )}
      </Card>
    </div>
  );
}
