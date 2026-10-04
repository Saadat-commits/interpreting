import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { Header, PageHeader } from "./Header";
import { Footer } from "./Footer";

export function LegalPage({ locale, t, title, children }: { locale: Locale; t: Dictionary; title: string; children: ReactNode }) {
  return (
    <>
      <Header locale={locale} t={t} />
      <PageHeader locale={locale} t={t} title={title} crumbs={[{ label: title }]} />
      <main id="inhalt" className="container-page max-w-3xl py-10">
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
