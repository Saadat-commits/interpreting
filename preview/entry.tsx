import { StrictMode, useEffect, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { Header } from "@/components/Header";
import { HomeContent } from "@/components/HomeContent";
import { LegalPage } from "@/components/LegalPage";
import { FloatingContact } from "@/components/FloatingContact";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { site } from "@/config/site";
import { dirOf, getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { getPath, navigate, subscribe } from "./router";
import { installMockApi } from "./mock-api";

installMockApi();

function DemoBar({ locale }: { locale: Locale }) {
  return (
    <div className="relative z-50 bg-brand-900 px-4 py-2 text-center text-[13px] text-brand-100" dir={locale === "fa" ? "rtl" : "ltr"}>
      {locale === "fa"
        ? "پیش‌نمایش – حالت نمایشی: رزروها ذخیره نمی‌شوند و ایمیلی ارسال نمی‌شود."
        : "Vorschau im Demo-Modus – Buchungen werden nicht gespeichert, es werden keine E-Mails verschickt."}
    </div>
  );
}

function App() {
  const path = useSyncExternalStore(subscribe, getPath);
  const [pathname, query = ""] = path.split("?");
  const seg = pathname.split("/").filter(Boolean);
  const locale: Locale = seg[0] === "fa" ? "fa" : "de";
  const page = seg[1] ?? "";
  const t = getDictionary(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirOf(locale);
    document.title = `${site.brand} – Vorschau`;
  }, [locale]);

  let content;
  if (page === "termin") {
    const leistung = new URLSearchParams(query).get("leistung");
    content = (
      <>
        <Header locale={locale} t={t.nav} minimal />
        <main className="relative min-h-[80vh] overflow-hidden pb-32">
          <div className="bg-girih pointer-events-none absolute inset-x-0 top-0 h-[420px] mask-fade-b opacity-80" aria-hidden="true" />
          <div className="container-page relative max-w-4xl pt-10 sm:pt-14">
            <div className="text-center">
              <h1 className="text-4xl font-bold sm:text-5xl">{t.booking.title}</h1>
              <p className="mt-3 text-lg text-ink-muted">{t.booking.subtitle}</p>
            </div>
            <div className="mt-10">
              <BookingWizard key={path} locale={locale} t={t} initialService={leistung === "phone" || leistung === "onsite" ? leistung : undefined} />
            </div>
          </div>
        </main>
      </>
    );
  } else if (page === "impressum" || page === "datenschutz") {
    content = (
      <LegalPage locale={locale} t={t} title={page === "impressum" ? t.legal.imprint : t.legal.privacy}>
        <p>In der Vorschau nicht enthalten – auf der fertigen Website steht hier {page === "impressum" ? "das Impressum" : "die Datenschutzerklärung"}.</p>
      </LegalPage>
    );
  } else {
    content = <HomeContent key={locale} locale={locale} t={t} />;
  }

  return (
    <div lang={locale} dir={dirOf(locale)} className={locale === "fa" ? "font-fa" : "font-sans"}>
      <DemoBar locale={locale} />
      {content}
      <FloatingContact locale={locale} t={t.chat} />
    </div>
  );
}

// Links wie /de#leistungen, die nicht über next/link laufen (z. B. im Footer)
document.addEventListener("click", (e) => {
  const a = (e.target as HTMLElement).closest("a");
  const href = a?.getAttribute("href");
  if (!a || !href || !href.startsWith("/") || e.defaultPrevented) return;
  e.preventDefault();
  navigate(href);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
