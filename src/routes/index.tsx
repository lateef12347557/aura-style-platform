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
    queryFn: () => listProducts({ data: { sort: "newest", limit: 8 } }),
  });

  return (
    <StoreLayout>
      <section className="relative min-h-[calc(100vh-6rem)] overflow-hidden bg-slate-950 text-white">
        <img
          src={hero}
          alt="Hero editorial imagery"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-80"
          width={1920}
          height={1280}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/30 to-slate-950/95" />
        <div className="relative mx-auto grid max-w-screen-2xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.9fr] lg:py-24 xl:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="flex flex-col justify-center gap-8"
          >
            <div className="inline-flex rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/80">
              Spring / Summer — Collection 04
            </div>
            <div className="max-w-2xl">
              <h1 className="text-4xl font-display tracking-tight text-white sm:text-5xl lg:text-6xl">
                Quiet luxury, considered cuts.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-200 sm:text-lg">
                A curated edit of footwear and ready-to-wear, made in small batches with a quiet
                confidence and crafted for today’s modern wardrobe.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/shop/$gender"
                params={{ gender: "women" }}
                className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-slate-950 shadow-lg shadow-black/20 transition hover:scale-[1.01] sm:w-auto"
              >
                Shop Women
              </Link>
              <Link
                to="/shop/$gender"
                params={{ gender: "men" }}
                className="inline-flex w-full items-center justify-center rounded-full border border-white/30 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/10 sm:w-auto"
              >
                Shop Men
              </Link>
            </div>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {[
              {
                title: "Leather essentials",
                subtitle: "New season selection",
                description: "Hand-finished silhouettes with a refined, understated edge.",
                image:
                  "https://images.unsplash.com/photo-1514996937319-344454492b37?w=900&q=80",
              },
              {
                title: "Modern tailoring",
                subtitle: "Tailored for today",
                description: "Smart, easy pieces that elevate every wardrobe.",
                image:
                  "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=900&q=80",
              },
            ].map((card) => (
              <Link
                key={card.title}
                to="/shop"
                className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900/80 shadow-2xl shadow-black/25 transition hover:-translate-y-1 hover:shadow-black/40"
              >
                <img
                  src={card.image}
                  alt={card.title}
                  className="h-64 w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">{card.subtitle}</p>
                  <h2 className="mt-2 text-2xl font-display text-white">{card.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-200">{card.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="editorial-eyebrow text-muted-foreground mb-3">Featured edit</div>
            <h2 className="font-display text-4xl sm:text-5xl">A quiet wardrobe of statement pieces.</h2>
          </div>
          <div className="text-sm leading-7 text-muted-foreground">
            Discover the season’s editorial favorites — curated in limited quantities with a focus
            on premium materials and timeless silhouettes.
          </div>
        </div>
        <ProductRail
          title="Featured"
          eyebrow="Editor's pick"
          loading={featured.isLoading}
          items={featured.data ?? []}
        />
      </section>

      <section className="mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
        <div className="mb-10 text-center">
          <div className="editorial-eyebrow text-muted-foreground mb-3">Shop the edit</div>
          <h2 className="font-display text-3xl sm:text-4xl">A refined edit for every moment.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            Explore effortless essentials, elevated outerwear, and accessories designed to anchor
            your signature style.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[
            {
              title: "Boots & footwear",
              description: "Understated silhouettes with considered construction.",
              image:
                "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=900&q=80",
            },
            {
              title: "Outerwear",
              description: "Tailoring and outer layers for crisp days and city evenings.",
              image:
                "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900&q=80",
            },
            {
              title: "Accessories",
              description: "Clean accents that refine every look.",
              image:
                "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=900&q=80",
            },
          ].map((card) => (
            <Link
              key={card.title}
              to="/shop"
              className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:shadow-black/30"
            >
              <img
                src={card.image}
                alt={card.title}
                className="h-72 w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">Shop</p>
                <h3 className="mt-3 text-2xl font-display text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{card.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Crafted in small batches",
              description: "Minimal runs for better quality, reduced waste, and a stronger story.",
            },
            {
              title: "Sustainable materials",
              description: "Vegetable-tanned leather, fine wools, and responsibly sourced fabrics.",
            },
            {
              title: "Modern tailoring",
              description: "Soft, precise cuts built for comfort and elegant everyday wear.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-[2rem] border border-border bg-background/90 p-8 shadow-lg shadow-slate-950/5"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
                Why us
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="editorial-eyebrow text-muted-foreground mb-3">New arrivals</div>
            <h2 className="font-display text-4xl sm:text-5xl">Just landed in the studio.</h2>
          </div>
          <Link to="/shop" className="text-sm underline underline-offset-4 hover:text-accent">
            View all new arrivals
          </Link>
        </div>
        <ProductRail
          title="New arrivals"
          eyebrow="Just landed"
          loading={newest.isLoading}
          items={newest.data ?? []}
        />
      </section>

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
