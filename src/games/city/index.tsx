import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { hasWebGL2 } from "../../platform/webgl";
import { raise } from "../../platform/faults";
import { CityGame } from "./CityGame";

// Route entry for /play/city (lazy). Without WebGL2 → back to the site with a notice.
export function CityRoute() {
  const navigate = useNavigate();
  const [ok] = useState(() => hasWebGL2());
  useEffect(() => {
    if (!ok) {
      raise("webgl.unsupported", { game: "city" });
      navigate("/?notice=webgl", { replace: true });
    }
  }, [ok, navigate]);
  return ok ? <CityGame /> : null;
}
