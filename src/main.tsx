import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    const key = e.key.toUpperCase();
    const isDevToolsCombo =
      key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (key === 'I' || key === 'J' || key === 'C')) ||
      (e.ctrlKey && key === 'U');

    if (isDevToolsCombo) {
      e.preventDefault();
      e.stopPropagation();
    }
  });
}
