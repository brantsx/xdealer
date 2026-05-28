# Dealer Marketplace

## Concept

xDealer now includes a private UK dealer-to-dealer marketplace. The workflow is deliberately part of the appraisal product: capture the vehicle once, generate the decision pack, then decide whether to retail, auction, trade out or list it to approved dealers.

## Listing Lifecycle

1. A seller creates a listing from an analysed vehicle.
2. The wizard pre-fills vehicle, appraisal, prep, damage and pricing evidence.
3. The seller chooses fixed price, best offer, timed auction, buy it now or trade-only enquiry.
4. The seller confirms visibility, photos and the accuracy declaration.
5. The listing moves from `Draft` to `Live`.
6. Buyers can watch, ask questions, bid or make offers.
7. Accepted offers move the listing to `Reserved` and create mocked next steps for details, invoice, transport, payment outside platform and completion.

## Buyer-Specific AI

The buyer sees their own xDealer guidance, not just the seller recommendation. `analyse-marketplace-listing` compares the listed vehicle against the buyer organisation rules and dealer profile, producing fit score, maximum bid, expected margin, risk rating, reasons and checks before bidding.

## Bids And Offers

Bids are used for timed auctions and maintain a leading/outbid state. Offers support submitted, accepted, rejected and countered statuses. Payment, escrow, contracts and transport booking are intentionally outside the MVP.

## Security Model

Sellers can manage their own listings. Approved authenticated organisations can view live marketplace listings according to visibility rules. Buyer bids, offers, watchlist entries and marketplace analyses remain private to the buyer organisation, while sellers can see activity against their own listings.

## Future Considerations

- Trade verification and KYC through Companies House, VAT and director checks.
- Escrow, card payments or payment-intent workflows.
- Trade sale contract generation and signature.
- Transport quote and collection booking.
- Webhook and email notifications for bids, offers and questions.
