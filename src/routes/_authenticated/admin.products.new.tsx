import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin/AdminShell";
import { ProductForm, emptyProduct } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/_authenticated/admin/products/new")({
  component: () => (
    <AdminPage title="New product" eyebrow="Catalog">
      <ProductForm initial={emptyProduct()} />
    </AdminPage>
  ),
});
