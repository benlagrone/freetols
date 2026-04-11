import React, { useEffect } from 'react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

const SitePage = ({ eyebrow, title, intro, children }) => {
  useEffect(() => {
    document.title = `${title} | Free Thumbnail Wizard`;
  }, [title]);

  return (
    <div className="page-wrapper site-page-wrapper">
      <SiteHeader />
      <main className="site-page">
        <section className="page-hero">
          {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          {intro ? <p className="page-intro">{intro}</p> : null}
        </section>
        <div className="page-sections">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default SitePage;
