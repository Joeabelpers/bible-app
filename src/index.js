import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './DailyBibleApp';
import ScribePage from './ScribePage';

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

  return route.startsWith('#/study') ? <ScribePage /> : <App />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><Root /></React.StrictMode>);
