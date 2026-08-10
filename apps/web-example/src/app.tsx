const packages = ['Core', 'React Native', 'React', 'Theme', 'Testing'] as const;

export function App() {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">PHASE 0 · FOUNDATION</p>
        <h1>JackpotKit works beyond native.</h1>
        <p className="lede">
          This Vite application resolves <code>@jackpotkit/core</code> without React Native, Expo,
          DOM initialization, or platform-specific dependencies.
        </p>
      </section>

      <section aria-labelledby="workspace-title" className="workspace-card">
        <div>
          <p className="section-label">Workspace status</p>
          <h2 id="workspace-title">Package boundaries are ready</h2>
        </div>
        <ul>
          {packages.map((packageName) => (
            <li key={packageName}>
              <span aria-hidden="true">✓</span>
              {packageName}
            </li>
          ))}
        </ul>
        <p className="note">
          No game APIs are exposed in this milestone. Shared primitives arrive in Phase 1.
        </p>
      </section>
    </main>
  );
}
