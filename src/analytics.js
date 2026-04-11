import ReactGA from 'react-ga4';

const GA_MEASUREMENT_ID = 'G-LJBMXKDXY9';
let analyticsInitialized = false;

export const initializeAnalytics = () => {
  if (analyticsInitialized) {
    return;
  }

  ReactGA.initialize(GA_MEASUREMENT_ID);
  analyticsInitialized = true;
};

export const trackPageView = (page) => {
  initializeAnalytics();
  ReactGA.send({ hitType: 'pageview', page });
};
