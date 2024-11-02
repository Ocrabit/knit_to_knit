// PatternGrid.jsx

import React, {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import './PatternGrid.css';
import {TransformComponent, TransformWrapper} from 'react-zoom-pan-pinch';
import PatternGridSquare from "./PatternGridSquare.jsx";
import {COLOR_MAPPING, LINE_STYLES, OUTLINE_MAPPING, NUMBER_MAPPING} from './config';
import SideToolbar from "./Toolbars/SideToolbar.jsx";
import TopToolbar from "./Toolbars/TopToolbar.jsx";
import {debounce, getCSSVariable, updateLocalStorageProperty, ColorMapper} from "./utils.js";
import useDrawingTools from "../PatternEditor/useDrawingTools.jsx";
import {throttle} from 'lodash';
import { unstable_batchedUpdates } from 'react-dom'; // For React 18 or higher


const PatternGrid = ({ gridData, handleSave, selectedFile, viewMode, LOCAL_STORAGE_KEY, handleFileChange, handleViewModeChange}) => {
  const grid_pixels = getCSSVariable('--square_var');
  const gap_size = getCSSVariable('--gap_var');

  const LOCAL_STORAGE_ACTIVE_KEY = 'ActiveSelections'

  // Other vars
  console.log(gridData)
  const rows = gridData.shape.length;
  const columns = gridData.shape[0].length;

  // Initialize grid state based on the gridData prop
  const initialGrid = useMemo(() => {
    const colorData = gridData['color']
    const shapeData = gridData['shape'];
    if (!shapeData) return [];

    try {
      if (viewMode === 'shape') {
        return shapeData.map(row =>
            row.map(value => ({
              color: COLOR_MAPPING[value] ?? '#00000000',
              isHashed: !value,
              marking: 'none',
              outline: 'none'
            }))
        );
      } else if (viewMode === 'color') {
        return shapeData.map((row, rowIndex) =>
            row.map(((value, colIndex) => ({
              color: value ? (colorData[rowIndex]?.[colIndex] ?? '#ffffff') : '#00000000', //temp
              isHashed: !value,
              marking: 'none',
              outline: OUTLINE_MAPPING[value] ?? 'none',
            }))
        ));
      }
    } catch (error) {
      console.error('Failed to load grid data:', error);
    }
  }, [gridData, viewMode]);

  // State for `grid` that can be individually updated
  const [grid, setGrid] = useState(initialGrid);

  // Re-sync `grid` with `initialGrid` only when `gridData`, `viewMode`, or `selectedFile` change
  useEffect(() => {
    setGrid(initialGrid);
  }, [initialGrid, selectedFile]);

  // Variables
  const {activeMode, drawActive, eraseActive, panActive, handleModeSelect} = useDrawingTools(LOCAL_STORAGE_ACTIVE_KEY);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedMarking, setSelectedMarking] = useState('none');
  const [selectedLineStyle, setSelectedLineStyle] = useState('regular');
  const [customLineStyle, setCustomLineStyle] = useState([]);
  const [lineStyleIndex, setLineStyleIndex] = useState(0);

  // Size Vars
  const [drawSize, setDrawSize] = useState(1);
  const [eraseSize, setEraseSize] = useState(1);

  // Popup Vars
  const [popupType, setPopupType] = useState(''); // Type of popup ('color', 'marker', 'grid', 'save')

  // Reference Vars
  const gridContainerRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const transformWrapperRef = useRef(null);

  // Function to handle popups
  const openPopup = (type) => {
    setPopupType(type);
  };

  const closePopup = () => {
    setPopupType('');
  };
  // Handle lineStyle selection and conversion
  const handleLineStyleChange = (event) => {
    const newLineStyle = event.target.value;
    setSelectedLineStyle(newLineStyle);
    updateLocalStorageProperty(LOCAL_STORAGE_ACTIVE_KEY, 'selectedLineStyle', newLineStyle);
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
    updateLocalStorageProperty(LOCAL_STORAGE_ACTIVE_KEY, 'customLineStyle', JSON.stringify(mappedCustomLine))
  };

  // Handle color change
  const handleColorChange = (event) => {
    const newColor = event.target.value;
    setSelectedColor(newColor);
    updateLocalStorageProperty(LOCAL_STORAGE_ACTIVE_KEY, 'selectedColor', newColor)
    closePopup();
  };

  // Handle marking change
  const handleMarkingChange = (event) => {
    const newMarker = event.target.value;
    setSelectedMarking(newMarker);
    updateLocalStorageProperty(LOCAL_STORAGE_ACTIVE_KEY, 'selectedMarker', newMarker)
    closePopup();
  };

  // Handle mouse down event (start drawing)
  const handleMouseDown = (e) => {
    if (!drawActive && !eraseActive) return;
    setIsDrawing(true);
    const indices = getSquareIndicesFromEvent(e);
    if (indices !== null) {
      fillSquare(indices.rowIndex, indices.colIndex);
    }
  };


  // Handle mouse enter event (continue drawing on new squares)
  const handleMouseMove = useCallback(
    throttle((e) => {
      if (!isDrawing) return;
      const indices = getSquareIndicesFromEvent(e);
      if (indices !== null && (drawActive || eraseActive)) {
        fillSquare(indices.rowIndex, indices.colIndex);
      }
    }, 16),
    [isDrawing, drawActive, eraseActive]
  );

  const handleMouseUp = () => {
    setIsDrawing( false);
  }


  const getSquareIndicesFromEvent = (e) => {
    if (!gridContainerRef.current || !transformWrapperRef.current) return null;

    const rect = gridContainerRef.current.getBoundingClientRect();
    const scale = transformWrapperRef.current.instance.transformState.scale

    // Adjust for scaling and panning
    const offsetX = (e.clientX - rect.left) / scale;
    const offsetY = (e.clientY - rect.top) / scale;

    // Calculate column and row index based on transformed coordinates
    const totalCellSize = (grid_pixels + gap_size);

    const colIndex = Math.floor(offsetX / totalCellSize);
    const rowIndex = Math.floor(offsetY / totalCellSize);

    // Ensure indices are within bounds
    if (rowIndex >= 0 && rowIndex < rows && colIndex >= 0 && colIndex < columns) {
      console.log(`Mouse on grid cell: row ${rowIndex}, column ${colIndex}`);
      console.log(`Mouse screen (${e.clientX}, ${e.clientY})`);
      console.log(`Grid Mouse Point (${offsetX}, ${offsetY})`);
      return { rowIndex, colIndex };
    } else {
      console.log("Mouse outside the grid boundaries");
      return null;
    }
  };


  // Function to fill a square with the selected color or eraser
    const fillSquare = useCallback(
      throttle((rowIndex, colIndex) => {
        setGrid(prevGrid => {
          const newGrid = [...prevGrid];
          const size = drawActive ? drawSize : eraseActive ? eraseSize : 1;
          const halfSize = Math.floor(size / 2);
          for (let i = -halfSize; i <= halfSize; i++) {
            for (let j = -halfSize; j <= halfSize; j++) {
              const newRow = rowIndex + i;
              const newCol = colIndex + j;
              if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < columns) {
                const square = { ...newGrid[newRow][newCol] };
                if (eraseActive) {
                  square.color = viewMode === 'shape' ? '#00000000': '#ffffff';
                  square.marking = 'none';
                } else if (drawActive) {
                  // let marking = '';
                  // if (selectedLineStyle === 'regular') {
                  //   marking = selectedMarking !== 'none' ? selectedMarking : '';
                  // } else if (selectedLineStyle === 'custom') {
                  //   const lineStyleToUse = customLineStyle.length > 0 ? customLineStyle : ['•'];
                  //   marking = lineStyleToUse[lineStyleIndex % lineStyleToUse.length];
                  //   setLineStyleIndex(prevIndex => prevIndex + 1);
                  // } else {
                  //   const lineStyleToUse = LINE_STYLES[selectedLineStyle];
                  //   marking = lineStyleToUse[lineStyleIndex % lineStyleToUse.length];
                  //   setLineStyleIndex(prevIndex => prevIndex + 1);
                  // }
                  square.color = selectedColor;
                  square.marking = selectedMarking;
                }
                newGrid[newRow][newCol] = square;
              }
            }
          }
          unstable_batchedUpdates(() => saveGridToLocalStorage(newGrid));
          return newGrid;
        });
      }, 16), // Throttle to 50ms intervals
      [
        drawActive,
        eraseActive,
        selectedColor,
        selectedMarking,
        //selectedLineStyle,
        //customLineStyle,
        //lineStyleIndex,
        drawSize,
        eraseSize
      ]
    );

  // Definitely broken with the 3d array, make an array for each.
  const saveGridToLocalStorage = useCallback(
    debounce((newGrid) => {
      console.log('savedGridToLocalStorage Called');
      try {
        let dataToSave;
        if (viewMode === 'shape') {
          dataToSave = newGrid.map(row => row.map(cell => NUMBER_MAPPING[cell.color] ?? 0));
        } else {
          // For other view modes, save the grid as is
          console.log('viewMode is other, this will be implemented later');
        }
        updateLocalStorageProperty(LOCAL_STORAGE_KEY, 'gridArray', JSON.stringify(dataToSave));
      } catch (error) {
        console.error('Failed to save grid data to localStorage:', error);
      }
    }, 5000),
    [LOCAL_STORAGE_KEY] //is there a way to call save when they leave page or reload?
  );

  // Handle global mouse up to stop drawing
  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Set previous selections from storage.
  useEffect(() => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_ACTIVE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log("Parsed saved data:", parsedData);

        const {
          savedMarker,
          savedColor,
          savedMode,
          savedLineStyle,
          savedCustomLineStyle,
          savedDrawSize,
          savedEraseSize,
        } = parsedData;

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
        if (savedDrawSize) {
          setDrawSize(JSON.parse(savedDrawSize));
        }
        if (savedEraseSize) {
          setEraseSize(JSON.parse(savedEraseSize));
        }
      } catch (error) {
        console.error("Failed to load grid data from localStorage:", error);
      }
    }
  }, []);

  const [minScale, setMinScale] = useState(1);

  useLayoutEffect(() => {
    const updateMinScale = () => {
      if (canvasContainerRef.current && gridContainerRef.current) {
        const wrapperRect = canvasContainerRef.current.getBoundingClientRect();
        const gridRect = gridContainerRef.current.getBoundingClientRect();
        const scaleWidth = wrapperRect.width / gridRect.width;
        const scaleHeight = wrapperRect.height / gridRect.height;
        const newMinScale = Math.min(scaleWidth, scaleHeight, 1);
        setMinScale(newMinScale);
      }
    };
    updateMinScale();

    const wrapperResizeObserver = new ResizeObserver(updateMinScale);
    if (canvasContainerRef.current) {
      wrapperResizeObserver.observe(canvasContainerRef.current);
    }
    // Clean up on unmount
    return () => {
      wrapperResizeObserver.disconnect();
    };
  }, [rows, columns, grid_pixels, gap_size]);


  useEffect(() => {
    console.log('Active Mode:', activeMode);
  }, [activeMode]);

  return (
      <div className="pattern-editor">
        <TransformWrapper
            wheel={{step: 0.05}}
            pinch={{disabled: false}}
            panning={{disabled: !panActive}}
            minScale={minScale}
            maxScale={5}
            ref={transformWrapperRef}
            limitToBounds={false}
            centerOnInit={true}
            style={{width: '100%', height: '100%'}}
        >
          <div
              ref={canvasContainerRef}
              id="canvasContainer"
              onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu
          >
            <TransformComponent>
              <div id="gridContainer" ref={gridContainerRef}
                   style={{
                      gridTemplateColumns: `repeat(${columns}, ${grid_pixels}px)`,
                      gridTemplateRows: `repeat(${rows}, ${grid_pixels}px)`,
                   }}
                   onMouseDown={handleMouseDown}
                   onMouseMove={handleMouseMove}
              >
                {grid.map((row, rowIndex) =>
                  row.map((square, colIndex) => (
                    <PatternGridSquare
                        key={`${rowIndex}-${colIndex}`}
                        square={square}
                        viewMode={viewMode}
                        rowIndex={rowIndex}
                        colIndex={colIndex}
                    />
                  ))
                )}
              </div>
            </TransformComponent>
          </div>

          {/* Add Toolbars*/}
          <TopToolbar
            selectedFile={selectedFile}
            viewMode={viewMode}
            handleViewModeChange={handleViewModeChange}
            handleFileChange={handleFileChange}
          />
          <SideToolbar
              activeMode={activeMode}
              handleModeSelect={handleModeSelect}
              openPopup={openPopup}
              viewMode={viewMode}
              setDrawSize={setDrawSize}
              setEraseSize={setEraseSize}
              drawSize={drawSize}
              eraseSize={eraseSize}
              LOCAL_STORAGE_ACTIVE_KEY={LOCAL_STORAGE_ACTIVE_KEY}
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
      </div>
  );
};

PatternGrid.propTypes = {
  gridData: PropTypes.shape({
    shape: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
    color: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
    stitch_type: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  }).isRequired,
};

export default PatternGrid;
