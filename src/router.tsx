import type { RouteObject } from "react-router";
import { RootLayout } from "./site/layout/RootLayout";
import { SiteLayout } from "./site/layout/SiteLayout";
import { RouteError } from "./site/pages/RouteError";
import { Home } from "./site/pages/Home";
import { CvPage } from "./site/pages/CvPage";
import { ProjectPage } from "./site/pages/ProjectPage";
import { NotFound } from "./site/pages/NotFound";
import { RealmLoading } from "./play/RealmLoading";

export const routes: RouteObject[] = [
  {
    path: "/",
    Component: RootLayout,
    ErrorBoundary: RouteError,
    children: [
      {
        Component: SiteLayout,
        children: [
          { index: true, Component: Home },
          { path: "cv", Component: CvPage },
          { path: "projects/:slug", Component: ProjectPage },
          { path: "*", Component: NotFound },
        ],
      },
      {
        path: "play",
        HydrateFallback: RealmLoading,
        lazy: async () => ({ Component: (await import("./play/WorldSelect")).WorldSelect }),
      },
      {
        path: "play/block",
        HydrateFallback: RealmLoading,
        lazy: async () => ({ Component: (await import("./games/block")).BlockRoute }),
      },
      {
        path: "play/neon",
        HydrateFallback: RealmLoading,
        lazy: async () => ({ Component: (await import("./games/neon")).NeonRoute }),
      },
      {
        path: "play/city",
        HydrateFallback: RealmLoading,
        lazy: async () => ({ Component: (await import("./games/city")).CityRoute }),
      },
    ],
  },
];
