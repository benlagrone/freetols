import React from 'react';
import { Link } from 'react-router-dom';
import SitePage from './SitePage';

const NotFound = () => (
  <SitePage
    eyebrow="Miscast Spell"
    title="That Page Has Vanished"
    intro="The path you asked for does not exist here. The Wizard recommends returning to the editor or reading something useful instead."
  >
    <section className="content-card">
      <div className="button-row">
        <Link to="/" className="primary-link">
          Back to the editor
        </Link>
        <Link to="/tips" className="secondary-link">
          Browse tips
        </Link>
      </div>
    </section>
  </SitePage>
);

export default NotFound;
