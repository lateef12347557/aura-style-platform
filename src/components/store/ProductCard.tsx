import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/format";

interface ProductCardProps {
  slug: string;
  name: string;
  price: number | string;
  comparePrice?: number | string | null;
  image?: string | null;
  categoryName?: string;
}

export function ProductCard({
  slug,
  name,
  price,
  comparePrice,
  image,
  categoryName,
}: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Link
        to="/product/$slug"
        params={{ slug }}
        className="group block overflow-hidden bg-card border border-border hover:border-accent/40 transition-all"
      >
      <div className="relative aspect-[4/5] bg-muted overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <button
          aria-label="Quick add"
          className="absolute left-3 right-3 bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 bg-accent text-accent-foreground px-3 py-2.5 text-xs uppercase tracking-[0.18em] font-medium"
        >
          Quick Add
        </button>
      </div>

      <div className="p-4 space-y-1.5">
        {categoryName && (
          <div className="editorial-eyebrow text-accent">{categoryName}</div>
        )}
        <div className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
          {name}
        </div>
        <div className="text-sm flex items-center gap-3">
          <span className="font-semibold">{formatPrice(price)}</span>
          {comparePrice && Number(comparePrice) > Number(price) && (
            <span className="line-through text-muted-foreground text-xs">
              {formatPrice(comparePrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
    </motion.div>
  );
}

export function primaryImage(
  images?: Array<{ image_url: string; is_primary?: boolean | null; display_order?: number | null }>,
) {
  if (!images || images.length === 0) return null;
  const sorted = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return (a.display_order ?? 0) - (b.display_order ?? 0);
  });
  return sorted[0]?.image_url ?? null;
}
