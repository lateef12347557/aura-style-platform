import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { StoreLayout } from "@/components/store/StoreLayout";
import { supabase } from "@/integrations/supabase/client";
import { listMyOrders } from "@/lib/orders.functions";
import { formatPrice, formatDate } from "@/lib/format";
import { promoteSelfToAdmin } from "@/lib/admin.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My account — ATELIER" }, { name: "robots", content: "noindex" }] }),
  component: Account,
});

function Account() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [fullName, setFullName] = useState("");

  const orders = useQuery({ queryKey: ["my-orders"], queryFn: () => listMyOrders() });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setFullName(data?.full_name ?? ""));
  }, [user?.id]);

  async function saveProfile() {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Saved");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  async function becomeAdmin() {
    try {
      await promoteSelfToAdmin();
      toast.success("You are now admin. Reloading…");
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="editorial-eyebrow text-muted-foreground mb-2">Account</div>
        <h1 className="font-display text-4xl mb-10">Hello{fullName ? `, ${fullName.split(" ")[0]}` : ""}</h1>

        <section className="mb-16">
          <h2 className="editorial-eyebrow mb-4">Profile</h2>
          <div className="space-y-3 max-w-md">
            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <div className="text-sm">{user?.email}</div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full mt-1 border border-border bg-background px-3 py-2"
              />
            </div>
            <button onClick={saveProfile} className="bg-primary text-primary-foreground px-5 py-2 text-sm uppercase tracking-wider">Save</button>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="editorial-eyebrow mb-4">Orders</h2>
          {orders.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (orders.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet. <Link to="/shop" className="underline">Start shopping →</Link></p>
          ) : (
            <div className="divide-y divide-border border-y border-border">
              {orders.data!.map((o) => (
                <div key={o.id} className="py-4 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">#{o.id.slice(0, 8).toUpperCase()}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(o.created_at)} · {o.status}</div>
                  </div>
                  <div className="font-medium">{formatPrice(o.total_amount)}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex items-center gap-4">
          {!isAdmin && (
            <button onClick={becomeAdmin} className="text-xs underline text-muted-foreground">
              Claim admin (first user only)
            </button>
          )}
          {isAdmin && <Link to="/admin" className="text-xs underline text-accent">Open admin →</Link>}
          <button onClick={signOut} className="ml-auto text-xs underline text-muted-foreground">Sign out</button>
        </div>
      </div>
    </StoreLayout>
  );
}