import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkBackground, setIsDarkBackground] = useState(false);
  const [isEditorPage, setIsEditorPage] = useState(false);

  return (
    <ThemeContext.Provider value={{ isDarkBackground, setIsDarkBackground, isEditorPage, setIsEditorPage }}>
      {children}
    </ThemeContext.Provider>
  );
};
