import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminPage } from "@/components/admin/AdminShell";
import { listAdminOrders } from "@/lib/orders.functions";
import { StatusBadge } from "./admin.index";
import { formatPrice, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: OrdersAdmin,
});

function OrdersAdmin() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-orders"], queryFn: () => listAdminOrders() });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const filtered = (data ?? []).filter((o) => statusFilter === "all" || o.status === statusFilter);

  return (
    <AdminPage title="Orders" eyebrow="Operations">
      <div className="mb-4 flex gap-2">
        {["all","pending","processing","shipped","delivered","cancelled"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`text-xs uppercase tracking-wider px-3 py-1.5 border ${statusFilter === s ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{s}</button>
        ))}
      </div>
      {isLoading ? <p>Loading…</p> : (
        <div className="bg-card border border-border">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b border-border">
              <tr><th className="text-left p-3">Order</th><th className="text-left">Date</th><th className="text-left">Status</th><th className="text-right">Total</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td className="p-3"><Link to="/admin/orders/$id" params={{ id: o.id }} className="hover:text-accent">#{o.id.slice(0,8).toUpperCase()}</Link></td>
                  <td>{formatDate(o.created_at)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="text-right">{formatPrice(o.total_amount)}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No orders.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </AdminPage>
  );
}