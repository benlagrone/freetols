import React from 'react';
import { Link } from 'react-router-dom';

const BottomContent = () => (
  <section className="home-lower">
    <div className="content-grid two-up">
      <article className="content-card">
        <h2>What the Wizard Already Does Well</h2>
        <ul className="bullet-list">
          <li>Upload images, add text, and stack shapes without leaving the browser.</li>
          <li>Keep versions with undo, redo, and snapshots while you test louder ideas.</li>
          <li>Use safe zones and guides to keep critical text out of crop danger.</li>
          <li>Export clean PNG or thumbnail output when the composition is ready.</li>
        </ul>
      </article>

      <article className="content-card">
        <h2>Trust Notes</h2>
        <p>
          The editor is browser-based. Your images are edited client-side, while standard site
          requests and analytics stay on the normal web side of the stack. That means faster
          iteration and fewer reasons to hand over work-in-progress assets just to try a headline.
        </p>
      </article>
    </div>

    <div className="content-grid three-up">
      <article className="feature-card">
        <h2>Read the Scrolls</h2>
        <p>Start with practical advice on sizing, composition, and click-through-friendly hierarchy.</p>
        <Link to="/tips" className="text-link">Go to tips</Link>
      </article>
      <article className="feature-card">
        <h2>Meet the Mascot</h2>
        <p>Get the short version of the Wizard lore and the practical version of what his “powers” actually mean.</p>
        <Link to="/about-the-wizard" className="text-link">Meet the Wizard</Link>
      </article>
      <article className="feature-card">
        <h2>Need the Boring Stuff?</h2>
        <p>Legal, privacy, and contact paths are now first-class pages instead of afterthought placeholders.</p>
        <Link to="/legal" className="text-link">Read legal</Link>
      </article>
    </div>
  </section>
);

export default BottomContent;
