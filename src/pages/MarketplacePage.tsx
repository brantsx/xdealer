import { Search, SlidersHorizontal, Store } from "lucide-react";
import { useMemo, useState } from "react";
import { MarketplaceCard } from "../components/marketplace/MarketplaceCard";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { SelectInput, TextInput } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { useData } from "../context/DataContext";
import { formatCurrency } from "../lib/utils/format";
import type { MarketplaceListing } from "../types";

type MarketplaceSort =
  | "Newly listed"
  | "Ending soon"
  | "Lowest price"
  | "Highest margin opportunity"
  | "Best stock profile match"
  | "Lowest risk"
  | "Highest trade desirability";

const sortOptions: MarketplaceSort[] = [
  "Newly listed",
  "Ending soon",
  "Lowest price",
  "Highest margin opportunity",
  "Best stock profile match",
  "Lowest risk",
  "Highest trade desirability",
];

function listingPrice(listing: MarketplaceListing): number {
  return listing.currentHighestBid ?? listing.buyNowPrice ?? listing.askingPrice;
}

export function MarketplacePage() {
  const { marketplace, marketplaceVehicles, organisation, watchListing } = useData();
  const [search, setSearch] = useState("");
  const [make, setMake] = useState("All");
  const [fuel, setFuel] = useState("All");
  const [risk, setRisk] = useState("All");
  const [listingType, setListingType] = useState("All");
  const [priceBand, setPriceBand] = useState("All");
  const [sort, setSort] = useState<MarketplaceSort>("Best stock profile match");

  const liveListings = marketplace.listings.filter((listing) => listing.status === "Live");
  const makes = Array.from(
    new Set(
      liveListings
        .map((listing) => marketplaceVehicles.find((vehicle) => vehicle.id === listing.vehicleId)?.make)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort();

  const filtered = useMemo(() => {
    const results = liveListings
      .map((listing) => ({
        listing,
        vehicle: marketplaceVehicles.find((vehicle) => vehicle.id === listing.vehicleId),
        seller: marketplace.dealerProfiles.find((profile) => profile.id === listing.sellerProfileId),
        analysis: marketplace.analyses.find(
          (candidate) => candidate.listingId === listing.id && candidate.buyerOrganisationId === organisation.id,
        ),
      }))
      .filter((item) => item.vehicle)
      .filter((item) => {
        const vehicle = item.vehicle;
        if (!vehicle) return false;
        const haystack = `${vehicle.vrm} ${vehicle.make} ${vehicle.model} ${vehicle.derivative} ${item.seller?.tradingName ?? ""}`.toLowerCase();
        const price = listingPrice(item.listing);
        return (
          haystack.includes(search.toLowerCase()) &&
          (make === "All" || vehicle.make === make) &&
          (fuel === "All" || vehicle.fuelType === fuel) &&
          (listingType === "All" || item.listing.listingType === listingType) &&
          (risk === "All" || item.analysis?.riskRating === risk) &&
          (priceBand === "All" ||
            (priceBand === "Under £10k" && price < 10000) ||
            (priceBand === "£10k to £20k" && price >= 10000 && price < 20000) ||
            (priceBand === "Over £20k" && price >= 20000))
        );
      });

    return results.sort((a, b) => {
      if (sort === "Ending soon") return new Date(a.listing.endsAt ?? "2999-01-01").getTime() - new Date(b.listing.endsAt ?? "2999-01-01").getTime();
      if (sort === "Lowest price") return listingPrice(a.listing) - listingPrice(b.listing);
      if (sort === "Highest margin opportunity") return (b.analysis?.expectedMargin ?? 0) - (a.analysis?.expectedMargin ?? 0);
      if (sort === "Best stock profile match") return (b.analysis?.fitScore ?? 0) - (a.analysis?.fitScore ?? 0);
      if (sort === "Lowest risk") return (a.analysis?.riskRating ?? "Low").localeCompare(b.analysis?.riskRating ?? "Low");
      if (sort === "Highest trade desirability") {
        return (b.analysis?.tradeDesirabilityScore ?? 0) - (a.analysis?.tradeDesirabilityScore ?? 0);
      }
      return new Date(b.listing.publishedAt ?? b.listing.createdAt).getTime() - new Date(a.listing.publishedAt ?? a.listing.createdAt).getTime();
    });
  }, [fuel, liveListings, listingType, make, marketplace.analyses, marketplace.dealerProfiles, marketplaceVehicles, organisation.id, priceBand, risk, search, sort]);

  const totalMarginOpportunity = filtered.reduce((sum, item) => sum + Math.max(0, item.analysis?.expectedMargin ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dealer marketplace"
        description="Private UK dealer-to-dealer stock exchange, powered by the same xDealer decision intelligence used at appraisal."
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">{liveListings.length} live listings</Badge>
            <Badge className="bg-sky-50 text-sky-700 ring-sky-200">{formatCurrency(totalMarginOpportunity)} margin opportunity</Badge>
          </div>
        }
      />

      <Card>
        <CardHeader title="Search marketplace stock" eyebrow="Trade exchange" action={<Store className="h-5 w-5 text-signal-600" />} />
        <CardBody className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1.3fr_repeat(5,minmax(0,1fr))]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <TextInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search VRM, make, model, seller"
                className="pl-9"
              />
            </div>
            <SelectInput value={make} onChange={(event) => setMake(event.target.value)} aria-label="Make">
              <option>All</option>
              {makes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </SelectInput>
            <SelectInput value={fuel} onChange={(event) => setFuel(event.target.value)} aria-label="Fuel type">
              {["All", "Petrol", "Diesel", "Hybrid", "Plug-in hybrid", "Electric"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </SelectInput>
            <SelectInput value={listingType} onChange={(event) => setListingType(event.target.value)} aria-label="Listing type">
              {["All", "Fixed price", "Best offer", "Timed auction", "Buy it now", "Trade-only enquiry"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </SelectInput>
            <SelectInput value={risk} onChange={(event) => setRisk(event.target.value)} aria-label="Risk">
              {["All", "Low", "Medium", "High", "Critical"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </SelectInput>
            <SelectInput value={priceBand} onChange={(event) => setPriceBand(event.target.value)} aria-label="Price range">
              {["All", "Under £10k", "£10k to £20k", "Over £20k"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </SelectInput>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {["Age", "Mileage", "Transmission", "Body type", "Distance/location", "Seller", "CAP position", "Source", "Has full appraisal", "Has photos", "VAT/margin note", "Stock profile match"].map((item) => (
                <Badge key={item} className="bg-slate-50 text-slate-600 ring-slate-200">
                  {item}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />
              <SelectInput value={sort} onChange={(event) => setSort(event.target.value as MarketplaceSort)} aria-label="Sort">
                {sortOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </SelectInput>
            </div>
          </div>
        </CardBody>
      </Card>

      {filtered.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ listing, vehicle, seller, analysis }) =>
            vehicle ? (
              <MarketplaceCard
                key={listing.id}
                listing={listing}
                vehicle={vehicle}
                seller={seller}
                analysis={analysis}
                watched={marketplace.watchlist.some((watch) => watch.listingId === listing.id && watch.organisationId === organisation.id)}
                onWatch={watchListing}
              />
            ) : null,
          )}
        </div>
      ) : (
        <EmptyState
          title="No marketplace stock matches those filters"
          description="Broaden the search criteria or clear the risk and pricing filters to see more approved dealer listings."
          action={<Button variant="secondary" onClick={() => setSearch("")}>Clear search</Button>}
        />
      )}
    </div>
  );
}
