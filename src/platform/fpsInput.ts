// Polled first-person input shared by the 3D games (Neon City, Open City):
// held keys, pointer-lock mouse look, arrow-key look, wheel, and touch inputs.

export class FpsInput {
  keys = new Set<string>();
  lookDX = 0;
  lookDY = 0;
  wheel = 0;
  primary = false;
  /** Touch joystick (-1..1, y down = backward). */
  move: [number, number] = [0, 0];
  touchJump = false;
  touchSprint = false;

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    this.keys.add(e.code);
  };
  private onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.code);
  private onMouseMove = (e: MouseEvent) => {
    if (!document.pointerLockElement) return;
    this.lookDX += e.movementX;
    this.lookDY += e.movementY;
  };
  private onMouseDown = (e: MouseEvent) => {
    if (document.pointerLockElement && e.button === 0) this.primary = true;
  };
  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) this.primary = false;
  };
  private onWheel = (e: WheelEvent) => {
    if (document.pointerLockElement) this.wheel += Math.sign(e.deltaY);
  };
  private onBlur = () => this.reset();

  has(code: string) {
    return this.keys.has(code);
  }

  /** -1..1 forward/strafe from WASD/arrows-free keys plus the touch stick. */
  axes(): { forward: number; strafe: number } {
    const k = (c: string) => (this.keys.has(c) ? 1 : 0);
    const forward = k("KeyW") - k("KeyS") - this.move[1];
    const strafe = k("KeyD") - k("KeyA") + this.move[0];
    return { forward: Math.max(-1, Math.min(1, forward)), strafe: Math.max(-1, Math.min(1, strafe)) };
  }

  reset() {
    this.keys.clear();
    this.lookDX = this.lookDY = this.wheel = 0;
    this.primary = false;
    this.move = [0, 0];
    this.touchJump = this.touchSprint = false;
  }

  attach(target: Window): () => void {
    target.addEventListener("keydown", this.onKeyDown);
    target.addEventListener("keyup", this.onKeyUp);
    target.addEventListener("mousemove", this.onMouseMove);
    target.addEventListener("mousedown", this.onMouseDown);
    target.addEventListener("mouseup", this.onMouseUp);
    target.addEventListener("wheel", this.onWheel, { passive: true });
    target.addEventListener("blur", this.onBlur);
    return () => {
      target.removeEventListener("keydown", this.onKeyDown);
      target.removeEventListener("keyup", this.onKeyUp);
      target.removeEventListener("mousemove", this.onMouseMove);
      target.removeEventListener("mousedown", this.onMouseDown);
      target.removeEventListener("mouseup", this.onMouseUp);
      target.removeEventListener("wheel", this.onWheel);
      target.removeEventListener("blur", this.onBlur);
    };
  }
}

/** Request pointer lock on an element; failures (no user gesture, too soon after Esc) are expected and silent. */
export function tryPointerLock(el: Element | null | undefined) {
  try {
    const p = (el as HTMLElement | null)?.requestPointerLock?.() as unknown as Promise<void> | undefined;
    p?.catch?.(() => {});
  } catch {
    /* refused: the game shows its "click to play" hint */
  }
}
