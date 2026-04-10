"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MissingEnvNotice } from "@/components/missing-env-notice";
import { getSupabasePublicEnvErrorMessage, hasSupabasePublicEnv } from "@/lib/env";
import { supabaseAuth } from "@/lib/supabase/authClient";

type PublicStatusResponse = {
  has_platforms?: boolean;
  env_ready?: boolean;
  schema_ready?: boolean;
  missing_requirements?: string[];
  error?: string;
};

type BootstrapResponse = {
  access?: {
    active_membership?: {
      role: "super_admin" | "platform_admin" | "platform_user";
    } | null;
    memberships?: Array<{ membership_id: string }>;
  };
  public_status?: {
    has_platforms?: boolean;
  };
  error?: string;
};

export default function HomePage() {
  const router = useRouter();
  const [message, setMessage] = useState("Cargando acceso...");
  const [blockingMessage, setBlockingMessage] = useState("");
  const [blockingRequirements, setBlockingRequirements] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      setMessage("Validando estado de plataforma...");
      const publicStatusRes = await fetch("/api/platform/public-status", { cache: "no-store" });
      const publicStatusJson = (await publicStatusRes.json().catch(() => ({}))) as PublicStatusResponse;

      if (!publicStatusRes.ok) {
        setBlockingRequirements([]);
        setBlockingMessage(publicStatusJson.error || "No se pudo cargar el estado inicial.");
        return;
      }

      if (publicStatusJson.env_ready === false) {
        setBlockingRequirements(publicStatusJson.missing_requirements ?? []);
        setBlockingMessage((publicStatusJson.missing_requirements ?? []).join(" · ") || "Falta configuración de entorno.");
        return;
      }

      if (publicStatusJson.schema_ready === false) {
        setBlockingRequirements(publicStatusJson.missing_requirements ?? []);
        setBlockingMessage(
          (publicStatusJson.missing_requirements ?? []).join(" · ") ||
            "Falta ejecutar el SQL base antes de continuar."
        );
        return;
      }

      if (publicStatusJson.has_platforms === false) {
        router.replace("/setup-platform");
        return;
      }

      if (!hasSupabasePublicEnv()) {
        setBlockingRequirements([
          "NEXT_PUBLIC_SUPABASE_AUTH_URL",
          "NEXT_PUBLIC_SUPABASE_AUTH_ANON_KEY",
        ]);
        setBlockingMessage(getSupabasePublicEnvErrorMessage());
        return;
      }

      setMessage("Validando sesión...");
      const { data } = await supabaseAuth.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        router.replace("/login");
        return;
      }

      setMessage("Cargando acceso...");
      const bootstrapRes = await fetch("/api/app/bootstrap", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bootstrapJson = (await bootstrapRes.json().catch(() => ({}))) as BootstrapResponse;

      if (!bootstrapRes.ok) {
        setBlockingRequirements([]);
        setBlockingMessage(bootstrapJson.error || "No se pudo cargar el bootstrap inicial.");
        return;
      }

      if (bootstrapJson.public_status?.has_platforms === false) {
        router.replace("/setup-platform");
        return;
      }

      if (bootstrapJson.access?.active_membership?.role === "super_admin") {
        router.replace("/super-admin");
        return;
      }

      if (bootstrapJson.access?.active_membership) {
        router.replace("/dashboard");
        return;
      }

      router.replace("/select-platform");
    })();
  }, [router]);

  if (!hasSupabasePublicEnv()) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-6">
        <MissingEnvNotice
          title="Configuración pendiente"
          message={`${getSupabasePublicEnvErrorMessage()} Configura esas variables para continuar con el flujo inicial.`}
          requirements={[
            "NEXT_PUBLIC_SUPABASE_AUTH_URL",
            "NEXT_PUBLIC_SUPABASE_AUTH_ANON_KEY",
          ]}
        />
      </main>
    );
  }

  if (blockingMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-6">
        <MissingEnvNotice
          title="Instalación pendiente"
          message={blockingMessage}
          requirements={blockingRequirements}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card-surface rounded-[28px] px-6 py-5 text-sm text-[var(--muted)]">{message}</div>
    </main>
  );
}
