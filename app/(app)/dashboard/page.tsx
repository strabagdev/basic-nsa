 "use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseAuth } from "@/lib/supabase/authClient";

const cards = [
  {
    title: "Identidad global",
    description: "Supabase Auth sigue siendo el nexo común para login, reset password y validación del usuario.",
  },
  {
    title: "Acceso por plataforma",
    description: "Cada producto decide el rol del usuario según memberships y la plataforma activa seleccionada.",
  },
  {
    title: "Kernel replicable",
    description: "Desde esta base puedes montar superadmin, admins y módulos del negocio sin rearmar auth.",
  },
];

type BootstrapResponse = {
  access?: {
    active_membership?: {
      platform_name: string;
      platform_slug: string;
      role: string;
    } | null;
    memberships?: Array<{ membership_id: string }>;
  };
  settings?: {
    platform_name?: string | null;
  };
  profile?: {
    full_name?: string | null;
    email?: string | null;
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await supabaseAuth.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch("/api/app/bootstrap", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json().catch(() => ({}))) as BootstrapResponse & { error?: string };
      if (!res.ok) {
        setError(json.error || "No se pudo cargar el dashboard.");
        setLoading(false);
        return;
      }

      if (!json.access?.active_membership) {
        router.replace("/select-platform");
        return;
      }

      setBootstrap(json);
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="card-surface rounded-[28px] px-6 py-5 text-sm text-[var(--muted)]">Cargando dashboard...</div>
      </main>
    );
  }

  return (
    <main className="grid gap-6">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="card-surface rounded-[30px] p-6 sm:p-8">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Dashboard base</div>
          <h1 className="mt-3 max-w-2xl font-mono text-4xl leading-none tracking-[-0.06em]">
            {bootstrap?.access?.active_membership?.platform_name || "Punto de partida listo para clonar"}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
            Esta plataforma está activa para{" "}
            <strong>{bootstrap?.profile?.full_name || bootstrap?.profile?.email || "el usuario actual"}</strong> con
            rol <strong>{bootstrap?.access?.active_membership?.role || "sin definir"}</strong>. Desde aquí puedes sumar
            módulos del negocio manteniendo identidad global y permisos locales.
          </p>
          {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}
        </article>

        <article className="card-surface rounded-[30px] p-6 sm:p-8">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Checklist</div>
          <div className="mt-4 space-y-3">
            {[
              "Variables de entorno cargadas",
              "Tabla profiles creada en Supabase",
              "Kernel de plataformas creado",
              "Membership activa seleccionada",
            ].map((item) => (
              <div key={item} className="rounded-[18px] border border-[var(--border)] bg-white/82 px-4 py-3 text-sm">
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.title} className="card-surface rounded-[26px] p-5">
            <h2 className="text-lg font-semibold">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{card.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
