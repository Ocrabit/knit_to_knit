import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true); // State to toggle sidebar open/closed

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Toggle button with dynamic styles */}

      <div id="sidebar-wrapper" className={isOpen ? '' : 'closed'}>
        <button
            className="toggle-btn"
            onClick={toggleSidebar}
        >
          {isOpen ? '◄' : '➔'}
        </button>
        <div className="sidebar-heading">Knitting Navbar</div>
        <ul className="list-group">
          <li className="list-group-item">
            <Link
                to="/"
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Dashboard
            </Link>
          </li>
          <li className="list-group-item">
            <Link
                to="/patterns"
                className={`nav-link ${location.pathname === '/patterns' ? 'active' : ''}`}
            >
              Patterns
            </Link>
          </li>
          <li className="list-group-item">
            <Link
                to="/create-pattern"
                className={`nav-link ${location.pathname === '/create-pattern' ? 'active' : ''}`}
            >
              Pattern Create
            </Link>
          </li>
          <li className="list-group-item">
            <Link
                to="/designs"
                className={`nav-link ${location.pathname === '/designs' ? 'active' : ''}`}
            >
              Designs
            </Link>
          </li>
          <li className="list-group-item">
            <Link
                to="/create-design"
                className={`nav-link ${location.pathname === '/create-design' ? 'active' : ''}`}
            >
              Design Create
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Sidebar;