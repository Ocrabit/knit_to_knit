/* SideToolbar.jsx */

import React from 'react';
import './Toolbar.css'

const TopToolbar = ({ selectedFile, viewMode, handleFileChange, handleViewModeChange }) => {
    return (
      <div id="top-toolbar">
          <select className="top-toolbar-select"
                  value={selectedFile}
                  onChange={handleFileChange}
          >
              <option value="front_torso.npy">Front Torso</option>
              <option value="back_torso.npy">Back Torso</option>
              <option value="left_sleeve.npy">Left Sleeve</option>
              <option value="right_sleeve.npy">Right Sleeve</option>
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