import React from 'react';
import StrokeRangeSlider from './controls/StrokeRangeSlider.jsx'
import StrokeSpeedSlider from './controls/StrokeSpeedSlider.jsx'
import StrokeRangeMaxMinSlider from './controls/StrokeRangeMaxMinSlider.jsx'
import StrokeRangeMinMaxSlider from './controls/StrokeRangeMinMaxSlider.jsx'
import StrokeSpeedRangeSlider from './controls/StrokeSpeedRangeSlider.jsx'
import DisplayScreen from './controls/DisplayScreen.jsx'
import AirButtons from './controls/AirButtons.jsx'
import PlayShuffleButtons from './controls/PlayShuffleButtons.jsx'
import DelayCapButtons from './controls/DelayCapButtons.jsx'


const ControllerMainWrapper = ({
  code,
  remoteRoomId,
  controllerJoined,
  inputCode,
  setInputCode,
  handleJoinRoom,
  versionMismatch,
  COMPATABLE_HW_VERSION,
  isDeviceConnected,
  connecting,
  handleConnect,
  shuffleMode,
  setShuffleMode,
  minPositionLower,
  setMinPositionLower,
  maxPositionUpper,
  setMaxPositionUpper,
  minPositionUpper,
  setMinPositionUpper,
  maxPositionLower,
  setMaxPositionLower,
  running,
  setRunning,
  runStage,
  minLoopCap,
  maxLoopCap,
  loopCap,
  loopCount,
  minSpeed,
  maxSpeed,
  speed,
  setSpeed,
  setMinSpeed,
  setMaxSpeed,
  minPosition,
  maxPosition,
  minLoopDelay,
  maxLoopDelay,
  loopDelay,
  setLoopDelay,
  setLoopCap,
  setMinLoopDelay,
  setMaxLoopDelay,
  setMinLoopCap,
  setMaxLoopCap,
  airIn,
  airOut,
  setAirIn,
  setAirOut
}) => {
	return(
		<div className={`wrapper ${controllerJoined && !remoteRoomId && 'controlled'}`}>
            {versionMismatch ? (
              <div className='version_error'>Hardware Version does not match v{COMPATABLE_HW_VERSION}, flash latest version to your Nimble Control Module</div>
            ) : !remoteRoomId && !isDeviceConnected() ? (
              <div className='connect_wrapper'>
                <button className={`connect_button ${connecting && 'connecting'}`} onClick={handleConnect}></button>      
                <div>or...</div>
                <div className='remote_connect'>
                  <input 
                      type="text" 
                      value={inputCode} 
                      onChange={(e) => setInputCode(e.target.value)} 
                      placeholder="Code"
                  />
                  <button onClick={handleJoinRoom}>Remote Connect</button>
                </div>
              </div>

            ) : (
              <>
              <div className='upper-wrapper'>
                {!shuffleMode ? (
                  <StrokeRangeSlider 
                    minPosition={minPositionLower} 
                    setMinPosition={setMinPositionLower}
                    maxPosition={maxPositionUpper}
                    setMaxPosition={setMaxPositionUpper}
                  />
                  ) : (
                  <>
                  <StrokeRangeMaxMinSlider 
                    minPosition={minPositionLower} 
                    setMinPosition={setMinPositionLower}
                    minPositionUpper={minPositionUpper}
                    setMinPositionUpper={setMinPositionUpper}
                    maxPositionUpper={maxPositionUpper}
                    setMaxPositionUpper={setMaxPositionUpper}
                  />
                  <StrokeRangeMinMaxSlider 
                    maxPosition={maxPositionUpper} 
                    setMaxPosition={setMaxPositionUpper}
                    maxPositionLower={maxPositionLower}
                    setMaxPositionLower={setMaxPositionLower}
                    minPositionLower={minPositionLower}
                    setMinPositionLower={setMinPositionLower}
                  />
                  </>
                )}
                <DisplayScreen
                  code={code}
                  remoteRoomId={remoteRoomId}
                  running={running}
                  runStage={runStage}
                  shuffleMode={shuffleMode}
                  minLoopCap={minLoopCap}
                  maxLoopCap={maxLoopCap}
                  loopCap={loopCap}
                  loopCount={loopCount}
                  minSpeed={minSpeed}
                  maxSpeed={maxSpeed}
                  speed={speed}
                  minPositionLower={minPositionLower}
                  minPositionUpper={minPositionUpper}
                  maxPositionLower={maxPositionLower}
                  maxPositionUpper={maxPositionUpper}
                  minPosition={minPosition}
                  maxPosition={maxPosition}
                  minLoopDelay={minLoopDelay}
                  maxLoopDelay={maxLoopDelay}
                  loopDelay={loopDelay}
                  airIn={airIn}
                  airOut={airOut}
                />
                {!shuffleMode ? (
                    <StrokeSpeedSlider 
                      maxSpeed={maxSpeed}
                      setMaxSpeed={setMaxSpeed}
                    />
                  ) : (
                  <>
                    <StrokeSpeedRangeSlider 
                      maxSpeed={maxSpeed}
                      setMaxSpeed={setMaxSpeed}
                      minSpeed={minSpeed}
                      setMinSpeed={setMinSpeed}
                    />
                  </>
                )}
              </div>
              <div className='lower-wrapper'>
                <PlayShuffleButtons 
                  running={running}
                  setRunning={setRunning}
                  shuffleMode={shuffleMode}
                  setShuffleMode={setShuffleMode}
                  controllerJoined={controllerJoined}
                  remoteRoomId={remoteRoomId}
                />
                <DelayCapButtons
                  shuffleMode={shuffleMode}
                  loopDelay={loopDelay}
                  setLoopDelay={setLoopDelay}
                  loopCap={loopCap}
                  setLoopCap={setLoopCap}
                  minLoopDelay={minLoopDelay}
                  setMinLoopDelay={setMinLoopDelay}
                  maxLoopDelay={maxLoopDelay}
                  setMaxLoopDelay={setMaxLoopDelay}
                  minLoopCap={minLoopCap}
                  setMinLoopCap={setMinLoopCap}
                  maxLoopCap={maxLoopCap}
                  setMaxLoopCap={setMaxLoopCap}
                />

                <AirButtons 
                  airIn={airIn}
                  airOut={airOut}
                  setAirIn={setAirIn}
                  setAirOut={setAirOut}
                />
              </div>
              </>
            )}
        </div>
)}

export default ControllerMainWrapper;