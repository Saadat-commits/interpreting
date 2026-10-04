import type { Locale } from "@/lib/types";

/**
 * HAMRAH Service Worlds – die eine Quelle für Welt-Seiten, 3D-Szenen und Anfrageformulare.
 * Neue Leistung: Eintrag hier ergänzen + Szene in src/components/three/worlds/. Das Formular entsteht aus `steps`.
 * Keine Preise hier (Datei ist öffentlich) – nur, wovon der Preis abhängt.
 */

export type L = Record<Locale, string>;

export const serviceSlugs = ["reinigung", "umzug", "montage", "transport", "dolmetschen", "sicherheit"] as const;
export type ServiceSlug = (typeof serviceSlugs)[number];

export interface Option {
  id: string;
  label: L;
}

interface QuestionBase {
  id: string;
  label: L;
  hint?: L;
  required?: boolean;
  /** Frage nur zeigen, wenn eine andere Antwort einen bestimmten Wert hat */
  showIf?: { id: string; in: (string | boolean)[] };
}

export type Question =
  | (QuestionBase & { type: "choice"; options: Option[] })
  | (QuestionBase & { type: "multi"; options: Option[] })
  | (QuestionBase & { type: "number"; min: number; max: number; step?: number; unit?: L; default?: number })
  | (QuestionBase & { type: "toggle" })
  | (QuestionBase & { type: "address" })
  | (QuestionBase & { type: "date" })
  | (QuestionBase & { type: "text"; multiline?: boolean });

export interface FormStep {
  id: string;
  title: L;
  questions: Question[];
}

export interface ServiceWorld {
  slug: ServiceSlug;
  color: string;
  name: L;
  /** Eine Zeile für den Service Selector */
  short: L;
  heroTitle: L;
  heroLead: L;
  journey: { title: L; text: L }[];
  includes: L[];
  needs: L[];
  pricing: { intro: L; factors: L[] };
  booking: { mode: "wizard" } | { mode: "request"; steps: FormStep[] };
}

const o = (id: string, de: string, fa: string): Option => ({ id, label: { de, fa } });
const l = (de: string, fa: string): L => ({ de, fa });

const timeWindow: Question = {
  id: "timeWindow",
  type: "choice",
  label: l("Uhrzeit", "ساعت"),
  options: [o("morning", "Vormittag", "صبح"), o("afternoon", "Nachmittag", "بعدازظهر"), o("evening", "Abend", "عصر"), o("flexible", "Flexibel", "انعطاف‌پذیر")],
  required: true,
};

const floor = (id: string, label: L): Question => ({ id, type: "number", label, min: -1, max: 30, default: 0, unit: l("Etage", "طبقه"), hint: l("0 = Erdgeschoss", "۰ = همکف") });

