import { createFileRoute, Link } from "@tanstack/react-router";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Check } from "lucide-react";

export const Route = createFileRoute("/order-confirmation/$id")({
  head: () => ({
    meta: [{ title: "Order confirmed — ATELIER" }, { name: "robots", content: "noindex" }],
  }),
  component: () => {
    const { id } = Route.useParams();
    return (
      <StoreLayout>
        <div className="mx-auto max-w-lg px-4 py-32 text-center">
          <div className="h-14 w-14 rounded-full bg-accent text-accent-foreground flex items-center justify-center mx-auto mb-6">
            <Check className="h-6 w-6" />
          </div>
          <div className="editorial-eyebrow text-muted-foreground mb-2">Thank you</div>
          <h1 className="font-display text-3xl mb-3">Order placed</h1>
          <p className="text-muted-foreground mb-2">Confirmation #{id.slice(0, 8).toUpperCase()}</p>
          <p className="text-sm text-muted-foreground mb-8">We'll send you a note when it ships.</p>
          <Link
            to="/account"
            className="inline-block bg-primary text-primary-foreground px-7 py-3 text-sm uppercase tracking-wider"
          >
            View orders
          </Link>
        </div>
      </StoreLayout>
    );
  },
});
