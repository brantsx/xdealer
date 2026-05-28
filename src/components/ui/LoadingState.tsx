export function LoadingState({ label = "Loading Xdealer" }: { label?: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-signal-500" />
        {label}
      </div>
    </div>
  );
}
