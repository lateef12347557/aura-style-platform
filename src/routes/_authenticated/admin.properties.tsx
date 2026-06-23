import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Save, ArrowLeft } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { listAllCategories } from "@/lib/categories.functions";
import { upsertProduct, getAdminProduct, listAdminProducts } from "@/lib/products.functions";

export const Route = createFileRoute("/_authenticated/admin/properties")({
  head: () => ({
    meta: [{ title: "Properties — Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: PropertiesAdmin,
});

function PropertiesAdmin() {
  const qc = useQueryClient();
  const categoriesQuery = useQuery({
    queryKey: ["admin-cats"],
    queryFn: () => listAllCategories(),
  });
  const productsQuery = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => listAdminProducts(),
  });

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [form, setForm] = useState({
    productId: "",
    materials: "",
    care_instructions: "",
    available_sizes: "",
    available_colors: "",
  });
  const [saving, setSaving] = useState(false);

  async function loadProduct(id: string) {
    setSelectedProductId(id);
    try {
      const product = await getAdminProduct({ data: { id } });
      if (!product) throw new Error("Product not found");
      setForm({
        productId: id,
        materials: product.materials ?? "",
        care_instructions: product.care_instructions ?? "",
        available_sizes: (product.available_sizes ?? []).join(", "),
        available_colors: (product.available_colors ?? []).join(", "),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load product");
    }
  }

  async function saveProperties() {
    if (!selectedProductId) return;
    setSaving(true);
    try {
      await upsertProduct({
        data: {
          id: selectedProductId,
          materials: form.materials || null,
          care_instructions: form.care_instructions || null,
          available_sizes: form.available_sizes
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          available_colors: form.available_colors
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        },
      });
      toast.success("Product properties saved");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setSaving(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
      setSaving(false);
    }
  }

  const products = productsQuery.data ?? [];

  return (
    <AdminPage
      title="Product Properties"
      eyebrow="Catalog"
      actions={
        <Link
          to="/admin/products/new"
          className="bg-primary text-primary-foreground px-4 py-2 text-sm uppercase tracking-wider inline-flex items-center gap-2 font-medium hover:bg-accent transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[0.6fr_1.4fr]">
        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="editorial-eyebrow text-muted-foreground mb-4">Products</div>
          <div className="space-y-2">
            {products.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => loadProduct(product.id)}
                className={`w-full text-left rounded-2xl px-4 py-3 transition ${
                  selectedProductId === product.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-secondary"
                }`}
              >
                <div className="font-semibold truncate">{product.name}</div>
                <div className="text-xs text-muted-foreground truncate">{product.slug}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <div className="editorial-eyebrow text-muted-foreground">Properties</div>
              <h2 className="font-display text-2xl">{selectedProductId ? "Edit product details" : "Select a product"}</h2>
            </div>
            {selectedProductId && (
              <button
                type="button"
                onClick={() => {
                  setSelectedProductId(null);
                  setForm({ productId: "", materials: "", care_instructions: "", available_sizes: "", available_colors: "" });
                }}
                className="text-sm text-muted-foreground hover:text-accent"
              >
                <ArrowLeft className="mr-2 inline-block h-4 w-4" /> Clear
              </button>
            )}
          </div>

          {selectedProductId ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="editorial-eyebrow text-muted-foreground text-xs">Materials</label>
                  <textarea
                    value={form.materials}
                    onChange={(e) => setForm({ ...form, materials: e.target.value })}
                    className="w-full mt-1 min-h-[120px] resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="editorial-eyebrow text-muted-foreground text-xs">Care instructions</label>
                  <textarea
                    value={form.care_instructions}
                    onChange={(e) => setForm({ ...form, care_instructions: e.target.value })}
                    className="w-full mt-1 min-h-[120px] resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="editorial-eyebrow text-muted-foreground text-xs">Available sizes</label>
                  <input
                    value={form.available_sizes}
                    onChange={(e) => setForm({ ...form, available_sizes: e.target.value })}
                    placeholder="Comma-separated sizes"
                    className="w-full mt-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="editorial-eyebrow text-muted-foreground text-xs">Available colors</label>
                  <input
                    value={form.available_colors}
                    onChange={(e) => setForm({ ...form, available_colors: e.target.value })}
                    placeholder="Comma-separated colors"
                    className="w-full mt-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProductId(null);
                    setForm({ productId: "", materials: "", care_instructions: "", available_sizes: "", available_colors: "" });
                  }}
                  className="rounded-full border border-border px-5 py-2 text-sm uppercase tracking-[0.35em] hover:border-accent"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveProperties}
                  disabled={saving}
                  className="rounded-full bg-primary px-5 py-2 text-sm uppercase tracking-[0.35em] text-primary-foreground hover:bg-accent disabled:opacity-50"
                >
                  <Save className="mr-2 inline-block h-4 w-4" />
                  {saving ? "Saving..." : "Save properties"}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-background/80 p-6 text-sm text-muted-foreground">
              Select a product on the left to begin adding materials, care instructions, sizes, and colors.
            </div>
          )}
        </div>
      </div>
    </AdminPage>
  );
}
