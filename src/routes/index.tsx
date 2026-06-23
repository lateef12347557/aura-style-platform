import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import hero from "@/assets/hero.jpg";
import { StoreLayout } from "@/components/store/StoreLayout";
import { ProductCard, primaryImage } from "@/components/store/ProductCard";
import { listProducts } from "@/lib/products.functions";
import { subscribeNewsletter } from "@/lib/newsletter.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MDCLASSIC WEARS — Premium shoes & ready-to-wear" },
      {
        name: "description",
        content: "Editorial fashion. Hand-finished shoes and ready-to-wear for men and women.",
      },
      { property: "og:title", content: "MDCLASSIC WEARS — Premium shoes & ready-to-wear" },
      {
        property: "og:description",
        content: "Editorial fashion. Hand-finished shoes and ready-to-wear.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const featured = useQuery({
    queryKey: ["products", { featured: true }],
    queryFn: () => listProducts({ data: { featured: true, limit: 8 } }),
  });
  const newest = useQuery({
    queryKey: ["products", { sort: "newest" }],
    queryFn: () => listProducts({ data: { sort: "newest", limit: 6 } }),
  });

  return (
    <StoreLayout>
      {/* HERO */}
      <section className="relative h-[78vh] min-h-[520px] w-full overflow-hidden bg-paper">
        <img
          src={hero}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          width={1920}
          height={1280}
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative h-full container-max flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="max-w-2xl text-white"
          >
            <div className="editorial-eyebrow text-white/75 mb-4">Spring / Summer · Volume 04</div>
            <h1 className="hero-title text-5xl md:text-6xl lg:text-7xl mb-6">Quiet luxury, considered cuts.</h1>
            <p className="text-lg text-white/90 max-w-lg mb-8">A studied edit of footwear and ready-to-wear, made in small batches with attention to detail.</p>
            <div className="flex gap-4">
              <Link
                to="/shop/$gender"
                params={{ gender: "women" }}
                className="bg-ink text-white px-6 py-3 text-sm tracking-wider uppercase rounded-md shadow-card hover:opacity-95 transition-in-out-quad"
              >
                Shop Women
              </Link>
              <Link
                to="/shop/$gender"
                params={{ gender: "men" }}
                className="border border-white/30 text-white px-6 py-3 text-sm tracking-wider uppercase rounded-md hover:bg-white/6 transition-in-out-quad"
              >
                Shop Men
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* COLLECTIONS SPLIT */}
      <section className="container-max py-20 grid md:grid-cols-2 gap-6">
        {[
          {
            gender: "women" as const,
            label: "Women",
            img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&q=85",
          },
          {
            gender: "men" as const,
            label: "Men",
            img: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=1400&q=85",
          },
        ].map((c) => (
          <Link
            key={c.gender}
            to="/shop/$gender"
            params={{ gender: c.gender }}
            className="group relative block rounded-lg overflow-hidden aspect-[4/5] bg-muted shadow-card"
          >
            <img
              src={c.img}
              alt={c.label}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-8 left-8">
              <div className="editorial-eyebrow text-white/70 mb-2">Collection</div>
              <div className="font-display text-4xl text-white">{c.label}</div>
            </div>
          </Link>
        ))}
      </section>

      {/* FEATURED */}
      <ProductRail
        title="Featured"
        eyebrow="Editor's pick"
        loading={featured.isLoading}
        items={featured.data ?? []}
      />

      {/* EDITORIAL */}
      <section className="bg-secondary my-24 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="editorial-eyebrow text-muted-foreground mb-6">Our values</div>
          <h2 className="font-display text-4xl md:text-5xl leading-tight mb-6">
            We make less, better — and we make it last.
          </h2>
          <p className="text-muted-foreground">
            Every piece is cut in considered batches. Leather is vegetable-tanned in Tuscany; wool
            is sourced from mills with a centuries-old record.
          </p>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <ProductRail
        title="New arrivals"
        eyebrow="Just landed"
        loading={newest.isLoading}
        items={newest.data ?? []}
      />

      <NewsletterSection />
    </StoreLayout>
  );
}

function ProductRail({
  title,
  eyebrow,
  loading,
  items,
}: {
  title: string;
  eyebrow: string;
  loading: boolean;
  items: Array<{
    slug: string;
    name: string;
    price: number | string;
    compare_price?: number | string | null;
    images?: Array<{
      image_url: string;
      is_primary?: boolean | null;
      display_order?: number | null;
    }>;
  }>;
}) {
  return (
    <section className="mx-auto max-w-screen-2xl px-4 md:px-8 py-16">
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="editorial-eyebrow text-muted-foreground mb-2">{eyebrow}</div>
          <h2 className="font-display text-3xl md:text-4xl">{title}</h2>
        </div>
        <Link to="/shop" className="text-sm underline underline-offset-4 hover:text-accent">
          View all
        </Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.slice(0, 8).map((p) => (
            <ProductCard
              key={p.slug}
              slug={p.slug}
              name={p.name}
              price={p.price}
              comparePrice={p.compare_price}
              image={primaryImage(p.images)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await subscribeNewsletter({ data: { email } });
      toast.success("You're on the list.");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      <div className="editorial-eyebrow text-muted-foreground mb-3">Stay close</div>
      <h2 className="font-display text-3xl md:text-4xl mb-6">Letters from the studio</h2>
      <p className="text-muted-foreground mb-8">
        Early access to collections, atelier notes, no spam.
      </p>
      <form onSubmit={onSubmit} className="flex gap-2 max-w-md mx-auto">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent"
        />
        <button
          disabled={submitting}
          className="bg-primary text-primary-foreground px-6 py-3 text-sm uppercase tracking-wider hover:bg-accent disabled:opacity-50"
        >
          {submitting ? "…" : "Join"}
        </button>
      </form>
    </section>
  );
}
