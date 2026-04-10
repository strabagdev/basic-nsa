"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MissingEnvNotice } from "@/components/missing-env-notice";

type PublicStatusResponse = {
  has_platforms?: boolean;
  platform_name?: string | null;
  env_ready?: boolean;
  schema_ready?: boolean;
  missing_requirements?: string[];
  error?: string;
};

export default function SetupPlatformPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [missingRequirements, setMissingRequirements] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupKey, setSetupKey] = useState("");
  const [platformName, setPlatformName] = useState("");
  const [platformSlug, setPlatformSlug] = useState("");

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const checks: string[] = [];
  if (!normalizedEmail) checks.push("Email requerido");
  if (password.length < 8) checks.push("Contraseña mínimo 8 caracteres");
  if (confirmPassword !== password) checks.push("Confirmación de contraseña no coincide");
  if (!setupKey.trim()) checks.push("Clave de setup requerida");
  if (!platformName.trim()) checks.push("Nombre de plataforma requerido");
  const canSubmit = checks.length === 0;

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/platform/public-status", { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as PublicStatusResponse;
      if (!res.ok) {
        setError(json.error || "No se pudo validar el estado de plataforma.");
        setLoading(false);
        return;
      }
      setMissingRequirements(Array.isArray(json.missing_requirements) ? json.missing_requirements : []);
      if (json.has_platforms) {
        router.replace("/login");
        return;
      }
      setLoading(false);
    })();
  }, [router]);

  async function createPlatform() {
    if (missingRequirements.length > 0) {
      setError("Falta configuración de entorno antes de ejecutar el setup.");
      return;
    }

    if (!canSubmit) {
      setError("Completa todos los campos requeridos.");
      return;
    }

    setBusy(true);
    setError("");
    setOk("");

    const res = await fetch("/api/platform/super-admin/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: normalizedEmail,
        password,
        setupKey: setupKey.trim(),
        platformName: platformName.trim(),
        platformSlug: platformSlug.trim(),
      }),
    });

    const json = (await res.json().catch(() => ({}))) as { error?: string; email?: string; platform?: { name?: string } };
    if (!res.ok) {
      setError(json.error || "No se pudo crear la plataforma inicial.");
      setBusy(false);
      return;
    }

    setOk(
      `Plataforma creada: ${json.platform?.name || platformName.trim()}. Super admin listo para iniciar sesión con ${json.email || normalizedEmail}.`
    );
    setBusy(false);
    setTimeout(() => router.replace("/login"), 1000);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="card-surface rounded-[28px] px-6 py-5 text-sm text-[var(--muted)]">Validando setup inicial...</div>
      </main>
    );
  }

  if (missingRequirements.length > 0) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-6">
        <MissingEnvNotice
          title="Setup bloqueado"
          message={`Antes de crear la plataforma inicial, debes completar esta configuración: ${missingRequirements.join(" · ")}`}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6">
      <div className="card-surface w-full max-w-3xl rounded-[30px] p-6 sm:p-8">
        <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Setup inicial</div>
        <h1 className="mt-3 font-mono text-4xl leading-none tracking-[-0.06em]">Crea la primera plataforma.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
          Este flujo deja creada la plataforma base, su primer super admin y la configuración mínima para empezar a
          montar módulos de negocio encima.
        </p>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="platformName" className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Nombre de plataforma
            </label>
            <input
              id="platformName"
              value={platformName}
              onChange={(event) => setPlatformName(event.target.value)}
              placeholder="Ops Ahead"
              className="mt-2 min-h-12 w-full rounded-[18px] border border-[var(--border)] bg-white px-4 text-sm"
              disabled={busy}
            />
          </div>
          <div>
            <label htmlFor="platformSlug" className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Slug
            </label>
            <input
              id="platformSlug"
              value={platformSlug}
              onChange={(event) => setPlatformSlug(event.target.value)}
              placeholder="ops-ahead"
              className="mt-2 min-h-12 w-full rounded-[18px] border border-[var(--border)] bg-white px-4 text-sm"
              disabled={busy}
            />
          </div>
          <div>
            <label htmlFor="email" className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Email super admin
            </label>
            <input
              id="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="superadmin@empresa.com"
              className="mt-2 min-h-12 w-full rounded-[18px] border border-[var(--border)] bg-white px-4 text-sm"
              disabled={busy}
            />
          </div>
          <div>
            <label htmlFor="setupKey" className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Clave de setup
            </label>
            <input
              id="setupKey"
              value={setupKey}
              onChange={(event) => setSetupKey(event.target.value)}
              type="password"
              placeholder="PLATFORM_SETUP_KEY"
              className="mt-2 min-h-12 w-full rounded-[18px] border border-[var(--border)] bg-white px-4 text-sm"
              disabled={busy}
            />
          </div>
          <div>
            <label htmlFor="password" className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Contraseña
            </label>
            <input
              id="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="mt-2 min-h-12 w-full rounded-[18px] border border-[var(--border)] bg-white px-4 text-sm"
              disabled={busy}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              className="mt-2 min-h-12 w-full rounded-[18px] border border-[var(--border)] bg-white px-4 text-sm"
              disabled={busy}
            />
          </div>
        </div>

        {error ? <p className="mt-5 text-sm leading-6 text-[var(--danger)]">{error}</p> : null}
        {ok ? <p className="mt-5 text-sm leading-6 text-[var(--accent-strong)]">{ok}</p> : null}
        {!canSubmit ? <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Falta: {checks.join(" · ")}</p> : null}

        <button
          type="button"
          onClick={createPlatform}
          disabled={busy}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[linear-gradient(180deg,var(--accent),var(--accent-strong))] px-5 text-sm font-semibold text-white"
        >
          {busy ? "Creando plataforma..." : "Crear plataforma inicial"}
        </button>
      </div>
    </main>
  );
}
