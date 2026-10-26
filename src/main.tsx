import "./site/styles/index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { LazyMotion, MotionConfig } from "motion/react";
import { routes } from "./router";
import { contentSource } from "./content/source";
import { ContentProvider } from "./content/useContent";
import { ContentErrorPage } from "./site/pages/ContentErrorPage";
import { installGlobalErrorLogging } from "./platform/globalErrors";

installGlobalErrorLogging();

const root = createRoot(document.getElementById("root")!);
const router = createBrowserRouter(routes);
const loadMotionFeatures = () => import("./motionFeatures").then((m) => m.default);

contentSource.load().then(
  (content) =>
    root.render(
      <StrictMode>
        <MotionConfig reducedMotion="user">
          <LazyMotion features={loadMotionFeatures} strict>
            <ContentProvider content={content}>
              <RouterProvider router={router} />
            </ContentProvider>
          </LazyMotion>
        </MotionConfig>
      </StrictMode>,
    ),
  (err: unknown) => root.render(<ContentErrorPage message={err instanceof Error ? err.message : String(err)} />),
);
