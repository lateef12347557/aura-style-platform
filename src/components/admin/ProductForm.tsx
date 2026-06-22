import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";
import { Trash2, Plus } from "lucide-react";
import { listAllCategories } from "@/lib/categories.functions";
import { upsertProduct } from "@/lib/products.functions";

interface VariantForm { size: string; color: string; stock_quantity: number; price_modifier: number; }
interface ImageForm { image_url: string; alt_text: string; is_primary: boolean; display_order: number; }

export interface ProductFormValues {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  price: number;
  compare_price: number | null;
  sku: string;
  stock_quantity: number;
  is_featured: boolean;
  is_active: boolean;
  meta_title: string;
  meta_description: string;
  images: ImageForm[];
  variants: VariantForm[];
}

export function emptyProduct(): ProductFormValues {
  return {
    name: "", slug: "", description: "", category_id: "",
    price: 0, compare_price: null, sku: "", stock_quantity: 0,
    is_featured: false, is_active: true, meta_title: "", meta_description: "",
    images: [], variants: [],
  };
}

export function ProductForm({ initial }: { initial: ProductFormValues }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<ProductFormValues>(initial);
  const [busy, setBusy] = useState(false);
  const cats = useQuery({ queryKey: ["admin-cats"], queryFn: () => listAllCategories() });

  function update<K extends keyof ProductFormValues>(k: K, v: ProductFormValues[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.category_id) { toast.error("Pick a category"); return; }
    setBusy(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.name, { lower: true, strict: true }),
        price: Number(form.price),
        compare_price: form.compare_price === null || form.compare_price === undefined ? null : Number(form.compare_price),
        stock_quantity: Number(form.stock_quantity),
        description: form.description || null,
        sku: form.sku || null,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
        images: form.images.filter((i) => i.image_url),
        variants: form.variants.filter((v) => v.size || v.color),
      };
      await upsertProduct({ data: payload });
      toast.success("Saved");
      navigate({ to: "/admin/products" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <Section title="Basics">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name"><input value={form.name} onChange={(e) => update("name", e.target.value)} className="inp" /></Field>
          <Field label="Slug"><input value={form.slug} onChange={(e) => update("slug", e.target.value)} placeholder="auto from name" className="inp" /></Field>
          <Field label="SKU"><input value={form.sku} onChange={(e) => update("sku", e.target.value)} className="inp" /></Field>
          <Field label="Category">
            <select value={form.category_id} onChange={(e) => update("category_id", e.target.value)} className="inp">
              <option value="">Select…</option>
              {(cats.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.gender}/{c.type})</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Description"><textarea rows={5} value={form.description} onChange={(e) => update("description", e.target.value)} className="inp" /></Field>
      </Section>

      <Section title="Pricing & stock">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Price"><input type="number" step="0.01" value={form.price} onChange={(e) => update("price", Number(e.target.value))} className="inp" /></Field>
          <Field label="Compare-at price"><input type="number" step="0.01" value={form.compare_price ?? ""} onChange={(e) => update("compare_price", e.target.value ? Number(e.target.value) : null)} className="inp" /></Field>
          <Field label="Stock"><input type="number" value={form.stock_quantity} onChange={(e) => update("stock_quantity", Number(e.target.value))} className="inp" /></Field>
        </div>
        <div className="flex gap-6 mt-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_featured} onChange={(e) => update("is_featured", e.target.checked)} /> Featured</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => update("is_active", e.target.checked)} /> Active</label>
        </div>
      </Section>

      <Section
        title="Images"
        action={<button onClick={() => update("images", [...form.images, { image_url: "", alt_text: "", is_primary: form.images.length === 0, display_order: form.images.length }])} className="text-xs underline flex items-center gap-1"><Plus className="h-3 w-3" /> Add image</button>}
      >
        <p className="text-xs text-muted-foreground -mt-2 mb-3">Paste image URLs (hosted on a CDN or storage you control).</p>
        <div className="space-y-2">
          {form.images.map((img, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={img.image_url} onChange={(e) => update("images", form.images.map((x, idx) => idx === i ? { ...x, image_url: e.target.value } : x))} placeholder="https://…" className="inp flex-1" />
              <input value={img.alt_text} onChange={(e) => update("images", form.images.map((x, idx) => idx === i ? { ...x, alt_text: e.target.value } : x))} placeholder="alt" className="inp w-40" />
              <label className="text-xs flex items-center gap-1"><input type="radio" checked={img.is_primary} onChange={() => update("images", form.images.map((x, idx) => ({ ...x, is_primary: idx === i })))} /> Primary</label>
              <button onClick={() => update("images", form.images.filter((_, idx) => idx !== i))} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Variants"
        action={<button onClick={() => update("variants", [...form.variants, { size: "", color: "", stock_quantity: 0, price_modifier: 0 }])} className="text-xs underline flex items-center gap-1"><Plus className="h-3 w-3" /> Add variant</button>}
      >
        <div className="space-y-2">
          {form.variants.map((v, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input placeholder="Size" value={v.size} onChange={(e) => update("variants", form.variants.map((x, idx) => idx === i ? { ...x, size: e.target.value } : x))} className="inp w-24" />
              <input placeholder="Color" value={v.color} onChange={(e) => update("variants", form.variants.map((x, idx) => idx === i ? { ...x, color: e.target.value } : x))} className="inp w-32" />
              <input type="number" placeholder="Stock" value={v.stock_quantity} onChange={(e) => update("variants", form.variants.map((x, idx) => idx === i ? { ...x, stock_quantity: Number(e.target.value) } : x))} className="inp w-24" />
              <input type="number" step="0.01" placeholder="± Price" value={v.price_modifier} onChange={(e) => update("variants", form.variants.map((x, idx) => idx === i ? { ...x, price_modifier: Number(e.target.value) } : x))} className="inp w-28" />
              <button onClick={() => update("variants", form.variants.filter((_, idx) => idx !== i))} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="SEO">
        <Field label="Meta title"><input value={form.meta_title} onChange={(e) => update("meta_title", e.target.value)} className="inp" /></Field>
        <Field label="Meta description"><textarea rows={3} value={form.meta_description} onChange={(e) => update("meta_description", e.target.value)} className="inp" /></Field>
      </Section>

      <div className="flex gap-3 sticky bottom-0 bg-secondary py-4 -mx-8 px-8 border-t border-border">
        <Link to="/admin/products" className="px-4 py-2 text-sm">Cancel</Link>
        <button onClick={save} disabled={busy} className="bg-primary text-primary-foreground px-6 py-2 text-sm uppercase tracking-wider disabled:opacity-50">
          {busy ? "Saving…" : "Save product"}
        </button>
      </div>

      <style>{`.inp{width:100%;background:var(--background);border:1px solid var(--border);padding:.5rem .75rem;font-size:.875rem}.inp:focus{outline:none;border-color:var(--accent)}`}</style>
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="editorial-eyebrow">{title}</div>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="editorial-eyebrow text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}