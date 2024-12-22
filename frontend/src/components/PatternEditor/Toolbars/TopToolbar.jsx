/* SideToolbar.jsx */

import React from 'react';
import './Toolbar.css'

const TopToolbar = ({ selectedSection, viewMode, handleFileChange, handleViewModeChange }) => {
    return (
      <div id="top-toolbar">
          <select className="top-toolbar-select"
                  value={selectedSection}
                  onChange={handleFileChange}
          >
              <option value="front_torso">Front Torso</option>
              <option value="back_torso">Back Torso</option>
              <option value="left_sleeve">Left Sleeve</option>
              <option value="right_sleeve">Right Sleeve</option>
          </select>
          <select
              className="toolbar-select"
              value={viewMode}
              onChange={handleViewModeChange}
          >
              <option value="shape">Shape</option>
              <option value="color">Color</option>
              <option value="stitch_type">Stitch Type</option>
          </select>
      </div>
  );
};

export default TopToolbar;