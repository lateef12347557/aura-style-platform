import { createFileRoute, Outlet, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/shop/$gender")({
  beforeLoad: ({ params }) => {
    if (!["men", "women"].includes(params.gender)) throw notFound();
  },
  component: () => <Outlet />,
});
