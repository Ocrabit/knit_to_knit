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
  const [gridData, setGridData] = useState(null);
  const [changes, setChanges] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const LOCAL_STORAGE_KEY = `patternEditor-${patternId}-${selectedFile}-${viewMode}`;

  useEffect(() => {
    const fetchData = async () => {
      if (patternId && selectedFile && viewMode) {
        console.log("Local Storage Key:", LOCAL_STORAGE_KEY);
        const savedData = getLocalStorageProperty(LOCAL_STORAGE_KEY, 'gridArray')
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            setGridData(parsedData);
            console.log("Loaded from local storage", savedData);
            return;
          } catch (error) {
            console.error("Failed to parse saved data from local storage", error);
          }
        }

        setIsLoading(true);
        try {
          const data = await fetchPatternData({
            patternId,
            fileName: selectedFile,
            viewMode,
          });
          console.log('Fetched from API', data);
          setGridData(data);
          setChanges({});
        } catch (error) {
          console.error('Error fetching pattern file:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [patternId, selectedFile, viewMode, LOCAL_STORAGE_KEY]);


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
        changes,
      });
      alert('Changes saved successfully!');
      setChanges({});
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
            key={`${selectedFile}-${viewMode}`}
          gridData={gridData}
          selectedFile={selectedFile}
          viewMode={viewMode}
          handleSave={handleSaveChanges}
          LOCAL_STORAGE_KEY={LOCAL_STORAGE_KEY}
          handleFileChange={handleFileChange}
          handleViewModeChange={handleViewModeChange}
        />
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default PatternView;