import type { ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Layers,
  ArrowLeft,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const NAV: Array<{
  to:
    | "/admin"
    | "/admin/products"
    | "/admin/categories"
    | "/admin/orders"
    | "/admin/customers";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}> = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/customers", label: "Customers", icon: Users },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { isAdmin, loading, user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (!isAdmin) navigate({ to: "/" });
  }, [loading, user, isAdmin, navigate]);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p className="editorial-eyebrow text-muted-foreground">Checking access</p>
        </div>
      </div>
    );
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const sidebarContent = (
    <>
        <div className="px-6 py-6 border-b border-sidebar-border">
          <div className="font-display tracking-[0.3em] text-sm gold-gradient-text">MDCLASSIC WEARS</div>
          <div className="editorial-eyebrow opacity-60 mt-1">Admin Console</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`relative flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition-all ${active ? "bg-sidebar-accent text-sidebar-primary" : "hover:bg-sidebar-accent hover:translate-x-0.5"}`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-sidebar-primary" />
                )}
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 text-xs opacity-70 hover:opacity-100"
          >
            <ArrowLeft className="h-3 w-3" /> Back to storefront
          </Link>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs opacity-70 hover:opacity-100"
          >
            <LogOut className="h-3 w-3" /> Sign out
          </button>
        </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-72 flex-col shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border sticky top-0">
        <div className="flex h-full flex-col justify-between">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-sidebar text-sidebar-foreground flex flex-col z-50 md:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-sidebar-foreground/60 hover:text-sidebar-foreground"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-sidebar text-sidebar-foreground sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="p-2 -ml-2"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="font-display tracking-[0.25em] text-xs gold-gradient-text">
            MDCLASSIC
          </div>
          <div className="w-9" />
        </div>
        {children}
      </div>
    </div>
  );
}

export function AdminPage({
  title,
  eyebrow,
  children,
  actions,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl"
    >
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 lg:mb-8">
        <div>
          {eyebrow && (
            <div className="editorial-eyebrow text-accent mb-1">{eyebrow}</div>
          )}
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl">{title}</h1>
          <div className="gold-hairline w-24 mt-2" />
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </header>
      {children}
    </motion.div>
  );
}
