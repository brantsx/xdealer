import { ArrowRight, BarChart3, CheckCircle2, FileText, ShieldCheck, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card, CardBody } from "../components/ui/Card";
import { MetricCard } from "../components/ui/MetricCard";

const useCases = [
  "Dealer groups controlling part-exchange margin leakage",
  "Car supermarkets reviewing high-volume consumer acquisitions",
  "Auction vendors setting reserves before lane allocation",
  "Fleet and leasing teams deciding retail, auction or trade disposal",
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-signal-500 text-sm font-black">X</span>
            <span className="text-lg font-semibold">Xdealer</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden rounded-md px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10 sm:block">
              Log in
            </Link>
            <Link to="/signup">
              <Button className="bg-white text-ink-950 hover:bg-slate-100">Book a review</Button>
            </Link>
          </div>
        </div>
      </header>

      <section
        className="relative min-h-[92vh] overflow-hidden bg-ink-950 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/xdealer-hero.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/88 to-ink-950/35" />
        <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center px-4 pb-20 pt-28 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Xdealer</p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              The AI trading agent for UK used vehicle decisions.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              Make faster, more consistent decisions on what to buy, what to pay, what to repair and where to sell.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup">
                <Button icon={<ArrowRight className="h-4 w-4" />}>Book a margin leakage review</Button>
              </Link>
              <Link to="/app/decision-packs/latest">
                <Button variant="secondary" className="border-white/20 bg-white/10 text-white hover:bg-white/15">
                  View demo decision pack
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main>
        <section className="bg-slate-50 py-16">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            <MetricCard label="Problem" value="Fragmented decisions" helper="Offers, prep calls and disposal routes often sit across spreadsheets, DMS notes and auction memory." icon={<ShieldCheck className="h-5 w-5" />} />
            <MetricCard label="Product" value="Decision packs" helper="Xdealer turns every appraisal into a clear commercial position with risks, pricing and next actions." icon={<FileText className="h-5 w-5" />} />
            <MetricCard label="Outcome" value="Margin control" helper="Standardise appraisal judgement without removing senior buyer oversight." icon={<TrendingUp className="h-5 w-5" />} />
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-signal-600">Product</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Commercial AI inside the vehicle workflow.</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Xdealer brings VRM-first intake, appraisal evidence, CAP-style values, HPI markers, MOT advisories, prep estimates, rules and outcomes into one decision system.
              </p>
              <div className="mt-6 grid gap-3">
                {useCases.map((item) => (
                  <div key={item} className="flex gap-3 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-signal-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Card className="overflow-hidden">
              <div className="bg-ink-950 p-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-300">Decision pack preview</p>
                    <h3 className="mt-1 text-xl font-semibold">BK21 XDL · Volkswagen Golf Style DSG</h3>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-300/20">
                    Retail · 84%
                  </span>
                </div>
              </div>
              <CardBody>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Maximum offer</p>
                    <p className="mt-1 text-xl font-semibold">£14,900</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Expected margin</p>
                    <p className="mt-1 text-xl font-semibold">£2,225</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Prep exposure</p>
                    <p className="mt-1 text-xl font-semibold">£475</p>
                  </div>
                </div>
                <div className="mt-5 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  Retail is viable if the vehicle is bought inside the recommended range. Replace front tyre, complete bumper smart repair, then move to retail photography.
                </div>
              </CardBody>
            </Card>
          </div>
        </section>

        <section className="bg-ink-950 py-16 text-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            <MetricCard tone="dark" label="ROI" value="Protect offer discipline" helper="Reduce over-allowance on PX and consumer acquisition vehicles." icon={<BarChart3 className="h-5 w-5" />} />
            <MetricCard tone="dark" label="Credibility" value="Built for UK terms" helper="CAP, MOT, V5C, HPI, reserve, hammer price and prep language are first-class concepts." icon={<ShieldCheck className="h-5 w-5" />} />
            <MetricCard tone="dark" label="CTA" value="Pilot in weeks" helper="Start with mocked integrations, then connect valuation, DMS and outcome feeds." icon={<ArrowRight className="h-5 w-5" />} />
          </div>
        </section>
      </main>
    </div>
  );
}
