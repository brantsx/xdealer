import { Database, ShieldCheck, UserRound } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { supabaseConfig } from "../lib/supabase/client";

export function SettingsPage() {
  const { organisation, profiles } = useData();
  const { demoMode } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Organisation, tenant users, roles and platform readiness for Supabase auth, database, storage and edge functions."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Organisation" eyebrow="Tenant" action={<ShieldCheck className="h-5 w-5 text-signal-600" />} />
          <CardBody className="space-y-4">
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Trading name</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{organisation.tradingName}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Legal organisation</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{organisation.name}</p>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              All tenant-owned tables include <code className="rounded bg-slate-100 px-1.5 py-0.5">organisation_id</code> and RLS policies in the Supabase migration.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Supabase status" eyebrow="Runtime" action={<Database className="h-5 w-5 text-slate-400" />} />
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-md bg-slate-50 p-4">
              <div>
                <p className="font-semibold text-slate-950">Auth, database, storage and edge functions</p>
                <p className="mt-1 text-sm text-slate-600">
                  {supabaseConfig.enabled ? "Configured through Vite environment variables." : "Running with local mock data until Supabase variables are set."}
                </p>
              </div>
              <Badge className={demoMode ? "bg-sky-50 text-sky-700 ring-sky-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"}>
                {demoMode ? "Demo mode" : "Connected"}
              </Badge>
            </div>
            <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-950">Environment variables</p>
              <p className="mt-2">Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to use a live Supabase project.</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Users and roles" eyebrow="Access model" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Site/team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-white">
                        <UserRound className="h-4 w-4" />
                      </span>
                      <span className="font-semibold text-slate-950">{profile.fullName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{profile.email}</td>
                  <td className="px-5 py-4"><Badge className="bg-slate-50 text-slate-700 ring-slate-200">{profile.role}</Badge></td>
                  <td className="px-5 py-4 text-slate-600">{profile.siteTeam}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
