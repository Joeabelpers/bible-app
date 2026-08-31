import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './DailyBibleApp';
import ScribePage from './ScribePage';
import { STUDY_MODE_KEY } from './studyMode';

// ─── FIRST-RUN STYLUS DEFAULT ────────────────────────────────────────────────
// No browser API reports whether a stylus is paired. The only reliable signal
// is a real pointer event with pointerType "pen", which by definition arrives
// after the pen has already touched the glass. So: the first time one is seen
// on this device, and only if the user has not already chosen, default the
// study mode to ink. From then on the stored setting wins and this is a no-op.
window.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'pen') return;
  try {
    if (!localStorage.getItem(STUDY_MODE_KEY)) {
      localStorage.setItem(STUDY_MODE_KEY, 'ink');
    }
  } catch {}
}, { capture: true });

// ─── ROUTER ──────────────────────────────────────────────────────────────────
// Two separate apps behind one deployment:
//   /            reading app
//   /#/study     study page
// Hash routing needs no server config, so Vercel serves it as-is.
function Root() {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const onChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  if (route.startsWith('#/study')) return <ScribePage mode="ink" />;
  if (route.startsWith('#/notes')) return <ScribePage mode="text" />;
  return <App />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><Root /></React.StrictMode>);
