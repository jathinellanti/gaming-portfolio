// Shown only if content validation fails at load (a broken data edit).
// Lists each issue as "<file field path>: <problem>" so the fix is obvious.
export function ContentErrorPage({ message }: { message: string }) {
  const [headline, ...issues] = message.split("\n");
  return (
    <div role="alert" style={{ maxWidth: 720, margin: "10vh auto", padding: 24, fontFamily: "system-ui", lineHeight: 1.5 }}>
      <h1 style={{ fontSize: 24 }}>Portfolio content failed validation.</h1>
      <p>
        {headline} An entry in <code>src/content/data/</code> breaks the content schema. Fix the fields below, then run{" "}
        <code>npm test</code>.
      </p>
      <ul>
        {issues.map((i) => (
          <li key={i}>
            <code>{i}</code>
          </li>
        ))}
      </ul>
      <p>
        Contact: <a href="mailto:jathinellanti@gmail.com">jathinellanti@gmail.com</a>
      </p>
    </div>
  );
}
