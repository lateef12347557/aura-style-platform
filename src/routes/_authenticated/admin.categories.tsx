import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import slugify from "slugify";
import { AdminPage } from "@/components/admin/AdminShell";
import { listAllCategories, upsertCategory, toggleCategoryActive } from "@/lib/categories.functions";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: CategoriesAdmin,
});

function CategoriesAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-cats"], queryFn: () => listAllCategories() });
  const [editing, setEditing] = useState<{ id?: string; name: string; slug: string; gender: "male" | "female" | "unisex"; type: "shoes" | "clothing"; image_url: string; is_active: boolean } | null>(null);

  async function save() {
    if (!editing) return;
    try {
      await upsertCategory({ data: { ...editing, slug: editing.slug || slugify(editing.name, { lower: true }), image_url: editing.image_url || null } });
      toast.success("Saved");
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <AdminPage
      title="Categories"
      eyebrow="Catalog"
      actions={
        <button
          onClick={() => setEditing({ name: "", slug: "", gender: "unisex", type: "clothing", image_url: "", is_active: true })}
          className="bg-primary text-primary-foreground px-4 py-2 text-sm uppercase tracking-wider"
        >
          + New
        </button>
      }
    >
      {isLoading ? <p>Loading…</p> : (
        <div className="bg-card border border-border">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b border-border">
              <tr><th className="text-left p-3">Name</th><th className="text-left">Gender</th><th className="text-left">Type</th><th className="text-left">Slug</th><th>Active</th><th></th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data ?? []).map((c) => (
                <tr key={c.id}>
                  <td className="p-3">{c.name}</td>
                  <td>{c.gender}</td>
                  <td>{c.type}</td>
                  <td className="text-muted-foreground">{c.slug}</td>
                  <td className="text-center">
                    <input type="checkbox" checked={c.is_active} onChange={(e) => toggle(c.id, e.target.checked)} />
                  </td>
                  <td className="text-right pr-3">
                    <button onClick={() => setEditing({ id: c.id, name: c.name, slug: c.slug, gender: c.gender, type: c.type, image_url: c.image_url ?? "", is_active: c.is_active })} className="text-xs underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-background border border-border w-full max-w-md p-6 space-y-4">
            <h2 className="font-display text-2xl">{editing.id ? "Edit category" : "New category"}</h2>
            <Input label="Name" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v, slug: editing.slug || slugify(v, { lower: true }) })} />
            <Input label="Slug" value={editing.slug} onChange={(v) => setEditing({ ...editing, slug: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Select label="Gender" value={editing.gender} options={["male","female","unisex"]} onChange={(v) => setEditing({ ...editing, gender: v as "male" | "female" | "unisex" })} />
              <Select label="Type" value={editing.type} options={["shoes","clothing"]} onChange={(v) => setEditing({ ...editing, type: v as "shoes" | "clothing" })} />
            </div>
            <Input label="Image URL" value={editing.image_url} onChange={(v) => setEditing({ ...editing, image_url: v })} />
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm">Cancel</button>
              <button onClick={save} className="bg-primary text-primary-foreground px-4 py-2 text-sm uppercase tracking-wider">Save</button>
            </div>
          </div>
        </div>
      )}
    </AdminPage>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="editorial-eyebrow text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full mt-1 border border-border bg-background px-3 py-2" />
    </div>
  );
}
function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="editorial-eyebrow text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full mt-1 border border-border bg-background px-3 py-2">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}