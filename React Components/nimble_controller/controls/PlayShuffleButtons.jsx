import React from 'react';

const PlayShuffleButtons = ({controllerJoined,remoteRoomId,running,setRunning,shuffleMode,setShuffleMode}) => {
	return(
        <div className='play_pause_wrapper'>
          {running ? (
            <button 
                onClick={() => {
                    setRunning(false);
                }} 
                className={`playPauseButton pause`}
            >
                <i className="icofont-ui-pause"></i>
            </button>
          ) : (
            <button 
                onClick={() => {
                    setRunning(true);
                }} 
                className={`playPauseButton play`}
            >
                <i className="icofont-ui-play"></i>
            </button>
          )}
          {controllerJoined || remoteRoomId ? (null) : (
            <button 
                onClick={() => {
                    setShuffleMode(!shuffleMode);
                }} 
                className={`shuffleModeButton ${shuffleMode && "active"}`}
            >
                <i className="icofont-random"></i>
            </button>
        )}
        </div>
)}

export default PlayShuffleButtons;