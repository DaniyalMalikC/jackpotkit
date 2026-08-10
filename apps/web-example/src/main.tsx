import '@jackpotkit/core';
import './styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';

const rootElement = document.querySelector('#root');

if (!rootElement) {
  throw new Error('The web example root element is missing.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
