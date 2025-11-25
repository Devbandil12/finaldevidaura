// src/Components/SsoCallbackLoader.jsx
import React from 'react';
import { DotLoader } from 'react-spinners'; // Using DotLoader as an example

const SsoCallbackLoader = ({ text = "Finalizing sign-in, please wait..." }) => {
    // Define a clear, high-contrast color (e.g., Indigo/Purple)
    const spinnerColor = "#4f46e5"; 
    
    return (
        // Ensures the component covers the entire viewport (100vh)
        // and sets a clear, visible background color (#f9fafb is light grey).
        <div 
            className="flex flex-col items-center justify-center w-full"
            style={{ 
                minHeight: '100vh', 
                backgroundColor: '#f9fafb',
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 9999, // Ensure it's on top of everything
            }}
        >
            <DotLoader 
                color={spinnerColor} 
                loading={true} 
                size={60} // Size in pixels
                aria-label="Loading Spinner" 
                data-testid="loader"
                className="mb-4"
            />
            <p className="text-xl font-semibold text-gray-700 mt-4">{text}</p>
        </div>
    );
};

export default SsoCallbackLoader;