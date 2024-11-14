import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPatternDataByFile } from '../../services/data.service';
import { getLocalStorageProperty, updateLocalStorageProperty } from "../PatternEditor/utils.js";
import './StepGuide.css';
import { COLOR_MAPPING } from "../PatternEditor/config.js";

import testTorsoData from './test_torso.json';


const generateStepGuide = (shapeData, colorData, stitchData) => {
    let stepGuideArr = [];
    let chunkToRowMap = {};
    let chunkIndex = -1;

    for (let i = 0; i < shapeData.length; i++) {
        let stepGuideRow = [];
        let chunkTrace = null;
        console.log('calling  row', i, stitchData[i])

        for (let j = 0; j < shapeData[i].length; j++) {
            let square = {
                color: COLOR_MAPPING[colorData[i][j]],
                stitch_type: stitchData[i][j],
                stitch_shift: [],
                chunk: 0,
                row: i,
                col: j
            };

            if (chunkTrace === null) {
                chunkTrace = stitchData[i][j];
                chunkIndex += 1;
                square.chunk = chunkIndex;
                console.log('was null, chunk is ', chunkIndex)
                if (chunkToRowMap[chunkIndex] === undefined) {
                    chunkToRowMap[chunkIndex] = i;
                }
            } else if (chunkTrace !== stitchData[i][j]) {
                chunkTrace = stitchData[i][j];
                chunkIndex += 1;
                square.chunk = chunkIndex;

                if (chunkToRowMap[chunkIndex] === undefined) {
                    chunkToRowMap[chunkIndex] = i;
                }
            } else {
                square.chunk = chunkIndex;
            }

            // Determine if there's a stitch shift compared to the previous row
            square.stitch_shift = i > 0 && shapeData[i - 1][j] !== shapeData[i][j];

            stepGuideRow.push(square);
        }

        stepGuideArr.push(stepGuideRow);
    }
    console.log('stepGuideArr', stepGuideArr)
    console.log('chunkToRowMap', chunkToRowMap)
    return { stepGuideArr, chunkToRowMap };
};

