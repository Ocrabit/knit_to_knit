import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import logoDark from '../../assets/logos/primary-black-coffee.svg';
import logoLight from '../../assets/logos/primary-cream.svg';
import yarnLogo from '../../assets/logos/yarn-walnut.svg';
import { useTheme } from '../../context/ThemeContext';

const Sidebar = () => {
  const location = useLocation();
  const { isDarkBackground, isEditorPage } = useTheme();

  return (
    <>
      <div id="sidebar-wrapper" className={isDarkBackground ? 'dark-mode' : ''}>
        {!isEditorPage && (
          <div className="sidebar-logo">
            <img src={isDarkBackground ? logoLight : logoDark} alt="Knit to Knit" />
          </div>
        )}
        <nav className="nav-list">
          <Link
              to="/"
              className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link
              to="/patterns"
              className={`nav-item ${location.pathname === '/patterns' ? 'active' : ''}`}
          >
            Patterns
          </Link>
          <Link
              to="/designs"
              className={`nav-item ${location.pathname === '/designs' ? 'active' : ''}`}
          >
            Designs
          </Link>
          <Link
              to="/about"
              className={`nav-item ${location.pathname === '/about' ? 'active' : ''}`}
          >
            About
          </Link>
          <Link
              to="/contact"
              className={`nav-item ${location.pathname === '/contact' ? 'active' : ''}`}
          >
            Contact
          </Link>
        </nav>
        {!isEditorPage && (
          <Link to="/youfoundme" className="sidebar-yarn-logo">
            <img src={yarnLogo} alt="Yarn" />
          </Link>
        )}
      </div>
    </>
  );
};

export default Sidebar;