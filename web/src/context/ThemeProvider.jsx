import { createContext, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";

const getInitialTheme = (storageKey, defaultTheme) => {
  if (typeof window === "undefined") {
    return defaultTheme;
  }
  return localStorage.getItem(storageKey) || defaultTheme;
};

const ThemeProviderContext = createContext({
  theme: "system",
  setTheme: () => {},
});

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "vite-ui-theme",
  ...props
}) {
  const [theme, setTheme] = useState(() =>
    getInitialTheme(storageKey, defaultTheme)
  );

  // handles theme application and system preference changes
  useEffect(() => {
    const applyTheme = (currentTheme) => {
      // Clear previous theme classes from the root
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");

      // determine the theme to apply
      const effectiveTheme =
        currentTheme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : currentTheme;
      
      // Apply the new theme class to the root
      root.classList.add(effectiveTheme);
    };

    applyTheme(theme);

    // listener for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handleChange);

    // remove theme class when component unmounts
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
    };
      
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
  defaultTheme: PropTypes.oneOf(["light", "dark", "system"]),
  storageKey: PropTypes.string,
};

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};