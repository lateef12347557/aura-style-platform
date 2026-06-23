import type { ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const NAV: Array<{
  to: "/admin" | "/admin/products" | "/admin/categories" | "/admin/orders" | "/admin/customers";
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

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (!isAdmin) navigate({ to: "/" });
  }, [loading, user, isAdmin, navigate]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking access…</p>
      </div>
    );
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen flex bg-secondary">
      <aside className="w-60 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="px-6 py-6 border-b border-sidebar-border">
          <div className="font-display tracking-[0.3em] text-sm">MDCLASSIC WEARS</div>
          <div className="editorial-eyebrow opacity-60 mt-1">Admin</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 px-3 py-2 text-sm rounded-sm transition-colors ${active ? "bg-sidebar-accent text-sidebar-primary" : "hover:bg-sidebar-accent"}`}
              >
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
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
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
    <div className="p-8 max-w-screen-2xl">
      <header className="flex items-end justify-between mb-8">
        <div>
          {eyebrow && <div className="editorial-eyebrow text-muted-foreground mb-1">{eyebrow}</div>}
          <h1 className="font-display text-3xl">{title}</h1>
        </div>
        {actions && <div>{actions}</div>}
      </header>
      {children}
    </div>
  );
}
