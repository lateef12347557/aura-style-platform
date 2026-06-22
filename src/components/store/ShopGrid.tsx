import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listProducts } from "@/lib/products.functions";
import { ProductCard, primaryImage } from "./ProductCard";

type Sort = "newest" | "price_asc" | "price_desc";

export function ShopGrid({
  title,
  eyebrow,
  gender,
  type,
}: {
  title: string;
  eyebrow: string;
  gender?: "male" | "female";
  type?: "shoes" | "clothing";
}) {
  const [sort, setSort] = useState<Sort>("newest");
  const [typeFilter, setTypeFilter] = useState<"shoes" | "clothing" | "all">(type ?? "all");

  const effectiveType = type ?? (typeFilter === "all" ? undefined : typeFilter);

  const query = useQuery({
    queryKey: ["products", { gender, type: effectiveType, sort }],
    queryFn: () =>
      listProducts({ data: { gender, type: effectiveType, sort, limit: 60 } }),
  });

  return (
    <div className="mx-auto max-w-screen-2xl px-4 md:px-8 py-16">
      <div className="mb-10">
        <div className="editorial-eyebrow text-muted-foreground mb-2">{eyebrow}</div>
        <h1 className="font-display text-4xl md:text-5xl">{title}</h1>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border py-4 mb-10">
        <div className="flex gap-2 text-xs uppercase tracking-wider">
          {!type && (
            <>
              {(["all", "shoes", "clothing"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 border ${typeFilter === t ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                >
                  {t}
                </button>
              ))}
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <label className="editorial-eyebrow text-muted-foreground">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="bg-background border border-border px-3 py-1.5 text-xs"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>
      </div>

      {query.isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] bg-muted animate-pulse" />
          ))}
        </div>
      ) : (query.data?.length ?? 0) === 0 ? (
        <p className="text-center py-24 text-muted-foreground">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
          {query.data!.map((p) => (
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
    </div>
  );
}