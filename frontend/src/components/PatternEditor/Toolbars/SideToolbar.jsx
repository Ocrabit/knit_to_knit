/* SideToolbar.jsx */

import React, { useState } from 'react';
import * as Icons from "../../../assets/icons/grid/icon_export.js";
import { useControls } from "react-zoom-pan-pinch";
import './Toolbar.css'
import {getRemSize, updateLocalStorageProperty} from "../utils.js";

const ResetButton = () => {
  const { resetTransform, centerView } = useControls();

  return (
    <button className="side-toolbar-button" onClick={() => { resetTransform(); centerView(); }}>
      <img src={Icons.reset_icon} alt="Reset Icon" draggable="false"/>
    </button>
  );
};

const WritePopup = ({name, size, set, position}) => (
    <div className="tool-popup" style={{top: position.top, left: position.left}}>
       <label htmlFor={`${name}-size`}>Size:</label>
      <select
        id={`${name}-size`}
        value={size}
        onChange={(e) => set(name, e.target.value)}
      >
         <option value="1">1</option>
        <option value="3">3</option>
        <option value="5">5</option>
      </select>
    </div>
  )

const OnDrawPopup = ({size, setSize, position, viewMode, recentColors, handleColorRecentChange}) => (
    <div className="tool-popup" style={{top: position.top, left: position.left}}>
      <label htmlFor={`draw-size`}>Size:</label>
      <select
          id={`draw-size`}
          value={size}
          onChange={(e) => setSize('draw', e.target.value)}
      >
        <option value="1">1</option>
        <option value="3">3</option>
        <option value="5">5</option>
      </select>
      {viewMode === 'shape' && (
          <div className="color-options">
            <button
                onClick={() => handleColorRecentChange('#ffffff')}
                className="color-button white"
            />
            <button
                onClick={() => handleColorRecentChange('#000000')}
                className="color-button black"
            />
            <button
                onClick={() => handleColorRecentChange('#d722c5')}
                className="color-button pink"
            />
          </div>
      )}
      {viewMode === 'color' && (
        <div className="color-options">
          {recentColors.map((color, index) => (
            <button
              className="color-button"
              key={index}
              onClick={() => handleColorRecentChange(color)}
              style={{ backgroundColor: color }}
            />
          ))}
          <div className="color-input-wrapper">
            <input
              type="color"
              onChange={(e) => handleColorRecentChange(e.target.value)}
              title="Choose custom color"
              className="custom-color-input"
            />
            <img
              src={Icons.color_icon}
              alt="Color Icon"
              draggable="false"
              className="color-icon"
            />
          </div>
        </div>
      )}

      {viewMode === 'stitch_type'}

    </div>
)

const SideToolbar = ({
                       activeMode, viewMode, LOCAL_STORAGE_ACTIVE_KEY, handleSave,
                       handleModeSelect, handleColorChange, setDrawSize, setEraseSize, drawSize, eraseSize
                     }) => {
  const [recentColors, setRecentColors] = useState(['#000000', '#FFFFFF', '#FF69B4']); // Initialize with default colors

  // Popup Handling
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  const onSizeChange = (size_name, value) => {
    if (size_name === 'draw') {
      updateLocalStorageProperty(LOCAL_STORAGE_ACTIVE_KEY, 'savedDrawSize', value);
      setDrawSize(value);
    } else if (size_name === 'erase') {
      updateLocalStorageProperty(LOCAL_STORAGE_ACTIVE_KEY, 'savedEraseSize', value);
      setEraseSize(value);
    }

  }

  // Button Click
  const handleButtonClick = (mode) => (event) => {
      const buttonRect = event.currentTarget.getBoundingClientRect();
      const remSize = getRemSize();

      setPopupPosition({
        top: buttonRect.top + window.scrollY - 10, // Offset 10px below the top of the button
        left: buttonRect.left + window.scrollX - buttonRect.width - remSize, // Offset to position popup beside the button
      });
    handleModeSelect(mode);
  };

  // Handle color selection logic for color viewMode
  const handleColorRecentChange = (color) => {
    console.log('recent Color change', color)
    handleColorChange(color);

    setRecentColors((prevColors) => {
      const updatedColors = [color, ...prevColors.filter(c => c !== color)];
      return updatedColors.slice(0, 3); // Keep only the last 3 colors
    });
  };

  // Define conditional rendering for buttons based on viewMode
  const renderButtons = () => {
    const buttons = [];

    // Draw button with persistent draw size popup
    buttons.push(
      <button
        key="draw"
        className={`side-toolbar-button ${activeMode === 'draw' ? 'active' : ''}`}
        onClick={handleButtonClick('draw')}
      >
        <img src={Icons.draw_icon} alt="Draw Icon" draggable="false"/>
      </button>
    );

    // Erase button with persistent eraser size popup
    buttons.push(
      <button
        key="erase"
        className={`side-toolbar-button ${activeMode === 'erase' ? 'active' : ''}`}
        onClick={handleButtonClick('erase')}
      >
        <img src={Icons.erase_icon} alt="Erase Icon" draggable="false"/>
      </button>
    );

    // Pan button
    buttons.push(
      <button
        key="pan"
        className={`side-toolbar-button ${activeMode === 'pan' ? 'active' : ''}`}
        onClick={() => handleModeSelect('pan')}
      >
        <img src={Icons.pan_icon} alt="Pan Icon" draggable="false"/>
      </button>
    );

    // Reset button
    buttons.push(<ResetButton key="reset" />);

    // if (viewMode === 'stitch_type') {
    //   buttons.push(
    //     <button
    //       key="line_style"
    //       className="side-toolbar-button"
    //       onClick={() => openPopup('line_style')}
    //     >
    //       <img src={Icons.line_style_icon} alt="Line Style Icon" draggable="false"/>
    //     </button>
    //   );
    // }

    // Save button | Fix this
    buttons.push(
      <button
        key="save"
        className="side-toolbar-button"
        onClick={() => handleSave()}
      >
        <img src={Icons.download_icon} alt="Download Icon" draggable="false"/>
      </button>
    );

    return buttons;
  };

  return (
    <div id="side-toolbar">
      {renderButtons()}

      {/* Show DrawSizePopup if draw mode is active */}
      {activeMode === 'draw' && <OnDrawPopup size={drawSize} setSize={onSizeChange} position={popupPosition} viewMode={viewMode} recentColors={recentColors} handleColorRecentChange={handleColorRecentChange} />}

      {/* Show EraseSizePopup if erase mode is active */}
      {activeMode === 'erase' && <WritePopup name={activeMode} size={eraseSize} set={onSizeChange} position={popupPosition} />}
    </div>
  );
};

export default SideToolbar;
