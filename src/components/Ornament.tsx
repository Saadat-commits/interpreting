import { starPath } from "@/lib/star";

/** Ornamentaler Trenner – Linie, Rauten und Girih-Stern (angelehnt an afghanische Teppichbordüren) */
export function Ornament({ className = "" }: { className?: string }) {
  const diamond = (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="shrink-0">
      <path d="M7 1 L13 7 L7 13 L1 7Z" fill="none" stroke="#82C29E" strokeWidth="1.2" />
      <path d="M7 4.5 L9.5 7 L7 9.5 L4.5 7Z" fill="#2C8A5D" />
    </svg>
  );
  return (
    <div className={`container-page flex items-center gap-3 ${className}`} aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-brand-200 rtl:bg-gradient-to-l" />
      {diamond}
      <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0">
        <circle cx="22" cy="22" r="20" fill="#fff" stroke="#D9EEE1" />
        <path d={starPath(22, 22, 14, 0.62)} fill="none" stroke="#1F7049" strokeWidth="1.5" strokeLinejoin="round" />
        <path d={starPath(22, 22, 6, 0.6)} fill="#2C8A5D" />
      </svg>
      {diamond}
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-brand-200 rtl:bg-gradient-to-r" />
    </div>
  );
}
