import Link from 'next/link';

interface EmptyStateProps {
  icon: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}

export default function EmptyState({ icon, title, body, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <span className="text-4xl">{icon}</span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-zinc-300">{title}</p>
        <p className="text-xs text-zinc-500 max-w-xs">{body}</p>
      </div>
      <Link
        href={ctaHref}
        className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
