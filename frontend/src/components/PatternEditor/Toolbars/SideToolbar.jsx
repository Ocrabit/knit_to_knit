/* SideToolbar.jsx */

import React, { useState } from 'react';
import * as Icons from "../../../assets/icons/grid/icon_export.js";
import { useControls } from "react-zoom-pan-pinch";

const ResetButton = () => {
  const { resetTransform, centerView } = useControls();

  return (
    <button className="toolbox-button" onClick={() => { resetTransform(); centerView(); }}>
      <img src={Icons.reset_icon} alt="Reset Icon" draggable="false"/>
    </button>
  );
};

// Erase Size Popup Component
const EraseSizePopup = ({ setEraseSize }) => (
  <div className="popup">
    <label>Eraser Size:</label>
    <input type="range" min="1" max="10" onChange={(e) => setEraseSize(e.target.value)}/>
  </div>
);

// Draw Size Popup Component
const DrawSizePopup = ({ setDrawSize }) => (
  <div className="popup">
    <label>Draw Size:</label>
    <input type="range" min="1" max="10" onChange={(e) => setDrawSize(e.target.value)}/>
  </div>
);

const SideToolbar = ({ activeMode, handleModeSelect, openPopup, viewMode }) => {
  const [eraseSize, setEraseSize] = useState(5);
  const [drawSize, setDrawSize] = useState(5);
  const [showErasePopup, setShowErasePopup] = useState(false);
  const [showDrawPopup, setShowDrawPopup] = useState(false);
  const [recentColors, setRecentColors] = useState(['#000000', '#FFFFFF', '#FF69B4']); // Initialize with default colors

  // Handle color selection logic for color viewMode
  const handleColorChange = (color) => {
    setRecentColors((prevColors) => {
      const updatedColors = [color, ...prevColors.filter(c => c !== color)];
      return updatedColors.slice(0, 3); // Keep only the last 3 colors
    });
  };

  // Define conditional rendering for buttons based on viewMode
  const renderButtons = () => {
    const buttons = [];

    // Draw button with draw size popup on hover
    buttons.push(
      <button
        key="draw"
        className={`toolbox-button ${activeMode === 'draw' ? 'active' : ''}`}
        onMouseEnter={() => setShowDrawPopup(true)}
        onMouseLeave={() => setShowDrawPopup(false)}
        onClick={() => handleModeSelect('draw')}
      >
        <img src={Icons.draw_icon} alt="Draw Icon" draggable="false"/>
        {showDrawPopup && <DrawSizePopup setDrawSize={setDrawSize} />}
      </button>
    );

    // Erase button with eraser size popup on hover
    buttons.push(
      <button
        key="erase"
        className={`toolbox-button ${activeMode === 'erase' ? 'active' : ''}`}
        onMouseEnter={() => setShowErasePopup(true)}
        onMouseLeave={() => setShowErasePopup(false)}
        onClick={() => handleModeSelect('erase')}
      >
        <img src={Icons.erase_icon} alt="Erase Icon" draggable="false"/>
        {showErasePopup && <EraseSizePopup setEraseSize={setEraseSize} />}
      </button>
    );

    // Pan button
    buttons.push(
      <button
        key="pan"
        className={`toolbox-button ${activeMode === 'pan' ? 'active' : ''}`}
        onClick={() => handleModeSelect('pan')}
      >
        <img src={Icons.pan_icon} alt="Pan Icon" draggable="false"/>
      </button>
    );

    // Reset button
    buttons.push(<ResetButton key="reset" />);

    // Conditional color and line style buttons
    if (viewMode === 'shape' || viewMode === 'color' || viewMode === 'stitch_type') {
      buttons.push(
        <button
          key="color"
          className="toolbox-button"
          onClick={() => openPopup('color')}
        >
          <img src={Icons.color_icon} alt="Color Icon" draggable="false"/>
        </button>
      );
    }

    if (viewMode === 'stitch_type') {
      buttons.push(
        <button
          key="line_style"
          className="toolbox-button"
          onClick={() => openPopup('line_style')}
        >
          <img src={Icons.line_style_icon} alt="Line Style Icon" draggable="false"/>
        </button>
      );
    }

    // Save button
    buttons.push(
      <button
        key="save"
        className="toolbox-button"
        onClick={() => openPopup('save')}
      >
        <img src={Icons.download_icon} alt="Download Icon" draggable="false"/>
      </button>
    );

    return buttons;
  };

  return (
    <div id="toolbox">
      {renderButtons()}
    </div>
  );
};

export default SideToolbar;
