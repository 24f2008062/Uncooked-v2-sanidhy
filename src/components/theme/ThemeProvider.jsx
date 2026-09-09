"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeContext = createContext({
  theme: "dark",
  mode: "dark",
  setTheme: () => null,
  toggleTheme: () => null,
});

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState("dark");
  const [theme, setThemeState] = useState("dark");
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback((targetMode) => {
    let resolved = targetMode;
    if (targetMode === "system") {
      if (typeof window !== "undefined" && window.matchMedia) {
        resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } else {
        resolved = "dark";
      }
    }
    const finalTheme = resolved === "light" ? "light" : "dark";
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", finalTheme);
    }
    setThemeState(finalTheme);
    setModeState(targetMode);
  }, []);

  useEffect(() => {
    const storedMode = localStorage.getItem("theme_mode") || localStorage.getItem("theme") || "dark";
    const validMode = (storedMode === "light" || storedMode === "dark" || storedMode === "system") ? storedMode : "dark";
    
    applyTheme(validMode);
    queueMicrotask(() => {
      setMounted(true);
    });

    const mql = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const handleChange = (e) => {
      const currentMode = localStorage.getItem("theme_mode");
      if (currentMode === "system") {
        const autoTheme = e.matches ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", autoTheme);
        setThemeState(autoTheme);
      }
    };

    if (mql && mql.addEventListener) {
      mql.addEventListener("change", handleChange);
      return () => mql.removeEventListener("change", handleChange);
    }
  }, [applyTheme]);

  const setTheme = (newMode) => {
    const target = (newMode === "light" || newMode === "dark" || newMode === "system") ? newMode : "dark";
    localStorage.setItem("theme_mode", target);
    localStorage.setItem("theme", target === "system" ? theme : target);
    applyTheme(target);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

