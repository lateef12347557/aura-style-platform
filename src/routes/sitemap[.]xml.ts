import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sb = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );
        const { data: products } = await sb
          .from("products")
          .select("slug, updated_at")
          .eq("is_active", true);
        const entries: Array<{ path: string; lastmod?: string; priority?: string }> = [
          { path: "/", priority: "1.0" },
          { path: "/shop", priority: "0.9" },
          { path: "/shop/men", priority: "0.8" },
          { path: "/shop/women", priority: "0.8" },
          { path: "/shop/men/shoes", priority: "0.7" },
          { path: "/shop/men/clothing", priority: "0.7" },
          { path: "/shop/women/shoes", priority: "0.7" },
          { path: "/shop/women/clothing", priority: "0.7" },
          ...(products ?? []).map((p) => ({
            path: `/product/${p.slug}`,
            lastmod: p.updated_at,
            priority: "0.6",
          })),
        ];
        const urls = entries.map((e) =>
          [
            "  <url>",
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            "  </url>",
          ]
            .filter(Boolean)
            .join("\n"),
        );
        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...urls,
          "</urlset>",
        ].join("\n");
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});