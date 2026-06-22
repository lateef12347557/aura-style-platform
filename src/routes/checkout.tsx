import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { StoreLayout } from "@/components/store/StoreLayout";
import { useCart, cartTotal } from "@/store/cart";
import { formatPrice } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { placeOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — ATELIER" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clear } = useCart();
  const [busy, setBusy] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postal_code: "",
    country: "United States",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  const total = cartTotal(items);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setBusy(true);
    try {
      const result = await placeOrder({
        data: {
          items: items.map((i) => ({
            product_id: i.productId,
            variant_id: i.variantId,
            quantity: i.quantity,
            unit_price: i.price,
            product_name_snapshot: i.name,
          })),
          shipping_address: form,
        },
      });
      clear();
      toast.success("Order placed");
      navigate({ to: "/order-confirmation/$id", params: { id: result.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setBusy(false);
    }
  }

  if (authed === false) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-md px-4 py-32 text-center">
          <h1 className="font-display text-3xl mb-4">Sign in to check out</h1>
          <p className="text-muted-foreground mb-6">Your bag stays with you.</p>
          <Link to="/auth" className="inline-block bg-primary text-primary-foreground px-7 py-3 text-sm uppercase tracking-wider">Sign in</Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-screen-xl px-4 md:px-8 py-16 grid lg:grid-cols-2 gap-12">
        <div>
          <div className="editorial-eyebrow text-muted-foreground mb-2">Step 1</div>
          <h1 className="font-display text-3xl mb-8">Shipping</h1>
          <form onSubmit={onSubmit} className="space-y-4">
            {([
              ["full_name", "Full name"],
              ["line1", "Address"],
              ["line2", "Apartment, suite (optional)"],
              ["city", "City"],
              ["region", "State / Region"],
              ["postal_code", "Postal code"],
              ["country", "Country"],
            ] as const).map(([k, label]) => (
              <div key={k}>
                <label className="editorial-eyebrow text-muted-foreground">{label}</label>
                <input
                  required={k !== "line2"}
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="w-full mt-1 border border-border bg-background px-3 py-2.5 focus:outline-none focus:border-accent"
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground bg-secondary px-4 py-3 mt-6">
              Payments aren't enabled yet — your order is recorded so you can track it in your account.
            </p>
            <button
              disabled={busy || items.length === 0}
              className="w-full bg-primary text-primary-foreground py-4 text-sm uppercase tracking-wider hover:bg-accent disabled:opacity-50"
            >
              {busy ? "Placing…" : "Place order"}
            </button>
          </form>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start bg-secondary p-8">
          <div className="editorial-eyebrow mb-6">Order summary</div>
          <div className="divide-y divide-border">
            {items.map((i) => (
              <div key={`${i.productId}:${i.variantId ?? ""}`} className="flex gap-3 py-3 text-sm">
                <div className="flex-1">
                  <div>{i.name}</div>
                  <div className="text-xs text-muted-foreground">{[i.size, i.color].filter(Boolean).join(" · ")} × {i.quantity}</div>
                </div>
                <div>{formatPrice(i.price * i.quantity)}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm font-medium mt-6 pt-4 border-t border-border">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}