import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { hasWebGL2 } from "../../platform/webgl";
import { raise } from "../../platform/faults";
import { BlockGame } from "./BlockGame";

// Route entry for /play/block (lazy-loaded). Without WebGL2 the visitor is sent
// back to the professional site with an explanation; the CV never depends on 3D.
export function BlockRoute() {
  const navigate = useNavigate();
  const [ok] = useState(() => hasWebGL2());
  useEffect(() => {
    if (!ok) {
      raise("webgl.unsupported", { game: "block" });
      navigate("/?notice=webgl", { replace: true });
    }
  }, [ok, navigate]);
  return ok ? <BlockGame /> : null;
}
