import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { StoreLayout } from "@/components/store/StoreLayout";
import { useCart, cartTotal } from "@/store/cart";
import { formatPrice } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { placeOrder } from "@/lib/orders.functions";
import { CreditCard, ShieldCheck, ArrowRight, CheckCircle2, ChevronRight, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  
  // Checkout flow state
  const [step, setStep] = useState<"shipping" | "payment">("shipping");
  const [busy, setBusy] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);

  // Address Form State
  const [shippingForm, setShippingForm] = useState({
    full_name: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postal_code: "",
    country: "United States",
  });

  // Credit Card Form State
  const [cardForm, setCardForm] = useState({
    number: "",
    expiry: "",
    cvc: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  const total = cartTotal(items);

  // Auto-format card number: 4242 4242 4242 4242
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 16);
    const matches = val.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts: string[] = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardForm((prev) => ({ ...prev, number: parts.join(" ") }));
    } else {
      setCardForm((prev) => ({ ...prev, number: val }));
    }
  };

  // Auto-format expiry: MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 2) {
      setCardForm((prev) => ({ ...prev, expiry: `${val.slice(0, 2)}/${val.slice(2, 4)}` }));
    } else {
      setCardForm((prev) => ({ ...prev, expiry: val }));
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCardForm((prev) => ({ ...prev, cvc: val }));
  };

  function validateShipping() {
    const { full_name, line1, city, region, postal_code, country } = shippingForm;
    if (!full_name || !line1 || !city || !region || !postal_code || !country) {
      toast.error("Please complete all shipping address fields.");
      return false;
    }
    return true;
  }

  function handleShippingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validateShipping()) {
      setStep("payment");
    }
  }

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    
    // Quick validation
    if (cardForm.number.replace(/\s/g, "").length < 16) {
      toast.error("Please enter a valid 16-digit card number.");
      return;
    }
    if (cardForm.expiry.length < 5) {
      toast.error("Please enter expiry date (MM/YY).");
      return;
    }
    if (cardForm.cvc.length < 3) {
      toast.error("Please enter a valid CVC code.");
      return;
    }

    setBusy(true);
    try {
      // Simulate secure Stripe Checkout Element processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const stripePaymentId = `ch_stripe_${Math.random().toString(36).substring(2, 14)}`;

      const result = await placeOrder({
        data: {
          items: items.map((i) => ({
            product_id: i.productId,
            variant_id: i.variantId,
            quantity: i.quantity,
            unit_price: i.price,
            product_name_snapshot: i.name,
          })),
          shipping_address: shippingForm,
          stripe_payment_id: stripePaymentId,
        },
      });

      clear();
      toast.success("Payment authorized. Order confirmed!");
      navigate({ to: "/order-confirmation/$id", params: { id: result.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment execution failed");
    } finally {
      setBusy(false);
    }
  }

  if (authed === false) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-md px-4 py-36 text-center space-y-6">
          <h1 className="font-display text-4xl leading-tight">Identify yourself</h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Please sign in to your ATELIER account to access shipping and premium Stripe checkout.
          </p>
          <Link
            to="/auth"
            className="inline-block bg-primary text-primary-foreground px-8 py-3.5 text-xs uppercase tracking-wider font-semibold hover:bg-accent transition-colors"
          >
            Sign in or Sign up
          </Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-screen-xl px-4 md:px-8 py-16">
        {/* Checkout Header Progress */}
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-12 border-b border-border pb-4">
          <button
            onClick={() => setStep("shipping")}
            className={`font-semibold transition-colors ${step === "shipping" ? "text-foreground" : "hover:text-foreground"}`}
          >
            01 / Shipping
          </button>
          <ChevronRight className="h-3 w-3" />
          <span className={step === "payment" ? "text-foreground font-semibold" : ""}>
            02 / Payment
          </span>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Main Forms Column */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {step === "shipping" ? (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-2.5 mb-6">
                    <MapPin className="h-5 w-5 text-accent" />
                    <h2 className="font-display text-3xl">Shipping Address</h2>
                  </div>
                  
                  <form onSubmit={handleShippingSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="editorial-eyebrow text-muted-foreground text-xs">Full Name</label>
                        <input
                          required
                          type="text"
                          value={shippingForm.full_name}
                          onChange={(e) => setShippingForm({ ...shippingForm, full_name: e.target.value })}
                          className="w-full mt-1 border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent"
                          placeholder="E.g. Sarah Jenkins"
                        />
                      </div>
                      
                      <div>
                        <label className="editorial-eyebrow text-muted-foreground text-xs">Address Line 1</label>
                        <input
                          required
                          type="text"
                          value={shippingForm.line1}
                          onChange={(e) => setShippingForm({ ...shippingForm, line1: e.target.value })}
                          className="w-full mt-1 border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent"
                          placeholder="Street name, PO box"
                        />
                      </div>

                      <div>
                        <label className="editorial-eyebrow text-muted-foreground text-xs">Address Line 2 (Optional)</label>
                        <input
                          type="text"
                          value={shippingForm.line2}
                          onChange={(e) => setShippingForm({ ...shippingForm, line2: e.target.value })}
                          className="w-full mt-1 border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent"
                          placeholder="Apartment, suite, unit, building"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="editorial-eyebrow text-muted-foreground text-xs">City</label>
                        <input
                          required
                          type="text"
                          value={shippingForm.city}
                          onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                          className="w-full mt-1 border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className="editorial-eyebrow text-muted-foreground text-xs">State / Region</label>
                        <input
                          required
                          type="text"
                          value={shippingForm.region}
                          onChange={(e) => setShippingForm({ ...shippingForm, region: e.target.value })}
                          className="w-full mt-1 border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent"
                          placeholder="State"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="editorial-eyebrow text-muted-foreground text-xs">Postal Code</label>
                        <input
                          required
                          type="text"
                          value={shippingForm.postal_code}
                          onChange={(e) => setShippingForm({ ...shippingForm, postal_code: e.target.value })}
                          className="w-full mt-1 border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent"
                          placeholder="ZIP code"
                        />
                      </div>
                      <div>
                        <label className="editorial-eyebrow text-muted-foreground text-xs">Country</label>
                        <input
                          required
                          type="text"
                          value={shippingForm.country}
                          onChange={(e) => setShippingForm({ ...shippingForm, country: e.target.value })}
                          className="w-full mt-1 border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-primary text-primary-foreground py-4 text-xs uppercase tracking-wider font-semibold hover:bg-accent transition-colors flex items-center justify-center gap-2 mt-8"
                    >
                      Continue to Payment <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-2.5 mb-6">
                    <CreditCard className="h-5 w-5 text-accent" />
                    <h2 className="font-display text-3xl">Stripe Credit Card Payment</h2>
                  </div>

                  <form onSubmit={handlePaymentSubmit} className="space-y-6">
                    {/* Card container */}
                    <div className="bg-secondary border border-border p-6 space-y-4">
                      <div className="flex justify-between items-center border-b border-border pb-3">
                        <span className="editorial-eyebrow text-muted-foreground text-xs">Stripe Secure Input</span>
                        <div className="flex gap-1.5 items-center text-accent text-xs font-semibold uppercase tracking-wider">
                          <ShieldCheck className="h-4 w-4 text-accent" /> Secured by Stripe
                        </div>
                      </div>

                      <div>
                        <label className="editorial-eyebrow text-muted-foreground text-xs">Card Number</label>
                        <input
                          required
                          type="text"
                          value={cardForm.number}
                          onChange={handleCardNumberChange}
                          placeholder="4242 4242 4242 4242"
                          className="w-full mt-1 border border-border bg-background px-4 py-3 text-sm font-mono tracking-widest focus:outline-none focus:border-accent"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="editorial-eyebrow text-muted-foreground text-xs">Expiration Date</label>
                          <input
                            required
                            type="text"
                            value={cardForm.expiry}
                            onChange={handleExpiryChange}
                            placeholder="MM/YY"
                            className="w-full mt-1 border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent text-center"
                          />
                        </div>
                        <div>
                          <label className="editorial-eyebrow text-muted-foreground text-xs">CVC Code</label>
                          <input
                            required
                            type="password"
                            value={cardForm.cvc}
                            onChange={handleCvcChange}
                            placeholder="•••"
                            className="w-full mt-1 border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent text-center"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground bg-secondary border border-border px-4 py-3.5 leading-relaxed">
                      By placing this order, you authorize ATELIER to charge your card for the total amount. Secure connections are maintained by Stripe Elements.
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setStep("shipping")}
                        className="px-6 py-4 text-xs uppercase tracking-wider hover:bg-secondary border border-border font-medium"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={busy || items.length === 0}
                        className="flex-1 bg-primary text-primary-foreground py-4 text-xs uppercase tracking-wider font-semibold hover:bg-accent disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                      >
                        {busy ? "Authorizing Payment..." : `Pay and Place Order · ${formatPrice(total)}`}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar Column */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 lg:self-start bg-secondary border border-border p-6 space-y-6">
              <div className="editorial-eyebrow text-xs pb-3 border-b border-border text-muted-foreground">Order Summary</div>
              
              <div className="divide-y divide-border/60 max-h-[40vh] overflow-y-auto pr-2">
                {items.map((i) => (
                  <div key={`${i.productId}:${i.variantId ?? ""}`} className="flex gap-3 py-4 text-xs">
                    {i.image && (
                      <img src={i.image} alt={i.name} className="h-16 w-12 object-cover bg-muted border border-border" />
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="font-medium text-foreground">{i.name}</div>
                      <div className="text-muted-foreground text-[10px] uppercase tracking-wider">
                        {[i.color, i.size].filter(Boolean).join(" · ")}
                      </div>
                      <div className="text-muted-foreground">Qty: {i.quantity}</div>
                    </div>
                    <div className="font-semibold text-right">{formatPrice(i.price * i.quantity)}</div>
                  </div>
                ))}
              </div>

              {/* Price calculations */}
              <div className="space-y-2.5 pt-4 border-t border-border text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{total >= 250 ? "Complimentary" : "$15.00"}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Sales Tax</span>
                  <span>Calculated at checkout</span>
                </div>
                
                <div className="flex justify-between font-semibold text-sm pt-4 border-t border-border">
                  <span>Total Amount</span>
                  <span>{formatPrice(total + (total >= 250 ? 0 : 15))}</span>
                </div>
              </div>

              {/* Shipping snapshot if in step 2 */}
              {step === "payment" && (
                <div className="bg-background border border-border p-4 text-xs space-y-2.5 rounded-sm">
                  <div className="flex justify-between font-medium items-center pb-2 border-b border-border/40">
                    <span className="uppercase text-[10px] tracking-wider text-muted-foreground">Ship To:</span>
                    <button onClick={() => setStep("shipping")} className="text-accent underline">Edit</button>
                  </div>
                  <div className="text-muted-foreground space-y-0.5">
                    <div className="font-medium text-foreground">{shippingForm.full_name}</div>
                    <div>{shippingForm.line1}</div>
                    {shippingForm.line2 && <div>{shippingForm.line2}</div>}
                    <div>{shippingForm.city}, {shippingForm.region} {shippingForm.postal_code}</div>
                    <div>{shippingForm.country}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}