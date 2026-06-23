import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getAdminOverview, seedCatalogFromAdmin } from "@/lib/admin.functions";
import { AdminPage } from "@/components/admin/AdminShell";
import { formatPrice, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const qc = useQueryClient();
  const [seeding, setSeeding] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => getAdminOverview(),
  });

  async function handleSync() {
    if (
      !confirm(
        "Are you sure you want to clean and seed the database? This will clear old categories and products and load the clean MDCLASSIC WEARS categories (Male & Female) and products.",
      )
    )
      return;
    setSeeding(true);
    try {
      await seedCatalogFromAdmin();
      toast.success("Database seeded and synchronized successfully!");
      qc.invalidateQueries();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Synchronization failed");
    } finally {
      setSeeding(false);
    }
  }

  if (isLoading || !data) {
    return (
      <AdminPage title="Overview" eyebrow="Dashboard">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="Overview"
      eyebrow="Dashboard"
      actions={
        <button
          onClick={handleSync}
          disabled={seeding}
          className="bg-primary text-primary-foreground px-4 py-2 text-sm uppercase tracking-wider disabled:opacity-50 hover:bg-accent font-medium transition-colors cursor-pointer"
        >
          {seeding ? "Syncing..." : "Sync Database Catalog"}
        </button>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Revenue" value={formatPrice(data.totalRevenue)} />
        <StatCard label="Orders" value={String(data.totalOrders)} />
        <StatCard label="Active products" value={String(data.activeProducts)} />
        <StatCard label="Customers" value={String(data.newCustomers)} />
      </div>

      <div className="bg-card border border-border p-6 mb-8">
        <div className="editorial-eyebrow text-muted-foreground mb-4">Revenue · last 30 days</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.revenueByDay}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10 }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => formatPrice(Number(v))} />
              <Area dataKey="revenue" stroke="var(--accent)" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border p-6">
        <div className="editorial-eyebrow text-muted-foreground mb-4">Recent orders</div>
        {data.recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left py-2">Order</th>
                <th className="text-left">Customer</th>
                <th className="text-left">Date</th>
                <th className="text-left">Status</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-muted/30">
                  <td className="py-3 font-medium">
                    <Link
                      to="/admin/orders/$id"
                      params={{ id: o.id }}
                      className="hover:text-accent"
                    >
                      #{o.id.slice(0, 8).toUpperCase()}
                    </Link>
                  </td>
                  <td>
                    {o.shipping_address &&
                    typeof o.shipping_address === "object" &&
                    "full_name" in o.shipping_address
                      ? ((o.shipping_address as { full_name?: string }).full_name ?? "—")
                      : "—"}
                  </td>
                  <td>{formatDate(o.created_at)}</td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="text-right font-medium">{formatPrice(o.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminPage>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border p-5">
      <div className="editorial-eyebrow text-muted-foreground">{label}</div>
      <div className="font-display text-2xl mt-2">{value}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    pending: "bg-muted text-foreground",
    processing: "bg-accent/15 text-accent",
    shipped: "bg-chart-3/20 text-foreground",
    delivered: "bg-accent text-accent-foreground",
    cancelled: "bg-destructive/15 text-destructive",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs uppercase tracking-wider ${cls[status] ?? "bg-muted"}`}
    >
      {status}
    </span>
  );
}
