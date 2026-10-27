// Page-wide living background: slow, blurred cyan/violet light fields drifting
// behind the content, plus a faint star dust layer. Transform/opacity only;
// frozen under reduced motion (global CSS rule).
export function Aurora() {
  return (
    <div aria-hidden className="aurora pointer-events-none fixed inset-0 -z-20 overflow-hidden">
      <div className="aurora-blob aurora-a" />
      <div className="aurora-blob aurora-b" />
      <div className="aurora-blob aurora-c" />
      <div className="aurora-stars" />
    </div>
  );
}
