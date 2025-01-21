// useDrawingTools.jsx
import { useState } from 'react';
import { updateLocalStorageProperty } from "./utils.js";

const useDrawingTools = (LOCAL_STORAGE_ACTIVE_KEYS) => {
  const [activeMode, setActiveMode] = useState(null);
  const [drawActive, setDrawActive] = useState(false);
  const [eraseActive, setEraseActive] = useState(false);
  const [panActive, setPanActive] = useState(false);
  const [selectActive, setSelectActive] = useState(false);

  const handleModeSelect = (modeId) => {
    setActiveMode(modeId);
    updateLocalStorageProperty(LOCAL_STORAGE_ACTIVE_KEYS, 'savedMode', modeId);

    if (modeId === 'draw') {
      setDrawActive(true);
      setEraseActive(false);
      setSelectActive(false);
      setPanActive(false);
    } else if (modeId === 'erase') {
      setDrawActive(false);
      setEraseActive(true);
      setSelectActive(false);
      setPanActive(false);
    } else if (modeId === 'pan') {
      setDrawActive(false);
      setEraseActive(false);
      setSelectActive(false);
      setPanActive(true);
    } else if (modeId === 'select') {
      setDrawActive(false);
      setEraseActive(false);
      setSelectActive(true);
      setPanActive(false);
    }
  };

  return {
    activeMode,
    drawActive,
    eraseActive,
    panActive,
    selectActive,
    handleModeSelect,
  };
};

export default useDrawingTools;