import Link from "next/link";
import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { IconArrow } from "./icons";

export function LegalPage({ locale, t, title, children }: { locale: Locale; t: Dictionary; title: string; children: ReactNode }) {
  return (
    <>
      <Header locale={locale} t={t.nav} />
      <main className="container-page max-w-3xl py-14">
        <Link href={`/${locale}`} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline">
          <IconArrow size={16} className="rotate-180" /> {t.legal.back}
        </Link>
        <h1 className="mt-6 text-4xl font-bold">{title}</h1>
        {locale === "fa" && (
          <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-sm text-ink-muted">این متن حقوقی به زبان آلمانی معتبر است.</p>
        )}
        <div dir="ltr" lang="de" className="mt-8 space-y-6 font-sans text-[16px] leading-relaxed text-ink-soft [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink">
          {children}
        </div>
      </main>
      <Footer locale={locale} t={t} />
    </>
  );
}
