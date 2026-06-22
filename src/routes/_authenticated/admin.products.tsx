import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Search, Filter, Copy, Trash2, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { AdminPage } from "@/components/admin/AdminShell";
import { listAdminProducts, deleteProduct, getAdminProduct, upsertProduct, bulkUpdateStatus, bulkDeleteProducts } from "@/lib/products.functions";
import { listAllCategories } from "@/lib/categories.functions";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: ProductsAdmin,
});

const ITEMS_PER_PAGE = 10;

function ProductsAdmin() {
  const qc = useQueryClient();
  
  // Queries
  const productsQuery = useQuery({ queryKey: ["admin-products"], queryFn: () => listAdminProducts() });
  const categoriesQuery = useQuery({ queryKey: ["admin-cats"], queryFn: () => listAllCategories() });

  // Filters state
  const [search, setSearch] = useState("");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Bulk actions state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filtering Logic
  const filtered = useMemo(() => {
    return (productsQuery.data ?? []).filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                            (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
      const matchesGender = selectedGender === "all" || p.category?.gender === selectedGender;
      const matchesCategory = selectedCategory === "all" || p.category?.name === selectedCategory;
      return matchesSearch && matchesGender && matchesCategory;
    });
  }, [productsQuery.data, search, selectedGender, selectedCategory]);

  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  // Handlers
  async function onDelete(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct({ data: { id } });
      toast.success("Deleted product");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function onDuplicate(id: string) {
    try {
      const p = await getAdminProduct({ data: { id } });
      if (!p) throw new Error("Could not load original product");
      
      const copyPayload = {
        name: `${p.name} (Copy)`,
        slug: `${p.slug}-copy-${Math.floor(Math.random() * 10000)}`,
        description: p.description,
        category_id: p.category_id,
        price: Number(p.price),
        compare_price: p.compare_price ? Number(p.compare_price) : null,
        sku: p.sku ? `${p.sku}-COPY` : `SKU-${Math.floor(Math.random() * 10000)}`,
        stock_quantity: p.stock_quantity,
        is_featured: false,
        is_active: false, // Defaults to draft
        meta_title: p.meta_title ? `${p.meta_title} (Copy)` : null,
        meta_description: p.meta_description,
        images: (p.images ?? []).map((img: any) => ({
          image_url: img.image_url,
          alt_text: img.alt_text,
          is_primary: img.is_primary,
          display_order: img.display_order,
        })),
        variants: (p.variants ?? []).map((v: any) => ({
          size: v.size,
          color: v.color,
          stock_quantity: v.stock_quantity,
          price_modifier: Number(v.price_modifier),
        })),
      };

      await upsertProduct({ data: copyPayload });
      toast.success("Product duplicated successfully as Draft");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Duplication failed");
    }
  }

  // Bulk operation handlers
  async function handleBulkActivate(activate: boolean) {
    if (selectedIds.length === 0) return;
    try {
      await bulkUpdateStatus({ data: { ids: selectedIds, is_active: activate } });
      toast.success(`Updated ${selectedIds.length} products`);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setSelectedIds([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk update failed");
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} products permanently?`)) return;
    try {
      await bulkDeleteProducts({ data: { ids: selectedIds } });
      toast.success(`Deleted ${selectedIds.length} products`);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setSelectedIds([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk delete failed");
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedData.map((p) => p.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // List unique category names for filtering
  const categoryNames = useMemo(() => {
    return Array.from(new Set((categoriesQuery.data ?? []).map((c) => c.name)));
  }, [categoriesQuery.data]);

  return (
    <AdminPage
      title="Products"
      eyebrow="Catalog"
      actions={
        <Link
          to="/admin/products/new"
          className="bg-primary text-primary-foreground px-4 py-2 text-sm uppercase tracking-wider inline-flex items-center gap-2 font-medium hover:bg-accent transition-colors"
        >
          <Plus className="h-4 w-4" /> New Product
        </Link>
      }
    >
      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-border bg-background pl-9 pr-3 py-2 text-sm w-full focus:outline-none focus:border-accent"
            />
          </div>

          {/* Gender filter */}
          <select
            value={selectedGender}
            onChange={(e) => {
              setSelectedGender(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            <option value="all">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="unisex">Unisex</option>
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            <option value="all">All Categories</option>
            {categoryNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedIds.length > 0 && (
          <div className="bg-secondary border border-border px-4 py-1.5 flex items-center gap-3 text-xs">
            <span className="font-semibold text-muted-foreground">{selectedIds.length} selected:</span>
            <button
              onClick={() => handleBulkActivate(true)}
              className="hover:text-accent font-medium flex items-center gap-1 uppercase tracking-wider"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Activate
            </button>
            <button
              onClick={() => handleBulkActivate(false)}
              className="hover:text-accent font-medium flex items-center gap-1 uppercase tracking-wider"
            >
              <XCircle className="h-3.5 w-3.5" /> Deactivate
            </button>
            <button
              onClick={handleBulkDelete}
              className="text-destructive font-medium flex items-center gap-1 uppercase tracking-wider"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>

      {productsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground animate-pulse">Loading catalog...</p>
      ) : (
        <div className="bg-card border border-border">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b border-border bg-muted/20">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && selectedIds.length === paginatedData.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left p-3">Product Name</th>
                <th className="text-left">Category</th>
                <th className="text-center">Gender</th>
                <th className="text-right">Price</th>
                <th className="text-right">Stock</th>
                <th className="text-center">Status</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                return (
                  <tr key={p.id} className={isSelected ? "bg-muted/10" : ""}>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(p.id)}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col">
                        <Link to="/admin/products/$id" params={{ id: p.id }} className="hover:text-accent font-medium">
                          {p.name}
                        </Link>
                        {p.sku && <span className="text-[10px] text-muted-foreground font-mono">SKU: {p.sku}</span>}
                      </div>
                    </td>
                    <td className="text-muted-foreground text-xs">{p.category?.name || "—"}</td>
                    <td className="text-center text-xs uppercase tracking-wider text-muted-foreground">
                      {p.category?.gender || "—"}
                    </td>
                    <td className="text-right font-medium">{formatPrice(p.price)}</td>
                    <td className="text-right pr-2">
                      <span className={p.stock_quantity === 0 ? "text-destructive font-semibold" : ""}>
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          p.is_active ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.is_active ? "Active" : "Draft"}
                      </span>
                    </td>
                    <td className="text-right pr-4 space-x-3">
                      <button
                        onClick={() => onDuplicate(p.id)}
                        className="text-xs hover:text-accent inline-flex items-center gap-1"
                        title="Duplicate"
                      >
                        <Copy className="h-3.5 w-3.5" /> Duplicate
                      </button>
                      <Link to="/admin/products/$id" params={{ id: p.id }} className="text-xs underline font-medium hover:text-accent">
                        Edit
                      </Link>
                      <button
                        onClick={() => onDelete(p.id)}
                        className="text-xs underline text-destructive font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    No matching products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-muted/10 text-xs">
              <div className="text-muted-foreground">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 border border-border hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 border border-border hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminPage>
  );
}