import React from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Editor', end: true },
  { to: '/tips', label: 'Tips' },
  { to: '/about-the-wizard', label: 'About the Wizard' },
  { to: '/contact', label: 'Contact' },
  { to: '/legal', label: 'Legal' }
];

const Menu = () => (
  <nav className="menu" aria-label="Primary">
    <ul>
      {links.map((link) => (
        <li key={link.to}>
          <NavLink
            to={link.to}
            end={link.end}
            className={({ isActive }) => `menu-link${isActive ? ' active' : ''}`}
          >
            {link.label}
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);

export default Menu;
