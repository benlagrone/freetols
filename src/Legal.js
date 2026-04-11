import React from 'react';
import SitePage from './SitePage';

const Legal = () => (
  <SitePage
    eyebrow="Scrolls of Binding"
    title="Terms and Privacy"
    intro="Last updated April 11, 2026. This page covers the basics for using Free Thumbnail Wizard without pretending a one-person indie tool needs forty pages of legal theater."
  >
    <section className="content-card">
      <h2>Terms of Use</h2>
      <ul className="bullet-list">
        <li>The tool is provided as-is, with no warranty that it will always be available, error-free, or fit for a specific commercial purpose.</li>
        <li>You are responsible for the images, text, and other creative material you edit or export with the tool.</li>
        <li>Do not use the site for unlawful, abusive, or rights-infringing content.</li>
        <li>The project may change features, limits, or availability without advance notice.</li>
      </ul>
    </section>

    <section className="content-card">
      <h2>Privacy</h2>
      <div className="article-flow">
        <p>
          The editor is client-side. As currently built, the image editing work happens in your
          browser rather than being uploaded to an application server for processing.
        </p>
        <p>
          The site does use standard web infrastructure, which means the host or reverse proxy may
          record routine request metadata such as IP address, user agent, timestamps, and requested
          URLs for operations and security.
        </p>
      </div>
    </section>

    <section className="content-card">
      <h2>Analytics and Local Storage</h2>
      <ul className="bullet-list">
        <li>Google Analytics is used for aggregate traffic measurement.</li>
        <li>The editor stores local canvas state in your browser so your work can persist across refreshes.</li>
        <li>The site does not claim to sell personal data.</li>
      </ul>
    </section>
  </SitePage>
);

export default Legal;
