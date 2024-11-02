// config.js
export const COLOR_MAPPING = {
  0: '#00000000', // Hashed
  1: '#ffffff', // White
  2: '#000000', // Black
  3: '#d722c5', // Pink
};

export const NUMBER_MAPPING = {
    '#00000000': 0, // Hashed
    '#ffffff': 1, // White
    '#000000': 2, // Black
    '#d722c5': 3, // Pink
}

export const LINE_STYLES = {
  "dot-cross": ['•', '✕'],
  "dot-2cross": ['•', '✕', '✕'],
  "regular": [],
  "custom": []
};

export const VALUE_OUTLINE_MAPPING = { // Hashed
  2: '2px solid rgba(0, 0, 0, 1)', // Black
  3: '1px solid rgba(215, 34, 197, 1)', // Pink
}

export const COLOR_OUTLINE_MAPPING = { // Hashed
  '#000000': '2px solid rgba(0, 0, 0, 1)', // Black
  '#d722c5': '1px solid rgba(215, 34, 197, 1)', // Pink
}