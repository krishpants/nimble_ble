import React, { useState } from 'react';

const ModeSelector = ({modes,selectedMode,setSelectedMode}) => {
    return (
        <div className='modeSelector'>
            {modes.map(mode => (
                <div 
                    key={mode} 
                    className={`modeLed ${selectedMode === mode ? 'on' : ''}`} 
                    onClick={() => setSelectedMode(mode)}
                >
                </div>
            ))}
        </div>
    );
};

export default ModeSelector;
