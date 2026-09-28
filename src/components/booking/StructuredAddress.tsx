"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { addressProblems, formatAddress, normalizeStreet, parseFreeAddress } from "@/lib/address";
import { normalizeStreetKey } from "@/lib/streets";
import type { Locale, PostalAddress } from "@/lib/types";
import { IconCheck, IconPin } from "../icons";

export interface AddressTexts {
  street: string;
  streetPlaceholder: string;
  postalCode: string;
  city: string;
  cityAuto: string;
  cityPick: string;
  plzUnknown: string;
  needNumber: string;
  plzFirst: string;
  streetsIn: string;
  streetFound: string;
  streetUnknown: string;
  places: string;
}

interface Suggestion {
  id: string;
  title: string;
  subtitle: string;
  address?: PostalAddress;
  needsDetails?: boolean;
}

const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");

/**
 * Adresse wie beim Online-Banking:
 *  1. PLZ → Ort erscheint sofort automatisch
 *  2. Straße → beim Tippen werden die Straßen genau dieser PLZ darunter vorgeschlagen
 *  3. Hausnummer dahinter – fertig
 * Eine komplett eingefügte Adresse wird automatisch auf die Felder verteilt.
 */
export function StructuredAddress({
  value,
  onChange,
  t,
  locale,
  autoFocus,
}: {
  value: PostalAddress | null;
  onChange: (a: PostalAddress | null) => void;
  t: AddressTexts;
  locale: Locale;
  autoFocus?: boolean;
}) {
  const id = useId();
  const [streetLine, setStreetLine] = useState(value ? `${value.street} ${value.houseNumber}`.trim() : "");
  const [plz, setPlz] = useState(value?.postalCode ?? "");
  const [city, setCity] = useState(value?.city ?? "");
  const [placeName, setPlaceName] = useState(value?.placeName);
  const [cities, setCities] = useState<string[]>([]);
  const [plzState, setPlzState] = useState<"idle" | "loading" | "found" | "unknown">(value?.city ? "found" : "idle");
  const [streets, setStreets] = useState<string[]>([]);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [places, setPlaces] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [streetTouched, setStreetTouched] = useState(false);
  const streetRef = useRef<HTMLInputElement>(null);

  // Straße + Hausnummer trennen
  const parsedStreet = useMemo(() => {
    const m = streetLine.trim().match(/^(.*?[A-Za-zÄÖÜäöüß.])\s*(\d+\s*[a-zA-Z]?(?:\s*[-/]\s*\d+[a-zA-Z]?)?)$/);
    return m ? { street: normalizeStreet(m[1]), houseNumber: m[2].replace(/\s+/g, "") } : { street: normalizeStreet(streetLine), houseNumber: "" };
  }, [streetLine]);

  const plzOk = /^\d{5}$/.test(plz);

  // Ergebnis melden
  useEffect(() => {
    const a: PostalAddress = {
      street: parsedStreet.street,
      houseNumber: parsedStreet.houseNumber,
      postalCode: plz,
      city,
      country: "DE",
      label: "",
      source: "manual",
      placeName,
    };
    a.label = formatAddress(a);
    onChange(addressProblems(a).length === 0 ? a : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedStreet, plz, city, placeName]);

  // PLZ → Ort (live), danach direkt zur Straße springen
  useEffect(() => {
    if (!plzOk) {
      setCities([]);
      setPlzState("idle");
      setKnown(new Set());
      return;
    }
    let cancelled = false;
    setKnown(new Set());
    setPlzState("loading");
    fetch(`/api/plz?code=${plz}`)
      .then((r) => r.json() as Promise<{ cities: string[] }>)
      .then(({ cities: found }) => {
        if (cancelled) return;
        setCities(found);
        if (found.length === 0) setPlzState("unknown");
        else {
          setPlzState("found");
          if (!found.includes(city)) setCity(found[0]);
        }
      })
      .catch(() => !cancelled && setPlzState("unknown"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plz]);

  // Straßen dieser PLZ vorschlagen (beim Tippen gefiltert)
  useEffect(() => {
    if (!plzOk) {
      setStreets([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/streets?plz=${plz}&q=${encodeURIComponent(parsedStreet.street)}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const list = ((await res.json()) as { streets: string[] }).streets;
        setStreets(list);
        setActive(-1);
        setKnown((prev) => {
          const next = new Set(prev);
          list.forEach((s) => next.add(normalizeStreetKey(s)));
          return next;
        });
      } catch {
        /* Vorschläge sind optional */
      }
    }, 140);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [plz, plzOk, parsedStreet.street]);

  // Einrichtungen (z. B. „Jugendamt“) – ergänzen PLZ und Ort gleich mit
  useEffect(() => {
    const q = streetLine.trim();
    if (q.length < 3 || !open || /\d/.test(q)) {
      setPlaces([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(q + (plzOk ? ` ${plz}` : ""))}&lang=${locale}`, { signal: ctrl.signal });
        if (res.ok) {
          const list = ((await res.json()) as { suggestions: Suggestion[] }).suggestions;
          // mit bekannter PLZ nur Treffer in dieser PLZ
          // mit bekannter PLZ: nur Einrichtungen in dieser PLZ (reine Straßen kommen schon oben)
          setPlaces(list.filter((s) => !plzOk || !s.address || (s.address.postalCode === plz && !!s.address.placeName)).slice(0, plzOk ? 3 : 5));
        }
      } catch {
        /* optional */
      }
    }, 220);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [streetLine, open, plz, plzOk, locale]);

  const applyPlace = async (s: Suggestion) => {
    let a = s.address;
    if (!a && s.needsDetails) {
      const res = await fetch(`/api/places/details?id=${encodeURIComponent(s.id)}&lang=${locale}`);
      if (res.ok) a = ((await res.json()) as { address: PostalAddress }).address;
    }
    if (!a) return;
    setStreetLine(`${a.street} ${a.houseNumber}`.trim());
    setPlz(a.postalCode);
    setCity(a.city);
    setPlaceName(a.placeName);
    setOpen(false);
  };

  const applyStreet = (name: string) => {
    const nr = parsedStreet.houseNumber;
    setStreetLine(nr ? `${name} ${nr}` : `${name} `);
    setPlaceName(undefined);
    setOpen(false);
    setStreetTouched(false);
    // Cursor ans Ende → Hausnummer direkt dahinter tippen
    requestAnimationFrame(() => {
      const el = streetRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };

  // Eine komplette Adresse eingefügt/getippt? → automatisch auf die Felder verteilen
  const onStreetChange = (v: string) => {
    const full = parseFreeAddress(v);
    if (full && full.postalCode && full.street) {
      setStreetLine(`${full.street} ${full.houseNumber}`.trim());
      setPlz(full.postalCode);
      if (full.city) setCity(full.city);
      setPlaceName(undefined);
      return;
    }
    setStreetLine(v);
    setPlaceName(undefined);
    setOpen(true);
  };

  const streetKey = normalizeStreetKey(parsedStreet.street);
  const streetKnown = plzOk && streetKey.length > 2 && known.has(streetKey);
  // Vorschläge ausblenden, sobald die Straße exakt passt und eine Hausnummer da ist
  const streetItems = streetKnown && parsedStreet.houseNumber ? [] : streets.filter((s) => normalizeStreetKey(s) !== streetKey || !parsedStreet.houseNumber);
  const showStreets = open && plzOk && streetItems.length > 0 && !(streetKnown && streetItems.length === 1 && normalizeStreetKey(streetItems[0]) === streetKey && parsedStreet.houseNumber);
  const showList = open && (showStreets || places.length > 0);
  const flat = [...(showStreets ? streetItems.map((s) => ({ kind: "street" as const, s })) : []), ...places.map((p) => ({ kind: "place" as const, p }))];

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList || flat.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % flat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? flat.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      const item = flat[active];
      if (item.kind === "street") applyStreet(item.s);
      else applyPlace(item.p);
    } else if (e.key === "Escape") setOpen(false);
  };

  const needNumber = streetTouched && parsedStreet.street.length > 1 && !parsedStreet.houseNumber;
  const streetUnknown = streetTouched && plzOk && plzState === "found" && known.size > 0 && parsedStreet.street.length > 2 && !streetKnown && !placeName;

  return (
    <div className="space-y-4">
      {/* 1. PLZ + Ort */}
      <div className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] gap-3" dir="ltr">
        <div>
          <label className="field-label" htmlFor={`${id}-p`}>
            {t.postalCode}
          </label>
          <input
            id={`${id}-p`}
            className={`field !py-3.5 !text-base tracking-[0.14em] ${plzState === "found" ? "!border-brand-300" : ""}`}
            value={plz}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 5);
              setPlz(v);
              // PLZ vollständig → direkt weiter zur Straße
              if (v.length === 5 && !parsedStreet.street) requestAnimationFrame(() => streetRef.current?.focus());
            }}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="90402"
            maxLength={5}
            autoFocus={autoFocus}
          />
        </div>
        <div>
          <label className="field-label" htmlFor={`${id}-c`}>
            {t.city}
          </label>
          {cities.length > 1 ? (
            <select id={`${id}-c`} className="field !py-3.5 !text-base" value={city} onChange={(e) => setCity(e.target.value)}>
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          ) : (
            <div className="relative">
              <input
                id={`${id}-c`}
                className={`field !py-3.5 !pe-11 !text-base transition ${plzState === "found" ? "!border-brand-300 !bg-brand-50/40" : ""}`}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
                placeholder={plzState === "loading" ? "…" : ""}
                tabIndex={plzState === "found" ? -1 : 0}
              />
              {plzState === "found" && (
                <span className="absolute end-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-brand-600 text-white">
                  <IconCheck size={13} strokeWidth={3} />
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="-mt-2 min-h-[18px] text-[13px]" aria-live="polite">
        {plzState === "found" && cities.length === 1 && <span className="text-brand-700">✓ {t.cityAuto.replace("{city}", city)}</span>}
        {plzState === "found" && cities.length > 1 && <span className="text-ink-muted">{t.cityPick}</span>}
        {plzState === "unknown" && <span className="text-ink-muted">{t.plzUnknown}</span>}
        {plzState === "idle" && !parsedStreet.street && <span className="text-ink-muted">{t.plzFirst}</span>}
      </div>

      {/* 2. Straße + Hausnummer mit Vorschlägen aus dieser PLZ */}
      <div className="relative">
        <label className="field-label" htmlFor={`${id}-s`}>
          {t.street}
        </label>
        <div className="relative">
          <input
            id={`${id}-s`}
            ref={streetRef}
            className={`field !py-3.5 !pe-11 !text-base ${streetKnown ? "!border-brand-300" : ""}`}
            value={streetLine}
            onChange={(e) => onStreetChange(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => (setOpen(false), setStreetTouched(true)), 160)}
            onKeyDown={onKeyDown}
            placeholder={t.streetPlaceholder}
            autoComplete="address-line1"
            role="combobox"
            aria-expanded={showList}
            aria-controls={`${id}-list`}
            dir="ltr"
          />
          {streetKnown && parsedStreet.houseNumber && (
            <span className="absolute end-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-brand-600 text-white">
              <IconCheck size={13} strokeWidth={3} />
            </span>
          )}
        </div>
        {showList && (
          <div id={`${id}-list`} role="listbox" className="absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-auto rounded-2xl border border-line bg-white p-1.5 shadow-deep" dir="ltr">
            {showStreets && (
              <>
                <p className="px-3 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">{fill(t.streetsIn, { plz, city })}</p>
                {streetItems.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    role="option"
                    aria-selected={active === i}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyStreet(s)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start hover:bg-brand-50 ${active === i ? "bg-brand-50" : ""}`}
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-brand-700 ring-1 ring-brand-100">
                      <IconPin size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-semibold text-ink">
                        <Highlight text={s} q={parsedStreet.street} />
                      </span>
                      <span className="block truncate text-[13px] text-ink-muted">
                        {plz} {city}
                      </span>
                    </span>
                  </button>
                ))}
              </>
            )}
            {places.length > 0 && (
              <>
                <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">{t.places}</p>
                {places.map((s, j) => {
                  const i = (showStreets ? streetItems.length : 0) + j;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="option"
                      aria-selected={active === i}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyPlace(s)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start hover:bg-brand-50 ${active === i ? "bg-brand-50" : ""}`}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                        <IconPin size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-semibold text-ink">{s.title}</span>
                        <span className="block truncate text-[13px] text-ink-muted">{s.subtitle}</span>
                      </span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        )}
        <div className="mt-1.5 min-h-[18px] text-[13px]" aria-live="polite">
          {placeName ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-brand-700" dir="ltr">
              <IconCheck size={14} strokeWidth={2.6} /> {placeName}
            </span>
          ) : needNumber ? (
            <span className="text-brand-800">{t.needNumber}</span>
          ) : streetKnown ? (
            <span className="text-brand-700">✓ {fill(t.streetFound, { plz, city })}</span>
          ) : streetUnknown ? (
            <span className="text-ink-muted">{fill(t.streetUnknown, { plz })}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Highlight({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0 || !q) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-brand-100 text-ink">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}
