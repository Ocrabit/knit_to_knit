// PatternGrid.jsx

import React, {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import './PatternGrid.css';
import {TransformComponent, TransformWrapper} from 'react-zoom-pan-pinch';
import PatternGridSquare from "./PatternGridSquare.jsx";
import {COLOR_MAPPING, LINE_STYLES, VALUE_OUTLINE_MAPPING, COLOR_OUTLINE_MAPPING, NUMBER_MAPPING} from './config';
import SideToolbar from "./Toolbars/SideToolbar.jsx";
import TopToolbar from "./Toolbars/TopToolbar.jsx";
import {debounce, getCSSVariable, updateLocalStorageProperty, ColorMapper} from "./utils.js";
import useDrawingTools from "../PatternEditor/useDrawingTools.jsx";
import {throttle} from 'lodash';
import { unstable_batchedUpdates } from 'react-dom';
import { updateShapeGrid, updateColorGrid, updateStitchTypeGrid } from "./gridUpdater.jsx";


const PatternGrid = ({ gridData, handleSave, selectedFile, viewMode, LOCAL_STORAGE_KEY, handleFileChange, handleViewModeChange}) => {
  const grid_pixels = getCSSVariable('--square_var');
  const gap_size = getCSSVariable('--gap_var');

  const LOCAL_STORAGE_ACTIVE_KEY = 'ActiveSelections'
  const rows = gridData.shape.length;
  const columns = gridData.shape[0].length;

  // Initialize the initial shape grid with `useMemo`
  const initialShapeGrid = useMemo(() =>
    gridData.shape.map(row =>
      row.map(value => ({
        color: COLOR_MAPPING[value] ?? '#00000000',
        isHashed: !value,
        marking: 'none',
        outline: 'none'
      }))
    ),
    [gridData.shape]
  );
  const [shapeGrid, setShapeGrid] = useState(initialShapeGrid);

  // Memoized function to calculate the color grid based on the shape grid
  const calculateColorGrid = useCallback(() => {
    return shapeGrid.map((row, rowIndex) =>
      row.map((square, colIndex) => ({
        color: square.isHashed ? '#00000000' : '#ffffff',
        isHashed: square.isHashed,
        marking: 'none',
        outline: COLOR_OUTLINE_MAPPING[square.color] ?? 'none'
      }))
    );
  }, [shapeGrid]);

  // Memoized function to calculate the stitch type grid based on the shape grid
  const calculateStitchTypeGrid = useCallback(() => {
    return shapeGrid.map(row =>
      row.map(() => ({
        // Replace with actual stitch type properties or defaults
        stitchType: 'default',
        marking: 'none',
        outline: 'none'
      }))
    );
  }, [shapeGrid]);

  // Initialize colorGrid and stitchTypeGrid with calculated values
  const [colorGrid, setColorGrid] = useState(calculateColorGrid);
  const [stitchTypeGrid, setStitchTypeGrid] = useState(calculateStitchTypeGrid);

  // Effect to update colorGrid only when switching to 'color' view mode
  useEffect(() => {
    if (viewMode === 'color') {
      setColorGrid(calculateColorGrid());
    }
  }, [viewMode, calculateColorGrid]);

  // Effect to update stitchTypeGrid only when switching to 'stitch_type' view mode
  useEffect(() => {
    if (viewMode === 'stitch_type') {
      setStitchTypeGrid(calculateStitchTypeGrid());
    }
  }, [viewMode, calculateStitchTypeGrid]);

  // Memoized active grid selector
  const activeGrid = useMemo(() => {
    if (viewMode === 'shape') return shapeGrid;
    if (viewMode === 'color') return colorGrid;
    return stitchTypeGrid;
  }, [viewMode, shapeGrid, colorGrid, stitchTypeGrid]);



  // Variables
  const {activeMode, drawActive, eraseActive, panActive, handleModeSelect} = useDrawingTools(LOCAL_STORAGE_ACTIVE_KEY);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedMarking, setSelectedMarking] = useState('none');

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
      const size = drawActive ? drawSize : eraseActive ? eraseSize : 1;

      // Determine the correct update function based on the view mode
      const updateFunction =
        viewMode === 'shape' ? updateShapeGrid : viewMode === 'color' ? updateColorGrid : updateStitchTypeGrid;

      const setGridFunction =
        viewMode === 'shape' ? setShapeGrid : viewMode === 'color' ? setColorGrid : setStitchTypeGrid;

      // Call the appropriate grid update function and set state
      setGridFunction(prevGrid => {
        const updatedGrid = updateFunction(
          prevGrid,
          rowIndex,
          colIndex,
          size,
          drawActive,
          eraseActive,
          selectedColor,
          selectedMarking
        );
        unstable_batchedUpdates(() => saveGridToLocalStorage(updatedGrid));
        return updatedGrid;
      });
    }, 16),
    [drawActive, eraseActive, selectedColor, selectedMarking, drawSize, eraseSize, viewMode]
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
  const minScaleRef = useRef(1);

  useLayoutEffect(() => {
    const updateMinScale = () => {
      if (canvasContainerRef.current && gridContainerRef.current) {
        const wrapperRect = canvasContainerRef.current.getBoundingClientRect();
        const gridRect = gridContainerRef.current.getBoundingClientRect();
        const scaleWidth = wrapperRect.width / gridRect.width;
        const scaleHeight = wrapperRect.height / gridRect.height;
        const newMinScale = Math.min(scaleWidth, scaleHeight, 1);

        // Only update if minScale has changed
        if (newMinScale !== minScaleRef.current) {
          minScaleRef.current = newMinScale;
          setMinScale(newMinScale);
        }
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
            <TransformComponent key={{viewMode}}>
              <div id="gridContainer" ref={gridContainerRef}
                   style={{
                      gridTemplateColumns: `repeat(${columns}, ${grid_pixels}px)`,
                      gridTemplateRows: `repeat(${rows}, ${grid_pixels}px)`,
                   }}
                   onMouseDown={handleMouseDown}
                   onMouseMove={handleMouseMove}
              >
                {activeGrid.map((row, rowIndex) =>
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
