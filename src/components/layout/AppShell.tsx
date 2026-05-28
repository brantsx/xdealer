import {
  BarChart3,
  Bell,
  Car,
  ClipboardCheck,
  FileText,
  Gauge,
  Home,
  Layers3,
  LogOut,
  Menu,
  PlugZap,
  Plus,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { cx } from "../../lib/utils/format";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { LoadingState } from "../ui/LoadingState";

const navItems = [
  { label: "Dashboard", path: "/app/dashboard", icon: Home },
  { label: "Vehicle Inbox", path: "/app/vehicles", icon: Car },
  { label: "New Vehicle", path: "/app/vehicles/new", icon: Plus },
  { label: "Batch Review", path: "/app/batch-review", icon: Layers3 },
  { label: "Decision Packs", path: "/app/decision-packs", icon: FileText },
  { label: "Rules & Strategy", path: "/app/rules", icon: SlidersHorizontal },
  { label: "Outcomes", path: "/app/outcomes", icon: BarChart3 },
  { label: "Integrations", path: "/app/integrations", icon: PlugZap },
  { label: "Settings", path: "/app/settings", icon: Settings },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, signOut, demoMode } = useAuth();
  const { organisation } = useData();
  const navigate = useNavigate();

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col bg-ink-950 text-white">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-signal-500 text-sm font-black text-white">
          X
        </div>
        <div>
          <p className="text-base font-semibold leading-tight">Xdealer</p>
          <p className="text-xs text-slate-400">UK vehicle decisions</p>
        </div>
      </div>

      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-sm font-semibold">{organisation.tradingName}</p>
        <div className="mt-2 flex items-center gap-2">
          <Badge className="bg-white/10 text-slate-200 ring-white/15">{profile?.role ?? "User"}</Badge>
          {demoMode ? <Badge className="bg-signal-500/15 text-emerald-200 ring-signal-500/25">Demo mode</Badge> : null}
        </div>
      </div>

      <nav className="app-scrollbar flex-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                cx(
                  "mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-white text-ink-950"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:bg-white/10 hover:text-white"
          icon={<LogOut className="h-4 w-4" />}
          onClick={() => {
            void signOut().then(() => navigate("/"));
          }}
        >
          Sign out
        </Button>
      </div>
    </aside>
  );
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile } = useAuth();
  const { metrics, isLoading, dataError } = useData();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex">
        <Sidebar />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 bg-slate-950/60"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
            <button
              type="button"
              className="absolute left-72 top-4 rounded-md bg-white p-2 text-slate-700 shadow"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-2 text-sm text-slate-600 md:flex">
              <Gauge className="h-4 w-4 text-signal-600" />
              <span>{metrics.vehiclesAnalysedThisMonth} vehicles analysed this month</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 md:flex">
              <ShieldCheck className="h-4 w-4" />
              RLS-ready tenant model
            </div>
            <button
              type="button"
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
              aria-label="View notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-sm font-semibold text-white">
              {profile?.fullName
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </div>
          </div>
        </header>
        <main className="app-scrollbar min-h-[calc(100vh-4rem)] overflow-x-hidden px-4 py-6 lg:px-8">
          {dataError ? (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {dataError}
            </div>
          ) : null}
          {isLoading ? <LoadingState label="Loading tenant workspace" /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}
