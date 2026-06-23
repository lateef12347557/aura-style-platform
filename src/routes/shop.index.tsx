import { createFileRoute } from "@tanstack/react-router";
import { ShopGrid } from "@/components/store/ShopGrid";

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title: "Shop — MDCLASSIC WEARS" },
      {
        name: "description",
        content: "Browse the entire MDCLASSIC WEARS collection of shoes and ready-to-wear.",
      },
      { property: "og:title", content: "Shop — MDCLASSIC WEARS" },
      { property: "og:url", content: "/shop" },
    ],
    links: [{ rel: "canonical", href: "/shop" }],
  }),
  component: () => <ShopGrid title="All" eyebrow="The full edit" />,
});
