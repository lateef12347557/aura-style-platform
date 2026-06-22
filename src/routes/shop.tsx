import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StoreLayout } from "@/components/store/StoreLayout";

export const Route = createFileRoute("/shop")({
  component: () => (
    <StoreLayout>
      <Outlet />
    </StoreLayout>
  ),
});