"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { MissingEnvNotice } from "@/components/missing-env-notice";
import { getSupabasePublicEnvErrorMessage, hasSupabasePublicEnv } from "@/lib/env";
import { supabaseAuth } from "@/lib/supabase/authClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [missingEnvMessage] = useState(() =>
    hasSupabasePublicEnv() ? "" : getSupabasePublicEnvErrorMessage()
  );
  const [message, setMessage] = useState("Finalizando autenticación...");

  useEffect(() => {
    if (missingEnvMessage) return;

    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const type = params.get("type") as EmailOtpType | null;

      if (code) {
        const { error } = await supabaseAuth.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(error.message);
          return;
        }
      } else if (tokenHash && type) {
        const { error } = await supabaseAuth.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });
        if (error) {
          setMessage(error.message);
          return;
        }
      }

      const { data } = await supabaseAuth.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        router.replace("/login");
        return;
      }

      const syncRes = await fetch("/api/profile/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!syncRes.ok) {
        const json = await syncRes.json().catch(() => ({}));
        setMessage(json.error || "No se pudo sincronizar el perfil.");
        return;
      }

      const destination = type === "recovery" ? "/reset-password" : "/select-platform";
      router.replace(destination);
    })();
  }, [missingEnvMessage, router]);

  if (missingEnvMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <MissingEnvNotice
          title="Callback no disponible"
          message={`${missingEnvMessage} Sin esas variables no se puede completar el intercambio de sesión con Supabase.`}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card-surface max-w-lg rounded-[30px] p-6 text-center sm:p-8">
        <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Auth callback</div>
        <h1 className="mt-3 font-mono text-4xl leading-none tracking-[-0.06em]">Estamos cerrando tu acceso.</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{message}</p>
      </div>
    </main>
  );
}
