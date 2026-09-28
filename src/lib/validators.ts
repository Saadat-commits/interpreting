export const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Großzügig: +49 …, 0911 …, mit Leerzeichen/Bindestrichen; mind. 6 Ziffern */
export function isPhone(v: string) {
  return /^\+?[\d\s()/-]{6,}$/.test(v.trim()) && v.replace(/\D/g, "").length >= 6;
}
