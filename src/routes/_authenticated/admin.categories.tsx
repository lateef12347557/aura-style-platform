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
  reorderCategories,
} from "@/lib/categories.functions";
import {
  ChevronRight,
  Folder,
  FolderOpen,
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

  // Group categories into parent -> children tree structure
  const { roots, childrenMap } = useMemo(() => {
    const categories = (data ?? []) as Category[];
    const roots: Category[] = [];
    const childrenMap = new Map<string, Category[]>();

    categories.forEach((cat) => {
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
  }, [data]);

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
          className={`flex items-center justify-between py-3 px-4 hover:bg-muted/40 border-b border-border transition-colors ${depth > 0 ? "bg-background/50" : "bg-card"}`}
        >
          <div
            className="flex items-center gap-2 flex-1"
            style={{ paddingLeft: `${depth * 24}px` }}
          >
            {depth > 0 ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-accent shrink-0" />
            )}
            <div className="flex flex-col">
              <span className="font-medium text-sm">{c.name}</span>
              <span className="text-[10px] text-muted-foreground">slug: {c.slug}</span>
            </div>
            {c.image_url && (
              <img
                src={c.image_url}
                alt=""
                className="h-6 w-6 rounded object-cover ml-2 border border-border"
              />
            )}
          </div>

          <div className="flex items-center gap-8 text-xs text-muted-foreground">
            <span className="w-16 uppercase tracking-wider text-[10px] text-center">
              {c.gender}
            </span>
            <span className="w-16 uppercase tracking-wider text-[10px] text-center">{c.type}</span>
            <div className="w-20 text-center flex items-center justify-center">
              <button
                onClick={() => toggle(c.id, !c.is_active)}
                className={`p-1 hover:text-accent transition-colors`}
                title={c.is_active ? "Deactivate" : "Activate"}
              >
                {c.is_active ? (
                  <span className="inline-flex items-center gap-1 text-accent font-medium text-[10px] uppercase">
                    <Eye className="h-3.5 w-3.5" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-muted-foreground text-[10px] uppercase">
                    <EyeOff className="h-3.5 w-3.5" /> Draft
                  </span>
                )}
              </button>
            </div>

            <div className="w-32 flex justify-end gap-2 pr-2">
              <button
                onClick={() => moveCategory(c, "up")}
                className="hover:text-accent p-1 transition-colors"
                title="Move up"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => moveCategory(c, "down")}
                className="hover:text-accent p-1 transition-colors"
                title="Move down"
              >
                <ArrowDown className="h-4 w-4" />
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
                className="hover:text-foreground p-1 transition-colors"
                title="Edit"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
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
        <div className="bg-card border border-border">
          {/* Header row */}
          <div className="flex items-center justify-between py-2.5 px-4 bg-muted/30 border-b border-border text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            <div className="flex-1">Category Tree / Name</div>
            <div className="flex items-center gap-8">
              <span className="w-16 text-center">Gender</span>
              <span className="w-16 text-center">Type</span>
              <span className="w-20 text-center">Status</span>
              <span className="w-20 text-right pr-4">Actions</span>
            </div>
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
