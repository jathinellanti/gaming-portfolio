import { useEffect } from "react";
import { Outlet, ScrollRestoration } from "react-router";
import { useSettings } from "../../platform/settings";
import { applyTheme } from "../../platform/theme";

export function RootLayout() {
  const theme = useSettings((s) => s.theme);
  useEffect(() => applyTheme(theme), [theme]);
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}
