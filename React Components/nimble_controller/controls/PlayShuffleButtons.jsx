import React from 'react';

const PlayShuffleButtons = ({controllerJoined,remoteRoomId,running,setRunning,selectedMode,handleCycleMode}) => {
	return(
        <div className='play_pause_wrapper'>
          {running ? (
            <button 
                onClick={() => {
                    setRunning(false);
                }} 
                className={`playPauseButton pause ${selectedMode}`}
            >
                <i className="icofont-ui-pause"></i>
            </button>
          ) : (
            <button 
                onClick={() => {
                    setRunning(true);
                }} 
                className={`playPauseButton play ${selectedMode}`}
            >
                <i className="icofont-ui-play"></i>
            </button>
          )}
          {controllerJoined || remoteRoomId ? (null) : (
            <button 
                onClick={handleCycleMode} 
                className={`modeButton ${selectedMode}`}
            >
            </button>
        )}
        </div>
)}

export default PlayShuffleButtons;