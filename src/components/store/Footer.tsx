import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-screen-2xl px-4 md:px-8 py-16 grid gap-12 md:grid-cols-4">
        <div>
          <div className="font-display text-xl tracking-[0.3em]">ATELIER</div>
          <p className="mt-4 text-sm opacity-70 max-w-xs">
            Editorial fashion. Hand-finished shoes and ready-to-wear, made in small batches.
          </p>
        </div>
        <div>
          <div className="editorial-eyebrow mb-4 opacity-60">Shop</div>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/shop/$gender" params={{ gender: "men" }}>
                Men
              </Link>
            </li>
            <li>
              <Link to="/shop/$gender" params={{ gender: "women" }}>
                Women
              </Link>
            </li>
            <li>
              <Link to="/shop">All</Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="editorial-eyebrow mb-4 opacity-60">Help</div>
          <ul className="space-y-2 text-sm opacity-80">
            <li>Shipping & returns</li>
            <li>Size guide</li>
            <li>Contact</li>
          </ul>
        </div>
        <div>
          <div className="editorial-eyebrow mb-4 opacity-60">Company</div>
          <ul className="space-y-2 text-sm opacity-80">
            <li>About</li>
            <li>Journal</li>
            <li>Press</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 text-xs text-center py-6 opacity-60">
        © {new Date().getFullYear()} ATELIER. All rights reserved.
      </div>
    </footer>
  );
}
