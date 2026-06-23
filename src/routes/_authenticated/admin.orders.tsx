import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { listAdminOrders, bulkUpdateOrderStatus } from "@/lib/orders.functions";
import { StatusBadge } from "./admin.index";
import { formatPrice, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: OrdersAdmin,
});

function OrdersAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => listAdminOrders(),
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      const name =
        o.shipping_address &&
        typeof o.shipping_address === "object" &&
        "full_name" in o.shipping_address
          ? String((o.shipping_address as { full_name?: string }).full_name ?? "")
          : "";
      return o.id.toLowerCase().includes(q) || name.toLowerCase().includes(q);
    });
  }, [data, statusFilter, search]);

  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;
  const toggleAll = () =>
    setSelectedIds(allSelected ? [] : filtered.map((o) => o.id));
  const toggleRow = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  async function bulk(status: "pending" | "processing" | "shipped" | "delivered" | "cancelled") {
    if (!selectedIds.length) return;
    try {
      await bulkUpdateOrderStatus({ data: { ids: selectedIds, status } });
      toast.success(`Updated ${selectedIds.length} orders → ${status}`);
      setSelectedIds([]);
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <AdminPage title="Orders" eyebrow="Operations">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search by order ID or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-border bg-background pl-9 pr-3 py-2 text-sm w-full focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs uppercase tracking-wider px-3 py-1.5 border transition-colors ${statusFilter === s ? "border-accent bg-accent text-accent-foreground" : "border-border hover:border-accent/60"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {selectedIds.length > 0 && (
          <div className="bg-secondary border border-border px-3 py-1.5 flex items-center gap-2 text-xs animate-fade-in">
            <span className="text-muted-foreground font-semibold">
              {selectedIds.length} selected →
            </span>
            {(["processing", "shipped", "delivered", "cancelled"] as const).map((s) => (
              <button
                key={s}
                onClick={() => bulk(s)}
                className="uppercase tracking-wider hover:text-accent font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground animate-pulse">Loading orders…</p>
      ) : (
        <div className="bg-card border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b border-border bg-muted/20">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                </th>
                <th className="text-left p-3">Order</th>
                <th className="text-left">Customer</th>
                <th className="text-left">Date</th>
                <th className="text-left">Status</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((o) => {
                const sel = selectedIds.includes(o.id);
                return (
                <tr key={o.id} className={`hover:bg-muted/30 transition-colors ${sel ? "bg-muted/20" : ""}`}>
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={sel}
                      onChange={() => toggleRow(o.id)}
                    />
                  </td>
                  <td className="p-3 font-medium">
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
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No orders.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminPage>
  );
}
