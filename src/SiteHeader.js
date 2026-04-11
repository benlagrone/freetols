import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import Menu from './Menu';

const SiteHeader = () => (
  <header className="site-header">
    <Link to="/" className="site-brand" aria-label="Free Thumbnail Wizard home">
      <Logo />
      <div className="brand-copy">
        <span className="brand-title">Free Thumbnail Wizard</span>
        <span className="brand-tagline">
          Browser-based thumbnail editing with a mildly unhinged wizard in charge.
        </span>
      </div>
    </Link>
    <Menu />
  </header>
);

export default SiteHeader;
