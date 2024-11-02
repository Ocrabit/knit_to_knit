// utils.js
export const getCSSVariable = (variable) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable);
  return value ? parseFloat(value) : 0;
};

export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Updates a specific property in the localStorage under a central key.
 * If the key does not exist, it creates it.
 * @param {string} key - The localStorage key where the object is stored.
 * @param {string} property - The property name to update.
 * @param {*} value - The value to store in the property.
 */
export const updateLocalStorageProperty = (key, property, value) => {
    let existingData = localStorage.getItem(key);
    existingData = existingData ? JSON.parse(existingData) : {};
    existingData[property] = value;
    localStorage.setItem(key, JSON.stringify(existingData));
};

/**
 * Retrieves a specific property from localStorage under a central key.
 * @param {string} key - The localStorage key where the object is stored.
 * @param {string} property - The property name to retrieve.
 * @returns {*} - The retrieved value, or undefined if the property doesn't exist.
 */
export const getLocalStorageProperty = (key, property) => {
  const existingData = localStorage.getItem(key);
  if (!existingData) return undefined;
  const parsedData = JSON.parse(existingData);
  return parsedData[property];
};

export const getRemSize = () => {
  return parseFloat(getComputedStyle(document.documentElement).fontSize);
};

export class ColorMapper {
  constructor() {
    this.colorToIdMap = {};
    this.idToColorArray = [];
    this.colorIdCounter = 0;
  }

  // Convert color to a unique integer ID
  getColorId(color) {
    // If color not yet mapped, add it to the maps
    if (!(color in this.colorToIdMap)) {
      this.colorToIdMap[color] = this.colorIdCounter;
      this.idToColorArray[this.colorIdCounter] = color;
      this.colorIdCounter++;
    }
    return this.colorToIdMap[color];
  }

  // Retrieve color from the ID
  getColorFromId(id) {
    return this.idToColorArray[id];
  }

  // Map a 2D array of colors to a 2D array of IDs
  mapColorsToIds(colorArray) {
    return colorArray.map(row => row.map(color => this.getColorId(color)));
  }

  // Map a 2D array of IDs back to a 2D array of colors
  mapIdsToColors(idArray) {
    return idArray.map(row => row.map(id => this.getColorFromId(id)));
  }
}