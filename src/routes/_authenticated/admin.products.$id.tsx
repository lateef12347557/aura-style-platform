import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminPage } from "@/components/admin/AdminShell";
import { ProductForm, type ProductFormValues } from "@/components/admin/ProductForm";
import { getAdminProduct } from "@/lib/products.functions";

export const Route = createFileRoute("/_authenticated/admin/products/$id")({
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => getAdminProduct({ data: { id } }),
  });

  if (isLoading || !data) {
    return (
      <AdminPage title="Edit product" eyebrow="Catalog">
        <p>Loading…</p>
      </AdminPage>
    );
  }

  const p = data as unknown as {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    category_id: string;
    price: number;
    compare_price: number | null;
    sku: string | null;
    stock_quantity: number;
    is_featured: boolean;
    is_active: boolean;
    meta_title: string | null;
    meta_description: string | null;
    images: Array<{
      image_url: string;
      alt_text: string | null;
      is_primary: boolean;
      display_order: number;
    }>;
    variants: Array<{
      size: string | null;
      color: string | null;
      stock_quantity: number;
      price_modifier: number;
    }>;
  };

  const initial: ProductFormValues = {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    category_id: p.category_id,
    price: Number(p.price),
    compare_price: p.compare_price === null ? null : Number(p.compare_price),
    sku: p.sku ?? "",
    stock_quantity: p.stock_quantity,
    is_featured: p.is_featured,
    is_active: p.is_active,
    meta_title: p.meta_title ?? "",
    meta_description: p.meta_description ?? "",
    images: (p.images ?? []).map((i) => ({
      image_url: i.image_url,
      alt_text: i.alt_text ?? "",
      is_primary: i.is_primary,
      display_order: i.display_order,
    })),
    variants: (p.variants ?? []).map((v) => ({
      size: v.size ?? "",
      color: v.color ?? "",
      stock_quantity: v.stock_quantity,
      price_modifier: Number(v.price_modifier),
    })),
  };

  return (
    <AdminPage title={`Edit · ${p.name}`} eyebrow="Catalog">
      <ProductForm initial={initial} />
    </AdminPage>
  );
}
