// useDrawingTools.jsx
import { useState } from 'react';
import { updateLocalStorageProperty } from "./utils.js";

const useDrawingTools = (LOCAL_STORAGE_ACTIVE_KEYS) => {
  const [activeMode, setActiveMode] = useState(null);
  const [drawActive, setDrawActive] = useState(false);
  const [eraseActive, setEraseActive] = useState(false);
  const [panActive, setPanActive] = useState(false);

  const handleModeSelect = (modeId) => {
    setActiveMode(modeId);
    updateLocalStorageProperty(LOCAL_STORAGE_ACTIVE_KEYS, 'savedMode', modeId);

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

  return {
    activeMode,
    drawActive,
    eraseActive,
    panActive,
    handleModeSelect,
  };
};

export default useDrawingTools;
