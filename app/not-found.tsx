import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center px-6 pb-10 pt-24 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">ZIP</p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">That page isn’t here</h1>
      <p className="mt-2 max-w-xs text-sm font-medium text-muted">
        The link may have expired, or this screen moved. Your money is still in ZIP.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center rounded-2xl bg-primary px-5 text-sm font-bold text-on-accent"
      >
        Back to home
      </Link>
    </div>
  );
}
