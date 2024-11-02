// PatternView.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPatternData, savePatternChanges } from '../../services/data.service';
import PatternGrid from "../../components/PatternEditor/PatternGrid.jsx";
import {getLocalStorageProperty, updateLocalStorageProperty} from "../../components/PatternEditor/utils.js";

const PatternView = () => {  // Additional Goal Make -1 0 and 0 1 and 1 2 and 2 3
  const { patternId } = useParams(); // Get the pattern ID from the URL
  const [selectedFile, setSelectedFile] = useState(getLocalStorageProperty('SelectedFile', 'selectedFile') || 'front_torso.npy');
  const [viewMode, setViewMode] = useState(getLocalStorageProperty('ViewMode', 'viewMode') || 'shape'); //'shape', 'color','stitch_type'
  const [gridData, setGridData] = useState({
    shape: [[]],
    color: [[]],
    stitch_type: [[]]
  });
  const [changes, setChanges] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const LOCAL_STORAGE_KEY = `patternEditor-${patternId}-${selectedFile}-${viewMode}`;

  useEffect(() => {
    const fetchData = async () => {
      if (patternId && selectedFile) {
        setIsLoading(true);
        const viewModes = ['shape', 'color', 'stitch_type'];
        const newGridData = {};

        try {
          for (const mode of viewModes) {
            console.log('modes',mode)
            const localStorageKey = `patternEditor-${patternId}-${selectedFile}-${mode}`;
            const savedData = getLocalStorageProperty(localStorageKey, 'gridArray');

            if (savedData) {
              try {
                newGridData[mode] = JSON.parse(savedData);
                console.log(`Loaded ${mode} from local storage`, savedData);
              } catch (error) {
                console.error(`Failed to parse ${mode} data from local storage`, error);
              }
            } else {
              const fetchedData = await fetchPatternData({
                patternId,
                fileName: selectedFile,
                viewMode: mode,
              });
              console.log(`Fetched ${mode} from API`, fetchedData);
              newGridData[mode] = fetchedData;
            }
          }

          setGridData(newGridData);
          setChanges({});
        } catch (error) {
          console.error('Error fetching pattern data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, []);



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
        />
      ) : (
        <p>Strange Things Are Happening Here</p>
      )}
    </div>
  );
};

export default PatternView;