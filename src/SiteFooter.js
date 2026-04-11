import React from 'react';
import { Link } from 'react-router-dom';

const SiteFooter = () => (
  <footer className="site-footer">
    <div className="footer-copy">
      <p className="footer-kicker">FreeThumbnailWizard.com</p>
      <p>
        A fast, indie thumbnail editor for creators who want layers, guides, exports, and a little
        comic wizard energy without opening a full design suite.
      </p>
    </div>
    <div className="footer-links" aria-label="Footer">
      <Link to="/tips">Tips</Link>
      <Link to="/about-the-wizard">About the Wizard</Link>
      <Link to="/contact">Contact</Link>
      <Link to="/legal">Legal</Link>
      <a href="https://github.com/benlagrone/freetols" target="_blank" rel="noreferrer">
        GitHub
      </a>
    </div>
  </footer>
);

export default SiteFooter;
