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
import PercentageBar from './controls/PercentageBar.jsx'
import ModeSelector from './controls/ModeSelector.jsx'


const ControllerMainWrapper = ({
  showInfo,
  setShowInfo,
  code,
  encoderValue,
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
  handleCycleMode,
  modes,
  selectedMode,
  setSelectedMode,
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
  setAirOut,
  totalStrokes,
  cacheValues,
  rampInterval,
  setRampInterval,
  connectionIp,
  setConnectionIp,
  eomSpeed,
  connectToEom,
  eomConnecting,
  eomConnected,
  eomArousal
}) => {
	return(
		<div className={`wrapper ${controllerJoined && !remoteRoomId && 'controlled'} ${showInfo && 'show_info'}`}>
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
                <div className='version_info'>HW: v{COMPATABLE_HW_VERSION}</div>
              </div>

            ) : (
              <>
              <ModeSelector modes={modes} selectedMode={selectedMode} setSelectedMode={setSelectedMode} />
              {selectedMode == "shuffle" ? (<PercentageBar value={encoderValue} />) : (null)}
              <div className='upper-wrapper'>
                {selectedMode != "shuffle" ? (
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
                  selectedMode={selectedMode}
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
                  totalStrokes={totalStrokes}
                  rampInterval={rampInterval}
                  connectionIp={connectionIp}
                  setConnectionIp={setConnectionIp}
                  eomSpeed={eomSpeed}
                  eomConnected={eomConnected}
                  eomArousal={eomArousal}
                />
                {selectedMode != "shuffle" ? (
                    <StrokeSpeedSlider 
                      maxSpeed={maxSpeed}
                      setMaxSpeed={setMaxSpeed}
                      selectedMode={selectedMode}
                      speed={speed}
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
                  selectedMode={selectedMode}
                  handleCycleMode={handleCycleMode}
                  controllerJoined={controllerJoined}
                  remoteRoomId={remoteRoomId}
                />
                <DelayCapButtons
                  selectedMode={selectedMode}
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
                  cacheValues={cacheValues}
                  rampInterval={rampInterval}
                  setRampInterval={setRampInterval}
                  connectToEom={connectToEom}
                  eomConnecting={eomConnecting}
                  eomConnected={eomConnected}
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