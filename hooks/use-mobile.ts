import * as React from "react"

const MOBILE_BREAKPOINT = 768

const subscribeMobile = (callback: () => void) => {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
};

const getMobileSnapshot = () => window.innerWidth < MOBILE_BREAKPOINT;
const getMobileServerSnapshot = () => false;

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeMobile,
    getMobileSnapshot,
    getMobileServerSnapshot
  );
}
