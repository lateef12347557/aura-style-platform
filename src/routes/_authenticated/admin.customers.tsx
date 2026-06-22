import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminPage } from "@/components/admin/AdminShell";
import { listCustomers } from "@/lib/admin.functions";
import { formatPrice, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: CustomersAdmin,
});

function CustomersAdmin() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-customers"], queryFn: () => listCustomers() });

  return (
    <AdminPage title="Customers" eyebrow="People">
      {isLoading ? <p>Loading…</p> : (
        <div className="bg-card border border-border">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b border-border">
              <tr><th className="text-left p-3">Name</th><th className="text-left">Joined</th><th className="text-right">Orders</th><th className="text-right">Total spent</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data ?? []).map((c) => (
                <tr key={c.id}>
                  <td className="p-3">{c.full_name ?? "—"}</td>
                  <td>{formatDate(c.created_at)}</td>
                  <td className="text-right">{c.order_count}</td>
                  <td className="text-right">{formatPrice(c.total_spent)}</td>
                </tr>
              ))}
              {(data ?? []).length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No customers yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </AdminPage>
  );
}