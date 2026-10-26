import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

// The neon look: bloom on emissive signage, a hint of lens fringing, grain and vignette.
export function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={1.15} luminanceThreshold={0.55} luminanceSmoothing={0.2} mipmapBlur />
      <ChromaticAberration offset={new THREE.Vector2(0.0009, 0.0006)} radialModulation modulationOffset={0.35} />
      <Noise opacity={0.045} blendFunction={BlendFunction.SOFT_LIGHT} />
      <Vignette offset={0.25} darkness={0.75} />
    </EffectComposer>
  );
}
