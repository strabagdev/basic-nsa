type MissingEnvNoticeProps = {
  title?: string;
  message: string;
  requirements?: string[];
};

export function MissingEnvNotice({
  title = "Configuración pendiente",
  message,
  requirements = [],
}: MissingEnvNoticeProps) {
  return (
    <div className="card-surface max-w-xl rounded-[30px] p-6 sm:p-8">
      <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Entorno</div>
      <h1 className="mt-3 font-mono text-3xl leading-none tracking-[-0.05em]">{title}</h1>
      <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{message}</p>
      {requirements.length > 0 ? (
        <div className="mt-5 rounded-[18px] border border-[var(--border)] bg-white/80 px-4 py-3 font-mono text-xs text-[var(--foreground)]">
          {requirements.map((requirement) => (
            <div key={requirement}>{requirement}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
