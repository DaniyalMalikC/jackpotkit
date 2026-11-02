import '@jackpotkit/core';
import './styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';
import { resolveFixture } from './fixtures';

const rootElement = document.querySelector('#root');

if (!rootElement) {
  throw new Error('The web example root element is missing.');
}

const Fixture = resolveFixture(window.location.search);

createRoot(rootElement).render(<StrictMode>{Fixture ? <Fixture /> : <App />}</StrictMode>);
