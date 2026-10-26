// Loaded after first render via <LazyMotion>, keeping Motion's animation engine
// out of the critical path of the professional site.
import { domAnimation } from "motion/react";

export default domAnimation;
