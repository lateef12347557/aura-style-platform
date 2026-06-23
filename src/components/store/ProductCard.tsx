import { Link } from "@tanstack/react-router";
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
    <Link to="/product/$slug" params={{ slug }} className="group block">
      <div className="aspect-[4/5] bg-muted overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
      </div>
      <div className="pt-4 space-y-1">
        {categoryName && (
          <div className="editorial-eyebrow text-muted-foreground">{categoryName}</div>
        )}
        <div className="text-sm font-medium">{name}</div>
        <div className="text-sm flex items-center gap-2">
          <span>{formatPrice(price)}</span>
          {comparePrice && Number(comparePrice) > Number(price) && (
            <span className="line-through text-muted-foreground text-xs">
              {formatPrice(comparePrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
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
