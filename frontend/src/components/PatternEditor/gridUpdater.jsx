// gridUpdater.jsx

// Function to update the shape grid
export function updateShapeGrid(prevGrid, rowIndex, colIndex, size, drawActive, eraseActive, selectedColor, selectedMarking) {
  const newGrid = [...prevGrid];
  const halfSize = Math.floor(size / 2);

  for (let i = -halfSize; i <= halfSize; i++) {
    for (let j = -halfSize; j <= halfSize; j++) {
      const newRow = rowIndex + i;
      const newCol = colIndex + j;
      if (newRow >= 0 && newRow < newGrid.length && newCol >= 0 && newCol < newGrid[0].length) {
        if (newGrid[newRow] === prevGrid[newRow]) {
          newGrid[newRow] = [...prevGrid[newRow]];
        }
        const square = newGrid[newRow][newCol];
        newGrid[newRow][newCol] = {
          ...square,
          color: eraseActive ? '#00000000' : selectedColor,
          marking: eraseActive ? 'none' : selectedMarking,
        };
      }
    }
  }
  return newGrid;
}

// Function to update the color grid
export function updateColorGrid(prevGrid, rowIndex, colIndex, size, drawActive, eraseActive, selectedColor, selectedMarking) {
  const newGrid = [...prevGrid];
  const halfSize = Math.floor(size / 2);

  for (let i = -halfSize; i <= halfSize; i++) {
    for (let j = -halfSize; j <= halfSize; j++) {
      const newRow = rowIndex + i;
      const newCol = colIndex + j;
      if (newRow >= 0 && newRow < newGrid.length && newCol >= 0 && newCol < newGrid[0].length) {
        if (newGrid[newRow] === prevGrid[newRow]) {
          newGrid[newRow] = [...prevGrid[newRow]];
        }
        const square = newGrid[newRow][newCol];
        if (square.isHashed) continue;
        newGrid[newRow][newCol] = {
          ...square,
          color: eraseActive ? '#ffffff' : selectedColor,
          marking: eraseActive ? 'none' : selectedMarking,
        };
      }
    }
  }
  return newGrid;
}

// Function to update the stitch type grid
export function updateStitchTypeGrid(prevGrid, rowIndex, colIndex, size, selectedStitchType) {
  const newGrid = [...prevGrid];
  const halfSize = Math.floor(size / 2);

  for (let i = -halfSize; i <= halfSize; i++) {
    for (let j = -halfSize; j <= halfSize; j++) {
      const newRow = rowIndex + i;
      const newCol = colIndex + j;
      if (newRow >= 0 && newRow < newGrid.length && newCol >= 0 && newCol < newGrid[0].length) {
        if (newGrid[newRow] === prevGrid[newRow]) {
          newGrid[newRow] = [...prevGrid[newRow]];
        }
        newGrid[newRow][newCol] = {
          ...newGrid[newRow][newCol],
          stitchType: selectedStitchType,
        };
      }
    }
  }
  return newGrid;
}
