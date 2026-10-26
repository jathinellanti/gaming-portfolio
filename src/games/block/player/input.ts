// Raw input → a polled state object. Keyboard, mouse (pointer lock) and the touch
// controls all write here; Player.tsx reads it once per frame.

export class Input {
  keys = new Set<string>();
  lookDX = 0;
  lookDY = 0;
  wheel = 0;
  breaking = false;
  /** Right-click / place / interact presses not yet handled. */
  useQueued = 0;
  /** Touch joystick (-1..1). */
  touchMove: [number, number] = [0, 0];
  touchJump = false;
  touchSneak = false;
  flyToggleQueued = false;
  private lastSpace = 0;
  private lastForward = 0;
  sprintLatched = false;

  onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const now = performance.now();
    if (e.code === "Space") {
      if (now - this.lastSpace < 280) this.flyToggleQueued = true;
      this.lastSpace = now;
    }
    if (e.code === "KeyW") {
      if (now - this.lastForward < 280) this.sprintLatched = true;
      this.lastForward = now;
    }
    this.keys.add(e.code);
  };

  onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
    if (e.code === "KeyW") this.sprintLatched = false;
  };

  onMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement) {
      this.lookDX += e.movementX;
      this.lookDY += e.movementY;
    }
  };

  onMouseDown = (e: MouseEvent) => {
    if (!document.pointerLockElement) return;
    if (e.button === 0) this.breaking = true;
    if (e.button === 2) this.useQueued++;
  };

  onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) this.breaking = false;
  };

  onWheel = (e: WheelEvent) => {
    if (document.pointerLockElement) this.wheel += Math.sign(e.deltaY);
  };

  /** Forget held keys/buttons (e.g. when a screen opens or the tab loses focus). */
  reset() {
    this.keys.clear();
    this.breaking = false;
    this.lookDX = this.lookDY = this.wheel = 0;
    this.touchMove = [0, 0];
    this.touchJump = this.touchSneak = false;
    this.sprintLatched = false;
  }

  has(code: string) {
    return this.keys.has(code);
  }

  attach(target: Window) {
    target.addEventListener("keydown", this.onKeyDown);
    target.addEventListener("keyup", this.onKeyUp);
    target.addEventListener("mousemove", this.onMouseMove);
    target.addEventListener("mousedown", this.onMouseDown);
    target.addEventListener("mouseup", this.onMouseUp);
    target.addEventListener("wheel", this.onWheel, { passive: true });
    target.addEventListener("blur", this.resetOnBlur);
    return () => {
      target.removeEventListener("keydown", this.onKeyDown);
      target.removeEventListener("keyup", this.onKeyUp);
      target.removeEventListener("mousemove", this.onMouseMove);
      target.removeEventListener("mousedown", this.onMouseDown);
      target.removeEventListener("mouseup", this.onMouseUp);
      target.removeEventListener("wheel", this.onWheel);
      target.removeEventListener("blur", this.resetOnBlur);
    };
  }

  private resetOnBlur = () => this.reset();
}
