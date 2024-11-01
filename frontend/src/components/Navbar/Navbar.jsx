import React from "react";
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css'; // Import your CSS file for knitting website styles

const Navbar = ({ isAuthenticated, user, username, logout }) => {
  const location = useLocation(); // Get the current path for active link

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light" id="navbar-coloring">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">Knit-to-Knit</Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbar-container"
          aria-controls="navbar-container"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbar-container">
          <ul className="navbar-nav ms-auto"> {/* This will ensure all items are aligned to the right */}
            <li className="nav-item">
              <Link className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} to="/">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`} to="/about">
                About
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`} to="/contact">
                Contact
              </Link>
            </li>
          </ul>

          {/* User Profile Dropdown or Login Button */}
          <ul className="navbar-nav"> {/* No ms-auto here, it will sit after the menu items */}
            {isAuthenticated ? (
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  id="userDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {/* If profilePicture is not available, use a placeholder image */}
                  <img
                    className="rounded-circle account-img"
                    //src={user.UserProfile.image.url || '/assets/icons/profile_placeholder.png'}
                    alt="P"
                    style={{ width: '64px', height: '64px', marginRight: '10px' }}
                  />
                  {username || 'Guest'}
                </a>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                  <li>
                    <Link className="dropdown-item" to="/account-settings">Account Settings</Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item" onClick={logout}>Sign Out</button>
                  </li>
                </ul>
              </li>
            ) : (
              <li className="nav-item">
                <Link className="nav-link" to="/login">Login</Link>
              </li>
            )}
          </ul>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;