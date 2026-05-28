import { CalendarClock, CheckCircle2, KeyRound, PlugZap, Settings } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { useData } from "../context/DataContext";
import { formatDate } from "../lib/utils/format";
import type { IntegrationStatus } from "../types";

function statusClass(status: IntegrationStatus): string {
  const map: Record<IntegrationStatus, string> = {
    Mocked: "bg-sky-50 text-sky-700 ring-sky-200",
    Planned: "bg-slate-50 text-slate-700 ring-slate-200",
    Connected: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };
  return map[status];
}

export function IntegrationsPage() {
  const { integrations } = useData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Adapter-ready integration catalogue. Paid live services are intentionally mocked or planned for the MVP."
      />

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardHeader
              title={integration.name}
              eyebrow={integration.category}
              action={<Badge className={statusClass(integration.status)}>{integration.status}</Badge>}
            />
            <CardBody className="space-y-5">
              <p className="text-sm leading-6 text-slate-600">{integration.description}</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm text-slate-700">
                  <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="font-semibold text-slate-950">Required credentials</p>
                    <p className="mt-1">{integration.requiredCredentials.join(", ")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-700">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="font-semibold text-slate-950">Last sync</p>
                    <p className="mt-1">{integration.lastSync ? formatDate(integration.lastSync) : "Not connected"}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" icon={<Settings className="h-4 w-4" />} disabled={integration.status === "Planned"}>
                  Configure
                </Button>
                {integration.status === "Mocked" ? (
                  <span className="inline-flex items-center gap-2 rounded-md bg-slate-50 px-3 text-sm font-medium text-slate-600">
                    <PlugZap className="h-4 w-4" />
                    Mock adapter active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-md bg-slate-50 px-3 text-sm font-medium text-slate-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Roadmapped
                  </span>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
