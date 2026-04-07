import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from "react";

const RouterContext = createContext(null);

function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, "/");
  const [pathname, search] = raw.split("?");
  const params = Object.fromEntries(new URLSearchParams(search || ""));
  return { pathname: pathname || "/", params };
}

export function HashRouterProvider({ children }) {
  const [location, setLocation] = useState(parseHash);

  useEffect(() => {
    function onHashChange() {
      setLocation(parseHash());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((path) => {
    window.location.hash = path;
  }, []);

  const replace = useCallback((path) => {
    window.location.replace(`${window.location.pathname}${window.location.search}#${path}`);
    setLocation(parseHash());
  }, []);

  const value = useMemo(
    () => ({ pathname: location.pathname, params: location.params, navigate, replace }),
    [location.pathname, location.params, navigate, replace],
  );

  return createElement(RouterContext.Provider, { value }, children);
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("HashRouterProvider 안에서만 사용할 수 있어.");
  return ctx;
}

export function matchPath(pattern, pathname) {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) return { matched: false, params: {} };

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return { matched: false, params: {} };
    }
  }
  return { matched: true, params };
}
