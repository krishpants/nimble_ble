import React, { useState,useEffect } from 'react';
import Slider from 'react-slider';
import ReactSlider from 'react-slider';
import styled from 'styled-components';

const RangeSlider = styled(ReactSlider)`
    width: 50px; // Adjusted for vertical orientation
    height: 100%; // You can set this to the desired height
    .thumb-0, .thumb-1 {
        appearance: none;
        width: 80px; // Thumb width
        height: 15px; // Thumb height
        background: #436985;
        border-radius: 3px;
        border: 1px solid #729ebe;
        cursor: grab;
    }
    .track-0,.track-2 {
        top: 0;
        bottom: 0;
        width: 30px;
        background: #0a1218;
        margin-left: 25px;
        border-radius: 5px;
    }
    .track-1 {
        top: 0;
        bottom: 0;
        width: 30px;
        margin-left: 25px;
        background: #db8a50;
        border-radius: 5px;
    }
`;

const SpeedSlider = styled(ReactSlider)`
    width: 50px; // Adjusted for vertical orientation
    height: 100%; // You can set this to the desired height
    .thumb-0, .thumb-1 {
        appearance: none;
        width: 80px; // Thumb width
        height: 30px; // Thumb height
        background: #436985;
        border-radius: 3px;
        border: 1px solid #729ebe;
        cursor: grab;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #c4d1ec;

    }
    .track-1 {
        top: 0;
        bottom: 0;
        width: 30px;
        background: #0a1218;
        margin-left: 25px;
        border-radius: 5px;
    }
    .track-0 {
        top: 0;
        bottom: 0;
        width: 30px;
        margin-left: 25px;
        background: #4c81ed;
        border-radius: 5px;
    }
`;

