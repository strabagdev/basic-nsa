"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

type Member = {
  id: string;
  role: string;
  status: string;
  invited_email: string | null;
  email: string;
  full_name: string | null;
  user_id: string | null;
};

export default function SuperAdminPage() {
  const router = useRouter();
  const [activeMembership, setActiveMembership] = useState<Membership | null>(null);
  const [manageablePlatforms, setManageablePlatforms] = useState<Membership[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [platformName, setPlatformName] = useState("");
  const [platformSlug, setPlatformSlug] = useState("");
  const [platformDescription, setPlatformDescription] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("platform_user");

  async function getToken() {
    const { data } = await supabaseAuth.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      router.replace("/login");
      return null;
    }
    return token;
  }

  async function load() {
    setLoading(true);
    setError("");

    const token = await getToken();
    if (!token) return;

    const [bootstrapRes, manageRes, membersRes] = await Promise.all([
      fetch("/api/app/bootstrap", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/platforms/manage", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/platform/members", { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const bootstrapJson = await bootstrapRes.json().catch(() => ({}));
    const manageJson = await manageRes.json().catch(() => ({}));
    const membersJson = await membersRes.json().catch(() => ({}));

    if (!bootstrapRes.ok) {
      setError(bootstrapJson.error || "No se pudo cargar el estado actual.");
      setLoading(false);
      return;
    }

    if (!bootstrapJson.access?.active_membership || bootstrapJson.access.active_membership.role !== "super_admin") {
      router.replace("/dashboard");
      return;
    }

    setActiveMembership(bootstrapJson.access.active_membership as Membership);
    setManageablePlatforms(Array.isArray(manageJson.manageable_platforms) ? manageJson.manageable_platforms : []);
    setMembers(Array.isArray(membersJson.members) ? membersJson.members : []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createPlatform(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const token = await getToken();
    if (!token) return;

    const res = await fetch("/api/platforms/manage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: platformName,
        slug: platformSlug,
        description: platformDescription,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || "No se pudo crear la plataforma.");
      return;
    }

    setPlatformName("");
    setPlatformSlug("");
    setPlatformDescription("");
    setMessage(`Plataforma creada: ${json.platform?.platform_name || "nueva plataforma"}.`);
    await load();
  }

  async function inviteMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const token = await getToken();
    if (!token) return;

    const res = await fetch("/api/platform/members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: inviteEmail,
        role: inviteRole,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || "No se pudo invitar al miembro.");
      return;
    }

    setInviteEmail("");
    setInviteRole("platform_user");
    setMessage(`Invitación/asignación enviada a ${json.invited?.email || "usuario"}.`);
    await load();
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="card-surface rounded-[28px] px-6 py-5 text-sm text-[var(--muted)]">Cargando super admin...</div>
      </main>
    );
  }

  return (
    <main className="grid gap-6">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="card-surface rounded-[30px] p-6 sm:p-8">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Super admin</div>
          <h1 className="mt-3 font-mono text-4xl leading-none tracking-[-0.06em]">Gestiona plataformas y accesos.</h1>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            El usuario autenticado sigue siendo global, pero aquí defines en qué plataformas entra y con qué rol.
          </p>
          {activeMembership ? (
            <div className="mt-5 rounded-[20px] border border-[var(--border)] bg-white/82 px-4 py-3 text-sm">
              Plataforma activa: <strong>{activeMembership.platform_name}</strong>
            </div>
          ) : null}
          {error ? <p className="mt-5 text-sm leading-6 text-[var(--danger)]">{error}</p> : null}
          {message ? <p className="mt-5 text-sm leading-6 text-[var(--accent-strong)]">{message}</p> : null}
        </article>

        <article className="card-surface rounded-[30px] p-6 sm:p-8">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Atajos</div>
          <div className="mt-4 grid gap-3">
            <button
              type="button"
              onClick={() => router.replace("/select-platform")}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-white/80 px-5 text-sm font-medium"
            >
              Cambiar plataforma activa
            </button>
            <button
              type="button"
              onClick={() => router.replace("/dashboard")}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-white/80 px-5 text-sm font-medium"
            >
              Volver al dashboard
            </button>
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={createPlatform} className="card-surface rounded-[30px] p-6 sm:p-8">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Nueva plataforma</div>
          <div className="mt-5 grid gap-4">
            <input
              value={platformName}
              onChange={(event) => setPlatformName(event.target.value)}
              placeholder="Nombre"
              className="min-h-12 rounded-[18px] border border-[var(--border)] bg-white px-4 text-sm"
            />
            <input
              value={platformSlug}
              onChange={(event) => setPlatformSlug(event.target.value)}
              placeholder="Slug"
              className="min-h-12 rounded-[18px] border border-[var(--border)] bg-white px-4 text-sm"
            />
            <textarea
              value={platformDescription}
              onChange={(event) => setPlatformDescription(event.target.value)}
              placeholder="Descripción breve"
              className="min-h-28 rounded-[18px] border border-[var(--border)] bg-white px-4 py-3 text-sm"
            />
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(180deg,var(--accent),var(--accent-strong))] px-5 text-sm font-semibold text-white"
            >
              Crear plataforma
            </button>
          </div>
        </form>

        <form onSubmit={inviteMember} className="card-surface rounded-[30px] p-6 sm:p-8">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Invitar miembro</div>
          <div className="mt-5 grid gap-4">
            <input
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="usuario@empresa.com"
              type="email"
              className="min-h-12 rounded-[18px] border border-[var(--border)] bg-white px-4 text-sm"
            />
            <select
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value)}
              className="min-h-12 rounded-[18px] border border-[var(--border)] bg-white px-4 text-sm"
            >
              <option value="platform_user">Usuario</option>
              <option value="platform_admin">Admin</option>
              <option value="super_admin">Super admin</option>
            </select>
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(180deg,var(--accent),var(--accent-strong))] px-5 text-sm font-semibold text-white"
            >
              Invitar o asignar
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="card-surface rounded-[30px] p-6 sm:p-8">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Plataformas que gestionas</div>
          <div className="mt-4 space-y-3">
            {manageablePlatforms.map((platform) => (
              <div key={platform.membership_id} className="rounded-[18px] border border-[var(--border)] bg-white/82 px-4 py-3">
                <div className="font-medium">{platform.platform_name}</div>
                <div className="text-sm text-[var(--muted)]">{platform.platform_slug}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="card-surface rounded-[30px] p-6 sm:p-8">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Miembros de la plataforma activa</div>
          <div className="mt-4 space-y-3">
            {members.map((member) => (
              <div key={member.id} className="rounded-[18px] border border-[var(--border)] bg-white/82 px-4 py-3">
                <div className="font-medium">{member.full_name || member.email}</div>
                <div className="text-sm text-[var(--muted)]">
                  {member.role} · {member.status}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
