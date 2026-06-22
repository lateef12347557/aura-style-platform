import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StoreLayout } from "@/components/store/StoreLayout";
import { z } from "zod";

const shopSearchSchema = z.object({
  sort: z.enum(["newest", "price_asc", "price_desc", "best_rated"]).optional().catch("newest"),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
});

export type ShopSearchParams = z.infer<typeof shopSearchSchema>;

export const Route = createFileRoute("/shop")({
  validateSearch: (search) => shopSearchSchema.parse(search),
  component: () => (
    <StoreLayout>
      <Outlet />
    </StoreLayout>
  ),
});