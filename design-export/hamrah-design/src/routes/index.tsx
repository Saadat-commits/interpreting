import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleHelp,
  Landmark,
  Languages,
  Phone,
  Scale,
  ShieldCheck,
  Stethoscope,
  Timer,
  HandHeart,
  MapPin,
  Wallet,
  FileSignature,
  UsersRound,
} from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Depth, Globe, LanguageChips, Reveal, Tilt } from "@/components/motion";
import { useLocale } from "@/lib/locale-context";
import { SITE_PHONE_DISPLAY, SITE_PHONE_HREF } from "@/lib/site-config";
import mountains from "@/assets/afghan-mountains.jpg";
import { designCopy, webCopy } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hamrah Sprachservice — Dolmetschen Dari, Farsi und Paschtu" },
      {
        name: "description",
        content:
          "Persönliche Begleitung in Fürth und telefonisches Dolmetschen in ganz Deutschland.",
      },
      { property: "og:title", content: "Hamrah Sprachservice" },
      { property: "og:description", content: "Dolmetschen Dari, Farsi und Paschtu ⇄ Deutsch." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const serviceIcons = [CalendarDays, BriefcaseBusiness, BookOpen, CircleHelp];
const appointmentIcons = [
  UsersRound,
  BriefcaseBusiness,
  Stethoscope,
  UsersRound,
  Landmark,
  Scale,
  CircleHelp,
  BriefcaseBusiness,
];
const trustIcons = [ShieldCheck, Languages, Timer, HandHeart];

function PhoneMock({ w }: { w: (typeof webCopy)["de"] }) {
  return (
    <div
      aria-hidden="true"
      className="phone-float relative mx-auto w-[280px] rounded-[44px] bg-[#0c0e0d] p-3 shadow-[0_60px_120px_-40px_rgba(0,0,0,.55)] ring-1 ring-white/10"
    >
      <div className="relative overflow-hidden rounded-[34px] bg-[#0c0e0d] px-4 pb-6 pt-8 text-white">
        <div
          className="absolute inset-x-0 top-0 h-64"
          style={{
            background:
              "linear-gradient(155deg, rgba(122,150,128,.55) 0%, rgba(61,90,62,.35) 35%, rgba(12,14,13,0) 100%)",
          }}
        />
        <div className="relative text-center">
          <p className="text-[11px] font-semibold text-white/65">{w.phoneEarned}</p>
          <p className="mt-1 font-bold tabular-nums tracking-[-0.03em]">
            <span className="text-[38px] leading-10">352</span>
            <span className="text-[18px]">,82 €</span>
          </p>
        </div>
        <div className="relative mt-5 grid grid-cols-4 gap-1 text-center text-[9px] font-semibold text-white/80">
          {[Timer, BriefcaseBusiness, CircleHelp, Wallet].map((Icon, i) => (
            <span key={i} className="flex flex-col items-center gap-1">
              <span className="grid size-9 place-items-center rounded-full bg-white/10">
                <Icon className="size-4 text-[#6ee7a0]" />
              </span>
            </span>
          ))}
        </div>
        <div className="relative mt-5 rounded-[20px] bg-white/[.08] p-3.5">
          <p className="text-[10px] font-semibold text-white/60">{w.phoneNext}</p>
          <p className="mt-0.5 text-[17px] font-bold tabular-nums">11:00 – 15:00</p>
          <p className="flex items-center gap-1 text-[10px] text-white/60">
            <MapPin className="size-3 text-[#2dd4bf]" /> Nordring 98, Nürnberg
          </p>
          <div className="mt-3 rounded-full bg-[#fcd34d] py-2 text-center text-[11px] font-bold text-[#0c0e0d]">
            {w.phoneClockIn}
          </div>
        </div>
        <div className="relative mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-[18px] bg-white/[.08] p-3">
            <p className="text-[9px] font-semibold text-white/60">Einsätze</p>
            <p className="text-[20px] font-bold">4</p>
          </div>
          <div className="rounded-[18px] bg-white/[.08] p-3">
            <FileSignature className="size-4 text-[#fcd34d]" />
            <p className="mt-1 text-[9px] font-semibold text-white/70">Vertrag</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const { t, rtl, locale } = useLocale();
  const d = designCopy[locale];
  const w = webCopy[locale];
  const arrow = `size-4 ${rtl ? "rotate-180" : ""}`;
  const services = [
    { to: "/buchen" as const, label: t.navBooking },
    { to: "/leistungen" as const, label: t.navServices },
    { to: "/informationen" as const, label: t.informationCard },
    { to: "/kontakt" as const, label: t.contactCard },
  ];
  const pill =
    "inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-bold transition";
  return (
    <SiteShell>
      {/* Hero: Vollbild, große Schrift */}
      <Depth className="relative isolate overflow-hidden bg-[#0c0e0d] text-white">
        <img
          src={mountains}
          alt=""
          className="d-bg absolute inset-0 -z-20 size-full object-cover object-center opacity-70 will-change-transform"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/45 to-[#0c0e0d]" />
        <div
          aria-hidden
          className="hero-glow d-mid absolute -left-1/4 top-0 -z-10 h-[70%] w-[80%] rounded-full bg-[radial-gradient(closest-side,rgba(110,231,160,.35),transparent)] blur-3xl"
        />
        <LanguageChips
          items={["درود", "سلام", "Guten Tag", "Dari ⇄ Deutsch", "پښتو", "Farsi ⇄ Deutsch"]}
        />
        <div className="site-container grid min-h-[calc(100svh-64px)] items-center gap-12 py-16 lg:grid-cols-[1.15fr_.85fr] lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-white/75">{w.heroEyebrow}</p>
            <h1
              className="mt-4 text-[44px] font-bold leading-[1.02] tracking-[-0.035em] sm:text-[64px] lg:text-[80px]"
              style={{ perspective: "800px" }}
            >
              {w.heroTitle.split(" ").map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  className="word-in mr-[0.22em]"
                  style={{ animationDelay: `${120 + i * 90}ms` }}
                >
                  {word}
                </span>
              ))}
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-7 text-white/80 sm:text-[19px] sm:leading-8">
              {w.heroText}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/buchen" className={`${pill} bg-white text-[#0c0e0d] hover:bg-white/90`}>
                {t.navBooking}
                <ArrowRight className={arrow} />
              </Link>
              <Link
                to="/bewerben"
                className={`${pill} bg-white/15 text-white backdrop-blur hover:bg-white/25`}
              >
                {w.ctaWork}
              </Link>
            </div>
            <a
              href={`tel:${SITE_PHONE_HREF}`}
              className="mt-6 inline-flex items-center gap-2 text-[15px] font-semibold text-white/80 hover:text-white"
            >
              <Phone className="size-4" />
              <span dir="ltr">{SITE_PHONE_DISPLAY}</span>
            </a>
          </div>
          <div className="d-fg hidden lg:block">
            <PhoneMock w={w} />
          </div>
        </div>
      </Depth>

      {/* Sprachen laufen durchs Bild */}
      <div aria-hidden className="overflow-hidden bg-[#0c0e0d] py-4 text-white/55">
        <div className="marquee gap-10 whitespace-nowrap text-[15px] font-semibold">
          {[0, 1].flatMap((k) =>
            [
              "Dari",
              "درى",
              "Farsi",
              "فارسی",
              "Paschtu",
              "پښتو",
              "Deutsch",
              "Fürth",
              "Nürnberg",
              "Erlangen",
            ].map((x) => (
              <span key={`${k}-${x}`} className="mx-5 inline-flex items-center gap-10">
                {x}
                <span className="size-1.5 rounded-full bg-[#6ee7a0]" />
              </span>
            )),
          )}
        </div>
      </div>

      {/* Fakten */}
      <section className="bg-white">
        <dl className="site-container grid gap-3 py-8 sm:grid-cols-3">
          {t.homeFacts.map(([title, text], i) => (
            <Reveal key={title} delay={i * 110}>
              <Tilt className="h-full rounded-[24px] bg-[#f4f5f3] p-6">
                <dt className="flex items-center gap-2 text-[17px] font-bold tracking-[-0.01em]">
                  <Check className="size-5 text-[#1fa855]" />
                  {title}
                </dt>
                <dd className="mt-2 text-[15px] leading-6 text-black/60">{text}</dd>
              </Tilt>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* Zwei Bereiche */}
      <section className="bg-white pb-6">
        <div className="site-container grid gap-4 lg:grid-cols-2">
          <Reveal from="left">
            <Tilt className="h-full rounded-[32px]" max={4}>
              <Link
                to="/leistungen"
                className="group relative flex min-h-[380px] flex-col justify-between overflow-hidden rounded-[32px] bg-[#f4f5f3] p-8 sm:p-10"
              >
                <div>
                  <Languages className="size-8 text-[#3d5a3e]" />
                  <h2 className="mt-6 text-[36px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[48px]">
                    {w.interpretTitle}
                  </h2>
                  <p className="mt-4 max-w-md text-[17px] leading-7 text-black/65">
                    {w.interpretText}
                  </p>
                </div>
                <span className="mt-8 inline-flex items-center gap-2 text-[15px] font-bold">
                  {w.more}{" "}
                  <ArrowRight className={`${arrow} transition group-hover:translate-x-1`} />
                </span>
              </Link>
            </Tilt>
          </Reveal>
          <Reveal from="right" delay={120}>
            <Tilt className="h-full rounded-[32px]" max={4}>
              <Link
                to="/bewerben"
                className="group relative flex min-h-[380px] flex-col justify-between overflow-hidden rounded-[32px] bg-[#0c0e0d] p-8 text-white sm:p-10"
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(155deg, rgba(122,150,128,.45) 0%, rgba(61,90,62,.3) 35%, rgba(12,14,13,0) 80%)",
                  }}
                />
                <div className="relative">
                  <BriefcaseBusiness className="size-8 text-[#6ee7a0]" />
                  <h2 className="mt-6 text-[36px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[48px]">
                    {w.workTitle}
                  </h2>
                  <p className="mt-4 max-w-md text-[17px] leading-7 text-white/75">{w.workText}</p>
                </div>
                <span className="relative mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-[15px] font-bold text-[#0c0e0d]">
                  {w.ctaWork} <ArrowRight className={arrow} />
                </span>
              </Link>
            </Tilt>
          </Reveal>
        </div>
      </section>

      {/* Online-Dienste */}
      <section className="bg-white py-16 sm:py-24">
        <div className="site-container">
          <Reveal>
            <h2 className="text-[34px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[48px]">
              {t.onlineServices}
            </h2>
            <p className="mt-3 max-w-2xl text-[17px] text-black/60">{t.onlineServicesIntro}</p>
          </Reveal>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((item, index) => {
              const Icon = serviceIcons[index] ?? BookOpen;
              const first = index === 0;
              return (
                <Reveal key={item.to} delay={index * 100} from="zoom">
                  <Tilt className="h-full rounded-[28px]">
                    <Link
                      to={item.to}
                      className={`group flex h-full min-h-[200px] flex-col justify-between rounded-[28px] p-6 transition ${first ? "bg-[#0c0e0d] text-white" : "bg-[#f4f5f3] hover:bg-[#eceeea]"}`}
                    >
                      <span
                        className={`grid size-12 place-items-center rounded-full ${first ? "bg-white/10" : "bg-white"}`}
                      >
                        <Icon className={`size-5 ${first ? "text-[#6ee7a0]" : "text-[#3d5a3e]"}`} />
                      </span>
                      <span>
                        <span className="block text-[19px] font-bold tracking-[-0.01em]">
                          {item.label}
                        </span>
                        <span
                          className={`mt-1 block text-[14px] leading-5 ${first ? "text-white/70" : "text-black/55"}`}
                        >
                          {t.onlineServiceTexts[index]}
                        </span>
                      </span>
                    </Link>
                  </Tilt>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Häufige Termine */}
      <section className="bg-[#f4f5f3] py-16 sm:py-24">
        <div className="site-container">
          <Reveal>
            <h2 className="text-[34px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[48px]">
              {t.commonAppointments}
            </h2>
            <p className="mt-3 max-w-2xl text-[17px] text-black/60">{t.commonAppointmentsIntro}</p>
          </Reveal>
          <div className="mt-10 grid gap-3 md:grid-cols-2">
            {t.appointmentItems.map((item, index) => {
              const Icon = appointmentIcons[index] ?? CalendarDays;
              return (
                <Reveal key={item.id} delay={(index % 2) * 90} from={index % 2 ? "right" : "left"}>
                  <Link
                    to="/buchen"
                    search={{ type: item.id }}
                    className="group flex items-center gap-4 rounded-[24px] bg-white px-5 py-5 transition hover:shadow-[0_12px_32px_-18px_rgba(0,0,0,.35)]"
                  >
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#f4f5f3]">
                      <Icon className="size-5 text-[#3d5a3e]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-[17px] font-bold">{item.title}</strong>
                      <span className="mt-0.5 block text-[14px] leading-5 text-black/55">
                        {item.detail}
                      </span>
                    </span>
                    <ArrowRight
                      className={`${arrow} shrink-0 text-black/40 transition group-hover:translate-x-1`}
                    />
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Die App fürs Team */}
      <section className="relative isolate overflow-hidden bg-[#0c0e0d] py-20 text-white sm:py-28">
        <div
          className="absolute inset-x-0 top-0 -z-10 h-[520px]"
          style={{
            background:
              "linear-gradient(155deg, rgba(122,150,128,.4) 0%, rgba(61,90,62,.28) 30%, rgba(12,14,13,0) 100%)",
          }}
        />
        <div className="site-container grid items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-[#6ee7a0]">{w.appEyebrow}</p>
            <h2 className="mt-3 text-[40px] font-bold leading-[1.04] tracking-[-0.035em] sm:text-[60px]">
              {w.appTitle}
            </h2>
            <p className="mt-5 max-w-lg text-[17px] leading-7 text-white/70">{w.appText}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {w.appPoints.map(([title, text], i) => {
                const Icon = [MapPin, Timer, Wallet, FileSignature][i] ?? Check;
                return (
                  <div key={title} className="rounded-[24px] bg-white/[.07] p-5">
                    <Icon className="size-5 text-[#6ee7a0]" />
                    <p className="mt-3 text-[16px] font-bold">{title}</p>
                    <p className="mt-1 text-[14px] leading-5 text-white/60">{text}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {w.jobs.map((j) => (
                <span
                  key={j}
                  className="rounded-full bg-white/10 px-4 py-2 text-[14px] font-semibold"
                >
                  {j}
                </span>
              ))}
            </div>
          </div>
          <Reveal from="right">
            <PhoneMock w={w} />
          </Reveal>
        </div>
      </section>

      {/* Globus: Fürth, Teheran, Kabul */}
      <section className="relative isolate overflow-hidden bg-[#0c0e0d] pb-20 text-white sm:pb-28">
        <div className="site-container grid items-center gap-8 lg:grid-cols-2">
          <Reveal from="left" className="order-2 lg:order-1">
            <Globe className="mx-auto aspect-square w-full max-w-[520px]" />
          </Reveal>
          <Reveal className="order-1 lg:order-2">
            <p className="text-sm font-semibold text-[#6ee7a0]">{w.heroEyebrow}</p>
            <h2 className="mt-3 text-[34px] font-bold leading-[1.06] tracking-[-0.03em] sm:text-[52px]">
              {t.navServices}
            </h2>
            <p className="mt-5 max-w-lg text-[17px] leading-7 text-white/70">{w.interpretText}</p>
            <Link to="/buchen" className={`${pill} pulse-ring mt-8 bg-white text-[#0c0e0d]`}>
              {t.navBooking}
              <ArrowRight className={arrow} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* So läuft es */}
      <section className="bg-white py-16 sm:py-24">
        <div className="site-container">
          <p className="text-sm font-semibold text-[#3d5a3e]">{d.stepsEyebrow}</p>
          <Reveal>
            <h2 className="mt-2 text-[34px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[48px]">
              {d.stepsTitle}
            </h2>
          </Reveal>
          <ol className="mt-10 grid gap-3 md:grid-cols-3">
            {d.steps.map(([title, text], index) => (
              <Reveal key={title} delay={index * 140}>
                <li className="h-full rounded-[28px] bg-[#f4f5f3] p-7">
                  <span className="grid size-10 place-items-center rounded-full bg-[#0c0e0d] text-[15px] font-bold text-white">
                    {index + 1}
                  </span>
                  <span aria-hidden className="step-line mt-4 block h-0.5 w-full bg-[#6ee7a0]" />
                  <h3 className="mt-6 text-[20px] font-bold tracking-[-0.01em]">{title}</h3>
                  <p className="mt-2 text-[15px] leading-6 text-black/60">{text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Zitat */}
      <section className="relative isolate min-h-[26rem] overflow-hidden">
        <img src={mountains} alt="" className="absolute inset-0 -z-20 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-black/55" />
        <Reveal className="site-container py-24 text-center text-white sm:py-32" from="zoom">
          <div>
            <p className="mx-auto max-w-4xl text-[28px] font-bold leading-[1.2] tracking-[-0.02em] sm:text-[44px]">
              „{d.quote}“
            </p>
            <p className="mt-6 text-sm font-semibold text-white/75">{d.quoteBy}</p>
            <p className="mt-3 text-sm text-white/70">{d.hamrahMeaning}</p>
          </div>
        </Reveal>
      </section>

      {/* Vertrauen */}
      <section className="bg-white py-16 sm:py-24">
        <div className="site-container">
          <p className="text-sm font-semibold text-[#3d5a3e]">{d.trustEyebrow}</p>
          <h2 className="mt-2 text-[34px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[48px]">
            {d.trustTitle}
          </h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {d.trust.map(([, title, text], index) => {
              const Icon = trustIcons[index] ?? ShieldCheck;
              return (
                <Reveal key={title} delay={index * 100}>
                  <Tilt className="h-full rounded-[28px] bg-[#f4f5f3] p-7">
                    <Icon className="size-6 text-[#3d5a3e]" />
                    <h3 className="mt-5 text-[18px] font-bold">{title}</h3>
                    <p className="mt-2 text-[15px] leading-6 text-black/60">{text}</p>
                  </Tilt>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Für Einrichtungen */}
      <section className="bg-white pb-6">
        <div className="site-container">
          <div className="rounded-[32px] bg-[#f4f5f3] p-8 sm:p-12">
            <h2 className="text-[28px] font-bold tracking-[-0.02em] sm:text-[36px]">
              {t.agencyNoteTitle}
            </h2>
            <p className="mt-3 max-w-3xl text-[17px] leading-7 text-black/65">{t.agencyNote}</p>
            <Link
              to="/buchen"
              search={{ customer: "authority" }}
              className={`${pill} mt-7 bg-[#0c0e0d] text-white hover:bg-black`}
            >
              {t.bookForAgency}
              <ArrowRight className={arrow} />
            </Link>
          </div>
        </div>
      </section>

      {/* Bewerben */}
      <section className="bg-white py-6 pb-16">
        <div className="site-container">
          <div className="relative isolate overflow-hidden rounded-[32px] bg-[#0c0e0d] p-8 text-white sm:p-14">
            <div
              className="absolute inset-0 -z-10"
              style={{
                background:
                  "linear-gradient(120deg, rgba(122,150,128,.5) 0%, rgba(61,90,62,.3) 40%, rgba(12,14,13,0) 90%)",
              }}
            />
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[34px] font-bold leading-[1.05] tracking-[-0.03em] sm:text-[52px]">
                  {w.bandTitle}
                </h2>
                <p className="mt-3 max-w-lg text-[17px] text-white/75">{w.bandText}</p>
              </div>
              <Link
                to="/bewerben"
                className={`${pill} shrink-0 bg-white text-[#0c0e0d] hover:bg-white/90`}
              >
                {w.ctaWork}
                <ArrowRight className={arrow} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
