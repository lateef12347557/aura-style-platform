import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminPage } from "@/components/admin/AdminShell";
import { getAdminCustomer } from "@/lib/admin.functions";
import { formatPrice, formatDate } from "@/lib/format";
import { StatusBadge } from "./admin.index";
import { User, Mail, Calendar, TrendingUp, ShoppingBag, DollarSign } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/customers/$id")({
  component: CustomerDetail,
});

function CustomerDetail() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-customer", id],
    queryFn: () => getAdminCustomer({ data: { id } }),
  });

  if (isLoading) {
    return (
      <AdminPage title="Customer Profile" eyebrow="Customer Details">
        <div className="space-y-6">
          <Link to="/admin/customers" className="text-xs underline">← All customers</Link>
          <div className="bg-card border border-border p-6 animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
          </div>
        </div>
      </AdminPage>
    );
  }

  if (error || !data) {
    return (
      <AdminPage title="Error" eyebrow="Customer Details">
        <div className="space-y-4">
          <Link to="/admin/customers" className="text-xs underline">← All customers</Link>
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load customer profile"}
          </p>
        </div>
      </AdminPage>
    );
  }

  const { profile, orders, metrics } = data;
  const avgOrderValue = metrics.orderCount > 0 ? metrics.totalSpent / metrics.orderCount : 0;

  return (
    <AdminPage title={profile.full_name ?? "Customer Profile"} eyebrow="Customer Details">
      <div className="space-y-6">
        <Link to="/admin/customers" className="text-xs underline">← All customers</Link>

        {/* Profile Card */}
        <div className="bg-card border border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-muted border border-border flex items-center justify-center rounded-sm overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name ?? ""} className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <h2 className="font-display text-xl mb-1">{profile.full_name ?? "Anonymous Customer"}</h2>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{profile.email ?? "No email provided"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Joined {formatDate(profile.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border p-5 flex items-center justify-between">
            <div>
              <div className="editorial-eyebrow text-muted-foreground text-xs">Total spent</div>
              <div className="font-display text-2xl mt-1.5">{formatPrice(metrics.totalSpent)}</div>
            </div>
            <div className="p-3 bg-secondary rounded-sm">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="bg-card border border-border p-5 flex items-center justify-between">
            <div>
              <div className="editorial-eyebrow text-muted-foreground text-xs">Total orders</div>
              <div className="font-display text-2xl mt-1.5">{metrics.orderCount}</div>
            </div>
            <div className="p-3 bg-secondary rounded-sm">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="bg-card border border-border p-5 flex items-center justify-between">
            <div>
              <div className="editorial-eyebrow text-muted-foreground text-xs">Average order value</div>
              <div className="font-display text-2xl mt-1.5">{formatPrice(avgOrderValue)}</div>
            </div>
            <div className="p-3 bg-secondary rounded-sm">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="bg-card border border-border p-6">
          <div className="editorial-eyebrow text-muted-foreground mb-4">Order History</div>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No orders from this customer yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="text-left py-3">Order</th>
                    <th className="text-left">Date</th>
                    <th className="text-left">Status</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-muted/30">
                      <td className="py-3 font-medium">
                        <Link to="/admin/orders/$id" params={{ id: o.id }} className="hover:text-accent underline decoration-dotted">
                          #{o.id.slice(0, 8).toUpperCase()}
                        </Link>
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
            </div>
          )}
        </div>
      </div>
    </AdminPage>
  );
}
