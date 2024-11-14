// PatternView.jsx
import React, {useEffect, useRef, useState} from 'react';
import {useParams} from 'react-router-dom';
import {fetchPatternDataByFile, fetchPatternDataByMode, savePatternChanges} from '../../services/data.service';
import PatternGrid from "../../components/PatternEditor/PatternGrid.jsx";
import {
  ColorMapper,
  getLocalStorageProperty,
  updateLocalStorageProperty
} from "../../components/PatternEditor/utils.js";

const PatternView = () => {  // Additional Goal Make -1 0 and 0 1 and 1 2 and 2 3
  const { patternId } = useParams(); // Get the pattern ID from the URL
  const [selectedFile, setSelectedFile] = useState(getLocalStorageProperty('SelectedFile', 'selectedFile') || 'front_torso.npy');
  const [viewMode, setViewMode] = useState(getLocalStorageProperty('ViewMode', 'viewMode') || 'shape'); //'shape', 'color','stitch_type'
  const [gridData, setGridData] = useState({
    shape: [[]],
    color: [[]],
    stitch_type: [[]]
  });
  const [changes, setChanges] = useState({
      shape: [[]],
    color: [[]],
    stitch_type: [[]]
  });
  const [isLoading, setIsLoading] = useState(false);

  const LOCAL_STORAGE_KEY = `patternEditor-${patternId}-${selectedFile}-${viewMode}`;
  const colorMapper = useRef(new ColorMapper(LOCAL_STORAGE_KEY)).current;


  useEffect(() => {
    const fetchData = async () => {
      if (patternId && selectedFile) {
        setIsLoading(true);
        const viewModes = ['shape', 'color', 'stitch_type'];
        const newGridData = {};
        const newChanges = {};

        const noneLocalDataExists = viewModes.every((mode) => {
          const localStorageKey = `patternEditor-${patternId}-${selectedFile}-${mode}`;
          const localStorageData = getLocalStorageProperty(localStorageKey, 'gridArray');
          return localStorageData == null;
        });

        try {
          if (noneLocalDataExists) {
            console.log('No data current exists in local storage, fetching all data from api');
            const fetchedData = await fetchPatternDataByFile({
              patternId,
              fileName: selectedFile
            });
            console.log('Fetched data', fetchedData);
            for (const mode of viewModes) {
              newGridData[mode] = fetchedData[mode]
              newChanges[mode] = {};
            }
          } else {
            for (const mode of viewModes) {
              console.log('modes', mode)
              const localStorageKey = `patternEditor-${patternId}-${selectedFile}-${mode}`;
              const savedData = getLocalStorageProperty(localStorageKey, 'gridArray');

              if (savedData) {
                try {
                  const parsedData = JSON.parse(savedData);
                  newGridData[mode] = parsedData;
                  newChanges[mode] = parsedData;
                  //console.log(`Loaded ${mode} from local storage`, savedData);
                } catch (error) {
                  console.error(`Failed to parse ${mode} data from local storage`, error);
                }
              } else {
                //console.log(`Fetched ${mode} from API`, fetchedData);
                newGridData[mode] = await fetchPatternDataByMode({
                  patternId,
                  fileName: selectedFile,
                  viewMode: mode,
                });
                newChanges[mode] = {};
              }
            }
          }

          setGridData(newGridData);
          setChanges(newChanges);
        } catch (error) {
          console.error('Error fetching pattern data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [selectedFile, patternId, setGridData]);



  // Ensure the view mode and selected file updates are captured correctly.
  useEffect(() => {
    updateLocalStorageProperty('SelectedFile', 'selectedFile', selectedFile);
    updateLocalStorageProperty('ViewMode', 'viewMode', viewMode);
  }, [selectedFile, viewMode]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.value);
  };

  const handleViewModeChange = (event) => {
    setViewMode(event.target.value);
  };

  const handleSaveChanges = async () => {
    try {
      await savePatternChanges({
        patternId,
        fileName: selectedFile,
        viewMode,
        changes: changes[viewMode] || {}
      });
      alert('Changes saved successfully!');
      setChanges(prevChanges => ({ ...prevChanges, [viewMode]: {} }));
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error saving changes.');
    }
  };

  const handleGridUpdate = (updatedGridData) => {
    setChanges((prevChanges) => ({
      ...prevChanges,
      [viewMode]: updatedGridData,
    }));
    console.log('handleGridUpdate called...', updatedGridData);
  };


  return (
    <div className="pattern-view">
      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : gridData ? (
        <PatternGrid
          key={`${selectedFile}`}
          gridData={gridData}
          selectedFile={selectedFile}
          viewMode={viewMode}
          handleSave={handleSaveChanges}
          LOCAL_STORAGE_KEY={LOCAL_STORAGE_KEY}
          handleFileChange={handleFileChange}
          handleViewModeChange={handleViewModeChange}
          colorMapper={colorMapper}
          onGridUpdate={handleGridUpdate}
        />
      ) : (
        <p>Strange Things Are Happening Here</p>
      )}
    </div>
  );
};

export default PatternView;