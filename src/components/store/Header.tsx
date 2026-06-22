import { Link } from "@tanstack/react-router";
import { ShoppingBag, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart, cartCount } from "@/store/cart";
import { useUI } from "@/store/ui";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const items = useCart((s) => s.items);
  const setCartOpen = useUI((s) => s.setCartOpen);
  const count = cartCount(items);
  const { user, isAdmin } = useAuth();
  const [mobile, setMobile] = useState(false);

  const navLinks = [
    { to: "/shop", label: "Shop" },
    { to: "/shop/men", label: "Men" },
    { to: "/shop/women", label: "Women" },
  ] as const;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
        <button
          onClick={() => setMobile((s) => !s)}
          className="md:hidden p-2 -ml-2"
          aria-label="Menu"
        >
          {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link to="/" className="font-display text-xl tracking-[0.3em] font-medium">
          ATELIER
        </Link>

        <nav className="hidden md:flex items-center gap-10 text-sm">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="hover:text-accent transition-colors"
              activeProps={{ className: "text-accent" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden md:inline-block text-xs editorial-eyebrow text-accent mr-3 hover:underline"
            >
              Admin
            </Link>
          )}
          <Link
            to={user ? "/account" : "/auth"}
            className="p-2 hover:text-accent"
            aria-label="Account"
          >
            <User className="h-5 w-5" />
          </Link>
          <button
            onClick={() => setCartOpen(true)}
            className="p-2 relative hover:text-accent"
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent text-[10px] font-medium text-accent-foreground flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
      {mobile && (
        <nav className="md:hidden border-t border-border/60 bg-background px-4 py-4 flex flex-col gap-3">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm py-1"
              onClick={() => setMobile(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}