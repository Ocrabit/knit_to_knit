// src/pages/Designs/Designs.jsx
import React from 'react';
import ComingSoonCard from "../../components/ComingSoonCard/ComingSoonCard.jsx";
import '../AccountSettings/AccountSettings.css';

const Designs = () => {
  return (
      <div className="settings-container">
          <h1>Designs</h1>
          <ComingSoonCard/>
      </div>
  );
};

export default Designs;