const NimbleController = () => {

    let COMPATABLE_HW_VERSION = "0.02";

    const [bleCharacteristic, setBleCharacteristic] = useState(null);
    const [bleDevice, setBleDevice] = useState(null);
    const [connecting, setConnecting] = useState(null);
    const [versionMismatch, setVersionMismatch] = useState(false);

    //ESP STATE VARIABLES

    const [running, setRunning] = useState(false);
    const [speed, setSpeed] = useState(50);
    const [minPosition, setMinPosition] = useState(-500);
    const [maxPosition, setMaxPosition] = useState(500);
    const [loopCap, setLoopCap] = useState(10);
    const [loopDelay, setLoopDelay] = useState(5000);
    const [airIn, setAirIn] = useState(false);
    const [airOut, setAirOut] = useState(false);

    // Fed Back Variables
    const [loopCount, setLoopCount] = useState(0);
    const [runStage, setRunStage] = useState(0);


    useEffect(() => {
      if (bleCharacteristic){
        updateCommandString();
      }
    }, [running, speed, minPosition, maxPosition, loopCap, loopDelay, airIn, airOut,bleCharacteristic]);

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

    async function connectBluetooth() {
      setConnecting(true);
      let bleDevice;
      let bleServer;
      let bleService;
      let bleCharacteristic;

      try {
        // Define the UUIDs based on your Arduino sketch
        const SERVICE_UUID = "8143e16b-5798-407d-9535-c8f93fc37368";
        const CHARACTERISTIC_UUID = "48b98d5e-9bdd-412a-9b1b-92dcb593c313";
        const VERSION_CHARACTERISTIC_UUID = "4ecc1cb6-38c4-46f5-aaf5-549285f46cf1";
        const RUNSTAGE_CHARACTERISTIC_UUID = "2e125644-ce12-4fbd-9589-596e544a4f17";
        const LOOP_COUNT_CHARACTERISTIC_UUID = "03f779e0-65b8-4dbf-a984-637d02b8c07c"

        // Request the Bluetooth device
        let retrievedDevice = await navigator.bluetooth.requestDevice({
          filters: [{ name: "Nimble_BT" }],
          optionalServices: [SERVICE_UUID]
        });

        // Connect to the GATT Server
        bleServer = await retrievedDevice.gatt.connect();
        bleService = await bleServer.getPrimaryService(SERVICE_UUID);


        let versionCharacteristic = await bleService.getCharacteristic(VERSION_CHARACTERISTIC_UUID);
        // Read the value from the characteristic
        const versionArrayBuffer = await versionCharacteristic.readValue();
        const versionDecoder = new TextDecoder('utf-8');
        const versionValue = versionDecoder.decode(versionArrayBuffer);

        // Check if the version matches
        if (versionValue !== COMPATABLE_HW_VERSION) {
            setVersionMismatch(true);
        }

        let retrievedCharacteristic = await bleService.getCharacteristic(CHARACTERISTIC_UUID);
        let runStageCharacteristic = await bleService.getCharacteristic(RUNSTAGE_CHARACTERISTIC_UUID);
        let loopCountCharacteristic = await bleService.getCharacteristic(LOOP_COUNT_CHARACTERISTIC_UUID);

        startNotifications(runStageCharacteristic,setRunStage)
        startNotifications(loopCountCharacteristic,setLoopCount)

        console.log('Connected to GATT Server and found the characteristic');
        setBleCharacteristic(retrievedCharacteristic);
        setBleDevice(retrievedDevice);
        setConnecting(false);
      } catch (error) {
        console.error('Error in connecting to Bluetooth device:', error);
        console.log(error.message); // Fixed typo from 'messsage' to 'message'
        setConnecting(false);
      }
    }

    const startNotifications = (characteristic,callback) => {
      console.log('Starting notifications...');
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = event.target.value;
        let intValue = value.getInt8(0);
        callback(intValue);
      });

      return characteristic.startNotifications()
        .then(() => {
          console.log('Notifications started');
        })
        .catch(error => {
          console.error('Error in starting notifications:', error);
        });
    };



    const handleRangeSliderChange = (values) => {
      const [min, max] = values;
      setMinPosition(min);
      setMaxPosition(max);
    };

    const handleSpeedSliderChange = (value) => {
      setSpeed(value)
    };

    const Thumb = (props, state) => <div {...props}></div>;
    const speedThumb = (props, state) => <div {...props}>{state.value}%</div>;
    const Track = (props, state) => <div {...props} index={state.index}></div>;


    const StrokeRangeSlider = () => {
      return(
        <div className='sliderWrapper'>
            <RangeSlider
                min={-1000}
                max={1000}
                step={1}
                defaultValue={[minPosition, maxPosition]} // Set to initial positions within your range
                renderTrack={Track}
                renderThumb={Thumb}
                orientation="vertical"
                onAfterChange={handleRangeSliderChange}
                invert
            />
        </div>    
    )}

    const DisplayScreen = () => {
      return(
        <div className='screen'>
          <div className={`upper ${running && 'running'} ${runStage === 4 && 'paused'}`}>
            {runStage === 2 ? ('Nimble Is Stroking...') : runStage === 4 ? ("Nimble Is Paused...") : ('Nimble Is Stopped...')}
          </div>
          <div className='lower'>
            <div>Sequence...</div>
            <div className={`${runStage === 2 && 'active'}`}>Strokes: {loopCap-loopCount+1}/{loopCap}</div>
            <div>Stroke Speed: {speed}%</div>
            <div>Stroke Range: {Math.floor(minPosition / 10)} > {Math.floor(maxPosition / 10)}</div>
            <div className={`${runStage === 4 && 'active'}`}>Pause Time: {loopDelay/1000}s</div>
          </div>
          <div className='info'>
            {airIn ? (<div>Pressurizing for longer strokes<br/><i className="icofont-warning"></i> Slip out risk</div>) : (null)}
            {airOut ? (<div>Increasting suction<br/><i className="icofont-info-circle"></i> Slip out risk reducing</div>) : (null)}
          </div>
        </div>   
    )}

    const StrokeSpeedSlider = () => {
      return(
        <div className='speedSliderWrapper'>
            <SpeedSlider
                min={0}
                max={100}
                defaultValue={[speed]} // Set to initial positions within your range
                renderTrack={Track}
                renderThumb={speedThumb}
                orientation="vertical"
                onAfterChange={handleSpeedSliderChange}
                invert
            />
        </div>  
    )}

    return (
        <div id='NimbleController'>
            <div className='wrapper'>
            {versionMismatch ? (
              <div className='version_error'>Hardware Version does not match v{COMPATABLE_HW_VERSION}, flash latest version to your Nimble Control Module</div>
            ) : !isDeviceConnected() ? (
              <button className={`connect_button ${connecting && 'connecting'}`} onClick={connectBluetooth}></button>
            ) : (
              <>
              <div className='upper-wrapper'>
                <StrokeRangeSlider />
                <DisplayScreen />
                <StrokeSpeedSlider />
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
                </div>
                <div className='inputsWrapper'>
                  <input type='number' value={loopDelay/1000} onChange={e => setLoopDelay(e.target.value * 1000)}/>
                  <input type='number' value={loopCap} onChange={e => setLoopCap(e.target.value)}/>
                </div>
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
