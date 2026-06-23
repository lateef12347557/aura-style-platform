import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { ShopSearchParams } from "@/routes/shop";
import { listProducts } from "@/lib/products.functions";
import { listCategories } from "@/lib/categories.functions";
import { ProductCard, primaryImage } from "./ProductCard";
import { SlidersHorizontal, X, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/lib/format";

type Sort = "newest" | "price_asc" | "price_desc" | "best_rated";

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "7", "8", "9", "10", "11", "12"];
const AVAILABLE_COLORS = ["Black", "White", "Off-White", "Gray", "Navy", "Beige", "Olive", "Brown"];

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
  const navigate = useNavigate();
  // Get URL search parameters with strict: false so it works across nested routes
  const searchParams = useSearch({ strict: false }) as unknown as ShopSearchParams;

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const sort = searchParams.sort || "newest";
  const selectedSizes = searchParams.sizes || [];
  const selectedColors = searchParams.colors || [];
  const minPrice = searchParams.minPrice;
  const maxPrice = searchParams.maxPrice;
  const selectedCategory = searchParams.category;
  const searchQuery = searchParams.search || "";

  // Categories list
  const categoriesQuery = useQuery({
    queryKey: ["store-categories"],
    queryFn: () => listCategories(),
  });

  // Filter categories by gender / type if applicable
  const categories = (categoriesQuery.data ?? []).filter((c) => {
    if (gender && c.gender !== "unisex" && c.gender !== gender) return false;
    if (type && c.type !== type) return false;
    return true;
  });

  // Fetch products with all filters applied
  const productsQuery = useQuery({
    queryKey: [
      "products",
      {
        gender,
        type,
        sort,
        selectedSizes,
        selectedColors,
        minPrice,
        maxPrice,
        selectedCategory,
        searchQuery,
      },
    ],
    queryFn: () =>
      listProducts({
        data: {
          gender,
          type,
          categorySlug: selectedCategory,
          sort: sort as Sort,
          limit: 100,
          sizes: selectedSizes,
          colors: selectedColors,
          minPrice: minPrice ?? undefined,
          maxPrice: maxPrice ?? undefined,
          search: searchQuery || undefined,
        },
      }),
  });

  function updateParams(newParams: Partial<ShopSearchParams>) {
    navigate({
      search: ((prev: Record<string, unknown>) => {
        const next: Record<string, unknown> = { ...prev, ...newParams };
        // Clean up empty params
        Object.keys(next).forEach((key) => {
          if (
            next[key] === undefined ||
            next[key] === null ||
            (Array.isArray(next[key]) && next[key].length === 0) ||
            next[key] === ""
          ) {
            delete next[key];
          }
        });
        return next;
      }) as never,
    });
  }

  const toggleSize = (size: string) => {
    const next = selectedSizes.includes(size)
      ? selectedSizes.filter((s: string) => s !== size)
      : [...selectedSizes, size];
    updateParams({ sizes: next });
  };

  const toggleColor = (color: string) => {
    const next = selectedColors.includes(color)
      ? selectedColors.filter((c: string) => c !== color)
      : [...selectedColors, color];
    updateParams({ colors: next });
  };

  const clearAllFilters = () => {
    updateParams({
      sizes: undefined,
      colors: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      category: undefined,
      search: undefined,
    });
  };

  const hasActiveFilters =
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    minPrice !== undefined ||
    maxPrice !== undefined ||
    selectedCategory !== undefined ||
    searchQuery !== "";

  // Render the filter sections
  const renderFilterSections = () => (
    <div className="space-y-8">
      {/* Search Filter */}
      <div>
        <h4 className="editorial-eyebrow text-foreground mb-3">Search</h4>
        <div className="relative">
          <input
            type="text"
            placeholder="Type to search..."
            value={searchQuery}
            onChange={(e) => updateParams({ search: e.target.value })}
            className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
          {searchQuery && (
            <button
              onClick={() => updateParams({ search: undefined })}
              className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Categories Filter */}
      {categories.length > 0 && (
        <div>
          <h4 className="editorial-eyebrow text-foreground mb-3">Categories</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            <button
              onClick={() => updateParams({ category: undefined })}
              className={`w-full text-left py-1 text-sm flex justify-between items-center transition-colors ${!selectedCategory ? "text-accent font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              <span>All Categories</span>
              {!selectedCategory && <Check className="h-3.5 w-3.5" />}
            </button>

            {categories
              .filter((c) => !c.parent_id)
              .map((parent) => (
                <div key={parent.id} className="mb-1">
                  <button
                    onClick={() => updateParams({ category: parent.slug })}
                    className={`w-full text-left py-1 text-sm flex justify-between items-center transition-colors ${selectedCategory === parent.slug ? "text-accent font-medium" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <span>{parent.name}</span>
                    {selectedCategory === parent.slug && <Check className="h-3.5 w-3.5" />}
                  </button>

                  <div className="pl-4 mt-1 space-y-1">
                    {categories
                      .filter((c) => c.parent_id === parent.id)
                      .map((child) => (
                        <button
                          key={child.id}
                          onClick={() => updateParams({ category: child.slug })}
                          className={`w-full text-left py-1 text-sm flex justify-between items-center transition-colors ${selectedCategory === child.slug ? "text-accent font-medium" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          <span className="text-sm">{child.name}</span>
                          {selectedCategory === child.slug && <Check className="h-3.5 w-3.5" />}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Sizes Filter */}
      <div>
        <h4 className="editorial-eyebrow text-foreground mb-3">Sizes</h4>
        <div className="grid grid-cols-4 gap-2">
          {AVAILABLE_SIZES.map((sz) => {
            const active = selectedSizes.includes(sz);
            return (
              <button
                key={sz}
                onClick={() => toggleSize(sz)}
                className={`py-2 text-xs border text-center transition-all ${active ? "border-primary bg-primary text-primary-foreground font-semibold" : "border-border hover:border-primary text-muted-foreground hover:text-foreground"}`}
              >
                {sz}
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors Filter */}
      <div>
        <h4 className="editorial-eyebrow text-foreground mb-3">Colors</h4>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_COLORS.map((col) => {
            const active = selectedColors.includes(col);
            return (
              <button
                key={col}
                onClick={() => toggleColor(col)}
                className={`px-3 py-1.5 text-xs border transition-all rounded-full flex items-center gap-1.5 ${active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary text-muted-foreground hover:text-foreground"}`}
              >
                {active && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                {col}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <h4 className="editorial-eyebrow text-foreground mb-3">Price Range</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice ?? ""}
            onChange={(e) =>
              updateParams({ minPrice: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-full bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:border-accent"
          />
          <span className="text-muted-foreground text-xs">—</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice ?? ""}
            onChange={(e) =>
              updateParams({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-full bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="w-full text-center py-2.5 text-xs uppercase tracking-wider border border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
        >
          Reset Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="container-max py-12">
      {/* Header section */}
      <div className="mb-8 md:mb-12">
        <div className="editorial-eyebrow text-muted-foreground mb-2">{eyebrow}</div>
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl tracking-tight">{title}</h1>
      </div>

      {/* Toolbar / Sorting */}
      <div className="flex items-center justify-between border-y border-border py-4 mb-8">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="lg:hidden flex items-center gap-2 text-xs uppercase tracking-wider hover:text-accent transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </button>
        <div className="hidden lg:block text-xs text-muted-foreground">
          {productsQuery.isLoading
            ? "Loading products..."
            : `${productsQuery.data?.length ?? 0} items`}
        </div>

        <div className="flex items-center gap-3">
          <label className="editorial-eyebrow text-muted-foreground text-xs">Sort</label>
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value as Sort })}
            className="bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:border-accent cursor-pointer font-medium rounded-md"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="best_rated">Customer Rating</option>
          </select>
        </div>
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center mb-8">
          <span className="text-xs text-muted-foreground mr-1">Active filters:</span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1 bg-secondary px-2.5 py-1 text-xs border border-border">
              Search: "{searchQuery}"
              <button onClick={() => updateParams({ search: undefined })}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 bg-secondary px-2.5 py-1 text-xs border border-border">
              Cat: {selectedCategory}
              <button onClick={() => updateParams({ category: undefined })}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedSizes.map((sz: string) => (
            <span
              key={sz}
              className="inline-flex items-center gap-1 bg-secondary px-2.5 py-1 text-xs border border-border"
            >
              Size: {sz}
              <button onClick={() => toggleSize(sz)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {selectedColors.map((col: string) => (
            <span
              key={col}
              className="inline-flex items-center gap-1 bg-secondary px-2.5 py-1 text-xs border border-border"
            >
              Color: {col}
              <button onClick={() => toggleColor(col)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {(minPrice !== undefined || maxPrice !== undefined) && (
            <span className="inline-flex items-center gap-1 bg-secondary px-2.5 py-1 text-xs border border-border">
              Price: {minPrice !== undefined ? formatPrice(minPrice) : "$0"} –{" "}
              {maxPrice !== undefined ? formatPrice(maxPrice) : "∞"}
              <button onClick={() => updateParams({ minPrice: undefined, maxPrice: undefined })}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs text-accent underline underline-offset-4 ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="flex gap-10">
        {/* Desktop Sidebar Filter (sticky) */}
        <aside className="hidden lg:block w-72 shrink-0 self-start sticky top-24 max-h-[80vh] overflow-y-auto pr-4">
          <div className="bg-background border border-border rounded-lg p-5 shadow-sm">
            {renderFilterSections()}
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {productsQuery.isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[4/5] bg-muted animate-pulse" />
                  <div className="h-4 bg-muted animate-pulse w-3/4" />
                  <div className="h-4 bg-muted animate-pulse w-1/4" />
                </div>
              ))}
            </div>
          ) : (productsQuery.data?.length ?? 0) === 0 ? (
            <div className="text-center py-28 bg-secondary border border-border">
              <p className="text-sm text-muted-foreground font-display text-lg mb-2">
                No matching products
              </p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Try loosening your filter settings or search query to find products.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="mt-5 bg-primary text-primary-foreground px-6 py-2 text-xs uppercase tracking-wider"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {productsQuery.data!.map((p) => (
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
      </div>

      {/* Mobile Drawer Filter */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-full max-w-sm bg-background z-50 p-6 flex flex-col shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                <span className="font-display text-xl">Filters</span>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1 hover:bg-secondary rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pb-6">{renderFilterSections()}</div>
              <div className="pt-4 border-t border-border flex gap-3">
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex-1 bg-primary text-primary-foreground py-3 text-xs uppercase tracking-wider hover:bg-accent text-center"
                >
                  Apply Filters ({productsQuery.data?.length ?? 0})
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
