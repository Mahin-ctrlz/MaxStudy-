export default function GuestBanner() {
  return (
    <div className="bg-surface2 border-b border-border px-10 py-2 flex items-center justify-between flex-wrap gap-2">
      <span className="text-xs text-text-secondary">
        You're trying this out as a guest — nothing you add here is saved.
      </span>
      <a href="/login" className="text-xs text-purple hover:underline">
        Sign up to keep your data
      </a>
    </div>
  );
}
