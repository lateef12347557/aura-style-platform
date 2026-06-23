import { createFileRoute } from "@tanstack/react-router";
import { ShopGrid } from "@/components/store/ShopGrid";

export const Route = createFileRoute("/shop/$gender/")({
  head: ({ params }) => {
    const label = params.gender === "men" ? "Men" : "Women";
    return {
      meta: [
        { title: `${label} — MDCLASSIC WEARS` },
        {
          name: "description",
          content: `${label}'s collection: hand-finished shoes and ready-to-wear.`,
        },
        { property: "og:title", content: `${label} — MDCLASSIC WEARS` },
        { property: "og:url", content: `/shop/${params.gender}` },
      ],
      links: [{ rel: "canonical", href: `/shop/${params.gender}` }],
    };
  },
  component: GenderShop,
});

function GenderShop() {
  const { gender } = Route.useParams();
  const label = gender === "men" ? "Men" : "Women";
  const dbGender = gender === "men" ? "male" : "female";
  return <ShopGrid title={label} eyebrow="Collection" gender={dbGender} />;
}
