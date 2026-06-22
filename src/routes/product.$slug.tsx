import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { getProductBySlug, listProducts } from "@/lib/products.functions";
import { ProductCard, primaryImage } from "@/components/store/ProductCard";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const product = await getProductBySlug({ data: { slug: params.slug } });
    if (!product) throw notFound();
    return { product };
  },
  head: ({ params, loaderData }) => {
    const p = loaderData?.product;
    return {
      meta: [
        { title: p ? `${p.name} — ATELIER` : "ATELIER" },
        { name: "description", content: p?.meta_description || p?.description?.slice(0, 160) || "ATELIER product" },
        { property: "og:title", content: p?.name ?? "ATELIER" },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `/product/${params.slug}` },
        ...(p?.images?.[0]?.image_url ? [{ property: "og:image" as const, content: p.images[0].image_url }] : []),
      ],
      links: [{ rel: "canonical", href: `/product/${params.slug}` }],
      scripts: p
        ? [{
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: p.name,
              description: p.description,
              sku: p.sku,
              offers: { "@type": "Offer", price: p.price, priceCurrency: "USD" },
            }),
          }]
        : [],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const sortedImages = [...(product.images ?? [])].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return (a.display_order ?? 0) - (b.display_order ?? 0);
  });
  const [activeImg, setActiveImg] = useState(0);

  const variants = (product.variants ?? []) as Array<{ id: string; size: string | null; color: string | null; stock_quantity: number; price_modifier: number | string }>;
  const reviews = (product.reviews ?? []) as Array<{ id: string; rating: number; comment: string | null }>;
  const colors = useMemo(() => Array.from(new Set(variants.map((v) => v.color).filter(Boolean))) as string[], [variants]);
  const sizes = useMemo(() => Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[], [variants]);
  const [color, setColor] = useState<string | null>(colors[0] ?? null);
  const [size, setSize] = useState<string | null>(null);

  const variant = useMemo(
    () => variants.find((v) => v.color === color && v.size === size) ?? null,
    [variants, color, size],
  );

  const add = useCart((s) => s.add);
  const openCart = useUI((s) => s.setCartOpen);

  const related = useQuery({
    queryKey: ["related", product.category?.id],
    queryFn: () =>
      listProducts({
        data: { gender: product.category?.gender ?? undefined, type: product.category?.type ?? undefined, limit: 4 },
      }),
  });

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((s: number, r) => s + r.rating, 0) / reviews.length;
  }, [reviews]);

  function onAdd() {
    if (sizes.length > 0 && !size) {
      toast.error("Please select a size");
      return;
    }
    add({
      productId: product.id,
      variantId: variant?.id ?? null,
      name: product.name,
      slug: product.slug,
      image: sortedImages[0]?.image_url ?? null,
      size,
      color,
      price: Number(product.price) + Number(variant?.price_modifier ?? 0),
      quantity: 1,
    });
    openCart(true);
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-screen-2xl px-4 md:px-8 py-10">
        <div className="grid md:grid-cols-2 gap-10">
          {/* Gallery */}
          <div>
            <motion.div
              key={activeImg}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aspect-[4/5] bg-muted overflow-hidden group"
            >
              {sortedImages[activeImg] && (
                <img
                  src={sortedImages[activeImg].image_url}
                  alt={sortedImages[activeImg].alt_text ?? product.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              )}
            </motion.div>
            {sortedImages.length > 1 && (
              <div className="flex gap-2 mt-3">
                {sortedImages.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImg(i)}
                    className={`h-20 w-16 bg-muted overflow-hidden border ${i === activeImg ? "border-primary" : "border-transparent"}`}
                  >
                    <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="md:sticky md:top-24 md:self-start">
            <div className="editorial-eyebrow text-muted-foreground mb-3">{product.category?.name}</div>
            <h1 className="font-display text-3xl md:text-4xl mb-3">{product.name}</h1>
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-xl">{formatPrice(product.price)}</span>
              {product.compare_price && Number(product.compare_price) > Number(product.price) && (
                <span className="line-through text-muted-foreground text-sm">{formatPrice(product.compare_price)}</span>
              )}
            </div>
            {avgRating > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(avgRating) ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                ))}
                <span className="ml-1">({product.reviews?.length})</span>
              </div>
            )}

            <p className="text-sm text-muted-foreground leading-relaxed mt-6">{product.description}</p>

            {colors.length > 0 && (
              <div className="mt-8">
                <div className="editorial-eyebrow mb-2">Color · {color}</div>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`px-3 py-1.5 text-xs border ${color === c ? "border-primary" : "border-border"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="editorial-eyebrow">Size</div>
                  <button className="text-xs underline">Size guide</button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {sizes.map((s) => {
                    const v = variants.find((x) => x.size === s && x.color === color);
                    const out = !v || v.stock_quantity <= 0;
                    return (
                      <button
                        key={s}
                        disabled={out}
                        onClick={() => setSize(s)}
                        className={`py-2 text-xs border ${size === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"} ${out ? "opacity-30 line-through cursor-not-allowed" : ""}`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={onAdd}
              className="mt-8 w-full bg-primary text-primary-foreground py-4 text-sm uppercase tracking-wider hover:bg-accent transition-colors"
            >
              Add to bag
            </button>
            <p className="text-xs text-muted-foreground mt-3">Complimentary shipping over $250. Returns within 30 days.</p>
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mt-24 max-w-3xl">
            <h2 className="font-display text-2xl mb-6">Reviews</h2>
            <div className="space-y-6">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-border pb-4">
                  <div className="flex gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{r.comment}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related */}
        <section className="mt-24">
          <div className="editorial-eyebrow text-muted-foreground mb-2">You may also like</div>
          <h2 className="font-display text-3xl mb-8">Related</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {(related.data ?? []).filter((p) => p.slug !== product.slug).slice(0, 4).map((p) => (
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
        </section>
        <div className="mt-12">
          <Link to="/shop" className="text-sm underline">← Back to shop</Link>
        </div>
      </div>
    </StoreLayout>
  );
}