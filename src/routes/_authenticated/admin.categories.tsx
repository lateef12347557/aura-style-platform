import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";
import { AdminPage } from "@/components/admin/AdminShell";
import {
  listAllCategories,
  upsertCategory,
  toggleCategoryActive,
  deleteCategory,
  reorderCategories,
} from "@/lib/categories.functions";
import {
  ChevronRight,
  Folder,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: CategoriesAdmin,
});

interface Category {
  id: string;
  name: string;
  slug: string;
  gender: "male" | "female" | "unisex";
  type: "shoes" | "clothing";
  parent_id: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  meta_title: string | null;
  meta_description: string | null;
}

function CategoriesAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">("all");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: () => listAllCategories(),
  });

  const [editing, setEditing] = useState<{
    id?: string;
    name: string;
    slug: string;
    gender: "male" | "female" | "unisex";
    type: "shoes" | "clothing";
    parent_id: string | null;
    image_url: string;
    is_active: boolean;
    display_order: number;
    meta_title: string;
    meta_description: string;
  } | null>(null);

  const categoryCounts = useMemo(() => {
    const categories = (data ?? []) as Category[];
    return {
      total: categories.length,
      active: categories.filter((c) => c.is_active).length,
      draft: categories.filter((c) => !c.is_active).length,
      topLevel: categories.filter((c) => !c.parent_id).length,
    };
  }, [data]);

  // Group categories into parent -> children tree structure with optional filtering
  const { roots, childrenMap } = useMemo(() => {
    const categories = (data ?? []) as Category[];
    const searchTerm = search.trim().toLowerCase();

    const filtered = categories.filter((cat) => {
      if (statusFilter !== "all") {
        if (statusFilter === "active" && !cat.is_active) return false;
        if (statusFilter === "draft" && cat.is_active) return false;
      }
      if (!searchTerm) return true;
      const subject = `${cat.name} ${cat.slug} ${cat.gender} ${cat.type}`.toLowerCase();
      return subject.includes(searchTerm);
    });

    const roots: Category[] = [];
    const childrenMap = new Map<string, Category[]>();

    filtered.forEach((cat) => {
      if (!cat.parent_id) {
        roots.push(cat);
      } else {
        const list = childrenMap.get(cat.parent_id) || [];
        list.push(cat);
        childrenMap.set(cat.parent_id, list);
      }
    });

    roots.sort((a, b) => a.display_order - b.display_order);
    for (const list of childrenMap.values()) {
      list.sort((a, b) => a.display_order - b.display_order);
    }

    return { roots, childrenMap };
  }, [data, search, statusFilter]);

  async function save() {
    if (!editing) return;
    try {
      await upsertCategory({
        data: {
          ...editing,
          slug: editing.slug || slugify(editing.name, { lower: true, strict: true }),
          image_url: editing.image_url || null,
          parent_id: editing.parent_id || null,
        },
      });
      toast.success("Saved category");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-cats"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function toggle(id: string, is_active: boolean) {
    try {
      await toggleCategoryActive({ data: { id, is_active } });
      qc.invalidateQueries({ queryKey: ["admin-cats"] });
      toast.success("Category status updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete category "${name}"? This action cannot be undone.`)) return;
    try {
      await deleteCategory({ data: { id } });
      qc.invalidateQueries({ queryKey: ["admin-cats"] });
      toast.success("Category deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete category");
    }
  }

  async function moveCategory(category: Category, direction: "up" | "down") {
    const categories = (data ?? []) as Category[];
    const siblings = categories
      .filter((c) => c.parent_id === category.parent_id)
      .sort((a, b) => a.display_order - b.display_order);
    const index = siblings.findIndex((c) => c.id === category.id);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const target = siblings[targetIndex];
    try {
      await reorderCategories({
        data: {
          updates: [
            { id: category.id, display_order: target.display_order },
            { id: target.id, display_order: category.display_order },
          ],
        },
      });
      qc.invalidateQueries({ queryKey: ["admin-cats"] });
      toast.success("Category order updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update order");
    }
  }

  // Visual row renderer for the tree
  const renderCategoryRow = (c: Category, depth = 0) => {
    const children = childrenMap.get(c.id) || [];
    return (
      <div key={c.id} className="w-full">
        <div
          className={`grid gap-3 py-3 px-4 hover:bg-muted/40 border-b border-border transition-colors ${depth > 0 ? "bg-background/50" : "bg-card"}`}
        >
          <div className="flex flex-col gap-4 sm:grid sm:grid-cols-[1.6fr_0.9fr_0.9fr_1.2fr] sm:items-center sm:gap-3">
            <div className="flex items-center gap-3 min-w-0" style={{ paddingLeft: `${depth * 24}px` }}>
              {depth > 0 ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <Folder className="h-4 w-4 text-accent shrink-0" />
              )}
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{c.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">slug: {c.slug}</div>
              </div>
              {c.image_url && (
                <img
                  src={c.image_url}
                  alt=""
                  className="h-8 w-8 rounded object-cover border border-border"
                />
              )}
            </div>

            <div className="text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {c.gender}
            </div>

            <div className="text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {c.type}
            </div>

            <div className="flex flex-col gap-2 sm:items-end text-xs text-muted-foreground">
              <button
                onClick={() => toggle(c.id, !c.is_active)}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[10px] uppercase transition hover:border-accent"
                title={c.is_active ? "Deactivate" : "Activate"}
              >
                {c.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                {c.is_active ? "Active" : "Draft"}
              </button>
              <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
                <button
                  onClick={() => moveCategory(c, "up")}
                  className="rounded-full border border-border p-2 transition hover:border-accent"
                  title="Move up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => moveCategory(c, "down")}
                  className="rounded-full border border-border p-2 transition hover:border-accent"
                  title="Move down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() =>
                    setEditing({
                      id: c.id,
                      name: c.name,
                      slug: c.slug,
                      gender: c.gender,
                      type: c.type,
                      parent_id: c.parent_id,
                      image_url: c.image_url ?? "",
                      is_active: c.is_active,
                      display_order: c.display_order,
                      meta_title: c.meta_title ?? "",
                      meta_description: c.meta_description ?? "",
                    })
                  }
                  className="rounded-full border border-border p-2 transition hover:border-accent"
                  title="Edit"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => remove(c.id, c.name)}
                  className="rounded-full border border-destructive/50 p-2 text-destructive transition hover:bg-destructive/10"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
        {children.length > 0 && (
          <div className="w-full">
            {children.map((child) => renderCategoryRow(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const categoriesOptions = (data ?? []) as Category[];

  return (
    <AdminPage
      title="Categories"
      eyebrow="Catalog"
      actions={
        <button
          onClick={() =>
            setEditing({
              name: "",
              slug: "",
              gender: "male",
              type: "clothing",
              parent_id: null,
              image_url: "",
              is_active: true,
              display_order: 0,
              meta_title: "",
              meta_description: "",
            })
          }
          className="bg-primary text-primary-foreground px-4 py-2 text-sm uppercase tracking-wider font-medium hover:bg-accent transition-colors"
        >
          + Add Category
        </button>
      }
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground animate-pulse">Loading categories...</p>
      ) : (
        <>
          <div className="mb-6 grid gap-4 xl:grid-cols-[1.5fr_auto]">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="Total" value={String(categoryCounts.total)} />
              <SummaryCard label="Top-level" value={String(categoryCounts.topLevel)} />
              <SummaryCard label="Active" value={String(categoryCounts.active)} />
              <SummaryCard label="Draft" value={String(categoryCounts.draft)} />
            </div>
            <div className="grid gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent"
              />
              <div className="flex flex-wrap gap-2">
                {(["all", "active", "draft"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={`rounded-full px-4 py-2 text-sm uppercase tracking-[0.25em] transition ${
                      statusFilter === filter
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border">
            {/* Header row */}
            <div className="hidden sm:grid grid-cols-[1.8fr_0.85fr_0.85fr_1.2fr] items-center gap-4 py-3 px-4 bg-muted/30 border-b border-border text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              <div>Category / Name</div>
              <div className="text-center">Gender</div>
              <div className="text-center">Type</div>
              <div className="text-right">Actions</div>
            </div>

            {/* Tree Rows */}
            <div className="divide-y divide-border/40">
              {roots.map((root) => renderCategoryRow(root))}
              {roots.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No categories found. Create a category to get started.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Editing Dialog Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setEditing(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-background border border-border w-full max-w-md p-6 space-y-4 shadow-2xl relative"
          >
            <h2 className="font-display text-2xl mb-4">
              {editing.id ? "Edit category" : "New category"}
            </h2>

            <Input
              label="Name"
              value={editing.name}
              onChange={(v) =>
                setEditing({
                  ...editing,
                  name: v,
                  slug: editing.slug || slugify(v, { lower: true, strict: true }),
                })
              }
            />
            <Input
              label="Slug"
              value={editing.slug}
              onChange={(v) => setEditing({ ...editing, slug: v })}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Gender"
                value={editing.gender}
                options={["male", "female", "unisex"]}
                onChange={(v) =>
                  setEditing({ ...editing, gender: v as "male" | "female" | "unisex" })
                }
              />
              <Select
                label="Type"
                value={editing.type}
                options={["shoes", "clothing"]}
                onChange={(v) => setEditing({ ...editing, type: v as "shoes" | "clothing" })}
              />
            </div>

            {/* Parent Category Option Selection */}
            <div>
              <label className="editorial-eyebrow text-muted-foreground text-xs">
                Parent Category (Optional)
              </label>
              <select
                value={editing.parent_id || ""}
                onChange={(e) => setEditing({ ...editing, parent_id: e.target.value || null })}
                className="w-full mt-1 border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent"
              >
                <option value="">None (Top-Level Category)</option>
                {categoriesOptions
                  .filter((c) => c.id !== editing.id) // Cannot set parent to itself
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.gender} · {c.type})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="editorial-eyebrow text-muted-foreground text-xs">
                Category Image
              </label>
              <div className="flex gap-2 items-center mt-1">
                <input
                  type="text"
                  placeholder="https://..."
                  value={editing.image_url}
                  onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                  className="flex-1 border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent"
                />
                <label className="bg-secondary border border-border hover:border-primary px-3 py-2 text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shrink-0 select-none">
                  <Upload className="h-3.5 w-3.5" />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const toastId = toast.loading("Uploading image...");
                      try {
                        const fileExt = file.name.split(".").pop();
                        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
                        const filePath = `categories/${fileName}`;

                        const { error: uploadError } = await supabase.storage
                          .from("images")
                          .upload(filePath, file);

                        if (uploadError) throw uploadError;

                        const { data } = supabase.storage.from("images").getPublicUrl(filePath);

                        setEditing({ ...editing, image_url: data.publicUrl });
                        toast.success("Image uploaded successfully", { id: toastId });
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Upload failed", {
                          id: toastId,
                        });
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div>
              <Input
                label="SEO Title"
                value={editing.meta_title}
                onChange={(v) => setEditing({ ...editing, meta_title: v })}
              />
            </div>
            <div>
              <label className="editorial-eyebrow text-muted-foreground text-xs">
                SEO Description
              </label>
              <textarea
                value={editing.meta_description}
                onChange={(e) => setEditing({ ...editing, meta_description: e.target.value })}
                rows={3}
                className="w-full mt-1 border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
              />
            </div>
            <div>
              <Input
                label="Display Order"
                value={String(editing.display_order)}
                onChange={(v) => setEditing({ ...editing, display_order: Number(v) })}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-border mt-6">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm uppercase tracking-wider hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="bg-primary text-primary-foreground px-6 py-2 text-sm uppercase tracking-wider font-semibold hover:bg-accent transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPage>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="editorial-eyebrow text-muted-foreground text-xs">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-accent"
      />
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="editorial-eyebrow text-muted-foreground text-xs">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 border border-border bg-background px-3 py-2 text-sm uppercase tracking-wider focus:outline-none focus:border-accent"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border bg-background/90 p-5 shadow-sm shadow-slate-950/5">
      <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground">{label}</div>
      <div className="mt-3 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
