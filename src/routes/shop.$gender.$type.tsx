import { createFileRoute, notFound } from "@tanstack/react-router";
import { ShopGrid } from "@/components/store/ShopGrid";

export const Route = createFileRoute("/shop/$gender/$type")({
  beforeLoad: ({ params }) => {
    if (!["men", "women"].includes(params.gender)) throw notFound();
    if (!["shoes", "clothing"].includes(params.type)) throw notFound();
  },
  head: ({ params }) => {
    const label = `${params.gender === "men" ? "Men" : "Women"}'s ${params.type === "shoes" ? "Shoes" : "Clothing"}`;
    return {
      meta: [
        { title: `${label} — ATELIER` },
        { name: "description", content: `Shop ${label.toLowerCase()} from ATELIER.` },
        { property: "og:title", content: `${label} — ATELIER` },
        { property: "og:url", content: `/shop/${params.gender}/${params.type}` },
      ],
      links: [{ rel: "canonical", href: `/shop/${params.gender}/${params.type}` }],
    };
  },
  component: GenderTypeShop,
});

function GenderTypeShop() {
  const { gender, type } = Route.useParams();
  const label = `${gender === "men" ? "Men" : "Women"}'s ${type === "shoes" ? "Shoes" : "Clothing"}`;
  return (
    <ShopGrid
      title={label}
      eyebrow="Collection"
      gender={gender === "men" ? "male" : "female"}
      type={type as "shoes" | "clothing"}
    />
  );
}
