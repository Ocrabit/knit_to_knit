// src/pages/AccountSettings.jsx
import React from 'react';
import ComingSoonCard from "../../components/ComingSoonCard/ComingSoonCard.jsx";
import './AccountSettings.css'

const AccountSettings = () => {
  return (
      <div className="settings-container page-container">
          <h1>Settings</h1>
          <ComingSoonCard/>
      </div>
  );
};

export default AccountSettings;