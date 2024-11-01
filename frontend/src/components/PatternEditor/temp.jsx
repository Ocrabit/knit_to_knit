// PatternGrid.jsx

import React, {useState, useEffect, useRef, useCallback, useLayoutEffect} from 'react';
import PropTypes from 'prop-types';
import './PatternGrid.css';
import { TransformWrapper, TransformComponent, useTransformContext } from 'react-zoom-pan-pinch';
import PatternGridSquare from "./PatternGridSquare.jsx";
import { COLOR_MAPPING, LINE_STYLES } from './config';
import SideToolbar from "./Toolbars/SideToolbar.jsx";
import {getCSSVariable, debounce} from "./utils.js";
import useDrawingTools from "../PatternEditor/useDrawingTools.jsx";
import { throttle } from 'lodash';


const LOCAL_STORAGE_KEY = 'savedGrid';
//const LOCAL_STORAGE_KEY = `patternEditor-${fileKey}`;
const GridComponent = ({ gridData, gridContainerRef, grid_pixels, gap_size, rows, columns, fillSquare, viewMode, drawActive, eraseActive }) => {
  // Access the transformation context inside the child component of TransformWrapper
  const { scale, positionX, positionY } = useTransformContext();

  const [isDrawing, setIsDrawing] = useState(false);

  // Create a ref to store the current transformation state
  const transformStateRef = useRef({ scale, positionX, positionY });
  useEffect(() => {
    transformStateRef.current = { scale, positionX, positionY };
  }, [scale, positionX, positionY]);

  // Calculate the square index based on mouse event
  const getSquareIndexFromEvent = (e) => {
    const rect = gridContainerRef.current.getBoundingClientRect();
    const { scale, positionX, positionY } = transformStateRef.current; // Use the ref value

    // Calculate mouse position relative to the container, adjusted for scale and pan
    const x = (e.clientX - rect.left - positionX) / scale;
    const y = (e.clientY - rect.top - positionY) / scale;

    const totalCellSize = grid_pixels + gap_size;
    const column = Math.floor(x / totalCellSize);
    const row = Math.floor(y / totalCellSize);

    if (row >= 0 && row < rows && column >= 0 && column < columns) {
      return row * columns + column;
    }
    return null;
  };

  // Handle mouse down event (start drawing)
  const handleMouseDown = (e) => {
    if (!drawActive && !eraseActive) return;

    setIsDrawing(true);
    const index = getSquareIndexFromEvent(e);
    if (index !== null) {
      fillSquare(index);
    }
  };

  useEffect(() => {
    console.log(`Rows: ${rows}, Columns: ${columns}`);
  }, [rows, columns]);

  // Handle mouse enter event (continue drawing on new squares)
  const handleMouseMove = useCallback(throttle((e) => {
    if (!isDrawing) return;
    const index = getSquareIndexFromEvent(e);
    if (index !== null && (drawActive || eraseActive)) {
      fillSquare(index);
    }
  }, 16), // Approx 60fps
      [isDrawing, drawActive, eraseActive]
  );

  const handleMouseUp = () => {
    setIsDrawing(false);
  }

  // Handle global mouse up to stop drawing
  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
      id="gridContainer"
      ref={gridContainerRef}
      style={{
        gridTemplateColumns: `repeat(${columns}, ${grid_pixels}px)`,
        gridTemplateRows: `repeat(${rows}, ${grid_pixels}px)`,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      {gridData.map((square, index) => (
        <PatternGridSquare key={index} square={square} viewMode={viewMode} />
      ))}
    </div>
  );
};

const PatternGrid = ({ gridData, handleSave, viewMode }) => {
  const grid_pixels = getCSSVariable('--square_var');
  const gap_size = getCSSVariable('--gap-var');

  // Other vars
  const rows = gridData.length;
  const columns = gridData[0].length;

  // Initialize grid state based on the gridData prop
  const [grid, setGrid] = useState(() => {
    return gridData.flat().map(value => ({
      color: COLOR_MAPPING[value] || '#d3d3d3',
      isHashed: value === -1,
      marking: 'none',
    }));
  });

  // Variables
  const {activeMode, drawActive, eraseActive, panActive, handleModeSelect} = useDrawingTools();
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedMarking, setSelectedMarking] = useState('none');
  const [selectedLineStyle, setSelectedLineStyle] = useState('regular');
  const [customLineStyle, setCustomLineStyle] = useState([]);
  const [lineStyleIndex, setLineStyleIndex] = useState(0);

  // Popup Vars
  const [popupType, setPopupType] = useState(''); // Type of popup ('color', 'marker', 'grid', 'save')

  // Reference Vars
  const gridContainerRef = useRef(null); // Reference to grid container
  const transformWrapperRef = useRef(null);

  // Function to handle popups
  const openPopup = (type) => {
    setPopupType(type); // Opens the appropriate popup
  };

  const closePopup = () => {
    setPopupType('');
  };
  // Handle lineStyle selection and conversion
  const handleLineStyleChange = (event) => {
    const newLineStyle = event.target.value;
    setSelectedLineStyle(newLineStyle);
    localStorage.setItem('selectedLineStyle', newLineStyle);
    if (newLineStyle !== 'custom') {
      setCustomLineStyle([]); // Clear custom line style if switching back
    }

    setLineStyleIndex(0);
  };

  // Handle Custom Inputs
  const handleCustomLineStyleInput = (input) => {
    const mappedCustomLine = input.split(' ').map(char => {
      if (char === '.') return '•'; // Map '.' to dot
      if (char.toLowerCase() === 'x') return '✕'; // Map 'x' to cross
      return char; // Keep other characters as is
    });
    setCustomLineStyle(mappedCustomLine);
    localStorage.setItem('customLineStyle', JSON.stringify(mappedCustomLine));
  };

  // Handle color change
  const handleColorChange = (event) => {
    const newColor = event.target.value;
    setSelectedColor(newColor);
    localStorage.setItem('selectedColor', newColor);
    closePopup();
  };

  // Handle marking change
  const handleMarkingChange = (event) => {
    const newMarker = event.target.value;
    setSelectedMarking(newMarker);
    localStorage.setItem('selectedMarker', newMarker);
    closePopup();
  };


  // // Handle global mouse up event to stop drawing   Ask about this
  // useEffect(() => {
  //   const handleGlobalMouseUp = () => {
  //     setIsDrawing(false); // Stop drawing when the mouse is released anywhere
  //   };
  //
  //   window.addEventListener('mouseup', handleGlobalMouseUp);
  //
  //   return () => {
  //     window.removeEventListener('mouseup', handleGlobalMouseUp);
  //   };
  // }, []);

  // Function to fill a square with the selected color or eraser
  const fillSquare = useCallback((index) => {
    setGrid((prevGrid) => {
      const square = prevGrid[index];
      if (!square) return prevGrid;

      const newSquare = {...square};

      if (eraseActive) {
        newSquare.color = '#ffffff';
        newSquare.marking = 'none';
      } else if (drawActive) {
        let marking = '';
        if (selectedLineStyle === 'regular') {
          marking = selectedMarking !== 'none' ? selectedMarking : '';
        } else if (selectedLineStyle === 'custom') {
          const lineStyleToUse = customLineStyle.length > 0 ? customLineStyle : ['•'];
          marking = lineStyleToUse[lineStyleIndex % lineStyleToUse.length];
          setLineStyleIndex((prevIndex) => prevIndex + 1);
        } else {
          const lineStyleToUse = LINE_STYLES[selectedLineStyle];
          marking = lineStyleToUse[lineStyleIndex % lineStyleToUse.length];
          setLineStyleIndex((prevIndex) => prevIndex + 1);
        }
        newSquare.color = selectedColor;
        newSquare.marking = marking;
      }

      const newGrid = [...prevGrid];
      newGrid[index] = newSquare;

      saveGridToLocalStorage(newGrid);
      return newGrid;
    });
  }, [
      activeMode,
      selectedColor,
      selectedMarking,
      selectedLineStyle,
      customLineStyle,
      lineStyleIndex,
      LINE_STYLES,
      ]
  );

  const saveGridToLocalStorage = useCallback(
    debounce((newGrid) => {
      try {
        const updatedGridData = { savedGrid: newGrid, savedRows: rows, savedColumns: columns };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedGridData));
      } catch (error) {
        console.error('Failed to save grid data to localStorage:', error);
      }
    }, 5000),
    [rows, columns]
  );

  // Set previous selections from storage.
  useEffect(() => {
    // Load saved marker, color, and active mode from local storage
    const savedMarker = localStorage.getItem('selectedMarker');
    const savedColor = localStorage.getItem('selectedColor');
    const savedMode = localStorage.getItem('activeMode');
    const savedLineStyle = localStorage.getItem('selectedLineStyle');
    const savedCustomLineStyle = localStorage.getItem('customLineStyle');
    const savedRows = localStorage.getItem('rows')
    const savedColumns = localStorage.getItem('columns')

    if (savedMarker) {
      setSelectedMarking(savedMarker); // Set the saved marker
    }
    if (savedColor) {
      setSelectedColor(savedColor); // Set the saved color
    }
    if (savedMode) {
      handleModeSelect(savedMode); // Set the saved mode as the active mode
    } else {
      handleModeSelect('draw'); // Default to draw if no mode is saved
    }
    if (savedLineStyle) {
      setSelectedLineStyle(savedLineStyle); // Set the saved line style
    }
    if (savedCustomLineStyle) {
      setCustomLineStyle(JSON.parse(savedCustomLineStyle)); // Parse and set the custom line style
    }
    if (savedRows && savedColumns) {
      setRows(parseInt(savedRows, 10));
      setColumns(parseInt(savedColumns, 10));
    }

  }, []);

  const [minScale, setMinScale] = useState(1);

  useLayoutEffect(() => {
    const updateMinScale = () => {
      if (transformWrapperRef.current && gridContainerRef.current) {
        const wrapperRect = transformWrapperRef.current.getBoundingClientRect();
        const gridRect = gridContainerRef.current.getBoundingClientRect();

        const wrapperWidth = wrapperRect.width;
        const wrapperHeight = wrapperRect.height;

        const gridWidth = gridRect.width;
        const gridHeight = gridRect.height;

        // Calculate scale factors
        const scaleWidth = wrapperWidth / gridWidth;
        const scaleHeight = wrapperHeight / gridHeight;

        const newMinScale = Math.min(scaleWidth, scaleHeight, 1);

        setMinScale(newMinScale);

        // Debugging logs for clarity
        console.log('Wrapper Dimensions:', wrapperWidth, wrapperHeight);
        console.log('Grid Dimensions:', gridWidth, gridHeight);
        console.log('Scale Factors:', scaleWidth, scaleHeight);
        console.log('New Min Scale:', newMinScale);
      }
    };

    updateMinScale(); // Initial calculation

    // Set up Resize Observers
    const wrapperResizeObserver = new ResizeObserver(updateMinScale);
    if (transformWrapperRef.current) {
      wrapperResizeObserver.observe(transformWrapperRef.current);
    }

    // Clean up on unmount
    return () => {
        wrapperResizeObserver.disconnect();
      };
    }, [rows, columns, grid_pixels, gap_size]);


  return (
      <div className="pattern-editor">
      {gridData ? (
          <TransformWrapper
              wheel={{step: 0.05}}
              pinch={{disabled: false}}
              panning={{disabled: !panActive}}
              minScale={minScale}
              maxScale={5}

              limitToBounds={false}
              centerOnInit={true}
              style={{width: '100%', height: '100%'}}
          >
            <div
                ref={transformWrapperRef}
                id="canvasContainer"
                onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu
            >
              <TransformComponent>
                <GridComponent
                  gridData={gridData}
                  gridContainerRef={gridContainerRef}
                  grid_pixels={grid_pixels}
                  gap_size={gap_size}
                  rows={rows}
                  columns={columns}
                  fillSquare={fillSquare}
                  viewMode={viewMode}
                  drawActive={drawActive}
                  eraseActive={eraseActive}
                />
              </TransformComponent>
            </div>

            {/* Add SideToolbar*/}
            <SideToolbar
                activeMode={activeMode}
                handleModeSelect={handleModeSelect}
                open={openPopup}
            />

            {/* Popups */}
            {popupType === 'line_style' && (
                <div className="popup">
                  <h3>Select Line Style</h3>
                  <select value={selectedLineStyle} onChange={handleLineStyleChange}>
                    <option value="regular">None</option>
                    <option value="dot-cross">• ✕</option>
                    <option value="dot-2cross">• ✕ ✕</option>
                    <option value="custom">Custom</option>
                  </select>

                  {selectedLineStyle === 'custom' && (
                      <div>
                        <h4>Define Custom Line Style</h4>
                        <input
                            type="text"
                            value={customLineStyle.join(' ')}
                            onChange={(e) => handleCustomLineStyleInput(e.target.value)}
                            placeholder="Enter '.' for Dot and 'x' for Cross"
                        />
                        <button onClick={closePopup}>Use</button>
                      </div>
                  )}
                  {selectedLineStyle !== 'custom' && (
                      <button onClick={closePopup}>Close</button>
                  )}
                </div>
            )}
            {popupType === 'color' && (
                <div className="popup">
                  <h3>Select Color</h3>
                  <input type="color" value={selectedColor} onChange={handleColorChange}/>
                  <button onClick={closePopup}>Close</button>
                </div>
            )}

            {popupType === 'marker' && (
                <div className="popup">
                  <h3>Select Marker</h3>
                  <select value={selectedMarking} onChange={handleMarkingChange}>
                    <option value="none">None</option>
                    <option value="•">•</option>
                    <option value="✕">✕</option>
                    <option value="◯">◯</option>
                  </select>
                  <button onClick={closePopup}>Close</button>
                </div>
            )}

            {popupType === 'save' && (
                <div className="popup">
                  <h3>Save Grid</h3>
                  <button onClick={handleSave}>Save Grid</button>
                  <button onClick={closePopup}>Close</button>
                </div>
            )}
          </TransformWrapper>
      ) : (
          <div className="loading">No data available.</div>
      )}
      </div>
  );
};

PatternGrid.propTypes = {
  gridData: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
};

export default PatternGrid;
