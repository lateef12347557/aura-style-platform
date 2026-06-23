import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminPage } from "@/components/admin/AdminShell";
import { getAdminOrder, updateOrderStatus } from "@/lib/orders.functions";
import { formatPrice, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/orders/$id")({
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => getAdminOrder({ data: { id } }),
  });

  async function changeStatus(status: string) {
    try {
      await updateOrderStatus({
        data: {
          id,
          status: status as "pending" | "processing" | "shipped" | "delivered" | "cancelled",
        },
      });
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-order", id] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  if (isLoading || !data)
    return (
      <AdminPage title="Order" eyebrow="Operations">
        <p>Loading…</p>
      </AdminPage>
    );

  const o = data as unknown as {
    id: string;
    status: string;
    total_amount: number;
    created_at: string;
    shipping_address: {
      full_name: string;
      line1: string;
      line2?: string;
      city: string;
      region: string;
      postal_code: string;
      country: string;
    } | null;
    order_items: Array<{
      id: string;
      quantity: number;
      unit_price: number;
      product_name_snapshot: string | null;
      product?: { name: string } | null;
    }>;
  };

  return (
    <AdminPage
      title={`Order #${o.id.slice(0, 8).toUpperCase()}`}
      eyebrow={formatDate(o.created_at)}
      actions={
        <select
          value={o.status}
          onChange={(e) => changeStatus(e.target.value)}
          className="border border-border bg-background px-3 py-2 text-sm"
        >
          {["pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      }
    >
      <Link to="/admin/orders" className="text-xs underline">
        ← All orders
      </Link>
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-card border border-border p-6">
          <div className="editorial-eyebrow mb-4">Items</div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {o.order_items.map((it) => (
                <tr key={it.id}>
                  <td className="py-3">{it.product?.name ?? it.product_name_snapshot}</td>
                  <td className="text-center">× {it.quantity}</td>
                  <td className="text-right">{formatPrice(it.unit_price * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between font-medium mt-4 pt-4 border-t border-border">
            <span>Total</span>
            <span>{formatPrice(o.total_amount)}</span>
          </div>
        </div>
        <div className="bg-card border border-border p-6 space-y-4">
          <div>
            <div className="editorial-eyebrow mb-2">Shipping</div>
            {o.shipping_address ? (
              <div className="text-sm">
                <div>{o.shipping_address.full_name}</div>
                <div>{o.shipping_address.line1}</div>
                {o.shipping_address.line2 && <div>{o.shipping_address.line2}</div>}
                <div>
                  {o.shipping_address.city}, {o.shipping_address.region}{" "}
                  {o.shipping_address.postal_code}
                </div>
                <div>{o.shipping_address.country}</div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">—</div>
            )}
          </div>
        </div>
      </div>
    </AdminPage>
  );
}
