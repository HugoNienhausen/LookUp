import React, { createContext, useContext, useState } from 'react';

const ToolboxContext = createContext();

export const useToolbox = () => {
    const context = useContext(ToolboxContext);
    if (!context) {
        throw new Error('useToolbox must be used within a ToolboxProvider');
    }
    return context;
};

export const ToolboxProvider = ({ children }) => {
    const [selectedTool, setSelectedTool] = useState('brush');
    const [brushSize, setBrushSize] = useState(12);
    const [brushOpacity, setBrushOpacity] = useState(0.8);

    const value = {
        selectedTool,
        setSelectedTool,
        brushSize,
        setBrushSize,
        brushOpacity,
        setBrushOpacity
    };

    return (
        <ToolboxContext.Provider value={value}>
            {children}
        </ToolboxContext.Provider>
    );
};
