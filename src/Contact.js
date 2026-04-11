import React from 'react';
import SitePage from './SitePage';

const Contact = () => (
  <SitePage
    eyebrow="Send the Wizard a Message"
    title="Contact and Feedback"
    intro="This project is still indie and fast-moving. The cleanest contact path today is GitHub, where bugs, requests, and weird wizard suggestions can be tracked in the open."
  >
    <section className="content-card">
      <h2>Fastest Route</h2>
      <div className="button-row">
        <a
          href="https://github.com/benlagrone/freetols/issues/new"
          target="_blank"
          rel="noreferrer"
          className="primary-link"
        >
          Open a GitHub issue
        </a>
        <a
          href="https://github.com/benlagrone/freetols"
          target="_blank"
          rel="noreferrer"
          className="secondary-link"
        >
          View the repository
        </a>
      </div>
    </section>

    <section className="content-card">
      <h2>What to Include</h2>
      <ul className="bullet-list">
        <li>The browser and device you were using when the bug appeared.</li>
        <li>A screenshot or short description of what you expected versus what actually happened.</li>
        <li>If it is a feature request, the outcome you want, not just the control you imagine adding.</li>
      </ul>
      <p className="inline-note">
        Smoke and scroll delivery is currently unavailable, so issue tracking will have to do.
      </p>
    </section>
  </SitePage>
);

export default Contact;
