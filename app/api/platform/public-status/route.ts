import { NextResponse } from "next/server";
import {
  getPlatformSetupKey,
  getSupabaseAuthAdminEnvErrorMessage,
  getSupabaseDataServerEnvErrorMessage,
  getSupabasePublicEnvErrorMessage,
  hasSupabaseAuthAdminEnv,
  hasSupabaseDataServerEnv,
  hasSupabasePublicEnv,
} from "@/lib/env";
import { getPublicPlatformStatus, isMissingPlatformSchemaError } from "@/lib/server/platforms";

export async function GET() {
  try {
    const missing: string[] = [];
    if (!hasSupabasePublicEnv()) missing.push(getSupabasePublicEnvErrorMessage());
    if (!hasSupabaseDataServerEnv()) missing.push(getSupabaseDataServerEnvErrorMessage());
    if (!hasSupabaseAuthAdminEnv()) missing.push(getSupabaseAuthAdminEnvErrorMessage());
    if (!getPlatformSetupKey()) missing.push("Falta PLATFORM_SETUP_KEY en el servidor.");

    if (missing.length > 0) {
      return NextResponse.json(
        {
          has_platforms: false,
          env_ready: false,
          missing_requirements: missing,
        },
        { status: 200 }
      );
    }

    const status = await getPublicPlatformStatus();
    return NextResponse.json({
      has_platforms: status.hasPlatforms,
      platform_name: status.platformName,
      support_email: status.supportEmail,
      auth_provider: status.authProvider,
      env_ready: true,
      schema_ready: true,
      missing_requirements: [],
    });
  } catch (error) {
    if (isMissingPlatformSchemaError(error)) {
      return NextResponse.json(
        {
          has_platforms: false,
          env_ready: true,
          schema_ready: false,
          missing_requirements: [
            "Falta ejecutar el SQL base en Supabase: 001_profiles.sql y 002_platform_kernel.sql.",
          ],
        },
        { status: 200 }
      );
    }

    const message = error instanceof Error ? error.message : "No se pudo cargar el estado público.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
