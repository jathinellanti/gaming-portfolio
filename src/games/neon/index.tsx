import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { hasWebGL2 } from "../../platform/webgl";
import { raise } from "../../platform/faults";
import { NeonGame } from "./NeonGame";

// Route entry for /play/neon (lazy). Without WebGL2 → back to the site with a notice.
export function NeonRoute() {
  const navigate = useNavigate();
  const [ok] = useState(() => hasWebGL2());
  useEffect(() => {
    if (!ok) {
      raise("webgl.unsupported", { game: "neon" });
      navigate("/?notice=webgl", { replace: true });
    }
  }, [ok, navigate]);
  return ok ? <NeonGame /> : null;
}
