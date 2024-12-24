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

const PatternView = () => {
  const { patternId } = useParams(); // Get the pattern ID from the URL
  const [selectedSection, setSelectedSection] = useState(getLocalStorageProperty('SelectedSection', 'selectedSection') || 'front_torso');
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

  const LOCAL_STORAGE_KEY = `patternEditor-${patternId}-${selectedSection}-${viewMode}`;
  const colorMapper = useRef(new ColorMapper(`patternEditor-${patternId}-${selectedSection}-color`)).current;


  useEffect(() => {
    const fetchData = async () => {
      if (patternId && selectedSection) {
        setIsLoading(true);
        const viewModes = ['shape', 'color', 'stitch_type'];
        const newGridData = {};
        const newChanges = {};

        const noneLocalDataExists = viewModes.every((mode) => {
          const localStorageKey = `patternEditor-${patternId}-${selectedSection}-${mode}`;
          const localStorageData = getLocalStorageProperty(localStorageKey, 'gridArray');
          return localStorageData == null;
        });

        try {
          if (noneLocalDataExists) {
            //console.log('No data current exists in local storage, fetching all data from api');
            const fetchedData = await fetchPatternDataByFile({
              patternId,
              section: selectedSection
            });
            //console.log('Fetched data', fetchedData);
            for (const mode of viewModes) {
              newGridData[mode] = fetchedData[mode]
              newChanges[mode] = {};
            }
            colorMapper.updateValuesFromBackend(fetchedData['color_map'])
          } else {
            for (const mode of viewModes) {
              //console.log('modes', mode)
              const localStorageKey = `patternEditor-${patternId}-${selectedSection}-${mode}`;
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
                const fetchedData = await fetchPatternDataByMode({
                  patternId,
                  section: selectedSection,
                  viewMode: mode,
                });
                newGridData[mode] = fetchedData[mode];
                newChanges[mode] = {};
                if (mode === 'color') {
                  colorMapper.updateValuesFromBackend(fetchedData['color_map'])
                }
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
  }, [selectedSection, patternId, setGridData]);



  // Ensure the view mode and selected file updates are captured correctly.
  useEffect(() => {
    updateLocalStorageProperty('SelectedSection', 'selectedSection', selectedSection);
    updateLocalStorageProperty('ViewMode', 'viewMode', viewMode);
  }, [selectedSection, viewMode]);

  const handleFileChange = (event) => {
    setSelectedSection(event.target.value);
  };

  const handleViewModeChange = (event) => {
    setViewMode(event.target.value);
  };

  const handleSaveChanges = async () => {
    try {
      // Prepare the data to save
      const dataToSave = {
        patternId,
        section: selectedSection,
        viewMode,
        changes: changes[viewMode] || {},
      };

      if (viewMode === 'color') {
        dataToSave.colorMap = {
          idToColorArray: colorMapper.idToColorArray,
        };
      }


      const status_code = await savePatternChanges(dataToSave);
      if (status_code === 204) {
        alert('No changes needed to be made');
      } else if (status_code === 200) {
        alert('Changes saved successfully!');
      } else {
        alert(`Unexpected status code: ${status_code}`);
      }
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
    // console.log('handleGridUpdate called...', updatedGridData);
  };


  return (
    <div className="pattern-view">
      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : gridData ? (
        <PatternGrid
          key={`${selectedSection}`}
          gridData={gridData}
          selectedSection={selectedSection}
          viewMode={viewMode}
          handleSave={handleSaveChanges}
          LOCAL_STORAGE_KEY={LOCAL_STORAGE_KEY}
          handleFileChange={handleFileChange}
          handleViewModeChange={handleViewModeChange}
          colorMapper={colorMapper}
          onGridUpdate={handleGridUpdate}
        />
      ) : (
          <div>
            <p>Strange Things Are Happening Here</p>
            <p>There be dragons</p>
          </div>
      )}
    </div>
  );
};

export default PatternView;