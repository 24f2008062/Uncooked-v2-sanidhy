"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { translations, SUPPORTED_LANGUAGES } from "@/lib/i18n/translations";

const LanguageContext = createContext({
  language: "en",
  languageName: "English",
  setLanguage: () => null,
  t: (path, fallback) => fallback || path,
  supportedLanguages: SUPPORTED_LANGUAGES,
});

function resolveKey(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function normalizeLanguageCode(input) {
  if (!input) return "en";
  const lower = String(input).toLowerCase().trim();

  // Direct code matches
  if (SUPPORTED_LANGUAGES.some((l) => l.code === lower)) {
    return lower;
  }

  // Name or partial matches
  if (lower.includes("hindi") || lower.includes("हिन्दी") || lower === "hi") return "hi";
  if (lower.includes("japan") || lower.includes("日本語") || lower === "ja") return "ja";
  if (lower.includes("portug") || lower.includes("português") || lower === "pt") return "pt";
  if (lower.includes("german") || lower.includes("deutsch") || lower === "de") return "de";
  if (lower.includes("spanish") || lower.includes("español") || lower === "es") return "es";
  if (lower.includes("french") || lower.includes("français") || lower === "fr") return "fr";
  if (lower.includes("english") || lower === "en") return "en";

  return "en";
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("en");
  const [mounted, setMounted] = useState(false);

  const applyLanguage = useCallback((rawLang) => {
    const code = normalizeLanguageCode(rawLang);
    setLanguageState(code);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("user_language", code);
        localStorage.setItem("app_language", code);
        document.cookie = `app_language=${code}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {}
      if (document.documentElement) {
        document.documentElement.setAttribute("lang", code);
      }
    }
  }, []);

  useEffect(() => {
    let initialLang = "en";
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user_language") || localStorage.getItem("app_language");
      if (stored) {
        initialLang = normalizeLanguageCode(stored);
      } else if (navigator.language) {
        initialLang = normalizeLanguageCode(navigator.language.slice(0, 2));
      }
    }
    applyLanguage(initialLang);
    setMounted(true);
  }, [applyLanguage]);

  const setLanguage = useCallback(
    (newLang) => {
      applyLanguage(newLang);
    },
    [applyLanguage]
  );

  const t = useCallback(
    (path, fallback = "", params = null) => {
      let resolved = resolveKey(translations[language], path);

      // Fallback to English if translation is missing in current language
      if (resolved === undefined && language !== "en") {
        resolved = resolveKey(translations.en, path);
      }

      if (resolved === undefined) {
        resolved = fallback || path;
      }

      if (typeof resolved === "string" && params && typeof params === "object") {
        let output = resolved;
        for (const [k, v] of Object.entries(params)) {
          output = output.replaceAll(`{${k}}`, String(v));
        }
        return output;
      }

      return resolved;
    },
    [language]
  );

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        languageName: currentLangObj.nativeName,
        languageCode: language,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
        mounted,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