const StepGuide = () => {
    const { patternId } = useParams();
    const [selectedFile, setSelectedFile] = useState(
        getLocalStorageProperty('SelectedFile', 'selectedFile') || 'front_torso.npy'
    );
    const [patternData, setPatternData] = useState(null);
    const [stepGuideArr, setStepGuideArr] = useState([[]]);
    const [chunkToRowMap, setChunkToRowMap] = useState({});
    const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
    const [currentRowIndex, setCurrentRowIndex] = useState(0);
    const [currentNumberOfSteps, setCurrentNumberOfSteps] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [scrollSpeed, setScrollSpeed] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // const fetchedData = await fetchPatternDataByFile({
                //     patternId,
                //     fileName: selectedFile,
                // });
                const fetchedData = testTorsoData
                console.log('fetchedData', fetchedData)
                setPatternData(fetchedData);
                const { stepGuideArr: guideArr, chunkToRowMap } = generateStepGuide(fetchedData.shape, fetchedData.color, fetchedData.stitch_type);
                console.log('guideArr', guideArr);
                setStepGuideArr(guideArr);
                setChunkToRowMap(chunkToRowMap);
                setCurrentNumberOfSteps(Object.keys(chunkToRowMap).length);
                console.log('current Number of Steps', Object.keys(chunkToRowMap).length);
            } catch (error) {
                console.error("Error fetching pattern data:", error);
            }
        };

        fetchData();
    }, [patternId, selectedFile]);

    // Handle Chunk Transitions
    const handleNextChunk = () => {
        setCurrentChunkIndex((prev) => {
            const newChunkIndex = Math.min(prev + 1, currentNumberOfSteps - 1);
            const newRowIndex = chunkToRowMap[newChunkIndex] || 0
            setCurrentRowIndex(newRowIndex);
            console.log(chunkToRowMap[newChunkIndex] || 0)
            return newChunkIndex;
        });
    };

   const handlePreviousChunk = () => {
        setCurrentChunkIndex((prev) => {
            const newChunkIndex = Math.max(prev - 1, 0);
            const newRowIndex = chunkToRowMap[newChunkIndex] || 0
            setCurrentRowIndex(newRowIndex);
            console.log(chunkToRowMap[newChunkIndex] || 0)
            return newChunkIndex;
        });
   };

    // Handle space bar for advancing to the next chunk
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.code === 'Space') {
                event.preventDefault();
                handleNextChunk();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [currentNumberOfSteps, chunkToRowMap]);

    // Handle automatic play through the chunks
    useEffect(() => {
        if (isPlaying) {
            const interval = setInterval(() => {
                handleNextChunk();

                // Stop playing when the last chunk is reached
                setCurrentChunkIndex((prev) => {
                    if (prev >= currentNumberOfSteps - 1) {
                        setIsPlaying(false);
                    }
                    return prev;
                });
            }, 1000 / scrollSpeed);
            return () => clearInterval(interval);
        }
    }, [isPlaying, scrollSpeed, currentNumberOfSteps]);

    const handlePlayToggle = () => setIsPlaying(!isPlaying);

    const handleScrollSpeedChange = (event) => setScrollSpeed(parseFloat(event.target.value));

    const handleFileChange = (event) => {
        setSelectedFile(event.target.value);
        updateLocalStorageProperty('SelectedFile', 'selectedFile', event.target.value);
    };

    if (!patternData) {
        return <div>Loading pattern data...</div>;
    }

    return (
        <div className="step-guide">
            <div className="sidebar">
                <h2>Controls</h2>
                <button
                    onClick={handlePreviousChunk}
                    disabled={currentChunkIndex === 0}
                >
                    Previous
                </button>
                <button
                    onClick={handleNextChunk}
                    disabled={currentChunkIndex === currentNumberOfSteps - 1}
                >
                    Next
                </button>
                <button onClick={handlePlayToggle}>{isPlaying ? 'Pause' : 'Play'}</button>
                <label>Scroll Speed:</label>
                <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={scrollSpeed}
                    onChange={handleScrollSpeedChange}
                />
                <div>
                    <label>File:</label>
                    <select value={selectedFile} onChange={handleFileChange}>
                        <option value="front_torso.npy">Front Torso</option>
                        <option value="back_torso.npy">Back Torso</option>
                        <option value="left_sleeve.npy">Left Sleeve</option>
                        <option value="right_sleeve.npy">Right Sleeve</option>
                    </select>
                </div>
            </div>
            <div className="pattern-steps">
                {stepGuideArr.map(
                    (row, rowIndex) => ( // Assuming we are focusing on the first row
                        <div
                            key={rowIndex}
                            className={`pattern-step ${currentChunkIndex === rowIndex ? 'active-step' : 'inactive-step'}`}
                            style={{
                                opacity: currentRowIndex === rowIndex ? 1 : 0.5 // Greys out inactive steps
                            }}
                        >
                            <h3>Row {rowIndex + 1}</h3>
                            <div className="grid-row">
                                {row.map((square, stitchIndex) => (
                                    <div
                                        key={stitchIndex}
                                        className="grid-cell"
                                        style={{
                                            backgroundColor: square.color,
                                            display: 'inline-block',
                                            padding: '48px',
                                            margin: '2px',
                                            border:
                                                square.chunk === currentChunkIndex
                                                    ? '2px solid blue'
                                                    : '1px solid black',
                                        }}
                                    >chunk {square.chunk} </div>
                                ))}
                            </div>

                            {/* Instruction Paragraph */}
                            {/*{currentRowIndex === rowIndex && (*/}
                            {/*    <p className="instructions">*/}
                            {/*        Instructions for Chunk {currentChunkIndex + 1}:{' '}*/}
                            {/*        {chunkList[currentChunkIndex]*/}
                            {/*            .map((square) => {*/}
                            {/*                const stitchType =*/}
                            {/*                    square.stitch_type === 0*/}
                            {/*                        ? 'Knit'*/}
                            {/*                        : square.stitch_type === 1*/}
                            {/*                        ? 'Purl'*/}
                            {/*                        : 'Unknown';*/}
                            {/*                return stitchType;*/}
                            {/*            })*/}
                            {/*            .join(', ')}*/}
                            {/*    </p>*/}
                            {/*)}*/}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default StepGuide;
