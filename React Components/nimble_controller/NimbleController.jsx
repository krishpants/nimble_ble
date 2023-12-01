import React, { useState,useEffect,useRef } from 'react';
import StrokeRangeSlider from './StrokeRangeSlider.jsx'
import StrokeSpeedSlider from './StrokeSpeedSlider.jsx'
import StrokeRangeMaxMinSlider from './StrokeRangeMaxMinSlider.jsx'
import StrokeRangeMinMaxSlider from './StrokeRangeMinMaxSlider.jsx'
import StrokeSpeedRangeSlider from './StrokeSpeedRangeSlider.jsx'
import ConnectBluetooth from './BluetoothService.jsx'





const NimbleController = () => {

    let COMPATABLE_HW_VERSION = "0.02";

    const [bleCharacteristic, setBleCharacteristic] = useState(null);
    const [bleDevice, setBleDevice] = useState(null);
    const [connecting, setConnecting] = useState(null);
    const [versionMismatch, setVersionMismatch] = useState(false);
    const [holdUpdate, setHoldUpdate] = useState(false);

    //ESP STATE VARIABLES

    const [running, setRunning] = useState(false);
    const [speed, setSpeed] = useState(50);
    const [minPosition, setMinPosition] = useState(-500);
    const [maxPosition, setMaxPosition] = useState(500);
    const [loopCap, setLoopCap] = useState(15);
    const [loopDelay, setLoopDelay] = useState(5000);
    const [airIn, setAirIn] = useState(false);
    const [airOut, setAirOut] = useState(false);

    // Fed Back Variables
    const [loopCount, setLoopCount] = useState(0);
    const [runStage, setRunStage] = useState(0);

    // Shuffle Mode Control Variables
    const [shuffleMode, setShuffleMode] = useState(false);
    const [maxSpeed, setMaxSpeed] = useState(speed);
    const [minSpeed, setMinSpeed] = useState(speed-30);

    const [minPositionLower, setMinPositionLower] = useState(minPosition);
    const [minPositionUpper, setMinPositionUpper] = useState(null);
    const [maxPositionLower, setMaxPositionLower] = useState(null);
    const [maxPositionUpper, setMaxPositionUpper] = useState(maxPosition);
    

    const [minLoopDelay, setMinLoopDelay] = useState(0);
    const [maxLoopDelay, setMaxLoopDelay] = useState(loopDelay);

    const [minLoopCap, setMinLoopCap] = useState(5);
    const [maxLoopCap, setMaxLoopCap] = useState(loopCap);

    

    useEffect(() => {
      if (runStage == 4 && shuffleMode){
        shuffleVariables();
      }
    }, [runStage]);   

    useEffect(() => {
      setSpeed(maxSpeed);
    }, [maxSpeed]);

    useEffect(() => {
      setMinPosition(minPositionLower);
      setMaxPosition(maxPositionUpper);
      if (minPositionLower > minPositionUpper){
        setMinPositionUpper(minPositionLower)
      }
      if (maxPositionUpper < maxPositionLower){
        setMaxPositionLower(maxPositionUpper)
      }
      if (minPositionLower > maxPositionLower){
        setMaxPositionLower(minPositionLower)
      }
      if (maxPositionUpper < minPositionUpper){
        setMinPositionUpper(maxPositionUpper)
      }
    }, [minPositionLower,maxPositionUpper]);

    useEffect(() => {
      if (shuffleMode){
        setMaxPositionLower(Math.max(maxPositionUpper-300,minPositionLower));
        setMinPositionUpper(Math.min(minPositionLower+300,maxPositionUpper));        
      }
    }, [shuffleMode]);









    const throttleTimerRef = useRef(null);
    const lastInvocationTimeRef = useRef(Date.now());
    const debounceTimerRef = useRef(null);

    const executeAction = () => {
      updateCommandString();
    };

    const executeThrottledAndDebouncedAction = () => {
      const now = Date.now();

      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }

      if (now - lastInvocationTimeRef.current >= 300) {
        executeAction();
        lastInvocationTimeRef.current = now;
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        executeAction();
        debounceTimerRef.current = null;
      }, 300);
    };

    useEffect(() => {
      if (bleCharacteristic && !holdUpdate) {
        executeThrottledAndDebouncedAction();
      }

      return () => {
        if (throttleTimerRef.current) {
          clearTimeout(throttleTimerRef.current);
        }
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, [running, speed, minPosition, maxPosition, loopCap, loopDelay, airIn, airOut, bleCharacteristic, holdUpdate]);




    function isDeviceConnected() {
        return bleDevice && bleDevice.gatt.connected;
    }

    async function updateCommandString() {
        if (!isDeviceConnected() || !bleCharacteristic) {
            console.error('Device is not connected or characteristic not found.');
            return;
        }

        try {
            const serializedData = `${running?(1):(0)},${speed},${minPosition},${maxPosition},${loopCap},${loopDelay},${airIn?(1):(0)},${airOut?(1):(0)}`;
            const commandBuffer = new TextEncoder().encode(serializedData);
            await bleCharacteristic.writeValue(commandBuffer);
        } catch (error) {
            console.error('Error in sending Bluetooth command:', error);
        }
    }

    const handleConnect = () => {
      ConnectBluetooth(
        setConnecting, 
        setBleCharacteristic, 
        setBleDevice, 
        setVersionMismatch, 
        setRunStage, 
        setLoopCount, 
        COMPATABLE_HW_VERSION
      );
    };



    const cRrngV = (value) => {
      const vl = parseInt(value)
      const minInput = -1000;
      const maxInput = 1000;
      const minOutput = 0;
      const maxOutput = 100;
      const clampedValue = Math.max(minInput, Math.min(maxInput, vl));
      const cv = ((clampedValue - minInput) / (maxInput - minInput)) * (maxOutput - minOutput) + minOutput;
      return Math.floor(cv);
    }

    const shuffleVariables = () => {
      setHoldUpdate(true);
      setSpeed(getRandomBetween(minSpeed,maxSpeed))
      setLoopDelay(getRandomBetween(minLoopDelay,maxLoopDelay))
      setLoopCap(getRandomBetween(minLoopCap,maxLoopCap))
      const mm_vals = [getRandomBetween(minPositionLower,minPositionUpper),getRandomBetween(maxPositionLower,maxPositionUpper)]
      setMinPosition(Math.min(...mm_vals))
      setMaxPosition(Math.max(...mm_vals))
      setHoldUpdate(false);
    }

    const getRandomBetween = (min, max) => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }


    const DisplayScreen = () => {
      return(
        <div className='screen'>
          <div className={`upper ${running && 'running'} ${runStage === 4 && 'paused'}`}>
            {runStage === 2 ? ('Nimble Is Stroking...') : runStage === 4 ? ("Nimble Is Paused...") : ('Nimble Is Stopped...')}
          </div>
          {shuffleMode ? (
          <div className='lower'>
            <div>Shufle...</div>
            <div className={`${runStage === 2 && 'active'}`}>Strokes: {minLoopCap} <i className="icofont-long-arrow-right"></i> {maxLoopCap} <span>{runStage === 2 ? (Math.min(loopCap,loopCap-loopCount+1)):(0)}/{loopCap}</span></div>
            <div>Stroke Speed: {minSpeed} <i className="icofont-long-arrow-right"></i> {maxSpeed} <span>{speed}%</span></div>
            <div>Stroke Range: {cRrngV(minPositionLower)} <i className="icofont-long-arrow-right"></i> {cRrngV(minPositionUpper)} / {cRrngV(maxPositionLower)} <i className="icofont-long-arrow-right"></i> {cRrngV(maxPositionUpper)}<span>{cRrngV(minPosition)}<i className="icofont-long-arrow-right"></i>{cRrngV(maxPosition)}</span></div>
            <div className={`${runStage === 4 && 'active'}`}>Pause Time: {minLoopDelay/1000}<i className="icofont-long-arrow-right"></i>{maxLoopDelay/1000} seconds <span>{loopDelay/1000}s</span></div>
          </div>
            ) : (
          <div className='lower'>
            <div>Sequence...</div>
            <div className={`${runStage === 2 && 'active'}`}>Strokes: <span>{Math.min(loopCap,loopCap-loopCount+1)}/{loopCap}</span></div>
            <div>Stroke Speed: <span>{speed}%</span></div>
            <div>Stroke Range: <span>{cRrngV(minPosition)} <i className="icofont-long-arrow-right"></i> {cRrngV(maxPosition)}</span></div>
            <div className={`${runStage === 4 && 'active'}`}>Pause Time: <span>{loopDelay/1000} seconds</span></div>
          </div>
          )}
          <div className='info'>
            {airIn ? (<div><i className="icofont-warning"></i> Slip out risk: Longer Strokes</div>) : (null)}
            {airOut ? (<div><i className="icofont-info-circle"></i> Slip out risk reducing: Increasing Suction</div>) : (null)}
          </div>
        </div>   
    )}

    return (
        <div id='NimbleController'>
            <div className='wrapper'>
            {versionMismatch ? (
              <div className='version_error'>Hardware Version does not match v{COMPATABLE_HW_VERSION}, flash latest version to your Nimble Control Module</div>
            ) : !isDeviceConnected() ? (
              <button className={`connect_button ${connecting && 'connecting'}`} onClick={handleConnect}></button>
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
                <DisplayScreen />
                {!shuffleMode ? (
                    <StrokeSpeedSlider 
                      speed={maxSpeed}
                      setSpeed={setMaxSpeed}
                    />
                  ) : (
                  <>
                    <StrokeSpeedRangeSlider 
                      speed={maxSpeed}
                      setSpeed={setMaxSpeed}
                      minSpeed={minSpeed}
                      setMinSpeed={setMinSpeed}
                    />
                  </>
                )}
              </div>
              <div className='lower-wrapper'>
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
                    <button 
                        onClick={() => {
                            setShuffleMode(!shuffleMode);
                        }} 
                        className={`shuffleModeButton ${shuffleMode && "active"}`}
                    >
                        <i className="icofont-random"></i>
                    </button>
                </div>
                {!shuffleMode ? (
                  <div className='inputsWrapper'>
                      <input className='delay' min='0' type='number' value={loopDelay/1000} onChange={e => setLoopDelay(e.target.value * 1000)}/>
                      <input className='strokes' min='0' type='number' value={loopCap} onChange={e => setLoopCap(e.target.value * 1)}/>
                  </div>
                  ) : (
                  <div className='inputsWrapper'>
                    <div className='inputPair delay'>
                      <input type='number' min='0' value={minLoopDelay/1000} onChange={e => setMinLoopDelay(e.target.value * 1000)}/>
                      <input type='number' min='0' value={maxLoopDelay/1000} onChange={e => setMaxLoopDelay(e.target.value * 1000)}/>
                    </div>
                    <div className='inputPair strokes'>
                      <input type='number' min='0' value={minLoopCap} onChange={e => setMinLoopCap(e.target.value * 1)}/>
                      <input type='number' min='0' value={maxLoopCap} onChange={e => setMaxLoopCap(e.target.value * 1)}/>
                    </div>
                  </div>
                )}
                <div className='air_button_wrapper'>
                  <button 
                      onMouseDown={() => {
                          setAirIn(true);
                      }} 
                      onMouseUp={() => {
                          setAirIn(false);
                      }}
                      className={`airInButton ${airIn ? 'active' : ''}`}
                  >
                      <i className="icofont-long-arrow-down"></i>
                  </button>
                  <button 
                      onMouseDown={() => {
                          setAirOut(true);
                      }} 
                      onMouseUp={() => {
                          setAirOut(false);
                      }}
                      className={`airOutButton ${airOut ? 'active' : ''}`}
                  >
                      <i className="icofont-long-arrow-up"></i>
                  </button>
                </div>
              </div>
              </>
            )}
            </div>
        </div>
    );
};

export default NimbleController;
