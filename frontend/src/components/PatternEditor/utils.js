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