export const services: ServiceWorld[] = [
  {
    slug: "reinigung",
    color: "#3A9FB5",
    name: l("Reinigung", "نظافت"),
    short: l("Wohnung, Büro, Treppenhaus – gründlich und zuverlässig.", "خانه، دفتر، راه‌پله – دقیق و قابل اعتماد."),
    heroTitle: l("Sauber, bis man es sieht.", "تمیز، تا جایی که دیده شود."),
    heroLead: l(
      "Unterhaltsreinigung, Grundreinigung oder Endreinigung beim Auszug. Sie sagen uns Objekt, Größe und Wunsch – wir kommen mit Plan, Material und festem Team.",
      "نظافت دوره‌ای، نظافت اساسی یا نظافت نهایی هنگام تخلیه. شما نوع مکان، اندازه و خواسته را بگویید – ما با برنامه، وسایل و تیم ثابت می‌آییم.",
    ),
    journey: [
      { title: l("Schmutz", "کثیفی"), text: l("Sie beschreiben, was gereinigt werden soll und wie stark es verschmutzt ist.", "شما توضیح می‌دهید چه چیزی و تا چه حد باید تمیز شود.") },
      { title: l("Wasser", "آب"), text: l("Wir wählen Verfahren und Mittel passend zur Oberfläche.", "روش و مواد را متناسب با سطح انتخاب می‌کنیم.") },
      { title: l("Reinigung", "نظافت"), text: l("Das Team arbeitet nach einer festen Checkliste – Raum für Raum.", "تیم طبق یک فهرست ثابت کار می‌کند – اتاق به اتاق.") },
      { title: l("Oberfläche sauber", "سطح تمیز"), text: l("Abnahme gemeinsam mit Ihnen oder mit Fotos, wenn Sie nicht da sind.", "تحویل همراه شما یا با عکس، اگر حضور نداشته باشید.") },
      { title: l("Buchung", "رزرو"), text: l("Einmalig oder regelmäßig – Sie bekommen ein klares Angebot.", "یک‌باره یا منظم – یک پیشنهاد روشن دریافت می‌کنید.") },
    ],
    includes: [
      l("Unterhaltsreinigung für Wohnung und Büro", "نظافت دوره‌ای خانه و دفتر"),
      l("Grundreinigung und Endreinigung bei Auszug", "نظافت اساسی و نظافت نهایی هنگام تخلیه"),
      l("Treppenhaus- und Gemeinschaftsflächen", "راه‌پله و فضاهای مشترک"),
      l("Fenster, Rahmen und Glasflächen", "پنجره، قاب و سطوح شیشه‌ای"),
      l("Küche und Bad mit Entkalkung", "آشپزخانه و حمام همراه با جرم‌گیری"),
    ],
    needs: [
      l("Art des Objekts und ungefähre Fläche", "نوع مکان و مساحت تقریبی"),
      l("Anzahl der Räume, Bäder und Küchen", "تعداد اتاق‌ها، حمام‌ها و آشپزخانه‌ها"),
      l("Art der Reinigung und gewünschter Rhythmus", "نوع نظافت و دفعات دلخواه"),
      l("Adresse, Wunschtermin und Zugang (Schlüssel, Anwesenheit)", "آدرس، زمان دلخواه و نحوه دسترسی (کلید، حضور)"),
    ],
    pricing: {
      intro: l("Der Preis richtet sich nach dem Aufwand. Sie erhalten vorab ein verbindliches Angebot.", "قیمت به میزان کار بستگی دارد. پیش از شروع یک پیشنهاد قطعی دریافت می‌کنید."),
      factors: [
        l("Fläche und Anzahl der Räume", "مساحت و تعداد اتاق‌ها"),
        l("Art der Reinigung (Unterhalt, Grund, End)", "نوع نظافت (دوره‌ای، اساسی، نهایی)"),
        l("Verschmutzungsgrad und Sonderwünsche", "میزان کثیفی و درخواست‌های ویژه"),
        l("Rhythmus – regelmäßige Termine sind günstiger", "دفعات – نوبت‌های منظم مقرون‌به‌صرفه‌ترند"),
      ],
    },
    booking: {
      mode: "request",
      steps: [
        {
          id: "object",
          title: l("Objekt", "مکان"),
          questions: [
            { id: "object", type: "choice", label: l("Was soll gereinigt werden?", "چه جایی باید تمیز شود؟"), required: true, options: [o("apartment", "Wohnung", "آپارتمان"), o("house", "Haus", "خانه"), o("office", "Büro / Praxis", "دفتر / مطب"), o("stairs", "Treppenhaus", "راه‌پله"), o("other", "Sonstiges", "سایر")] },
            { id: "size", type: "number", label: l("Fläche", "مساحت"), min: 10, max: 2000, step: 5, default: 60, unit: l("m²", "متر مربع"), required: true },
            { id: "rooms", type: "number", label: l("Räume", "تعداد اتاق"), min: 1, max: 40, default: 3, required: true, showIf: { id: "object", in: ["apartment", "house", "office"] } },
            { id: "baths", type: "number", label: l("Bäder", "تعداد حمام"), min: 0, max: 10, default: 1, showIf: { id: "object", in: ["apartment", "house", "office"] } },
          ],
        },
        {
          id: "kind",
          title: l("Art der Reinigung", "نوع نظافت"),
          questions: [
            { id: "kind", type: "choice", label: l("Welche Reinigung?", "چه نوع نظافتی؟"), required: true, options: [o("regular", "Unterhaltsreinigung", "نظافت دوره‌ای"), o("deep", "Grundreinigung", "نظافت اساسی"), o("moveout", "Endreinigung (Auszug)", "نظافت نهایی (تخلیه)"), o("windows", "Nur Fenster", "فقط پنجره")] },
            { id: "rhythm", type: "choice", label: l("Wie oft?", "هر چند وقت؟"), required: true, options: [o("once", "Einmalig", "یک‌بار"), o("weekly", "Wöchentlich", "هفتگی"), o("biweekly", "Alle 2 Wochen", "هر دو هفته"), o("monthly", "Monatlich", "ماهانه")] },
            { id: "extras", type: "multi", label: l("Zusätzlich", "موارد اضافه"), options: [o("windows", "Fenster", "پنجره"), o("oven", "Backofen", "فر"), o("fridge", "Kühlschrank", "یخچال"), o("balcony", "Balkon", "بالکن"), o("carpet", "Teppich", "فرش")] },
          ],
        },
        {
          id: "when",
          title: l("Ort & Termin", "مکان و زمان"),
          questions: [
            { id: "address", type: "address", label: l("Adresse", "آدرس"), required: true },
            { id: "date", type: "date", label: l("Wunschtermin", "تاریخ دلخواه"), required: true },
            timeWindow,
            { id: "access", type: "choice", label: l("Zugang", "دسترسی"), options: [o("present", "Ich bin vor Ort", "خودم حضور دارم"), o("key", "Schlüsselübergabe", "تحویل کلید"), o("concierge", "Hausmeister / Empfang", "سرایدار / پذیرش")] },
          ],
        },
      ],
    },
  },
  {
    slug: "umzug",
    color: "#C27C3E",
    name: l("Umzug", "اسباب‌کشی"),
    short: l("Packen, tragen, fahren, aufbauen – von Tür zu Tür.", "بسته‌بندی، حمل، رانندگی، چیدن – از در تا در."),
    heroTitle: l("Ihre Wohnung kommt mit.", "خانه‌تان همراهتان می‌آید."),
    heroLead: l(
      "Vom Karton bis zum letzten Regal: Wir planen den Umzug nach Etage, Aufzug, Möbeln und Strecke – und sagen Ihnen vorher, was er kostet.",
      "از کارتن تا آخرین قفسه: اسباب‌کشی را بر اساس طبقه، آسانسور، مبلمان و مسیر برنامه‌ریزی می‌کنیم – و از قبل هزینه را می‌گوییم.",
    ),
    journey: [
      { title: l("Wohnung", "خانه"), text: l("Sie sagen uns Größe, Etage und was mitkommt.", "اندازه، طبقه و وسایلی که می‌آیند را می‌گویید.") },
      { title: l("Kartons", "کارتن‌ها"), text: l("Wir bringen Kartons und Material – oder Sie packen selbst.", "کارتن و وسایل بسته‌بندی می‌آوریم – یا خودتان بسته‌بندی می‌کنید.") },
      { title: l("Packen", "بسته‌بندی"), text: l("Zerbrechliches wird gepolstert, Möbel werden zerlegt.", "وسایل شکستنی محافظت و مبلمان باز می‌شود.") },
      { title: l("LKW", "کامیون"), text: l("Beladen in fester Reihenfolge – Schweres unten, Wichtiges zuletzt.", "بارگیری با ترتیب مشخص – سنگین پایین، ضروری آخر.") },
      { title: l("Route", "مسیر"), text: l("Direkte Fahrt, Halteverbotszone auf Wunsch beantragt.", "رانندگی مستقیم، در صورت تمایل درخواست محدوده توقف ممنوع.") },
      { title: l("Ankunft", "رسیدن"), text: l("Jeder Karton in den richtigen Raum, Möbel wieder aufgebaut.", "هر کارتن در اتاق درست، مبلمان دوباره سوار.") },
    ],
    includes: [
      l("Privatumzug und Büroumzug", "اسباب‌کشی خانه و دفتر"),
      l("Packservice und Umzugsmaterial", "خدمات بسته‌بندی و وسایل اسباب‌کشی"),
      l("Möbelabbau und -aufbau", "باز و بسته کردن مبلمان"),
      l("Transporter oder LKW mit Fahrer", "ون یا کامیون با راننده"),
      l("Halteverbotszone auf Wunsch", "محدوده توقف ممنوع در صورت تمایل"),
    ],
    needs: [
      l("Start- und Zieladresse", "آدرس مبدأ و مقصد"),
      l("Wohnungsgröße, Etagen und Aufzug", "اندازه خانه، طبقات و آسانسور"),
      l("Ungefähre Anzahl Kartons und große Möbel", "تعداد تقریبی کارتن‌ها و مبلمان بزرگ"),
      l("Wunschtermin und ob wir packen sollen", "تاریخ دلخواه و اینکه بسته‌بندی با ما باشد یا نه"),
    ],
    pricing: {
      intro: l("Ein Umzug wird nach Aufwand kalkuliert. Sie erhalten ein Festpreis-Angebot, bevor es losgeht.", "اسباب‌کشی بر اساس میزان کار محاسبه می‌شود. پیش از شروع یک پیشنهاد با قیمت ثابت دریافت می‌کنید."),
      factors: [
        l("Volumen: Kartons und Möbel", "حجم: کارتن‌ها و مبلمان"),
        l("Etagen und ob ein Aufzug vorhanden ist", "طبقات و وجود آسانسور"),
        l("Entfernung zwischen Start und Ziel", "فاصله بین مبدأ و مقصد"),
        l("Zusatzleistungen: Packen, Montage, Halteverbot", "خدمات اضافه: بسته‌بندی، مونتاژ، توقف ممنوع"),
      ],
    },
    booking: {
      mode: "request",
      steps: [
        {
          id: "from",
          title: l("Von", "از"),
          questions: [
            { id: "fromAddress", type: "address", label: l("Startadresse", "آدرس مبدأ"), required: true },
            floor("fromFloor", l("Etage", "طبقه")),
            { id: "fromElevator", type: "toggle", label: l("Aufzug vorhanden", "آسانسور دارد") },
          ],
        },
        {
          id: "to",
          title: l("Nach", "به"),
          questions: [
            { id: "toAddress", type: "address", label: l("Zieladresse", "آدرس مقصد"), required: true },
            floor("toFloor", l("Etage", "طبقه")),
            { id: "toElevator", type: "toggle", label: l("Aufzug vorhanden", "آسانسور دارد") },
          ],
        },
        {
          id: "volume",
          title: l("Umfang", "حجم"),
          questions: [
            { id: "size", type: "choice", label: l("Wohnungsgröße", "اندازه خانه"), required: true, options: [o("1", "1 Zimmer", "۱ اتاق"), o("2", "2 Zimmer", "۲ اتاق"), o("3", "3 Zimmer", "۳ اتاق"), o("4", "4 Zimmer", "۴ اتاق"), o("5+", "5+ Zimmer", "۵+ اتاق")] },
            { id: "boxes", type: "number", label: l("Kartons (ca.)", "کارتن (تقریبی)"), min: 0, max: 300, step: 5, default: 30 },
            { id: "furniture", type: "multi", label: l("Große Möbel", "مبلمان بزرگ"), options: [o("sofa", "Sofa", "مبل"), o("bed", "Bett", "تخت"), o("wardrobe", "Kleiderschrank", "کمد لباس"), o("kitchen", "Küche", "آشپزخانه"), o("washer", "Waschmaschine", "ماشین لباسشویی"), o("piano", "Klavier", "پیانو")] },
            { id: "packing", type: "choice", label: l("Wer packt?", "بسته‌بندی با کیست؟"), required: true, options: [o("self", "Ich packe selbst", "خودم"), o("hamrah", "HAMRAH packt", "HAMRAH"), o("partly", "Teilweise", "بخشی")] },
          ],
        },
        {
          id: "when",
          title: l("Termin & Transport", "زمان و حمل"),
          questions: [
            { id: "date", type: "date", label: l("Umzugstag", "روز اسباب‌کشی"), required: true },
            { id: "vehicle", type: "choice", label: l("Fahrzeug", "وسیله نقلیه"), required: true, options: [o("advice", "Bitte beraten", "لطفاً راهنمایی کنید"), o("van", "Transporter", "ون"), o("truck", "LKW 7,5 t", "کامیون ۷٫۵ تن")] },
            { id: "assembly", type: "toggle", label: l("Möbel ab- und aufbauen", "باز و بسته کردن مبلمان") },
            { id: "parking", type: "toggle", label: l("Halteverbotszone beantragen", "درخواست محدوده توقف ممنوع") },
          ],
        },
      ],
    },
  },
  {
    slug: "montage",
    color: "#5872A0",
    name: l("Montage", "نصب و مونتاژ"),
    short: l("Möbel, Küchen, Lampen – fachgerecht aufgebaut.", "مبلمان، آشپزخانه، چراغ – درست و اصولی نصب می‌شود."),
    heroTitle: l("Aus Teilen wird ein Möbel.", "از قطعه‌ها، یک مبل ساخته می‌شود."),
    heroLead: l(
      "Schrank, Bett, Küche oder Wandregal: Wir bringen Werkzeug und Erfahrung mit, bauen auf, richten aus und nehmen die Verpackung mit.",
      "کمد، تخت، آشپزخانه یا قفسه دیواری: ابزار و تجربه می‌آوریم، نصب و تنظیم می‌کنیم و بسته‌بندی را با خود می‌بریم.",
    ),
    journey: [
      { title: l("Einzelteile", "قطعه‌ها"), text: l("Sie sagen uns, was aufgebaut werden soll – gern mit Foto oder Link.", "می‌گویید چه چیزی نصب شود – با عکس یا لینک بهتر است.") },
      { title: l("Werkzeuge", "ابزار"), text: l("Wir bringen das passende Werkzeug und Befestigungsmaterial.", "ابزار و وسایل اتصال مناسب را می‌آوریم.") },
      { title: l("Montage", "مونتاژ"), text: l("Aufbau nach Anleitung, ausgerichtet und sicher befestigt.", "نصب طبق دستورالعمل، تراز و محکم.") },
      { title: l("Fertiges Möbel", "مبل آماده"), text: l("Funktionsprüfung, Verpackung nehmen wir mit.", "بررسی عملکرد، بسته‌بندی را می‌بریم.") },
    ],
    includes: [
      l("Möbelmontage (Schrank, Bett, Regal, Kommode)", "مونتاژ مبلمان (کمد، تخت، قفسه، دراور)"),
      l("Küchenmontage und Anpassung", "نصب و تنظیم آشپزخانه"),
      l("Wandmontage: Regale, TV, Spiegel, Bilder", "نصب دیواری: قفسه، تلویزیون، آینه، تابلو"),
      l("Lampen und Vorhangschienen", "چراغ و ریل پرده"),
      l("Abbau und Entsorgung der Verpackung", "باز کردن و بردن بسته‌بندی"),
    ],
    needs: [
      l("Was aufgebaut wird (Art, Anzahl, Hersteller)", "چه چیزی نصب می‌شود (نوع، تعداد، سازنده)"),
      l("Ob an der Wand befestigt werden muss – und welche Wand", "آیا باید به دیوار وصل شود – و چه نوع دیواری"),
      l("Adresse, Etage und Wunschtermin", "آدرس، طبقه و زمان دلخواه"),
    ],
    pricing: {
      intro: l("Abgerechnet wird nach Aufwand. Bei Standardmöbeln nennen wir vorab einen Festpreis.", "بر اساس میزان کار محاسبه می‌شود. برای مبلمان استاندارد از قبل قیمت ثابت می‌گوییم."),
      factors: [
        l("Anzahl und Größe der Möbel", "تعداد و اندازه مبلمان"),
        l("Wandmontage und Wandart", "نصب دیواری و نوع دیوار"),
        l("Anfahrt und Etage", "مسیر رفت و طبقه"),
      ],
    },
    booking: {
      mode: "request",
      steps: [
        {
          id: "what",
          title: l("Was wird montiert?", "چه چیزی نصب شود؟"),
          questions: [
            { id: "items", type: "multi", label: l("Art", "نوع"), required: true, options: [o("wardrobe", "Schrank", "کمد"), o("bed", "Bett", "تخت"), o("shelf", "Regal", "قفسه"), o("kitchen", "Küche", "آشپزخانه"), o("tv", "TV / Wand", "تلویزیون / دیوار"), o("lamp", "Lampe", "چراغ"), o("other", "Sonstiges", "سایر")] },
            { id: "count", type: "number", label: l("Anzahl Teile", "تعداد"), min: 1, max: 50, default: 1, required: true },
            { id: "wall", type: "toggle", label: l("Wird an der Wand befestigt", "به دیوار وصل می‌شود") },
            { id: "details", type: "text", multiline: true, label: l("Hersteller / Modell / Link", "سازنده / مدل / لینک"), hint: l("z. B. IKEA PAX 200 cm", "مثلاً IKEA PAX ۲۰۰ سانتی‌متر") },
          ],
        },
        {
          id: "when",
          title: l("Ort & Termin", "مکان و زمان"),
          questions: [
            { id: "address", type: "address", label: l("Adresse", "آدرس"), required: true },
            floor("floor", l("Etage", "طبقه")),
            { id: "date", type: "date", label: l("Wunschtermin", "تاریخ دلخواه"), required: true },
            timeWindow,
          ],
        },
      ],
    },
  },
  {
    slug: "transport",
    color: "#D9653B",
    name: l("Transport", "حمل و نقل"),
    short: l("Einzelstück, Möbel oder Ladung – abgeholt und geliefert.", "یک قطعه، مبلمان یا بار – تحویل گرفته و رسانده می‌شود."),
    heroTitle: l("Abgeholt. Unterwegs. Angekommen.", "تحویل گرفته. در راه. رسیده."),
    heroLead: l(
      "Vom Kleinanzeigen-Sofa bis zur Palette: Wir holen ab, sichern die Ladung und liefern zur vereinbarten Zeit – mit Tragehilfe, wenn nötig.",
      "از مبل آگهی تا پالت: تحویل می‌گیریم، بار را ایمن می‌کنیم و در زمان توافق‌شده می‌رسانیم – در صورت نیاز با کمک برای حمل.",
    ),
    journey: [
      { title: l("Paket", "بسته"), text: l("Sie sagen uns, was transportiert wird und wie groß es ist.", "می‌گویید چه چیزی و با چه اندازه‌ای حمل شود.") },
      { title: l("Abholung", "تحویل گرفتن"), text: l("Wir holen zur vereinbarten Zeit ab – auch aus oberen Etagen.", "در زمان توافق‌شده تحویل می‌گیریم – حتی از طبقات بالا.") },
      { title: l("Fahrzeug", "وسیله نقلیه"), text: l("Ladung wird gesichert und geschützt.", "بار ایمن و محافظت می‌شود.") },
      { title: l("Route", "مسیر"), text: l("Direkte Fahrt zum Ziel.", "رانندگی مستقیم به مقصد.") },
      { title: l("Lieferung", "تحویل"), text: l("Übergabe an der Tür oder bis in den Raum.", "تحویل دم در یا تا داخل اتاق.") },
    ],
    includes: [
      l("Möbel- und Einzeltransporte", "حمل مبلمان و اقلام تکی"),
      l("Abholung von Online-Käufen und Kleinanzeigen", "تحویل خریدهای اینترنتی و آگهی‌ها"),
      l("Kurierfahrten für Firmen", "پیک برای شرکت‌ها"),
      l("Tragehilfe bis in die Wohnung", "کمک در حمل تا داخل خانه"),
      l("Entsorgungsfahrten zum Wertstoffhof", "حمل به مرکز بازیافت"),
    ],
    needs: [
      l("Was transportiert wird, Größe und Gewicht", "چه چیزی حمل می‌شود، اندازه و وزن"),
      l("Abhol- und Lieferadresse", "آدرس تحویل گرفتن و رساندن"),
      l("Ob Tragehilfe nötig ist und welche Etage", "آیا کمک برای حمل لازم است و چه طبقه‌ای"),
      l("Wunschtag und Zeitfenster", "روز و بازه زمانی دلخواه"),
    ],
    pricing: {
      intro: l("Transporte rechnen wir nach Strecke und Aufwand ab. Den Preis kennen Sie vor der Fahrt.", "حمل بر اساس مسافت و میزان کار محاسبه می‌شود. قیمت را پیش از حرکت می‌دانید."),
      factors: [
        l("Entfernung", "مسافت"),
        l("Größe und Gewicht der Ladung", "اندازه و وزن بار"),
        l("Tragehilfe und Etagen", "کمک در حمل و طبقات"),
        l("Termin: Express oder flexibel", "زمان: فوری یا انعطاف‌پذیر"),
      ],
    },
    booking: {
      mode: "request",
      steps: [
        {
          id: "what",
          title: l("Was?", "چه چیزی؟"),
          questions: [
            { id: "cargo", type: "choice", label: l("Was wird transportiert?", "چه چیزی حمل می‌شود؟"), required: true, options: [o("parcel", "Paket / Karton", "بسته / کارتن"), o("furniture", "Möbelstück", "مبل"), o("appliance", "Elektrogerät", "لوازم برقی"), o("pallet", "Palette", "پالت"), o("other", "Sonstiges", "سایر")] },
            { id: "pieces", type: "number", label: l("Anzahl Teile", "تعداد"), min: 1, max: 100, default: 1, required: true },
            { id: "heavy", type: "toggle", label: l("Schwerer als 30 kg", "سنگین‌تر از ۳۰ کیلو") },
            { id: "details", type: "text", label: l("Kurze Beschreibung", "توضیح کوتاه"), hint: l("z. B. Sofa 3-Sitzer, 2,20 m", "مثلاً مبل سه‌نفره، ۲٫۲۰ متر") },
          ],
        },
        {
          id: "route",
          title: l("Route", "مسیر"),
          questions: [
            { id: "pickup", type: "address", label: l("Abholung", "محل تحویل گرفتن"), required: true },
            { id: "dropoff", type: "address", label: l("Lieferung", "محل تحویل دادن"), required: true },
            { id: "carry", type: "toggle", label: l("Tragehilfe gewünscht", "کمک برای حمل لازم است") },
          ],
        },
        {
          id: "when",
          title: l("Termin", "زمان"),
          questions: [
            { id: "date", type: "date", label: l("Wunschtag", "روز دلخواه"), required: true },
            timeWindow,
            { id: "express", type: "toggle", label: l("Eilig (heute / morgen)", "فوری (امروز / فردا)") },
          ],
        },
      ],
    },
  },
  {
    slug: "dolmetschen",
    color: "#1F7049",
    name: l("Dolmetschen", "ترجمه شفاهی"),
    short: l("Dari, Farsi, Paschtu ⇄ Deutsch – vor Ort oder am Telefon.", "دری، فارسی، پشتو ⇄ آلمانی – حضوری یا تلفنی."),
    heroTitle: l("Jedes Wort kommt an.", "هر کلمه می‌رسد."),
    heroLead: l(
      "Persönliche Begleitung zu Jugendamt, Jobcenter, Arzt, Schule und Behörden in Fürth und Umgebung – und telefonisch in ganz Deutschland, rund um die Uhr.",
      "همراهی حضوری در اداره جوانان، جاب‌سنتر، پزشک، مدرسه و ادارات در فورت و اطراف – و تلفنی در سراسر آلمان، شبانه‌روزی.",
    ),
    journey: [
      { title: l("Sprache A", "زبان الف"), text: l("Sie sprechen Dari, Farsi, Paschtu – oder Deutsch.", "شما دری، فارسی، پشتو – یا آلمانی صحبت می‌کنید.") },
      { title: l("Dolmetscher", "مترجم"), text: l("Eine Person, die beide Sprachen und beide Kulturen kennt.", "کسی که هر دو زبان و هر دو فرهنگ را می‌شناسد.") },
      { title: l("Sprache B", "زبان ب"), text: l("Ihr Gegenüber versteht jedes Wort – vollständig und neutral.", "طرف مقابل هر کلمه را می‌فهمد – کامل و بی‌طرف.") },
      { title: l("Termin", "نوبت"), text: l("Sie wählen einen freien Termin online – bestätigt per E-Mail.", "یک نوبت آزاد را آنلاین انتخاب می‌کنید – تأیید با ایمیل.") },
      { title: l("Einsatz", "انجام کار"), text: l("Vor Ort an der Adresse oder telefonisch zugeschaltet.", "حضوری در محل یا اتصال تلفنی.") },
    ],
    includes: [
      l("Jugendamt, Jobcenter und Behörden", "اداره جوانان، جاب‌سنتر و ادارات"),
      l("Arzt, Klinik und Therapie", "پزشک، کلینیک و درمان"),
      l("Schule und Kita", "مدرسه و مهدکودک"),
      l("Gericht, Anwalt und Beratungsstellen", "دادگاه، وکیل و مراکز مشاوره"),
      l("Telefondolmetschen deutschlandweit, auch sofort", "ترجمه تلفنی در سراسر آلمان، حتی فوری"),
    ],
    needs: [
      l("Sprache und Anlass des Termins", "زبان و موضوع نوبت"),
      l("Datum, Uhrzeit und voraussichtliche Dauer", "تاریخ، ساعت و مدت تقریبی"),
      l("Adresse (vor Ort) oder Rückrufnummer (Telefon)", "آدرس (حضوری) یا شماره تماس (تلفنی)"),
      l("Privat oder für eine Einrichtung – mit Rechnungsadresse", "شخصی یا برای یک نهاد – با آدرس صورتحساب"),
    ],
    pricing: {
      intro: l("Abgerechnet wird nach Zeit – transparent und minutengenau.", "بر اساس زمان محاسبه می‌شود – شفاف و دقیقه‌ای."),
      factors: [
        l("Mindestens 1 Stunde, danach jede weitere Minute", "حداقل ۱ ساعت، سپس هر دقیقه اضافه"),
        l("Vor Ort oder telefonisch", "حضوری یا تلفنی"),
        l("Rechnung als PDF – privat oder an die Einrichtung", "صورتحساب PDF – شخصی یا برای نهاد"),
      ],
    },
    booking: { mode: "wizard" },
  },
  {
    slug: "sicherheit",
    color: "#3F4C86",
    name: l("Sicherheit", "خدمات امنیتی"),
    short: l("Objekt, Veranstaltung, Empfang – Präsenz, die schützt.", "ساختمان، مراسم، پذیرش – حضوری که محافظت می‌کند."),
    heroTitle: l("Da, wenn es darauf ankommt.", "حاضر، وقتی اهمیت دارد."),
    heroLead: l(
      "Objektschutz, Veranstaltungen, Empfang und Baustellen: Wir planen den Einsatz mit Ihnen und schicken Personal, das zum Auftrag passt.",
      "حفاظت از ساختمان، مراسم، پذیرش و کارگاه ساختمانی: کار را با شما برنامه‌ریزی می‌کنیم و نیرویی می‌فرستیم که مناسب همان کار است.",
    ),
    journey: [
      { title: l("Mitarbeiter", "نیرو"), text: l("Wir wählen Personal passend zu Ort, Sprache und Aufgabe.", "نیرو را متناسب با مکان، زبان و وظیفه انتخاب می‌کنیم.") },
      { title: l("Qualifikation", "صلاحیت"), text: l("Nur Mitarbeitende, deren Qualifikation zum Auftrag passt.", "فقط نیروهایی که صلاحیتشان با کار جور است.") },
      { title: l("Auftrag", "مأموریت"), text: l("Ort, Zeiten und Aufgaben werden schriftlich festgelegt.", "مکان، زمان‌ها و وظایف کتبی مشخص می‌شود.") },
      { title: l("Unterwegs", "در راه"), text: l("Pünktliche Anreise, Übergabe vor Ort.", "رسیدن به‌موقع، تحویل در محل.") },
      { title: l("Einsatz", "انجام کار"), text: l("Präsenz, Kontrolle und Ansprechperson während des Einsatzes.", "حضور، کنترل و فرد پاسخگو در طول کار.") },
      { title: l("Abschluss", "پایان"), text: l("Kurzer Bericht nach dem Einsatz.", "گزارش کوتاه پس از کار.") },
    ],
    includes: [
      l("Objektschutz und Kontrollgänge", "حفاظت از ساختمان و گشت"),
      l("Veranstaltungsschutz und Einlass", "حفاظت مراسم و کنترل ورود"),
      l("Empfangs- und Pfortendienst", "پذیرش و نگهبانی در ورودی"),
      l("Baustellenbewachung", "نگهبانی کارگاه ساختمانی"),
      l("Mehrsprachiges Personal auf Wunsch", "نیروی چندزبانه در صورت تمایل"),
    ],
    needs: [
      l("Art des Einsatzes und Ort", "نوع کار و مکان"),
      l("Zeitraum, Uhrzeiten und Anzahl der Personen", "بازه زمانی، ساعت‌ها و تعداد نفرات"),
      l("Besondere Anforderungen (Sprache, Kleidung, Aufgaben)", "نیازهای ویژه (زبان، پوشش، وظایف)"),
    ],
    pricing: {
      intro: l("Sicherheitsdienste werden nach Einsatzstunden und Personal kalkuliert. Sie erhalten ein schriftliches Angebot.", "خدمات امنیتی بر اساس ساعت کار و تعداد نیرو محاسبه می‌شود. پیشنهاد کتبی دریافت می‌کنید."),
      factors: [
        l("Anzahl der Personen und Stunden", "تعداد نفرات و ساعت‌ها"),
        l("Uhrzeit: Nacht, Wochenende, Feiertag", "زمان: شب، آخر هفته، تعطیلات"),
        l("Art und Dauer des Auftrags", "نوع و مدت مأموریت"),
      ],
    },
    booking: {
      mode: "request",
      steps: [
        {
          id: "kind",
          title: l("Einsatz", "نوع کار"),
          questions: [
            { id: "kind", type: "choice", label: l("Art des Einsatzes", "نوع کار"), required: true, options: [o("object", "Objektschutz", "حفاظت از ساختمان"), o("event", "Veranstaltung", "مراسم"), o("reception", "Empfang / Pforte", "پذیرش / ورودی"), o("construction", "Baustelle", "کارگاه ساختمانی"), o("other", "Sonstiges", "سایر")] },
            { id: "guards", type: "number", label: l("Anzahl Personen", "تعداد نفرات"), min: 1, max: 50, default: 1, required: true },
            { id: "requirements", type: "multi", label: l("Anforderungen", "نیازها"), options: [o("languages", "Mehrsprachig", "چندزبانه"), o("night", "Nachts", "شبانه"), o("uniform", "Dienstkleidung", "لباس فرم"), o("firstaid", "Ersthelfer", "کمک‌های اولیه")] },
          ],
        },
        {
          id: "when",
          title: l("Ort & Zeitraum", "مکان و زمان"),
          questions: [
            { id: "address", type: "address", label: l("Einsatzort", "محل کار"), required: true },
            { id: "date", type: "date", label: l("Beginn", "شروع"), required: true },
            { id: "hours", type: "number", label: l("Stunden pro Tag", "ساعت در روز"), min: 1, max: 24, default: 8, required: true },
            { id: "days", type: "number", label: l("Anzahl Tage", "تعداد روز"), min: 1, max: 365, default: 1, required: true },
          ],
        },
      ],
    },
  },
];

export const serviceBySlug = (slug: string) => services.find((s) => s.slug === slug);
export const isServiceSlug = (v: string): v is ServiceSlug => (serviceSlugs as readonly string[]).includes(v);

/** Link zur Buchung: Dolmetschen nutzt den bestehenden Termin-Assistenten mit freien Zeiten. */
export function bookingHref(locale: Locale, s: ServiceWorld) {
  return s.booking.mode === "wizard" ? `/${locale}/termin` : `/${locale}/anfrage/${s.slug}`;
}

/** Fragen, die bei den aktuellen Antworten sichtbar sind */
export function visibleQuestions(step: FormStep, answers: Record<string, unknown>) {
  return step.questions.filter((q) => !q.showIf || q.showIf.in.includes(answers[q.showIf.id] as string | boolean));
}
