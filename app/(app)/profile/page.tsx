"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseAuth } from "@/lib/supabase/authClient";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data } = await supabaseAuth.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (!cancelled) setMessage(json.error || "No se pudo cargar el perfil.");
        return;
      }

      if (!cancelled) {
        const nextProfile = json.profile as Profile | null;
        setProfile(nextProfile);
        setFullName(nextProfile?.full_name ?? "");
        setAvatarUrl(nextProfile?.avatar_url ?? "");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSaving(true);

    try {
      const { data } = await supabaseAuth.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        router.replace("/login");
        return;
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage(json.error || "No se pudo guardar el perfil.");
        return;
      }

      setProfile(json.profile as Profile);
      setMessage("Perfil actualizado.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="card-surface rounded-[30px] p-6 sm:p-8">
        <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Perfil base</div>
        <h1 className="mt-3 font-mono text-4xl leading-none tracking-[-0.06em]">Datos transversales del usuario.</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)] sm:text-base">
          Este perfil es deliberadamente mínimo. Sirve como bloque inicial para cualquier producto que necesite nombre,
          email, avatar y metadatos básicos.
        </p>
      </section>

      <section className="card-surface rounded-[30px] p-6 sm:p-8">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Email
            </label>
            <input
              id="email"
              disabled
              value={profile?.email ?? ""}
              className="mt-2 min-h-12 w-full rounded-[18px] border border-[var(--border)] bg-white/75 px-4 text-sm text-[var(--muted)]"
            />
          </div>

          <div>
            <label htmlFor="fullName" className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Nombre
            </label>
            <input
              id="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Tu nombre"
              className="mt-2 min-h-12 w-full rounded-[18px] border border-[var(--border)] bg-white/88 px-4 text-sm"
            />
          </div>

          <div>
            <label htmlFor="avatarUrl" className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Avatar URL
            </label>
            <input
              id="avatarUrl"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://..."
              className="mt-2 min-h-12 w-full rounded-[18px] border border-[var(--border)] bg-white/88 px-4 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(180deg,var(--accent),var(--accent-strong))] px-5 text-sm font-semibold text-white"
          >
            {saving ? "Guardando..." : "Guardar perfil"}
          </button>

          {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
        </form>
      </section>
    </main>
  );
}
