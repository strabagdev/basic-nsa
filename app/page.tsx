import Link from "next/link";

const features = [
  "Autenticación con Supabase lista para Vercel",
  "Landing, login, callback y área privada base",
  "Sincronización de perfil en Supabase Data",
  "SQL bootstrap para arrancar cada proyecto",
];

export default function Home() {
  return (
    <main className="hero-grid min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-between gap-10 rounded-[32px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.66),rgba(255,255,255,0.42))] p-6 shadow-[0_32px_80px_-44px_rgba(19,34,38,0.36)] backdrop-blur-xl sm:p-8 lg:p-10">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted)]">
              Base duplicable
            </div>
            <h1 className="mt-5 max-w-4xl font-mono text-4xl leading-none tracking-[-0.06em] text-[var(--foreground)] sm:text-6xl">
              Next + Supabase Auth como punto de partida para futuros productos.
            </h1>
            <p className="text-balance mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              Esta plantilla deja resuelto el esqueleto transversal: autenticación, área privada, perfil, helpers de
              servidor, SQL inicial y documentación para desplegar rápido en Vercel cambiando solo variables de entorno.
            </p>
          </div>

          <div className="card-surface max-w-sm rounded-[28px] p-5">
            <div className="text-sm font-medium text-[var(--muted)]">Estado de la base</div>
            <div className="mt-3 grid gap-3">
              {features.map((feature) => (
                <div key={feature} className="rounded-[18px] border border-[var(--border)] bg-white/80 px-4 py-3 text-sm text-[var(--foreground)]">
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="card-surface rounded-[30px] p-6 sm:p-8">
            <div className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">Cómo se usa</div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <article className="rounded-[22px] border border-[var(--border)] bg-white/78 p-5">
                <div className="text-2xl font-mono">01</div>
                <h2 className="mt-3 text-lg font-semibold">Conecta tu proyecto Supabase</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Configura URL pública, anon key y service role key desde Vercel o tu `.env.local`.
                </p>
              </article>
              <article className="rounded-[22px] border border-[var(--border)] bg-white/78 p-5">
                <div className="text-2xl font-mono">02</div>
                <h2 className="mt-3 text-lg font-semibold">Ejecuta el SQL bootstrap</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Crea la tabla `profiles` y deja un punto estable para sumar tablas del negocio después.
                </p>
              </article>
              <article className="rounded-[22px] border border-[var(--border)] bg-white/78 p-5">
                <div className="text-2xl font-mono">03</div>
                <h2 className="mt-3 text-lg font-semibold">Monta tu lógica</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Reutiliza dashboard, perfil, helpers y auth; agrega solo módulos, tablas y pantallas específicas.
                </p>
              </article>
            </div>
          </div>

          <div className="card-surface rounded-[30px] p-6 sm:p-8">
            <div className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">Rutas base</div>
            <div className="mt-5 space-y-3">
              {["/", "/setup-platform", "/login", "/auth/callback", "/select-platform", "/dashboard", "/super-admin", "/profile"].map((route) => (
                <div key={route} className="rounded-[18px] border border-[var(--border)] bg-white/84 px-4 py-3 font-mono text-sm">
                  {route}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(180deg,var(--accent),var(--accent-strong))] px-5 text-sm font-semibold text-white shadow-[0_18px_30px_-20px_rgba(15,118,110,0.65)] transition hover:brightness-105"
              >
                Ir al login base
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--border)] bg-white/75 px-5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
              >
                Ver dashboard demo
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
