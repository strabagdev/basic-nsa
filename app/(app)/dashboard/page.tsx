const cards = [
  {
    title: "Auth resuelto",
    description: "Email/password, magic link, callback y cambio de contraseña sobre Supabase Auth.",
  },
  {
    title: "Perfil sincronizado",
    description: "Cada sesión puede sincronizar el perfil base hacia la tabla `profiles` con service role.",
  },
  {
    title: "Lista para negocio",
    description: "Desde acá cada proyecto monta sus módulos, tablas, permisos y pantallas específicas.",
  },
];

export default function DashboardPage() {
  return (
    <main className="grid gap-6">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="card-surface rounded-[30px] p-6 sm:p-8">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Dashboard base</div>
          <h1 className="mt-3 max-w-2xl font-mono text-4xl leading-none tracking-[-0.06em]">
            Punto de partida listo para clonar y adaptar rápido.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
            La intención de esta pantalla no es resolver un negocio específico, sino dejar un espacio privado funcional
            para probar sesión, conexión con Supabase y navegación inicial apenas se duplica el proyecto.
          </p>
        </article>

        <article className="card-surface rounded-[30px] p-6 sm:p-8">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Checklist</div>
          <div className="mt-4 space-y-3">
            {[
              "Variables de entorno cargadas",
              "Tabla profiles creada en Supabase",
              "Redirect URLs configuradas",
              "Deploy listo para Vercel",
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
