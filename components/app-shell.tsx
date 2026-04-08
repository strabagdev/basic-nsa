"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabasePublicEnvErrorMessage, hasSupabasePublicEnv } from "@/lib/env";
import { supabaseAuth } from "@/lib/supabase/authClient";

type MeResponse = {
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    last_seen_at: string | null;
  } | null;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Perfil" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [missingEnvMessage] = useState(() =>
    hasSupabasePublicEnv() ? "" : getSupabasePublicEnvErrorMessage()
  );
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState<string>("");

  useEffect(() => {
    if (missingEnvMessage) {
      setError(missingEnvMessage);
      setChecking(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const { data } = await supabaseAuth.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          router.replace("/login");
          return;
        }

        const profileSyncRes = await fetch("/api/profile/sync", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!profileSyncRes.ok) {
          throw new Error("No se pudo sincronizar el perfil base.");
        }

        const meRes = await fetch("/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meJson = (await meRes.json().catch(() => ({}))) as MeResponse;

        if (!meRes.ok) {
          throw new Error("No se pudo cargar el perfil actual.");
        }

        if (!cancelled) {
          setFullName(meJson.profile?.full_name || meJson.profile?.email || "");
          setChecking(false);
        }
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : "No se pudo validar la sesión.");
          setChecking(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [missingEnvMessage, router]);

  async function signOut() {
    await supabaseAuth.auth.signOut();
    router.replace("/login");
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="card-surface rounded-[28px] px-6 py-5 text-sm text-[var(--muted)]">Validando sesión base...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="card-surface max-w-md rounded-[28px] p-6">
          <div className="text-lg font-semibold">No pudimos abrir el área privada</div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{error}</p>
          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(180deg,var(--accent),var(--accent-strong))] px-5 text-sm font-semibold text-white"
          >
            Volver al login
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6">
      <div className="app-shell mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl flex-col rounded-[30px] border border-[var(--border)] shadow-[0_32px_80px_-44px_rgba(19,34,38,0.36)]">
        <header className="flex flex-col gap-4 border-b border-[var(--border)] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Base SaaS</div>
            <div className="mt-1 font-mono text-2xl tracking-[-0.05em]">Plantilla reutilizable</div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium transition ${
                    active
                      ? "bg-[var(--foreground)] text-white"
                      : "border border-[var(--border)] bg-white/72 text-[var(--foreground)] hover:bg-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-[var(--border)] bg-white/75 px-4 py-2 text-sm text-[var(--muted)]">
              {fullName || "Usuario autenticado"}
            </div>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex min-h-10 items-center rounded-full border border-[var(--border)] bg-white/72 px-4 text-sm font-medium text-[var(--foreground)] hover:bg-white"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <div className="flex-1 px-5 py-5 sm:px-6 sm:py-6">{children}</div>
      </div>
    </div>
  );
}
