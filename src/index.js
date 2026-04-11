import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import './index.css';
import App from './App';
import AboutWizard from './AboutWizard';
import Contact from './Contact';
import Legal from './Legal';
import NotFound from './NotFound';
import Tips from './Tips';
import { trackPageView } from './analytics';
import reportWebVitals from './reportWebVitals';

const PageTracker = () => {
  const location = useLocation();

  React.useEffect(() => {
    trackPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
};

const AppRoutes = () => (
  <>
    <PageTracker />
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/tips" element={<Tips />} />
      <Route path="/about-the-wizard" element={<AboutWizard />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/legal" element={<Legal />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
