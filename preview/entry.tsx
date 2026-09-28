import { StrictMode, useEffect, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { Header, PageHeader } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactContent, HomeContent, InfoContent, ServicesContent } from "@/components/HomeContent";
import { LegalPage } from "@/components/LegalPage";
import { HelpChat } from "@/components/HelpChat";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { VerifyBooking } from "@/components/booking/BookingDone";
import { DatenschutzContent, ImpressumContent } from "@/components/LegalContent";
import type { AppointmentCategory } from "@/lib/types";
import { site } from "@/config/site";
import { dirOf, getDictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { getPath, navigate, subscribe } from "./router";
import { installMockApi } from "./mock-api";

installMockApi();

function DemoBar({ locale }: { locale: Locale }) {
  return (
    <div className="relative z-50 border-b border-line bg-white px-4 py-2 text-center text-[12px] text-ink-muted" dir={locale === "fa" ? "rtl" : "ltr"}>
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
  const params = new URLSearchParams(query);
  if (page === "termin" && seg[2] === "bestaetigen") {
    content = (
      <>
        <Header locale={locale} t={t} active="book" />
        <PageHeader locale={locale} t={t} title={t.gov.book} crumbs={[{ href: `/${locale}/termin`, label: t.gov.book }, { label: "✓" }]} />
        <main className="container-page max-w-3xl py-10">
          <VerifyBooking key={path} t={t} locale={locale} token={params.get("t") ?? ""} />
        </main>
        <Footer locale={locale} t={t} />
      </>
    );
  } else if (page === "termin") {
    const leistung = params.get("leistung");
    const anlass = params.get("anlass");
    content = (
      <>
        <Header locale={locale} t={t} active="book" />
        <PageHeader locale={locale} t={t} title={t.gov.book} lead={t.booking.subtitle} crumbs={[{ label: t.gov.book }]} />
        <main className="pb-10">
          <div className="container-page">
            <BookingWizard
              key={path}
              locale={locale}
              t={t}
              initialService={leistung === "phone" || leistung === "onsite" ? leistung : undefined}
              initialCategory={anlass && anlass in t.categories ? (anlass as AppointmentCategory) : undefined}
              initialWho={params.get("wer") === "einrichtung" ? "organisation" : undefined}
            />
          </div>
        </main>
        <Footer locale={locale} t={t} />
      </>
    );
  } else if (page === "leistungen") {
    content = <ServicesContent key={locale} locale={locale} t={t} />;
  } else if (page === "informationen") {
    content = <InfoContent key={locale} locale={locale} t={t} />;
  } else if (page === "kontakt") {
    content = <ContactContent key={locale} locale={locale} t={t} />;
  } else if (page === "impressum" || page === "datenschutz") {
    content = (
      <LegalPage locale={locale} t={t} title={page === "impressum" ? t.legal.imprint : t.legal.privacy}>
        {page === "impressum" ? <ImpressumContent /> : <DatenschutzContent />}
      </LegalPage>
    );
  } else {
    content = <HomeContent key={locale} locale={locale} t={t} />;
  }

  return (
    <div lang={locale} dir={dirOf(locale)} className={locale === "fa" ? "font-fa" : "font-sans"}>
      <DemoBar locale={locale} />
      {content}
      <HelpChat locale={locale} t={t.help} />
    </div>
  );
}

// Links wie /de#leistungen, die nicht über next/link laufen (z. B. im Footer)
document.addEventListener("click", (e) => {
  const a = (e.target as HTMLElement).closest("a");
  const href = a?.getAttribute("href");
  if (!a || !href || !href.startsWith("/") || e.defaultPrevented || a.target === "_blank") return;
  e.preventDefault();
  navigate(href);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
