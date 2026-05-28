import { Check, HandCoins, Reply, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { TextInput } from "../components/ui/Field";
import { PageHeader } from "../components/ui/PageHeader";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { formatCurrency, formatDate, getVehicleTitle } from "../lib/utils/format";

const tabs = ["Offers received", "Bids received", "Offers made", "Bids placed", "Won", "Lost", "Expired"] as const;
type ActivityTab = (typeof tabs)[number];

export function BidsOffersPage() {
  const { marketplace, marketplaceVehicles, organisation, respondToMarketplaceOffer } = useData();
  const { pushToast } = useToast();
  const [tab, setTab] = useState<ActivityTab>("Offers received");
  const [counterAmount, setCounterAmount] = useState("");

  const offersReceived = marketplace.offers.filter((offer) => offer.sellerOrganisationId === organisation.id);
  const offersMade = marketplace.offers.filter((offer) => offer.buyerOrganisationId === organisation.id);
  const bidsReceived = marketplace.bids.filter((bid) => {
    const listing = marketplace.listings.find((candidate) => candidate.id === bid.listingId);
    return listing?.organisationId === organisation.id;
  });
  const bidsPlaced = marketplace.bids.filter((bid) => bid.bidderOrganisationId === organisation.id);

  const activeOffers =
    tab === "Offers received"
      ? offersReceived
      : tab === "Offers made"
        ? offersMade
        : tab === "Won"
          ? offersMade.filter((offer) => offer.status === "Accepted")
          : tab === "Lost"
            ? offersMade.filter((offer) => offer.status === "Rejected")
            : tab === "Expired"
              ? marketplace.offers.filter((offer) => offer.status === "Expired")
              : [];
  const activeBids = tab === "Bids received" ? bidsReceived : tab === "Bids placed" ? bidsPlaced : [];

  function offerVehicleTitle(listingId: string) {
    const listing = marketplace.listings.find((candidate) => candidate.id === listingId);
    const vehicle = listing ? marketplaceVehicles.find((candidate) => candidate.id === listing.vehicleId) : undefined;
    return vehicle ? getVehicleTitle(vehicle) : "Marketplace vehicle";
  }

  function respond(offerId: string, response: "accept" | "reject" | "counter") {
    const amount = response === "counter" ? Number(counterAmount) : undefined;
    respondToMarketplaceOffer(offerId, response, amount, response === "counter" ? "Counter offer issued from seller workflow." : undefined);
    pushToast({
      tone: "success",
      title: response === "accept" ? "Offer accepted" : response === "reject" ? "Offer rejected" : "Counter offer sent",
      message: response === "accept" ? "Mock next steps have been created for invoice, payment and collection." : "The buyer workflow has been updated.",
    });
    setCounterAmount("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bids & offers"
        description="Control buying and selling activity, including mock accepted-offer next steps for invoice, collection and payment outside Xdealer."
        actions={<HandCoins className="h-6 w-6 text-signal-600" />}
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => setTab(item)}
            className={
              item === tab
                ? "rounded-md bg-ink-950 px-3 py-2 text-sm font-semibold text-white"
                : "rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            }
          >
            {item}
          </button>
        ))}
      </div>

      {activeOffers.length ? (
        <div className="grid gap-4">
          {activeOffers.map((offer) => (
            <Card key={offer.id}>
              <CardHeader
                title={offerVehicleTitle(offer.listingId)}
                eyebrow={`${offer.status} · ${formatDate(offer.createdAt)}`}
                action={<span className="text-lg font-semibold text-slate-950">{formatCurrency(offer.counterAmount ?? offer.amount)}</span>}
              />
              <CardBody className="space-y-4">
                <p className="text-sm leading-6 text-slate-700">{offer.counterMessage ?? offer.message}</p>
                {offer.nextSteps.length ? (
                  <div className="grid gap-2 md:grid-cols-5">
                    {offer.nextSteps.map((step) => (
                      <div key={step} className="rounded-md bg-emerald-50 p-3 text-xs font-semibold text-emerald-900">{step}</div>
                    ))}
                  </div>
                ) : null}
                {tab === "Offers received" && offer.status === "Submitted" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button icon={<Check className="h-4 w-4" />} onClick={() => respond(offer.id, "accept")}>Accept offer</Button>
                    <Button variant="danger" icon={<X className="h-4 w-4" />} onClick={() => respond(offer.id, "reject")}>Reject</Button>
                    <TextInput
                      type="number"
                      className="max-w-44"
                      value={counterAmount}
                      onChange={(event) => setCounterAmount(event.target.value)}
                      placeholder="Counter amount"
                    />
                    <Button variant="secondary" icon={<Reply className="h-4 w-4" />} onClick={() => respond(offer.id, "counter")}>
                      Counter offer
                    </Button>
                  </div>
                ) : null}
                <Link to={`/app/marketplace/${offer.listingId}`} className="text-sm font-semibold text-signal-700 hover:text-signal-800">
                  View listing
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : activeBids.length ? (
        <Card>
          <CardHeader title={tab} eyebrow="Bid workflow" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Message</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeBids.map((bid) => (
                  <tr key={bid.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <Link to={`/app/marketplace/${bid.listingId}`} className="font-semibold text-slate-950 hover:text-signal-700">
                        {offerVehicleTitle(bid.listingId)}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-semibold">{formatCurrency(bid.amount)}</td>
                    <td className="px-5 py-4">{bid.status}</td>
                    <td className="px-5 py-4 text-slate-600">{bid.message}</td>
                    <td className="px-5 py-4 text-slate-500">{formatDate(bid.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState
          title={`No ${tab.toLowerCase()} yet`}
          description="Marketplace bid and offer activity will appear here as buyers and sellers work through the trade flow."
          action={
            <Link to="/app/marketplace">
              <Button variant="secondary">Browse marketplace</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
