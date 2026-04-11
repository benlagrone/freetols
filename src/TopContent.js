import React from 'react';
import { Link } from 'react-router-dom';
import { WIZARD_QUOTES } from './siteData';

const TopContent = () => {
  const quote = WIZARD_QUOTES[new Date().getDate() % WIZARD_QUOTES.length];

  return (
    <section className="home-hero">
      <div className="home-hero-copy">
        <p className="page-eyebrow">Summon the Wizard</p>
        <h1>Make a thumbnail that looks deliberate, not accidental.</h1>
        <p className="page-intro">
          Upload an image, layer text and shapes, snap everything into place, and export fast.
          Free Thumbnail Wizard is for creators who need speed, control, and a browser that behaves
          more like a workbench than a toy.
        </p>
        <div className="button-row">
          <a href="#editor" className="primary-link">
            Open the editor
          </a>
          <Link to="/tips" className="secondary-link">
            Read Wizard tips
          </Link>
        </div>
      </div>

      <aside className="quote-card">
        <p className="quote-label">Today&apos;s Wizard Quip</p>
        <blockquote>{quote}</blockquote>
        <p className="quote-caption">
          The jokes are optional. The advice about contrast and hierarchy is not.
        </p>
      </aside>

      <div className="content-grid three-up">
        <article className="feature-card">
          <h2>Browser First</h2>
          <p>Open the site, drop in an image, and work immediately. No account wall before you can move a single pixel.</p>
        </article>
        <article className="feature-card">
          <h2>Layout Control</h2>
          <p>Use guides, rulers, snap, and safe zones so your focal point survives platform crops instead of disappearing in them.</p>
        </article>
        <article className="feature-card">
          <h2>Real Editing Depth</h2>
          <p>History, snapshots, layers, grouping, and export tools are already here for the practical work, not just the mascot flavor.</p>
        </article>
      </div>
    </section>
  );
};

export default TopContent;
