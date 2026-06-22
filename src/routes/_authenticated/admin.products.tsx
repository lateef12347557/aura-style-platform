import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { listAdminProducts, deleteProduct } from "@/lib/products.functions";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: ProductsAdmin,
});

function ProductsAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-products"], queryFn: () => listAdminProducts() });
  const [search, setSearch] = useState("");

  const filtered = (data ?? []).filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  async function onDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct({ data: { id } });
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <AdminPage
      title="Products"
      eyebrow="Catalog"
      actions={
        <Link to="/admin/products/new" className="bg-primary text-primary-foreground px-4 py-2 text-sm uppercase tracking-wider inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> New product
        </Link>
      }
    >
      <div className="mb-4">
        <input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-border bg-background px-3 py-2 text-sm w-64"
        />
      </div>
      {isLoading ? <p>Loading…</p> : (
        <div className="bg-card border border-border">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left p-3">Name</th><th className="text-left">Category</th><th className="text-right">Price</th><th className="text-right">Stock</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="p-3">
                    <Link to="/admin/products/$id" params={{ id: p.id }} className="hover:text-accent">{p.name}</Link>
                    {p.is_featured && <span className="ml-2 text-xs text-accent">★</span>}
                  </td>
                  <td className="text-muted-foreground text-xs">{p.category?.name}</td>
                  <td className="text-right">{formatPrice(p.price)}</td>
                  <td className="text-right">{p.stock_quantity}</td>
                  <td className="text-center"><span className={`text-xs ${p.is_active ? "text-accent" : "text-muted-foreground"}`}>{p.is_active ? "Active" : "Draft"}</span></td>
                  <td className="text-right pr-3 space-x-3">
                    <Link to="/admin/products/$id" params={{ id: p.id }} className="text-xs underline">Edit</Link>
                    <button onClick={() => onDelete(p.id)} className="text-xs underline text-destructive">Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No products.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminPage>
  );
}