import { SeededRandomSource, createGameEvent, nextRandomValue } from '@jackpotkit/core';

const randomSource = new SeededRandomSource('jackpotkit-web-example');
const previewValues = Array.from({ length: 3 }, () => nextRandomValue(randomSource));
const readyEvent = createGameEvent('ready', { surface: 'web' }, { timestamp: 0 });

export function App() {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">PHASE 1 · SHARED PRIMITIVES</p>
        <h1>Deterministic mechanics, without native assumptions.</h1>
        <p className="lede">
          This Vite application uses <code>@jackpotkit/core</code> without React Native, Expo,
          platform initialization, or native dependencies.
        </p>
      </section>

      <section aria-labelledby="workspace-title" className="workspace-card">
        <div>
          <p className="section-label">Core smoke test</p>
          <h2 id="workspace-title">The same seed produces the same sequence</h2>
        </div>
        <ul aria-label="Deterministic random values">
          {previewValues.map((value, index) => (
            <li key={index}>
              <span aria-hidden="true">{index + 1}</span>
              {value.toFixed(8)}
            </li>
          ))}
        </ul>
        <p className="note">
          Lifecycle event: <code>{readyEvent.type}</code>. Seeded randomness is reproducible, not
          cryptographically secure. Valuable outcomes must come from an authoritative server.
        </p>
      </section>
    </main>
  );
}
