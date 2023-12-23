import React, { useState,useEffect,useRef } from 'react';
import ConnectBluetooth from './BluetoothService.jsx'
import ControllerMainWrapper from './ControllerMainWrapper.jsx'
import { useGlobalState } from '../global_utilities/GlobalStateContext.jsx';
import {generateCode} from './functions.js'
import io from 'socket.io-client';

const NimbleController = () => {
  const {errorMessages, setErrorMessages,confirmMessages, setConfirmMessages,setLoadCount} = useGlobalState();

// ░██████╗████████╗░█████╗░████████╗███████╗
// ██╔════╝╚══██╔══╝██╔══██╗╚══██╔══╝██╔════╝
// ╚█████╗░░░░██║░░░███████║░░░██║░░░█████╗░░
// ░╚═══██╗░░░██║░░░██╔══██║░░░██║░░░██╔══╝░░
// ██████╔╝░░░██║░░░██║░░██║░░░██║░░░███████╗
// ╚═════╝░░░░╚═╝░░░╚═╝░░╚═╝░░░╚═╝░░░╚══════╝

    let COMPATABLE_HW_VERSION = "0.02";
    //BT COMM VARIABLES
    const [bleCharacteristic, setBleCharacteristic] = useState(null);
    const [bleDevice, setBleDevice] = useState(null);
    const [connecting, setConnecting] = useState(null);
    const [versionMismatch, setVersionMismatch] = useState(false);
    const [holdUpdate, setHoldUpdate] = useState(false);
    //socket-io
    const [code, setCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const socket = useRef(null);
    const [remoteRoomId, setRemoteRoomId] = useState(null);
    const [controllerJoined, setControllerJoined] = useState(false);
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
        socket.current = io({
          auth: {
            token: "lm88hsg91_hj99s"
          }
        });
        const handleBeforeUnload = () => {
            if (socket.current) {
                socket.current.disconnect();
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (socket.current) {
                socket.current.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        socket.current.on('receiveCommand', (data) => {
            const command = data.command;
            processCommandString(command);
        });
        socket.current.on('controllerJoined', () => {
            setShuffleMode(false);
            setControllerJoined(true);
        });
        socket.current.on('nimbleDisconnect', (data) => {
            if (data.type == 'user'){
              setErrorMessages([...errorMessages, 'Connection lost to remote user.']);
              setRemoteRoomId(null);
              setInputCode('')
            } 
            else if (data.type === 'controller') {
              setErrorMessages([...errorMessages, 'Controller has disconnected.']);
              setControllerJoined(false);
            }
        });

        // socket.current.on('updateRunStage', (data) => {
        //   console.log(is_controller())
        //   if (is_controller()){
        //     setRunStage(data.runStage)
        //   }
        // });

        return () => {
            // socket.current.off('updateRunStage');
            socket.current.off('receiveCommand');
            socket.current.off('controllerJoined');
            socket.current.off('nimbleDisconnect');
        };
    }, [remoteRoomId]);

    const is_controller = () =>{
      return remoteRoomId != null
    }

    const disconnectSocket = () => {
        if (socket.current) {
            socket.current.disconnect();
        }
    };


    useEffect(() => {
      if (controllerJoined){
        setConfirmMessages([...confirmMessages, 'Controller Has Connected']);
      }
    }, [controllerJoined]);

    function processCommandString(command) {
        const values = command.split(',');
        if (values.length !== 8) {
            console.error('Received command string with incorrect format:', command);
            return;
        }
        const [running, speed, minPosition, maxPosition, loopCap, loopDelay, airIn, airOut] = values.map((value, index) => {
            if (index === 0 || index === 6 || index === 7) {
                return value === '1';
            }
            return Number(value);
        });

        setRunning(running);
        setSpeed(speed);
        setMaxSpeed(speed);
        setMinPosition(minPosition);
        setMinPositionLower(minPosition);
        setMaxPosition(maxPosition);
        setMaxPositionUpper(maxPosition);
        setLoopCap(loopCap);
        setLoopDelay(loopDelay);
        setAirIn(airIn);
        setAirOut(airOut);
    }



    const handleJoinRoom = () => {
        console.log('join',inputCode)
        if (inputCode) {
            socket.current.emit('joinRoom', inputCode, (response) => {
                if (response.success) {
                    setConfirmMessages([...confirmMessages, inputCode + ' joined successfully']);
                    setRemoteRoomId(inputCode);
                } else {
                    setErrorMessages([...errorMessages, 'Failed to join remote: Client does not exist or other error']);
                }
            });
        }
    };

    useEffect(() => {
      if (bleDevice){
        const newConfirmMessages = [...confirmMessages, 'Connected to Nimble Controller!'];
        setConfirmMessages(newConfirmMessages)
        const generatedCode = generateCode();
        setCode(generatedCode);
        socket.current.emit('createRoom', generatedCode);
      }
    }, [bleDevice]); 

    useEffect(() => {
      if (runStage == 4 && shuffleMode){
        shuffleVariables();
      }
      // if (controllerJoined){
      //   socket.current.emit('sendRunStage', runStage);
      // }
    }, [runStage]);   

    //Set Speed to maxSpeed (for use when shuffle is off)
    useEffect(() => {
      setSpeed(maxSpeed);
    }, [maxSpeed]);

    //Set Positions to l/u-Positions (when shuffle is off)
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

    //Set sensible values for second sliders when starting shuffle mode.
    useEffect(() => {
        setMaxPositionLower(Math.max(maxPositionUpper-300,minPositionLower));
        setMinPositionUpper(Math.min(minPositionLower+300,maxPositionUpper));
        setMinSpeed(Math.max(speed-30,0))      
    }, [shuffleMode]);




// ██████╗░████████╗░░░░░░██╗░░░██╗██████╗░██████╗░░█████╗░████████╗███████╗░██████╗
// ██╔══██╗╚══██╔══╝░░░░░░██║░░░██║██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██╔════╝
// ██████╦╝░░░██║░░░█████╗██║░░░██║██████╔╝██║░░██║███████║░░░██║░░░█████╗░░╚█████╗░
// ██╔══██╗░░░██║░░░╚════╝██║░░░██║██╔═══╝░██║░░██║██╔══██║░░░██║░░░██╔══╝░░░╚═══██╗
// ██████╦╝░░░██║░░░░░░░░░╚██████╔╝██║░░░░░██████╔╝██║░░██║░░░██║░░░███████╗██████╔╝
// ╚═════╝░░░░╚═╝░░░░░░░░░░╚═════╝░╚═╝░░░░░╚═════╝░╚═╝░░╚═╝░░░╚═╝░░░╚══════╝╚═════╝░

    const throttleTimerRef = useRef(null);
    const lastInvocationTimeRef = useRef(Date.now());
    const debounceTimerRef = useRef(null);

    const updateCommandStringDebounced = () => {
      const now = Date.now();
      if (throttleTimerRef.current) {clearTimeout(throttleTimerRef.current);}
      if (now - lastInvocationTimeRef.current >= 300) {
        updateCommandString();
        lastInvocationTimeRef.current = now;
      }
      if (debounceTimerRef.current) {clearTimeout(debounceTimerRef.current);}
      debounceTimerRef.current = setTimeout(() => {
        updateCommandString();
        debounceTimerRef.current = null;
      }, 300);
    };

    useEffect(() => {
      if ((remoteRoomId || bleCharacteristic) && !holdUpdate) {
        updateCommandStringDebounced();
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
            if (remoteRoomId) {
                const serializedData = createCommandString();
                socket.current.emit('broadcastCommand', { room: remoteRoomId, command: serializedData });
            } else {
                console.error('Device is not connected or characteristic not found, and no remote room is set.');
            }
            return;
        }

        try {
            const serializedData = createCommandString();
            const commandBuffer = new TextEncoder().encode(serializedData);
            await bleCharacteristic.writeValue(commandBuffer);
        } catch (error) {
            console.error('Error in sending Bluetooth command:', error);
        }
    }

    function createCommandString() {
        return `${running?(1):(0)},${speed},${minPosition},${maxPosition},${loopCap},${loopDelay},${airIn?(1):(0)},${airOut?(1):(0)}`;
    }



// ██╗░░██╗███████╗██╗░░░░░██████╗░███████╗██████╗░░██████╗
// ██║░░██║██╔════╝██║░░░░░██╔══██╗██╔════╝██╔══██╗██╔════╝
// ███████║█████╗░░██║░░░░░██████╔╝█████╗░░██████╔╝╚█████╗░
// ██╔══██║██╔══╝░░██║░░░░░██╔═══╝░██╔══╝░░██╔══██╗░╚═══██╗
// ██║░░██║███████╗███████╗██║░░░░░███████╗██║░░██║██████╔╝
// ╚═╝░░╚═╝╚══════╝╚══════╝╚═╝░░░░░╚══════╝╚═╝░░╚═╝╚═════╝░

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


// ██████╗░███████╗███╗░░██╗██████╗░███████╗██████╗░
// ██╔══██╗██╔════╝████╗░██║██╔══██╗██╔════╝██╔══██╗
// ██████╔╝█████╗░░██╔██╗██║██║░░██║█████╗░░██████╔╝
// ██╔══██╗██╔══╝░░██║╚████║██║░░██║██╔══╝░░██╔══██╗
// ██║░░██║███████╗██║░╚███║██████╔╝███████╗██║░░██║
// ╚═╝░░╚═╝╚══════╝╚═╝░░╚══╝╚═════╝░╚══════╝╚═╝░░╚═╝

    return (
        <div id='NimbleController'>
          {remoteRoomId}
          <ControllerMainWrapper
            code={code}
            inputCode={inputCode}
            setInputCode={setInputCode}
            handleJoinRoom={handleJoinRoom}
            remoteRoomId={remoteRoomId}
            controllerJoined={controllerJoined}
            versionMismatch={versionMismatch}
            COMPATABLE_HW_VERSION={COMPATABLE_HW_VERSION}
            isDeviceConnected={isDeviceConnected}
            connecting={connecting}
            handleConnect={handleConnect}
            shuffleMode={shuffleMode}
            setShuffleMode={setShuffleMode}
            minPositionLower={minPositionLower}
            setMinPositionLower={setMinPositionLower}
            maxPositionUpper={maxPositionUpper}
            setMaxPositionUpper={setMaxPositionUpper}
            minPositionUpper={minPositionUpper}
            setMinPositionUpper={setMinPositionUpper}
            maxPositionLower={maxPositionLower}
            setMaxPositionLower={setMaxPositionLower}
            running={running}
            setRunning={setRunning}
            runStage={runStage}
            minLoopCap={minLoopCap}
            maxLoopCap={maxLoopCap}
            loopCap={loopCap}
            loopCount={loopCount}
            minSpeed={minSpeed}
            maxSpeed={maxSpeed}
            speed={speed}
            setSpeed={setSpeed}
            setMinSpeed={setMinSpeed}
            setMaxSpeed={setMaxSpeed}
            minPosition={minPosition}
            maxPosition={maxPosition}
            minLoopDelay={minLoopDelay}
            maxLoopDelay={maxLoopDelay}
            loopDelay={loopDelay}
            setLoopDelay={setLoopDelay}
            setLoopCap={setLoopCap}
            setMinLoopDelay={setMinLoopDelay}
            setMaxLoopDelay={setMaxLoopDelay}
            setMinLoopCap={setMinLoopCap}
            setMaxLoopCap={setMaxLoopCap}
            airIn={airIn}
            airOut={airOut}
            setAirIn={setAirIn}
            setAirOut={setAirOut}
          />
        </div>
    );
};

export default NimbleController;
