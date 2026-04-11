import React from 'react';
import SitePage from './SitePage';
import { WIZARD_QUOTES } from './siteData';

const AboutWizard = () => (
  <SitePage
    eyebrow="Meet the WWWWizard"
    title="The Wizard Behind the Buttons"
    intro="He looks like a mascot, but his actual job is pushing creators toward cleaner hierarchy, better crops, and fewer thumbnail crimes."
  >
    <section className="content-card">
      <h2>Origin Story</h2>
      <div className="article-flow">
        <p>
          Legend says the WWWWizard first appeared when a creator tried to publish a YouTube video
          with six fonts, three drop shadows, and zero focal point. The browser trembled. The
          timeline blurred. Somewhere between a design app rage quit and a last-minute export, the
          Wizard crawled out of the cache and declared himself keeper of contrast.
        </p>
        <p>
          In less dramatic terms, Free Thumbnail Wizard exists because most thumbnail tasks are
          repetitive. You need a canvas, text, shapes, guides, layering, and a clean export. You do
          not need a bloated workflow just to move a face twenty pixels to the left.
        </p>
      </div>
    </section>

    <section className="content-card">
      <h2>His Powers, Translated into Plain English</h2>
      <div className="content-grid three-up">
        <article className="feature-card">
          <h3>Alignment Spells</h3>
          <p>Guides, rulers, grid snap, and safe zones help you place the important stuff where crops will not destroy it.</p>
        </article>
        <article className="feature-card">
          <h3>Memory Charms</h3>
          <p>Undo, redo, and snapshots let you test bolder ideas without losing the version that was already working.</p>
        </article>
        <article className="feature-card">
          <h3>Layer Discipline</h3>
          <p>Lock, hide, reorder, group, and export your scene without fighting invisible objects or accidental clicks.</p>
        </article>
      </div>
    </section>

    <section className="content-card">
      <h2>Selected Wisdom</h2>
      <div className="quote-grid">
        {WIZARD_QUOTES.slice(0, 6).map((quote) => (
          <blockquote key={quote} className="quote-chip">
            {quote}
          </blockquote>
        ))}
      </div>
    </section>
  </SitePage>
);

export default AboutWizard;
