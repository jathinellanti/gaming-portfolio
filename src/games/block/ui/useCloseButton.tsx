import { useBlock } from "../store";

/** A "Done" button for screens that draw their own chrome instead of GuiWindow. */
export function useCloseButton(label = "Done") {
  const close = useBlock((s) => s.close);
  return (
    <button type="button" className="jc-btn" onClick={close} aria-label={label}>
      Done
    </button>
  );
}
