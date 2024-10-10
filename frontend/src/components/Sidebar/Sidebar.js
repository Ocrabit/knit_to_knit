import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css'; // Reuse your existing CSS

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true); // State to toggle sidebar open/closed

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Toggle button with dynamic styles */}
      <button
        className="toggle-btn"
        onClick={toggleSidebar}
        style={
          isOpen
            ? { position: 'absolute', top: '70px', right: '10px' } // Sidebar open: move to top-right inside the sidebar
            : { position: 'fixed', top: '70px', left: '10px' }    // Sidebar closed: stay at top-left of the screen
        }
      >
        {isOpen ? '◄' : '➔'}
      </button>

      <div id="sidebar-wrapper" className={isOpen ? '' : 'closed'}>

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
                to="/create"
                className={`nav-link ${location.pathname === '/create' ? 'active' : ''}`}
            >
              Create
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
        </ul>
      </div>
      </>
  );
};

export default Sidebar;