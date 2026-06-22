import { Link } from "@tanstack/react-router";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useUI } from "@/store/ui";
import { useCart, cartTotal } from "@/store/cart";
import { formatPrice } from "@/lib/format";

export function CartDrawer() {
  const { cartOpen, setCartOpen } = useUI();
  const { items, remove, setQty } = useCart();
  const total = cartTotal(items);

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-50 bg-black/40"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background border-l border-border flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="editorial-eyebrow">Your bag · {items.length}</h2>
              <button onClick={() => setCartOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-border">
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground py-12 text-center">
                  Your bag is empty.
                </p>
              )}
              {items.map((i) => (
                <div key={`${i.productId}:${i.variantId ?? ""}`} className="flex gap-4 py-4">
                  <div className="h-24 w-20 bg-muted overflow-hidden flex-shrink-0">
                    {i.image && (
                      <img src={i.image} alt={i.name} className="h-full w-full object-cover" loading="lazy" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to="/product/$slug"
                      params={{ slug: i.slug }}
                      onClick={() => setCartOpen(false)}
                      className="text-sm font-medium hover:text-accent"
                    >
                      {i.name}
                    </Link>
                    <div className="text-xs text-muted-foreground mt-1">
                      {[i.size, i.color].filter(Boolean).join(" · ")}
                    </div>
                    <div className="text-sm mt-2">{formatPrice(i.price)}</div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center border border-border">
                        <button
                          onClick={() => setQty(i.productId, i.variantId, i.quantity - 1)}
                          className="p-1.5 hover:bg-muted"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-3 text-sm">{i.quantity}</span>
                        <button
                          onClick={() => setQty(i.productId, i.variantId, i.quantity + 1)}
                          className="p-1.5 hover:bg-muted"
                          aria-label="Increase"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => remove(i.productId, i.variantId)}
                        className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border px-6 py-5 space-y-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Shipping calculated at checkout.</p>
              <Link
                to="/checkout"
                onClick={() => setCartOpen(false)}
                className="block w-full text-center bg-primary text-primary-foreground py-3 text-sm tracking-wider uppercase hover:bg-accent transition-colors"
              >
                Checkout
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}