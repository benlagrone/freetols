import React from 'react';
import SitePage from './SitePage';

const Tips = () => (
  <SitePage
    eyebrow="The Wizard's Weekly Wisdom"
    title="Tips for Thumbnails That Survive the Scroll"
    intro="This section is for practical advice, not generic creator filler. Start with layout discipline, obvious focal points, and crops that do not mutilate the headline."
  >
    <section className="content-card">
      <h2>Sacred Ratios That Survive the Crop</h2>
      <div className="article-flow">
        <p>
          The safest default working canvas for a standard video thumbnail is still 1280 by 720.
          It is wide enough for YouTube, large enough to export cleanly, and familiar enough that
          you can spot balance problems early. The mistake is treating that full canvas as equally
          safe everywhere. It is not.
        </p>
        <p>
          The center of the image does most of the work. Faces, product silhouettes, and the few
          words that actually matter should live in the inner zone, not pressed against the edges.
          Crops, feed previews, and device UI all punish edge-hugging layouts first.
        </p>
      </div>
      <div className="content-grid three-up">
        <article className="feature-card">
          <h3>YouTube 16:9</h3>
          <p>Use the full width, but keep the face and core message inside a comfortable inner frame.</p>
        </article>
        <article className="feature-card">
          <h3>Shorts and Reels</h3>
          <p>Vertical previews demand stronger center weighting. Tall compositions punish tiny side text immediately.</p>
        </article>
        <article className="feature-card">
          <h3>Feed Crops</h3>
          <p>If a design dies the second it is cropped tighter, the design was never stable in the first place.</p>
        </article>
      </div>
    </section>

    <section className="content-card">
      <h2>The Three Fastest Fixes for Weak Thumbnails</h2>
      <ul className="bullet-list">
        <li>Cut the text in half. If the message needs a paragraph, the thumbnail is doing the title’s job badly.</li>
        <li>Make one thing win. A face, object, or phrase should dominate. Equality between elements usually reads as confusion.</li>
        <li>Push contrast harder. The thumbnail does not need to be tasteful first. It needs to be legible at a glance.</li>
      </ul>
    </section>

    <section className="content-card">
      <h2>Use the Editor Like a Test Bench</h2>
      <div className="article-flow">
        <p>
          The point of guides, snapshots, and layers is not decoration. They let you compare two
          compositions quickly and keep the version that actually reads better. Save a snapshot
          before you go louder. Then test the louder version without fear.
        </p>
        <p>
          If you only adopt one habit, make it this: place your focal subject first, then fit text
          around it. Most bad thumbnails come from writing the slogan first and cramming the visual
          into whatever corners remain.
        </p>
      </div>
      <a href="/#editor" className="text-link">Open the editor and test these rules</a>
    </section>
  </SitePage>
);

export default Tips;
