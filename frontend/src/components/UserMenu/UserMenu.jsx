import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './UserMenu.css';
import { useTheme } from '../../context/ThemeContext';

const UserMenu = ({ user, username, logout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isDarkBackground } = useTheme();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="user-menu-container">
      <button className={`user-bubble ${isDarkBackground ? 'dark-mode' : ''}`} onClick={toggleMenu}>
        {username ? username.charAt(0).toUpperCase() : 'U'}
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <Link to="/account-settings" className="menu-item" onClick={() => setIsOpen(false)}>
            Settings
          </Link>
          <button className="menu-item logout-btn" onClick={(e) => { logout(e); setIsOpen(false); }}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
