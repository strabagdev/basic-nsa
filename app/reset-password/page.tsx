"use client";

import { useEffect, useState } from "react";
import { MissingEnvNotice } from "@/components/missing-env-notice";
import { getSupabasePublicEnvErrorMessage, hasSupabasePublicEnv } from "@/lib/env";
import { supabaseAuth } from "@/lib/supabase/authClient";

export default function ResetPasswordPage() {
  const [missingEnvMessage] = useState(() =>
    hasSupabasePublicEnv() ? "" : getSupabasePublicEnvErrorMessage()
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [readyToUpdate, setReadyToUpdate] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (missingEnvMessage) return;

    void (async () => {
      const { data } = await supabaseAuth.auth.getSession();
      if (data.session) setReadyToUpdate(true);
    })();
  }, [missingEnvMessage]);

  if (missingEnvMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-6">
        <MissingEnvNotice
          title="Recuperación no disponible"
          message={`${missingEnvMessage} Configura Supabase primero para habilitar envío de recovery links y cambio de contraseña.`}
        />
      </main>
    );
  }

  async function requestResetLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabaseAuth.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Te enviamos un enlace para restablecer tu contraseña.");
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const { error } = await supabaseAuth.auth.updateUser({ password });
      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Contraseña actualizada. Ya puedes volver al login.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6">
      <div className="card-surface w-full max-w-lg rounded-[30px] p-6 sm:p-8">
        <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Reset password</div>
        <h1 className="mt-3 font-mono text-4xl leading-none tracking-[-0.06em]">
          {readyToUpdate ? "Define tu nueva contraseña" : "Solicita el enlace de recuperación"}
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          La misma pantalla sirve para pedir el correo de recuperación y para actualizar la contraseña una vez que el
          usuario vuelve desde Supabase.
        </p>

        {readyToUpdate ? (
          <form onSubmit={updatePassword} className="mt-7 space-y-4">
            <div>
              <label htmlFor="password" className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
                Nueva contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-[18px] border border-[var(--border)] bg-white px-4 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[linear-gradient(180deg,var(--accent),var(--accent-strong))] px-5 text-sm font-semibold text-white"
            >
              {busy ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </form>
        ) : (
          <form onSubmit={requestResetLink} className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-[18px] border border-[var(--border)] bg-white px-4 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[linear-gradient(180deg,var(--accent),var(--accent-strong))] px-5 text-sm font-semibold text-white"
            >
              {busy ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>
        )}

        {message ? <p className="mt-5 text-sm leading-6 text-[var(--muted)]">{message}</p> : null}
      </div>
    </main>
  );
}
