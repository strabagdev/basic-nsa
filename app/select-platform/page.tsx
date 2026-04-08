"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MissingEnvNotice } from "@/components/missing-env-notice";
import { getSupabasePublicEnvErrorMessage, hasSupabasePublicEnv } from "@/lib/env";
import { supabaseAuth } from "@/lib/supabase/authClient";

type Membership = {
  membership_id: string;
  platform_id: string;
  platform_name: string;
  platform_slug: string;
  platform_description: string | null;
  platform_logo_url: string | null;
  role: "super_admin" | "platform_admin" | "platform_user";
};

function roleLabel(role: Membership["role"]) {
  if (role === "super_admin") return "Super admin";
  if (role === "platform_admin") return "Admin";
  return "Usuario";
}

export default function SelectPlatformPage() {
  const router = useRouter();
  const [missingEnvMessage] = useState(() =>
    hasSupabasePublicEnv() ? "" : getSupabasePublicEnvErrorMessage()
  );
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [canCreatePlatforms, setCanCreatePlatforms] = useState(false);
  const [hasPlatforms, setHasPlatforms] = useState(true);

  useEffect(() => {
    if (missingEnvMessage) return;

    void (async () => {
      const { data } = await supabaseAuth.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch("/api/platforms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "No se pudieron cargar tus plataformas.");
        setLoading(false);
        return;
      }

      const list = Array.isArray(json.memberships) ? (json.memberships as Membership[]) : [];
      setMemberships(list);
      setCanCreatePlatforms(Boolean(json.can_create_platforms));
      setHasPlatforms(Boolean(json.has_platforms));

      if (!json.has_platforms) {
        router.replace("/setup-platform");
        return;
      }

      if (list.length === 1) {
        const setRes = await fetch("/api/platforms/active", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ platformId: list[0].platform_id }),
        });

        if (setRes.ok) {
          router.replace("/dashboard");
          return;
        }
      }

      setLoading(false);
    })();
  }, [missingEnvMessage, router]);

  async function choosePlatform(platformId: string) {
    setBusyId(platformId);
    setError("");

    const { data } = await supabaseAuth.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      router.replace("/login");
      return;
    }

    const res = await fetch("/api/platforms/active", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ platformId }),
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(json.error || "No se pudo activar la plataforma.");
      setBusyId("");
      return;
    }

    router.replace("/dashboard");
  }

  if (missingEnvMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-6">
        <MissingEnvNotice
          title="Selección no disponible"
          message={`${missingEnvMessage} Configura Supabase primero para listar plataformas.`}
        />
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="card-surface rounded-[28px] px-6 py-5 text-sm text-[var(--muted)]">Cargando plataformas...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="card-surface rounded-[30px] p-6 sm:p-8">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Contexto activo</div>
          <h1 className="mt-3 font-mono text-4xl leading-none tracking-[-0.06em]">Elige en qué plataforma entrar.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            Tu identidad viene desde Supabase Auth, pero el rol y el acceso se resuelven por plataforma.
          </p>

          {error ? <p className="mt-5 text-sm leading-6 text-[var(--danger)]">{error}</p> : null}

          {memberships.length === 0 ? (
            <div className="mt-6 rounded-[22px] border border-[var(--border)] bg-white/80 p-5">
              <div className="text-lg font-semibold">Tu usuario aún no tiene membresías.</div>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Iniciaste sesión correctamente, pero todavía no estás asignado a ninguna plataforma.
              </p>
              {canCreatePlatforms || !hasPlatforms ? (
                <button
                  type="button"
                  onClick={() => router.replace("/setup-platform")}
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(180deg,var(--accent),var(--accent-strong))] px-5 text-sm font-semibold text-white"
                >
                  Ir al setup inicial
                </button>
              ) : null}
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {memberships.map((membership) => (
                <article key={membership.membership_id} className="rounded-[24px] border border-[var(--border)] bg-white/82 p-5">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">{roleLabel(membership.role)}</div>
                  <h2 className="mt-3 text-2xl font-semibold">{membership.platform_name}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {membership.platform_description || `Slug: ${membership.platform_slug}`}
                  </p>
                  <button
                    type="button"
                    onClick={() => choosePlatform(membership.platform_id)}
                    disabled={busyId !== "" && busyId !== membership.platform_id}
                    className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(180deg,var(--accent),var(--accent-strong))] px-5 text-sm font-semibold text-white"
                  >
                    {busyId === membership.platform_id ? "Entrando..." : "Entrar a la plataforma"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
