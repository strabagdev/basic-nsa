"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MissingEnvNotice } from "@/components/missing-env-notice";
import { getSupabasePublicEnvErrorMessage, hasSupabasePublicEnv } from "@/lib/env";
import { supabaseAuth } from "@/lib/supabase/authClient";

type BusyAction = "password" | "magic-link" | "google" | null;

export default function LoginPage() {
  const router = useRouter();
  const [missingEnvMessage] = useState(() =>
    hasSupabasePublicEnv() ? "" : getSupabasePublicEnvErrorMessage()
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busyAction, setBusyAction] = useState<BusyAction>(null);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  useEffect(() => {
    if (missingEnvMessage) return;

    let cancelled = false;

    void (async () => {
      const { data } = await supabaseAuth.auth.getSession();
      if (!cancelled && data.session) {
        router.replace("/dashboard");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [missingEnvMessage, router]);

  if (missingEnvMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-6">
        <MissingEnvNotice
          title="Login no disponible todavía"
          message={`${missingEnvMessage} Crea tu .env.local o configura esas variables en Vercel para habilitar autenticación.`}
        />
      </main>
    );
  }

  async function loginWithPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!normalizedEmail || !password) {
      setMessage("Ingresa email y contraseña.");
      return;
    }

    setBusyAction("password");
    try {
      const { error } = await supabaseAuth.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      router.replace("/dashboard");
    } finally {
      setBusyAction(null);
    }
  }

  async function sendMagicLink() {
    setMessage("");
    if (!normalizedEmail) {
      setMessage("Primero ingresa tu email.");
      return;
    }

    setBusyAction("magic-link");
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabaseAuth.auth.signInWithOtp({
        email: normalizedEmail,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Te enviamos un magic link a tu correo.");
    } finally {
      setBusyAction(null);
    }
  }

  async function continueWithGoogle() {
    setMessage("");
    setBusyAction("google");
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabaseAuth.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        setMessage(error.message);
      }
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl items-stretch overflow-hidden rounded-[34px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.46))] shadow-[0_36px_80px_-46px_rgba(19,34,38,0.42)] backdrop-blur-xl">
        <section className="hidden flex-1 flex-col justify-between bg-[linear-gradient(160deg,#113730_0%,#0f766e_58%,#e97831_180%)] p-8 text-white lg:flex">
          <div>
            <div className="inline-flex rounded-full border border-white/18 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em]">
              Base reusable
            </div>
            <h1 className="mt-6 max-w-md font-mono text-5xl leading-none tracking-[-0.07em]">
              Login listo para partir cualquier SaaS interno.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/78">
              Usa correo y contraseña, magic link u OAuth. Luego monta encima la lógica del negocio sin rehacer auth.
            </p>
          </div>

          <div className="grid gap-3">
            {["Vercel-friendly redirects", "Sync de perfil al iniciar sesión", "Pantallas privadas listas"].map((item) => (
              <div key={item} className="rounded-[20px] border border-white/12 bg-white/10 px-4 py-3 text-sm">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="flex w-full flex-1 items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-md rounded-[30px] border border-[var(--border)] bg-white/82 p-6 shadow-[0_24px_60px_-34px_rgba(19,34,38,0.28)] sm:p-8">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Acceso base</div>
            <h2 className="mt-3 font-mono text-4xl leading-none tracking-[-0.06em]">Iniciar sesión</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Punto de entrada genérico para cualquier proyecto que herede esta base.
            </p>

            <form onSubmit={loginWithPassword} className="mt-7 space-y-4">
              <div>
                <label htmlFor="email" className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
                  Email
                </label>
                <input
                  id="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@empresa.com"
                  type="email"
                  autoComplete="email"
                  className="mt-2 min-h-12 w-full rounded-[18px] border border-[var(--border)] bg-white px-4 text-sm"
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
                  placeholder="••••••••"
                  type="password"
                  autoComplete="current-password"
                  className="mt-2 min-h-12 w-full rounded-[18px] border border-[var(--border)] bg-white px-4 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={busyAction !== null}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[linear-gradient(180deg,var(--accent),var(--accent-strong))] px-5 text-sm font-semibold text-white"
              >
                {busyAction === "password" ? "Entrando..." : "Entrar"}
              </button>
            </form>

            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={sendMagicLink}
                disabled={busyAction !== null}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[var(--border)] bg-white px-5 text-sm font-medium"
              >
                {busyAction === "magic-link" ? "Enviando..." : "Enviar magic link"}
              </button>

              <button
                type="button"
                onClick={continueWithGoogle}
                disabled={busyAction !== null}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[var(--border)] bg-[var(--accent-soft)] px-5 text-sm font-medium"
              >
                {busyAction === "google" ? "Abriendo Google..." : "Continuar con Google"}
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between text-sm text-[var(--muted)]">
              <Link href="/reset-password" className="hover:text-[var(--foreground)]">
                ¿Olvidaste tu contraseña?
              </Link>
              <Link href="/" className="hover:text-[var(--foreground)]">
                Volver al inicio
              </Link>
            </div>

            {message ? (
              <div className="mt-5 rounded-[18px] border border-[var(--border)] bg-[var(--accent-soft)]/60 px-4 py-3 text-sm leading-6 text-[var(--foreground)]">
                {message}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
