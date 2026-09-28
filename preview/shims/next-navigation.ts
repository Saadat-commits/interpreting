import { useSyncExternalStore } from "react";
import { getPath, subscribe } from "../router";

export function usePathname() {
  return useSyncExternalStore(subscribe, () => getPath().split("?")[0]);
}

export function notFound(): never {
  throw new Error("not found");
}
