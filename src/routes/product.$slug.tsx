import { createFileRoute, notFound, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Star, Heart, Check, X, ShieldAlert } from "lucide-react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { getProductBySlug, listProducts } from "@/lib/products.functions";
import { submitReview } from "@/lib/reviews.functions";
import { ProductCard, primaryImage } from "@/components/store/ProductCard";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useUI } from "@/store/ui";
import { useAuth } from "@/hooks/use-auth";

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
        { title: p ? `${p.name} — MDCLASSIC WEARS` : "MDCLASSIC WEARS" },
        {
          name: "description",
          content:
            p?.meta_description || p?.description?.slice(0, 160) || "MDCLASSIC WEARS product",
        },
        { property: "og:title", content: p?.name ?? "MDCLASSIC WEARS" },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `/product/${params.slug}` },
        ...(p?.images?.[0]?.image_url
          ? [{ property: "og:image" as const, content: p.images[0].image_url }]
          : []),
      ],
      links: [{ rel: "canonical", href: `/product/${params.slug}` }],
      scripts: p
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Product",
                name: p.name,
                description: p.description,
                sku: p.sku,
                offers: { "@type": "Offer", price: p.price, priceCurrency: "USD" },
              }),
            },
          ]
        : [],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { product } = Route.useLoaderData();

  const sortedImages = [...(product.images ?? [])].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return (a.display_order ?? 0) - (b.display_order ?? 0);
  });

  const [activeImg, setActiveImg] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({
    transformOrigin: "center center",
    transform: "scale(1)",
  });

  // Reviews and rating
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const variants = (product.variants ?? []) as Array<{
    id: string;
    size: string | null;
    color: string | null;
    stock_quantity: number;
    price_modifier: number | string;
  }>;
  const reviews = (product.reviews ?? []) as Array<{
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    user_id: string;
  }>;
  const colors = useMemo(
    () => Array.from(new Set(variants.map((v) => v.color).filter(Boolean))) as string[],
    [variants],
  );
  const sizes = useMemo(
    () => Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[],
    [variants],
  );
  const [color, setColor] = useState<string | null>(colors[0] ?? null);
  const [size, setSize] = useState<string | null>(null);

  const variant = useMemo(
    () => variants.find((v) => v.color === color && v.size === size) ?? null,
    [variants, color, size],
  );

  // Cart & Wishlist state
  const add = useCart((s) => s.add);
  const openCart = useUI((s) => s.setCartOpen);
  const wishlist = useWishlist();
  const isWishlisted = wishlist.has(product.id);

  const related = useQuery({
    queryKey: ["related", product.category?.id],
    queryFn: () =>
      listProducts({
        data: {
          gender: product.category?.gender ?? undefined,
          type: product.category?.type ?? undefined,
          limit: 5,
        },
      }),
  });

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  function onAdd() {
    if (sizes.length > 0 && !size) {
      toast.error("Please select a size");
      return;
    }
    const currentPrice = Number(product.price) + Number(variant?.price_modifier ?? 0);
    add({
      productId: product.id,
      variantId: variant?.id ?? null,
      name: product.name,
      slug: product.slug,
      image: sortedImages[activeImg]?.image_url ?? sortedImages[0]?.image_url ?? null,
      size,
      color,
      price: currentPrice,
      quantity: 1,
    });
    openCart(true);
    toast.success(`${product.name} added to bag.`);
  }

  function toggleWishlist() {
    if (isWishlisted) {
      wishlist.remove(product.id);
      toast.success("Removed from wishlist");
    } else {
      wishlist.add({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: sortedImages[0]?.image_url ?? null,
        price: Number(product.price),
      });
      toast.success("Added to wishlist");
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to submit a review");
      return;
    }
    setSubmittingReview(true);
    try {
      await submitReview({
        data: {
          product_id: product.id,
          rating: reviewRating,
          comment: reviewComment,
        },
      });
      toast.success("Review submitted.");
      setReviewComment("");
      router.invalidate(); // Refreshes page loader data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Review submission failed");
    } finally {
      setSubmittingReview(false);
    }
  }

  // Zoom on Hover effects
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: "scale(1.5)",
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: "center center",
      transform: "scale(1)",
    });
  };

  const isShoes = product.category?.type === "shoes";

  return (
    <StoreLayout>
      <div className="mx-auto max-w-screen-2xl px-4 md:px-8 py-10">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          {/* Gallery with Zoom on Hover */}
          <div>
            <div
              className="relative aspect-[4/5] bg-secondary overflow-hidden cursor-zoom-in"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              {sortedImages[activeImg] ? (
                <motion.img
                  style={zoomStyle}
                  transition={{ transform: { type: "tween", ease: "easeOut", duration: 0.15 } }}
                  src={sortedImages[activeImg].image_url}
                  alt={sortedImages[activeImg].alt_text ?? product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                  No image available
                </div>
              )}
            </div>
            {sortedImages.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pr-2 pb-2">
                {sortedImages.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImg(i)}
                    className={`h-24 w-20 bg-secondary shrink-0 overflow-hidden border transition-all ${i === activeImg ? "border-primary scale-95" : "border-transparent opacity-80 hover:opacity-100"}`}
                  >
                    <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="md:sticky md:top-24 md:self-start space-y-6">
            <div>
              <div className="editorial-eyebrow text-muted-foreground mb-2">
                {product.category?.name}
              </div>
              <h1 className="font-display text-4xl lg:text-5xl tracking-tight leading-tight">
                {product.name}
              </h1>
            </div>

            <div className="flex items-baseline gap-4 py-2 border-b border-border">
              <span className="text-2xl font-medium">
                {formatPrice(Number(product.price) + Number(variant?.price_modifier ?? 0))}
              </span>
              {product.compare_price && Number(product.compare_price) > Number(product.price) && (
                <span className="line-through text-muted-foreground text-sm">
                  {formatPrice(product.compare_price)}
                </span>
              )}
            </div>

            {avgRating > 0 && (
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${i < Math.round(avgRating) ? "fill-accent text-accent" : "text-muted-foreground"}`}
                    />
                  ))}
                </div>
                <span>
                  ({reviews.length} customer review{reviews.length > 1 ? "s" : ""})
                </span>
              </div>
            )}

            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>

            {/* Colors Variant Selector */}
            {colors.length > 0 && (
              <div className="space-y-3">
                <div className="editorial-eyebrow text-xs text-muted-foreground">
                  Color · <span className="text-foreground font-semibold">{color}</span>
                </div>
                <div className="flex gap-3">
                  {colors.map((c) => {
                    const active = color === c;
                    return (
                      <button
                        key={c}
                        onClick={() => {
                          setColor(c);
                          setSize(null);
                        }}
                        className={`px-4 py-2 text-xs border uppercase tracking-wider transition-all duration-200 ${active ? "border-primary bg-primary text-primary-foreground font-medium" : "border-border hover:border-primary text-muted-foreground hover:text-foreground"}`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sizes Variant Selector with Stock Indicator */}
            {sizes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="editorial-eyebrow text-xs text-muted-foreground">Size</div>
                  <button
                    onClick={() => setSizeGuideOpen(true)}
                    className="text-xs uppercase tracking-wider underline underline-offset-4 hover:text-accent transition-colors"
                  >
                    Size guide
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {sizes.map((s) => {
                    const v = variants.find((x) => x.size === s && x.color === color);
                    const out = !v || v.stock_quantity <= 0;
                    const lowStock = v && v.stock_quantity > 0 && v.stock_quantity < 5;
                    const isSelected = size === s;

                    return (
                      <button
                        key={s}
                        disabled={out}
                        onClick={() => setSize(s)}
                        className={`py-3 text-xs border relative flex flex-col items-center justify-center transition-all ${isSelected ? "border-primary bg-primary text-primary-foreground font-bold" : "border-border hover:border-primary"} ${out ? "opacity-35 line-through cursor-not-allowed bg-secondary" : ""}`}
                      >
                        <span>{s}</span>
                        {lowStock && !isSelected && (
                          <span className="absolute bottom-1 text-[8px] uppercase tracking-tighter text-accent font-semibold">
                            Low
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Stock Warning details */}
                {variant && (
                  <div className="text-xs">
                    {variant.stock_quantity <= 0 ? (
                      <span className="text-destructive font-medium">Out of stock</span>
                    ) : variant.stock_quantity < 5 ? (
                      <span className="text-accent font-medium">
                        Only {variant.stock_quantity} left in stock — order soon
                      </span>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Check className="h-3 w-3 text-accent" /> In stock (ships immediately)
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Actions: Add to Bag & Add to Wishlist */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onAdd}
                className="flex-1 bg-primary text-primary-foreground py-4 text-sm uppercase tracking-wider hover:bg-accent transition-colors duration-300 font-medium"
              >
                Add to bag
              </button>
              <button
                onClick={toggleWishlist}
                className={`px-5 border border-border hover:border-primary flex items-center justify-center transition-colors ${isWishlisted ? "bg-secondary text-accent" : "text-muted-foreground hover:text-foreground"}`}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? "fill-accent stroke-accent" : ""}`} />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-4 text-center">
              Complimentary shipping on orders over $250. 30-day hassle-free returns.
            </p>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mt-28 border-t border-border pt-16 max-w-4xl">
          <h2 className="font-display text-3xl mb-8">Customer Reviews</h2>

          <div className="grid md:grid-cols-5 gap-10">
            {/* Reviews list */}
            <div className="md:col-span-3 space-y-8">
              {reviews.length === 0 ? (
                <div className="bg-secondary p-8 border border-border text-center">
                  <p className="text-sm text-muted-foreground font-display text-lg mb-1">
                    No reviews yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Be the first to review this product and share your thoughts.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((r) => (
                    <div key={r.id} className="border-b border-border pb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < r.rating ? "fill-accent text-accent" : "text-muted-foreground"}`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {new Date(r.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {r.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Write a review form */}
            <div className="md:col-span-2 bg-secondary border border-border p-6 h-fit">
              <h3 className="editorial-eyebrow text-foreground mb-4">Write a review</h3>
              {user ? (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                      Rating
                    </label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setReviewRating(num)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`h-6 w-6 ${num <= reviewRating ? "fill-accent text-accent" : "text-muted-foreground"}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">
                      Comment
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience with fit, comfort, and material quality..."
                      className="w-full bg-background border border-border p-3 text-sm focus:outline-none focus:border-accent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full bg-primary text-primary-foreground py-2.5 text-xs uppercase tracking-wider hover:bg-accent disabled:opacity-50 transition-colors"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <ShieldAlert className="h-6 w-6 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    You must be signed in to submit a review.
                  </p>
                  <Link
                    to="/auth"
                    className="inline-block bg-primary text-primary-foreground px-4 py-2 text-xs uppercase tracking-wider"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Related Products Carousel */}
        <section className="mt-28 border-t border-border pt-16">
          <div className="editorial-eyebrow text-muted-foreground mb-2">You may also like</div>
          <h2 className="font-display text-3xl mb-8">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {(related.data ?? [])
              .filter((p) => p.slug !== product.slug)
              .slice(0, 4)
              .map((p) => (
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

        <div className="mt-16">
          <Link
            to="/shop"
            className="text-xs uppercase tracking-wider underline underline-offset-4 hover:text-accent transition-colors"
          >
            ← Back to shop
          </Link>
        </div>
      </div>

      {/* Size Guide Modal */}
      <AnimatePresence>
        {sizeGuideOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSizeGuideOpen(false)}
              className="fixed inset-0 bg-black/60"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-background border border-border w-full max-w-xl p-8 relative shadow-2xl z-50 max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setSizeGuideOpen(false)}
                className="absolute right-4 top-4 p-1 hover:bg-secondary rounded"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="font-display text-3xl mb-2">Size Guide</h3>
              <p className="text-xs text-muted-foreground mb-6 uppercase tracking-wider">
                Standard Measurements for {isShoes ? "Shoes & Footwear" : "Clothing & Apparel"}
              </p>

              {isShoes ? (
                <div className="space-y-4">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border font-medium text-muted-foreground uppercase">
                        <th className="py-2.5">US Men</th>
                        <th className="py-2.5">US Women</th>
                        <th className="py-2.5">EU</th>
                        <th className="py-2.5">UK</th>
                        <th className="py-2.5">Inches</th>
                        <th className="py-2.5">CM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="py-2.5">6</td>
                        <td className="py-2.5">7.5</td>
                        <td className="py-2.5">38</td>
                        <td className="py-2.5">5.5</td>
                        <td className="py-2.5">9.4"</td>
                        <td className="py-2.5">24.0</td>
                      </tr>
                      <tr>
                        <td className="py-2.5">7</td>
                        <td className="py-2.5">8.5</td>
                        <td className="py-2.5">39</td>
                        <td className="py-2.5">6.5</td>
                        <td className="py-2.5">9.6"</td>
                        <td className="py-2.5">24.5</td>
                      </tr>
                      <tr>
                        <td className="py-2.5">8</td>
                        <td className="py-2.5">9.5</td>
                        <td className="py-2.5">41</td>
                        <td className="py-2.5">7.5</td>
                        <td className="py-2.5">10.0"</td>
                        <td className="py-2.5">25.4</td>
                      </tr>
                      <tr>
                        <td className="py-2.5">9</td>
                        <td className="py-2.5">10.5</td>
                        <td className="py-2.5">42</td>
                        <td className="py-2.5">8.5</td>
                        <td className="py-2.5">10.2"</td>
                        <td className="py-2.5">26.0</td>
                      </tr>
                      <tr>
                        <td className="py-2.5">10</td>
                        <td className="py-2.5">11.5</td>
                        <td className="py-2.5">43</td>
                        <td className="py-2.5">9.5</td>
                        <td className="py-2.5">10.5"</td>
                        <td className="py-2.5">26.7</td>
                      </tr>
                      <tr>
                        <td className="py-2.5">11</td>
                        <td className="py-2.5">12.5</td>
                        <td className="py-2.5">45</td>
                        <td className="py-2.5">10.5</td>
                        <td className="py-2.5">10.9"</td>
                        <td className="py-2.5">27.6</td>
                      </tr>
                      <tr>
                        <td className="py-2.5">12</td>
                        <td className="py-2.5">13.5</td>
                        <td className="py-2.5">46</td>
                        <td className="py-2.5">11.5</td>
                        <td className="py-2.5">11.2"</td>
                        <td className="py-2.5">28.4</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-[10px] text-muted-foreground italic mt-4">
                    Note: Fit may vary depending on construction, materials, and manufacturer.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border font-medium text-muted-foreground uppercase">
                        <th className="py-2.5">Size</th>
                        <th className="py-2.5">Chest (in)</th>
                        <th className="py-2.5">Waist (in)</th>
                        <th className="py-2.5">Hip (in)</th>
                        <th className="py-2.5">Sleeve (in)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="py-2.5 font-bold">XS</td>
                        <td className="py-2.5">32-34</td>
                        <td className="py-2.5">26-28</td>
                        <td className="py-2.5">32-34</td>
                        <td className="py-2.5">31.5</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold">S</td>
                        <td className="py-2.5">35-37</td>
                        <td className="py-2.5">29-31</td>
                        <td className="py-2.5">35-37</td>
                        <td className="py-2.5">32.5</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold">M</td>
                        <td className="py-2.5">38-40</td>
                        <td className="py-2.5">32-34</td>
                        <td className="py-2.5">38-40</td>
                        <td className="py-2.5">33.5</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold">L</td>
                        <td className="py-2.5">41-43</td>
                        <td className="py-2.5">35-37</td>
                        <td className="py-2.5">41-43</td>
                        <td className="py-2.5">34.5</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold">XL</td>
                        <td className="py-2.5">44-46</td>
                        <td className="py-2.5">38-40</td>
                        <td className="py-2.5">44-46</td>
                        <td className="py-2.5">35.5</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-[10px] text-muted-foreground italic mt-4 font-light">
                    Measurements refer to body size, not garment dimensions.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </StoreLayout>
  );
}
