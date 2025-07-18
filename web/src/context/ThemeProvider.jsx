import { createContext, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";

const availableColorThemes = [
  "neutral",
  "zinc",
  "slate",
  "rose",
  "orange",
  "green",
  "blue",
  "yellow",
  "violet",
];

const getInitialTheme = (storageKey, defaultTheme) => {
  if (typeof window === "undefined") {
    return defaultTheme;
  }
  return localStorage.getItem(storageKey) || defaultTheme;
};

const ThemeProviderContext = createContext({
  theme: "system",
  setTheme: () => {},
  colorTheme: "zinc",
  setColorTheme: () => {},
  availableColorThemes: [],
});

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultColorTheme = "zinc",
  storageKey = "vite-ui-theme",
  colorThemeStorageKey = "vite-ui-color-theme",
  ...props
}) {
  const [theme, setTheme] = useState(() =>
    getInitialTheme(storageKey, defaultTheme)
  );

  const [colorTheme, setColorTheme] = useState(() =>
    getInitialTheme(colorThemeStorageKey, defaultColorTheme)
  );

  // handles theme application and system preference changes
  useEffect(() => {
    const applyTheme = (currentTheme) => {
      // clear previous theme classes from the root
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");

      // determine the theme to apply
      const effectiveTheme =
        currentTheme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : currentTheme;
      // apply the new theme class to the root
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

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(...availableColorThemes.map((t) => `theme-${t}`));
    if (colorTheme) {
      root.classList.add(`theme-${colorTheme}`);
    }
  }, [colorTheme]);

  const value = {
    theme,
    setTheme: (newTheme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
    colorTheme,
    setColorTheme: (newColorTheme) => {
      localStorage.setItem(colorThemeStorageKey, newColorTheme);
      setColorTheme(newColorTheme);
    },
    availableColorThemes,
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
  defaultColorTheme: PropTypes.string,
  colorThemeStorageKey: PropTypes.string,
};

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
