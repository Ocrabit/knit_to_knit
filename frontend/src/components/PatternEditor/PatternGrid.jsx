// PatternGrid.jsx

import React, {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import './PatternGrid.css';
import {TransformComponent, TransformWrapper} from 'react-zoom-pan-pinch';
import PatternGridSquare from "./PatternGridSquare.jsx";
import {COLOR_MAPPING, LINE_STYLES, VALUE_OUTLINE_MAPPING, COLOR_OUTLINE_MAPPING, NUMBER_MAPPING} from './config';
import SideToolbar from "./Toolbars/SideToolbar.jsx";
import TopToolbar from "./Toolbars/TopToolbar.jsx";
import {debounce, getCSSVariable, updateLocalStorageProperty, getAffectedCells, useUndoRedo} from "./utils.js";
import useDrawingTools from "../PatternEditor/useDrawingTools.jsx";
import {throttle} from 'lodash';
import { unstable_batchedUpdates } from 'react-dom';
import { updateShapeGrid, updateColorGrid, updateStitchTypeGrid } from "./gridUpdater.jsx";


const PatternGrid = ({ gridData, handleSave, selectedSection, viewMode, LOCAL_STORAGE_KEY, handleFileChange, handleViewModeChange, colorMapper, onGridUpdate}) => {
  // Return Checks
  if (!colorMapper) {
    return <div>Loading Color Mapper...</div>;
  }

  const grid_pixels = getCSSVariable('--square_var');
  const gap_size = getCSSVariable('--gap_var');

  // Debug data receiving
  // useEffect(() => {
  //   console.log("PatternGrid received gridData:", gridData);
  // }, [gridData]);

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
      row.map((square, colIndex) => {
        const colorValue = colorMapper.getColorFromId(gridData.color?.[rowIndex]?.[colIndex]) || '#ffffff';
        return {
          color: square.isHashed ? '#00000000' : colorValue,
          isHashed: square.isHashed,
          marking: 'none',
          outline: COLOR_OUTLINE_MAPPING[square.color] ?? 'none'
        };
      })
    );
  }, [shapeGrid, colorMapper, gridData.color]);

  // Memoized function to calculate the stitch type grid based on the shape grid
  const calculateStitchTypeGrid = useCallback(() => {
    return shapeGrid.map(row =>
      row.map((square, colIndex) => ({
        color: square.isHashed ? '#00000000' : '#ffffff',
        isHashed: square.isHashed,
        marking: 'none',
        outline: COLOR_OUTLINE_MAPPING[square.color] ?? 'none'
      }))
    );
  }, [shapeGrid]);

  // Initialize colorGrid and stitchTypeGrid with calculated values
  const [colorGrid, setColorGrid] = useState(() => calculateColorGrid());
  const [stitchTypeGrid, setStitchTypeGrid] = useState(() => calculateStitchTypeGrid());

  // Memoized active grid selector
  const activeGrid = useMemo(() => {
    if (viewMode === 'shape') return shapeGrid;
    if (viewMode === 'color') return colorGrid;
    return stitchTypeGrid;
  }, [viewMode, shapeGrid, colorGrid, stitchTypeGrid]);

  // Variables
  const {activeMode, drawActive, eraseActive, panActive, selectActive, handleModeSelect} = useDrawingTools(LOCAL_STORAGE_ACTIVE_KEY);
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

  // Handle color change
  const handleColorChange = (color) => {
    const newColor = color;
    setSelectedColor(newColor);
    updateLocalStorageProperty(LOCAL_STORAGE_ACTIVE_KEY, 'selectedColor', newColor)
  };

  // Handle marking change
  const handleMarkingChange = (event) => {
    const newMarker = event.target.value;
    setSelectedMarking(newMarker);
    updateLocalStorageProperty(LOCAL_STORAGE_ACTIVE_KEY, 'selectedMarker', newMarker)
  };

  // Undo / Redo Vars
  const [historyStack, setHistoryStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const historyLimit = 50;
  const [changeQueue, setChangeQueue] = useState(new Map());

  const handleUndo = () => {
    if (historyStack.length === 0) return;

    const lastDeltas = historyStack[historyStack.length - 1];
    setHistoryStack((prevHistory) => prevHistory.slice(0, -1)); // Remove last entry

    const redoDeltas = getNewPreviousValues(lastDeltas)
    setRedoStack((prevRedo) => [redoDeltas, ...prevRedo]); // Add to redo stack

    applyDeltas(lastDeltas, true);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const nextDeltas = redoStack[0];
    //console.log('Redo deltas:', nextDeltas);
    setRedoStack((prevRedo) => prevRedo.slice(1)); // Remove first entry
    setHistoryStack((prevHistory) => [...prevHistory, nextDeltas]); // Add back to history

    applyDeltas(nextDeltas, false); // Apply deltas
  };

  const applyDeltas = (deltas, reverse) => {
    //console.log('Applying deltas:', deltas, 'Reverse:', reverse);
    const setGridFunction =
      viewMode === 'shape' ? setShapeGrid : viewMode === 'color' ? setColorGrid : setStitchTypeGrid;

    setGridFunction((prevGrid) => {
      const updatedGrid = [...prevGrid];
      deltas.forEach(({ row, col, prevValue, newValue }) => {
        updatedGrid[row][col] = reverse ? prevValue : newValue;
      });
      return updatedGrid;
    });
  };

  const getNewPreviousValues = (deltas) => {
    deltas.forEach((value, key) => {
      const { row, col } = value;
      deltas.set(key, {
        ...value,
        newValue: activeGrid[row][col],
      });
    });
    return deltas;
  };

  const queueChange = (row, col) => {
    setChangeQueue((prevQueue) => {
      const newMapQueue = new Map(prevQueue); // Ensure uniqueness

      // Get all affected cells
      const affectedCells = getAffectedCells(row, col, drawSize, activeGrid);

      affectedCells.forEach(({row: affectedRow, col: affectedCol}) => {
        const key = `${affectedRow}-${affectedCol}`;
        if (!newMapQueue.has(key)) {
          newMapQueue.set(key, {
            row: affectedRow,
            col: affectedCol,
            prevValue: activeGrid[affectedRow][affectedCol],
          });
        }
      });

      return newMapQueue;
    });
  };

  // Add undo and redo listeners
  useUndoRedo(handleUndo, handleRedo);

  // Handle mouse down event (start drawing)
  const handleMouseDown = (e) => {
    if (!drawActive && !eraseActive) return;

    setIsDrawing(true);
    setChangeQueue(() => new Map());
    const indices = getSquareIndicesFromEvent(e);

    if (indices !== null) {
      const { rowIndex, colIndex } = indices;
      queueChange(rowIndex, colIndex);
      fillSquare(rowIndex, colIndex);
    }
  };

  // Handle mouse enter event (continue drawing on new squares)
  const handleMouseMove = useCallback(
    throttle((e) => {
      if (!isDrawing) return;

      const indices = getSquareIndicesFromEvent(e);
      if (indices !== null && (drawActive || eraseActive)) {
        const { rowIndex, colIndex } = indices;

        queueChange(rowIndex, colIndex);
        fillSquare(rowIndex, colIndex);
      }
    }, 16),
    [isDrawing, drawActive, eraseActive]
  );

  const handleMouseUp = () => {
    setChangeQueue((prevQueue) => {
      if (prevQueue.size > 0) {
        setHistoryStack((prevHistory) => {
          const newHistory = [...prevHistory, prevQueue];
          //console.log('Pushed drawn map to history stack:', prevQueue);
          if (newHistory.length > historyLimit) newHistory.shift();
          return newHistory;
        });
        setRedoStack([]); // Clear redo stack
        //console.log('Cleared redo stack on new action');
      }

      return new Map(); // Reset queue
    });

    if (!isDrawing) setIsDrawing(false);
  };

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
      // console.log(`Mouse on grid cell: row ${rowIndex}, column ${colIndex}`);
      // console.log(`Mouse screen (${e.clientX}, ${e.clientY})`);
      // console.log(`Grid Mouse Point (${offsetX}, ${offsetY})`);
      return { rowIndex, colIndex };
    } else {
      // console.log("Mouse outside the grid boundaries");
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
      console.log('saving to local storage');
      try {
        let dataToSave;
        if (viewMode === 'shape') {
          dataToSave = newGrid.map(row => row.map(cell => NUMBER_MAPPING[cell.color] ?? 0));
        } else if (viewMode === 'color') {
          dataToSave = colorMapper.mapColorsToIds(newGrid.map(row => row.map(cell => cell.color)));
        }
        updateLocalStorageProperty(LOCAL_STORAGE_KEY, 'gridArray', JSON.stringify(dataToSave));
        onGridUpdate(dataToSave);
      } catch (error) {
        console.error('Failed to save grid data to localStorage:', error);
      }
    }, 1000),
    [LOCAL_STORAGE_KEY, viewMode, onGridUpdate]
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
        //console.log("Parsed saved data:", parsedData);

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


  if (!gridData.shape || !shapeGrid.length) {
    return <div>Loading pattern...</div>;
  }

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
            selectedSection={selectedSection}
            viewMode={viewMode}
            handleViewModeChange={handleViewModeChange}
            handleFileChange={handleFileChange}
          />
          <SideToolbar
              activeMode={activeMode}
              handleModeSelect={handleModeSelect}
              handleColorChange={handleColorChange}
              viewMode={viewMode}
              handleSave={handleSave}
              setDrawSize={setDrawSize}
              setEraseSize={setEraseSize}
              drawSize={drawSize}
              eraseSize={eraseSize}
              handleUndo={handleUndo}
              handleRedo={handleRedo}
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
