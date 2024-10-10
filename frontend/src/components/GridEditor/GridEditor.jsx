import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import './GridEditor.css';
import * as Icons from '../../assets/icons/grid/icon_export';

// Local storage key for the grid state
const LOCAL_STORAGE_KEY = 'savedGrid';

const getCSSVariable = (variable) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable);
  return value ? parseFloat(value) : 0; // Return 0 if the variable isn't found
};  
const grid_pixels = getCSSVariable('--square_var');
const gap_size = getCSSVariable('--gap-var');

const GridEditor = () => {
  //Draw Vars
  const [drawActive, setDrawActive] = useState(false); // Draw mode

  //Erase Vars
  const [eraseActive, setEraseActive] = useState(false); // Eraser mode

  //Pan Var
  const [panActive, setPanActive] = useState(false);

  // Active Button Handler
  const [activeMode, setActiveMode] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Handle Current Active Button
  const handleModeSelect = (modeId) => {
    setActiveMode(modeId);
    localStorage.setItem('activeMode', modeId);

    if (modeId === 'draw') {
      setDrawActive(true);
      setEraseActive(false);
      setPanActive(false);
    } else if (modeId === 'erase') {
      setDrawActive(false);
      setEraseActive(true);
      setPanActive(false);
    } else if (modeId === 'pan') {
      setDrawActive(false);
      setEraseActive(false);
      setPanActive(true);
    }
  };

  // Handle mouse down event (start drawing)
  const handleMouseDown = (index) => {
    if (drawActive || eraseActive) {
      setIsDrawing(true); // Start drawing
      fillSquare(index);  // Fill the first square clicked
    }
  };

  // Handle mouse enter event (continue drawing on new squares)
  const handleMouseEnter = (index) => {
    if (isDrawing && (drawActive || eraseActive)) {
      fillSquare(index); // Only fill when drawing
    }
  };

  // Handle global mouse up event to stop drawing
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDrawing(false); // Stop drawing when the mouse is released anywhere
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  // Line Style Var
  const lineStyles = {
    "dot-cross": ['•', '✕'],
    "dot-2cross": ['•', '✕', '✕'],
    "regular": [],
    "custom": []
  };
  const [selectedLineStyle, setSelectedLineStyle] = useState('regular');
  const [customLineStyle, setCustomLineStyle] = useState([]);
  const [lineStyleIndex, setLineStyleIndex] = useState(0);

  // Color Var
  const [selectedColor, setSelectedColor] = useState('#000000');

  // Marker Var
  const [selectedMarking, setSelectedMarking] = useState('none');

  // Popup Vars
  const [popupType, setPopupType] = useState(''); // Type of popup ('color', 'marker', 'grid', 'save')

  // Reference Vars
  const gridContainerRef = useRef(null); // Reference to grid container
  const canvasContainerRef = useRef(null); // Reference to canvas container

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

  // GRID STUFF
  // Retrieve grid state from local storage or initialize an empty grid
  const savedGridData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {
    savedGrid: Array.from({ length: 16 }, () => ({ color: '#fff', marking: 'none' })),
    savedRows: 4,
    savedColumns: 4,
  };

  const [inputRows, setInputRows] = useState('');
  const [inputColumns, setInputColumns] = useState('');
  const [rows, setRows] = useState(savedGridData.savedRows);
  const [columns, setColumns] = useState(savedGridData.savedColumns);
  const [grid, setGrid] = useState(savedGridData.savedGrid || []); // Ensure grid is initialized

  // Utility for debouncing functions
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func.apply(null, args);
      }, delay);
    };
  };

  const saveGridToLocalStorage = useCallback(
    debounce((newGrid) => {
      const updatedGridData = { savedGrid: newGrid, savedRows: rows, savedColumns: columns };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedGridData));
    }, 500), [rows, columns]
  );

  // Function to generate the grid dynamically based on user input
  const generateGrid = useCallback((newRows, newColumns) => {
    const rowsValid = newRows > 0;
    const colsValid = newColumns > 0;
    if (rowsValid && colsValid) {
      setRows(newRows);
      setColumns(newColumns);
      localStorage.setItem('rows', newRows);
      localStorage.setItem('columns', newColumns);
      const newGrid = Array.from({ length: newRows * newColumns }, () => ({
        color: '#ffffff',
        marking: 'none',
      }));
      setGrid(newGrid);
      localStorage.removeItem(LOCAL_STORAGE_KEY); // Reset saved grid when a new one is created
      closePopup();
    } else {
      alert('Invalid row or column values.');
    }
  }, [closePopup]);

  // Function to fill a square with the selected color or eraser
  const fillSquare = (index) => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((square, i) => {
        if (i === index) {
          if (eraseActive) {
            return { color: '#ffffff', marking: 'none' };
          } else if (drawActive) {
            let marking = '';
            if (selectedLineStyle === 'regular') {
              marking = selectedMarking !== 'none' ? selectedMarking : '';
            } else if (selectedLineStyle === 'custom') {
              const lineStyleToUse = customLineStyle.length > 0 ? customLineStyle : ['•'];
              marking = lineStyleToUse[lineStyleIndex % lineStyleToUse.length];
              setLineStyleIndex((prevIndex) => prevIndex + 1);
            } else {
              const lineStyleToUse = lineStyles[selectedLineStyle];
              marking = lineStyleToUse[lineStyleIndex % lineStyleToUse.length];
              setLineStyleIndex((prevIndex) => prevIndex + 1);
            }
            return { color: selectedColor, marking: marking };
          }
        }
        return square;
      });

      saveGridToLocalStorage(newGrid);
      return newGrid;
    });
  };

  const calcContainerSize = (rows, cols, grid_size, gap_size) => {
    const width = cols * (grid_size + gap_size) - gap_size; // Total width including gaps
    const height = rows * (grid_size + gap_size) - gap_size; // Total height including gaps
    return { width, height };
  };
  
  // Dynamically calculate the container width and height based on grid configuration
  const { width: gridWidth, height: gridHeight } = calcContainerSize(rows, columns, grid_pixels, gap_size);
  console.log(gridWidth, gridHeight)

  // SAVE GRID
  const saveGrid = () => {
    const fileName = prompt('Please enter the file name', 'grid.png'); // Prompt for file name

    if (!fileName) {
      alert('File name cannot be empty!');
      return;
    }

    const canvas = document.createElement('canvas');
    const gridContainer = gridContainerRef.current;

    // Set canvas size based on grid container size
    const cellSize = 48; // Square size 48x48
    const gapSize = 1; // 1px gap for grid lines
    canvas.width = columns * (cellSize + gapSize) - gapSize; // Subtract the extra gap
    canvas.height = rows * (cellSize + gapSize) - gapSize;

    const ctx = canvas.getContext('2d');

    // Set the grid line color (optional: you can customize the line color)
    ctx.strokeStyle = '#404040'; // Black lines for the grid
    ctx.lineWidth = gapSize;

    // Iterate over the grid and draw each square onto the canvas
    grid.forEach((square, index) => {
      const x = (index % columns) * (cellSize + gapSize); // Adjust for gap size
      const y = Math.floor(index / columns) * (cellSize + gapSize); // Adjust for gap size

      // Set the fill style to the square color and fill a rectangle
      ctx.fillStyle = square.color;
      ctx.fillRect(x, y, cellSize, cellSize);

      // Optionally, you can draw markings here
      if (square.marking !== 'none') {
        ctx.fillStyle = 'black'; // Set a default marking color
        ctx.font = `${cellSize / 2}px Arial`;
        ctx.fillText(square.marking, x + cellSize / 4, y + cellSize / 1.5); // Center the marking
      }

      // Draw the grid lines around each square
      ctx.strokeRect(x, y, cellSize, cellSize); // Draw the grid lines (1px gaps)
    });

    // Convert the canvas to a data URL and create a download link
    const imageDataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = fileName; // Use the file name entered by the user
    document.body.appendChild(link); // Append the link to the body
    link.click(); // Programmatically click the link to trigger download
    document.body.removeChild(link); // Remove the link after download

    closePopup();
  };

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
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Fetch dimensions after the component has mounted
  useEffect(() => {
    if (canvasContainerRef.current) {
      // Set the container width and height after it's rendered
      setContainerWidth(canvasContainerRef.current.clientWidth);
      setContainerHeight(canvasContainerRef.current.clientHeight);
    }
  }, []);

  const minScale = Math.min(containerWidth / gridWidth, (containerHeight-100) / gridHeight, 1);

  const ResetButton = () => {
    const {resetTransform, centerView} = useControls();

    return (
        <button className="toolbox-button" onClick={() => {resetTransform(); centerView();}}>
          <img src={Icons.reset_icon} alt="Reset Icon" draggable="false"/>
        </button>
    );
  };

  // Render Component
  return (
      <TransformWrapper
        wheel={{step: 0.05}}
        pinch={{disabled: false}} // Allow pinch-to-zoom on touch devices
        panning={{ disabled: !panActive }} // Enable or disable panning based on mode
        minScale={minScale}
        maxScale={5}

        limitToBounds={false}
        centerOnInit={true}

      >
        <div
            id="canvasContainer"
            ref={canvasContainerRef}
            onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu
            style={{
              width: '100%',
              height: '100%',
            }}
        >

        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%' }}
          style={{width: '100%', height: '100%'}}
        >
          <div
            id="gridContainer"
            ref={gridContainerRef}
            style={{
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,

            }}
            onMouseUp={() => setIsDrawing(false)}
          >
            {grid.map((square, index) => (
                <div
                  key={index}
                  className="gridSquare"
                  style={{backgroundColor: square.color}}
                  onClick={() => fillSquare(index)}
                  onMouseDown={() => handleMouseDown(index)} // Start drawing
                  onMouseEnter={() => handleMouseEnter(index)} // Continue drawing while hovering over squares
                >
                  {square.marking !== 'none' && (
                      <span className="marking">{square.marking}</span>
                  )}
                </div>
            ))}
          </div>
          </TransformComponent>
        </div>


      {/* Toolbox with Buttons */}
        <div id="toolbox">
          {/* Active Buttons*/}
          <button className={`toolbox-button ${activeMode === 'draw' ? 'active' : ''}`}
                  onClick={() => handleModeSelect('draw')}>
            <img src={Icons.draw_icon} alt="Draw Icon" draggable="false"/>
          </button>
          <button className="toolbox-button" onClick={() => openPopup('line_style')}>
            <img src={Icons.line_style_icon} alt="Line Style Icon" draggable="false"/>
          </button>
          <button className={`toolbox-button ${activeMode === 'erase' ? 'active' : ''}`}
                  onClick={() => handleModeSelect('erase')}>
            <img src={Icons.erase_icon} alt="Erase Icon" draggable="false"/>
          </button>
          <button className={`toolbox-button ${activeMode === 'pan' ? 'active' : ''}`}
                  onClick={() => handleModeSelect('pan')}>
            <img src={Icons.pan_icon} alt="Pan Icon" draggable="false"/>
          </button>

          {/* Popup Buttons*/}
          <button className="toolbox-button" onClick={() => openPopup('color')}>
            <img src={Icons.color_icon} alt="Color Icon" draggable="false"/>
          </button>
          <button className="toolbox-button" onClick={() => openPopup('marker')}>
            <img src={Icons.marker_icon} alt="Marker Icon" draggable="false"/>
          </button>
          <button className="toolbox-button" onClick={() => openPopup('grid')}>
            <img src={Icons.grid_icon} alt="Grid Create Icon" draggable="false"/>
          </button>
          <ResetButton/>
          <button className="toolbox-button" onClick={() => openPopup('save')}>
            <img src={Icons.download_icon} alt="Download Icon" draggable="false"/>
          </button>
        </div>

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

      {popupType === 'grid' && (
        <div className="popup">
          <h3>Create New Grid</h3>
          <input
            type="number"
            placeholder="Rows"
            value={inputRows}
            onChange={(e) => setInputRows(e.target.value)} // Use inputRows instead of rows
          />
          <input
            type="number"
            placeholder="Columns"
            value={inputColumns}
            onChange={(e) => setInputColumns(e.target.value)} // Use inputColumns instead of columns
          />
          <button onClick={() => generateGrid(inputRows, inputColumns)}>Create</button> {/* Use inputRows/inputColumns */}
          <button onClick={closePopup}>Close</button>
        </div>
      )}

      {popupType === 'save' && (
        <div className="popup">
          <h3>Save Grid</h3>
          <button onClick={saveGrid}>Save Grid</button>
          <button onClick={closePopup}>Close</button>
        </div>
      )}
    </TransformWrapper>
  );
};

export default GridEditor;