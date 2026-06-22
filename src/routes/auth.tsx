import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { StoreLayout } from "@/components/store/StoreLayout";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — ATELIER" },
      { name: "description", content: "Sign in or create an ATELIER account." },
    ],
    links: [{ rel: "canonical", href: "/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/account" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "sign-up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created.");
        navigate({ to: "/account" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        navigate({ to: "/account" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google sign-in failed");
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/account" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    }
  }

  return (
    <StoreLayout>
      <div className="mx-auto max-w-md px-4 py-24">
        <div className="editorial-eyebrow text-muted-foreground text-center mb-3">Account</div>
        <h1 className="font-display text-3xl text-center mb-10">
          {mode === "sign-in" ? "Welcome back" : "Create your account"}
        </h1>

        <button
          onClick={onGoogle}
          className="w-full border border-primary py-3 text-sm uppercase tracking-wider mb-4 hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Continue with Google
        </button>
        <div className="flex items-center gap-3 my-6 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "sign-up" && (
            <div>
              <label className="editorial-eyebrow text-muted-foreground">Name</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full mt-1 border border-border bg-background px-3 py-2.5 focus:outline-none focus:border-accent"
              />
            </div>
          )}
          <div>
            <label className="editorial-eyebrow text-muted-foreground">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 border border-border bg-background px-3 py-2.5 focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="editorial-eyebrow text-muted-foreground">Password</label>
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 border border-border bg-background px-3 py-2.5 focus:outline-none focus:border-accent"
            />
          </div>
          <button
            disabled={busy}
            className="w-full bg-primary text-primary-foreground py-3 text-sm uppercase tracking-wider hover:bg-accent disabled:opacity-50"
          >
            {busy ? "…" : mode === "sign-in" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
          className="block mx-auto mt-6 text-sm underline text-muted-foreground"
        >
          {mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>

        <p className="mt-12 text-xs text-center text-muted-foreground">
          <Link to="/">← Back to shopping</Link>
        </p>
      </div>
    </StoreLayout>
  );
}