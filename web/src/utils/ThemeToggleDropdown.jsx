// src/components/ThemeColorPicker.jsx

import { Check, Palette } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// colors for swatches
const themeColors = {
  neutral: "#f3f4f6",
  zinc: "#0c0a09",
  slate: "#334155",
  rose: "#e11d48",
  green: "#22c55e",
  blue: "#3b82f6",
  orange: "#f97316",
  yellow: "#eab308",
  violet: "#8b5cf6",
};

export function ThemeToggleDropdown() {
  const { colorTheme, setColorTheme, availableColorThemes } = useTheme();

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-[145px] justify-start cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: themeColors[colorTheme] }}
                  />
                  <span className="capitalize">{colorTheme}</span>
                </div>
                <div className="ml-auto">
                  <Palette />
                </div>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Pick Color Theme</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* content */}
      <DropdownMenuContent className="w-[140px]" align="start">
        {availableColorThemes.map((themeName) => (
          <DropdownMenuItem
            key={themeName}
            onClick={() => setColorTheme(themeName)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: themeColors[themeName] }}
              />
              <span className="capitalize">{themeName}</span>
            </div>
            {colorTheme === themeName && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
