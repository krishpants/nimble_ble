import React, { useState, useEffect, useRef, useCallback } from 'react';
import ConnectBluetooth from './BluetoothService.jsx'
import WebSocketComponent from './WebSocketComponent.jsx'
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

    let COMPATABLE_HW_VERSION = "0.04";
    let modes = ['default','shuffle','StopGo','eom']
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
    const [speed, setSpeed] = useState(50); // Range 0-100
    const [minPosition, setMinPosition] = useState(-500);
    const [maxPosition, setMaxPosition] = useState(500);
    const [loopCap, setLoopCap] = useState(15);
    const [loopDelay, setLoopDelay] = useState(10000);
    const [airIn, setAirIn] = useState(false);
    const [airOut, setAirOut] = useState(false);
    // Misc
    const [showInfo, setShowInfo] = useState(false);
    // Fed Back Variables
    const [loopCount, setLoopCount] = useState(0);
    const [runStage, setRunStage] = useState(0);
    const [encoderValue,setEncoderValue] = useState(50);
    const [buttonValue,setButtonValue] = useState(false);
    
    // Shuffle Mode Control Variables
    const [shuffleMode, setShuffleMode] = useState(false);
    const [selectedMode, setSelectedMode] = useState('default');

    // Stop&Go Mode Control Variables
    const [rampInterval, setRampInterval] = useState(500);
    const [lastSpeedIncrementTime, setLastSpeedIncrementTime] = useState(Date.now());

    // EOM Variables
    const [eomConnected, setEomConnected] = useState(false);
    const [eomConnecting, setEomConnecting] = useState(false);
    const [eomSpeed, setEomSpeed] = useState(0);
    const [eomArousal, setEomArousal] = useState(0);
        const [connectionIp, setConnectionIp] = useState(() => {
        const savedIp = localStorage.getItem('connectionIp');
        return savedIp || '192.168.0.5';
    });

    const [maxSpeed, setMaxSpeed] = useState(speed);
    const [minSpeed, setMinSpeed] = useState(speed-30);
    const [minPositionLower, setMinPositionLower] = useState(minPosition);
    const [minPositionUpper, setMinPositionUpper] = useState(null);
    const [maxPositionLower, setMaxPositionLower] = useState(null);
    const [maxPositionUpper, setMaxPositionUpper] = useState(maxPosition);
    const [minLoopDelay, setMinLoopDelay] = useState(loopDelay/2);
    const [maxLoopDelay, setMaxLoopDelay] = useState(loopDelay);
    const [minLoopCap, setMinLoopCap] = useState(5);
    const [maxLoopCap, setMaxLoopCap] = useState(loopCap);

    const [cachedState, setCachedState] = useState({
      maxSpeed,
      minSpeed,
      minPositionLower,
      minPositionUpper,
      maxPositionLower,
      maxPositionUpper,
      minLoopDelay,
      maxLoopDelay,
      minLoopCap,
      maxLoopCap,
    });

    const cacheValues = () => {
      setCachedState({
        maxSpeed,
        minSpeed,
        minPositionLower,
        minPositionUpper,
        maxPositionLower,
        maxPositionUpper,
        minLoopDelay,
        maxLoopDelay,
        minLoopCap,
        maxLoopCap,
      });
      setEncoderValue(50);
    };

    // Other
    const [totalStrokes,setTotalStrokes] = useState(0);
    const [valueChanged, setValueChanged] = useState(false);
    
      // Create a memoized version of handleEncoderChange
      // const handleEncoderChange = useCallback((change) => {
      //     setEncoderValue((prevEncoderValue) => {
      //       let newEncoderValue;
      //       if (change === "up") {
      //         newEncoderValue = prevEncoderValue + 5;
      //       } else if (change === "down") {
      //         newEncoderValue = prevEncoderValue - 5;
      //       }
      //       return Math.min(Math.max(newEncoderValue, 0), 100);
      //     });
      // }, [shuffleMode]); // Include shuffleMode as a dependency

      const handleEncoderChange = (change) => {
          setEncoderValue((prevEncoderValue) => {
            let newEncoderValue;
            if (change === "up") {
              newEncoderValue = prevEncoderValue + 5;
            } else if (change === "down") {
              newEncoderValue = prevEncoderValue - 5;
            }
            return Math.min(Math.max(newEncoderValue, 0), 100);
          });
      }; // Include shuffleMode as a dependency

      useEffect(() => {
        let timer;
        if (encoderValue !== 50 && encoderValue > 40 && encoderValue < 60) {
          if (!valueChanged) {
            // Start the timer when the value changes to a valid range
            timer = setTimeout(() => {
              // If the value remains in the valid range for 1 second, snap it back to 50
              setEncoderValue(50);
              setValueChanged(false); // Reset the flag
            }, 1000);
          }
          setValueChanged(true);
        } else {
          clearTimeout(timer); // Clear the timer if the value goes out of the valid range
          setValueChanged(false); // Reset the flag
        }
        return () => {
          clearTimeout(timer); // Clean up the timer when the component unmounts or the dependency changes
        };
      }, [encoderValue]);

    useEffect(() => {
      const basePosition = 50;
      const minEncoderValue = 0;
      const maxEncoderValue = 100;

      const scaleValue = (value, minValue, maxValue, targetMin, targetMax) => {
        return (
          ((value - minValue) / (maxValue - minValue)) * (targetMax - targetMin) + targetMin
        );
      };

      const originalMinLoopDelay = cachedState.minLoopDelay;
      const originalMaxLoopDelay = cachedState.maxLoopDelay;

      const originalMinLoopCap = cachedState.minLoopCap;
      const originalMaxLoopCap = cachedState.maxLoopCap;

      let scaledMinLoopDelay, scaledMaxLoopDelay;
      let scaledMinLoopCap, scaledMaxLoopCap;

      if (encoderValue < basePosition - 9) {
        scaledMinLoopDelay = scaleValue(encoderValue, minEncoderValue, basePosition, 2 * originalMinLoopDelay, originalMinLoopDelay);
        scaledMaxLoopDelay = scaleValue(encoderValue, minEncoderValue, basePosition, 3 * originalMaxLoopDelay, originalMaxLoopDelay);
      } else if (encoderValue > basePosition + 9) {
        scaledMinLoopDelay = scaleValue(encoderValue, basePosition, maxEncoderValue, originalMinLoopDelay, 0);
        scaledMaxLoopDelay = scaleValue(encoderValue, basePosition, maxEncoderValue, originalMaxLoopDelay, 1000);
      } else {
        scaledMinLoopDelay = originalMinLoopDelay;
        scaledMaxLoopDelay = originalMaxLoopDelay;
      }

        if (encoderValue < basePosition - 9) {
            scaledMinLoopCap = originalMinLoopCap;
            scaledMaxLoopCap = originalMaxLoopCap;
            // scaledMinLoopCap = scaleValue(encoderValue, minEncoderValue, basePosition, originalMinLoopCap, originalMinLoopCap / 2);
            // scaledMaxLoopCap = scaleValue(encoderValue, minEncoderValue, basePosition, originalMaxLoopCap, originalMaxLoopCap / 2);
        } else if (encoderValue > basePosition + 9) {
            scaledMinLoopCap = scaleValue(encoderValue, basePosition, maxEncoderValue, originalMinLoopCap / 2, originalMinLoopCap * 3);
            scaledMaxLoopCap = scaleValue(encoderValue, basePosition, maxEncoderValue, originalMaxLoopCap / 2, originalMaxLoopCap * 3);
          } else {
                scaledMinLoopCap = originalMinLoopCap;
                scaledMaxLoopCap = originalMaxLoopCap;
          }

      setMinLoopDelay(Math.round(scaledMinLoopDelay / 1000) * 1000);
      setMaxLoopDelay(Math.round(scaledMaxLoopDelay / 1000) * 1000);
      setMinLoopCap(Math.round(scaledMinLoopCap));
      setMaxLoopCap(Math.round(scaledMaxLoopCap));
    }, [encoderValue]);



    useEffect(() => {
        if (selectedMode === 'StopGo') {
            if (buttonValue === 0){
                setRunning(true)
            } else {
                setRunning(false)
                setSpeed(maxSpeed)
            }
        } else if (buttonValue === 0){
            setRunning(!running)
        }
    }, [buttonValue]);







    useEffect(() => {
        if (loopCount > 0 && loopCount <= loopCap){
            setTotalStrokes(totalStrokes + 1)
        }
        if (selectedMode === 'StopGo' && rampInterval > 0){
            const currentTime = Date.now();
            if (currentTime - lastSpeedIncrementTime >= rampInterval) {
              setSpeed((prevSpeed) => Math.min(100, prevSpeed + 1));
              setLastSpeedIncrementTime(currentTime);
            }
        }
    }, [loopCount]);

    

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
            setSelectedMode('default');
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

        socket.current.on('updateRunStage', (data) => {
          if (is_controller()){
            setRunStage(data.runStage)
          }
        });

        return () => {
            socket.current.off('updateRunStage');
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
      if (runStage == 4 && selectedMode == 'shuffle'){
        // shuffleVariables();
        shuffleVariablesWithEncoder();
      }
      if (controllerJoined && (runStage == 4 || runStage == 2)){
        socket.current.emit('sendRunStage', runStage);
      }
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
        if (selectedMode == 'shuffle'){
            setMaxPositionLower(Math.max(maxPositionUpper-300,minPositionLower));
            setMinPositionUpper(Math.min(minPositionLower+300,maxPositionUpper));
            setMinSpeed(Math.max(speed-30,0))
        } else if (selectedMode == 'StopGo' || selectedMode == 'eom') {
            setLoopCap(999)
            setRunning(false)
        } 
    }, [selectedMode]);




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


// ███████╗░█████╗░███╗░░░███╗██████╗░██╗░░██╗
// ██╔════╝██╔══██╗████╗░████║╚════██╗██║░██╔╝
// █████╗░░██║░░██║██╔████╔██║░█████╔╝█████═╝░
// ██╔══╝░░██║░░██║██║╚██╔╝██║░╚═══██╗██╔═██╗░
// ███████╗╚█████╔╝██║░╚═╝░██║██████╔╝██║░╚██╗
// ╚══════╝░╚════╝░╚═╝░░░░░╚═╝╚═════╝░╚═╝░░╚═╝


  useEffect(() => {
      localStorage.setItem('connectionIp', connectionIp);
  }, [connectionIp]);

  const eomsocket = useRef(null);

  const connectToEom = () => {
    eomsocket.current = new WebSocket(`ws://${connectionIp}:80`);
    setEomConnecting(true);
    const connectionTimeout = 3000; // Timeout for establishing a connection
    let connectionEstablished = false;

    eomsocket.current.onopen = (event) => {
      console.log('WebSocket connection opened:', event);
      setEomConnected(true);
      setConfirmMessages([...confirmMessages, `Connected to EOM on ip: ${connectionIp}`]);
      connectionEstablished = true;
      setEomConnecting(false);
    };

    eomsocket.current.onmessage = (event) => {
      try {
        var eventData = JSON.parse(event.data);
        setEomSpeed(eventData.readings.motor);
        setEomArousal(eventData.readings.arousal);
      } catch (error) {
        console.error('Error parsing event data:', error);
        console.log('Received event:', event);
      }
    };

    eomsocket.current.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
      setEomConnected(false);
    };

    eomsocket.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Connection timeout check
    setTimeout(() => {
      if (!connectionEstablished) {
        setEomConnecting(false);
        setErrorMessages([...errorMessages, `Unable to connect to EOM on ip: ${connectionIp}`]);
        eomsocket.current.close();
      }
    }, connectionTimeout);
  }

  const disconnectFromEom = () => {
    console.log(eomsocket.current)
    if (eomsocket.current !== null) {
      eomsocket.current.close(); // Close the socket if it's open
      eomsocket.current = null;
    }
    // Reset any relevant state variables here
    setEomConnected(false);
    setEomConnecting(false);
    // ... any other state resets as needed ...
  };        

  useEffect(() => {
      if (eomSpeed == 0){
        setSpeed(0);
        setRunning(false);
      } else {
        setSpeed(maxSpeed)
        setRunning(true);
      } 
  }, [eomSpeed]);



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
        setEncoderValue,
        handleEncoderChange,
        setButtonValue,
        COMPATABLE_HW_VERSION
      );
    };

    // const shuffleVariables = () => {
    //   setHoldUpdate(true);
    //   setSpeed(getRandomBetween(minSpeed,maxSpeed))
    //   setLoopDelay(getRandomBetween(minLoopDelay,maxLoopDelay))
    //   setLoopCap(getRandomBetween(minLoopCap,maxLoopCap))
    //   const mm_vals = [getRandomBetween(minPositionLower,minPositionUpper),getRandomBetween(maxPositionLower,maxPositionUpper)]
    //   setMinPosition(Math.min(...mm_vals))
    //   setMaxPosition(Math.max(...mm_vals))
    //   setHoldUpdate(false);
    // }

    const shuffleVariablesWithEncoder = () => {
        setHoldUpdate(true);

        // Define quartiles for loopCap and loopDelay
        const loopCapQuartile = Math.floor((maxLoopCap - minLoopCap) / 4);
        const loopDelayQuartile = Math.floor((maxLoopDelay - minLoopDelay) / 4);

        // Adjust loopCap and loopDelay based on encoderValue
        if (encoderValue < 20) {
            setLoopCap(getRandomBetween(minLoopCap + loopCapQuartile * 2, maxLoopCap));
            setLoopDelay(getRandomBetween(minLoopDelay, minLoopDelay + loopDelayQuartile));
        } else if (encoderValue < 50) {
            setLoopCap(getRandomBetween(minLoopCap + loopCapQuartile * 2, maxLoopCap));
            setLoopDelay(getRandomBetween(minLoopDelay + loopDelayQuartile, minLoopDelay + loopDelayQuartile * 3));
        } else if (encoderValue < 70) {
            setLoopCap(getRandomBetween(minLoopCap + loopCapQuartile, minLoopCap + loopCapQuartile * 3));
            setLoopDelay(getRandomBetween(minLoopDelay + loopDelayQuartile * 2, minLoopDelay + loopDelayQuartile * 3));
        } else if (encoderValue < 90) {
            setLoopCap(getRandomBetween(minLoopCap, minLoopCap + loopCapQuartile * 2));
            setLoopDelay(getRandomBetween(minLoopDelay + loopDelayQuartile * 2, maxLoopDelay));
        } else {
            setLoopCap(getRandomBetween(minLoopCap, minLoopCap + loopCapQuartile * 2));
            setLoopDelay(getRandomBetween(minLoopDelay + loopDelayQuartile * 3, maxLoopDelay));
        }

        // Randomize other variables
        setSpeed(getRandomBetween(minSpeed, maxSpeed));
        const mm_vals = [getRandomBetween(minPositionLower, minPositionUpper), getRandomBetween(maxPositionLower, maxPositionUpper)];
        setMinPosition(Math.min(...mm_vals));
        setMaxPosition(Math.max(...mm_vals));

        setHoldUpdate(false);
    };


    const getRandomBetween = (min, max) => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const handleCycleMode = () => {
      const currentIndex = modes.indexOf(selectedMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      setSelectedMode(modes[nextIndex]);
      disconnectFromEom();
    };



// ██████╗░███████╗███╗░░██╗██████╗░███████╗██████╗░
// ██╔══██╗██╔════╝████╗░██║██╔══██╗██╔════╝██╔══██╗
// ██████╔╝█████╗░░██╔██╗██║██║░░██║█████╗░░██████╔╝
// ██╔══██╗██╔══╝░░██║╚████║██║░░██║██╔══╝░░██╔══██╗
// ██║░░██║███████╗██║░╚███║██████╔╝███████╗██║░░██║
// ╚═╝░░╚═╝╚══════╝╚═╝░░╚══╝╚═════╝░╚══════╝╚═╝░░╚═╝

    return (
        <div id='NimbleController'>
            {/*<WebSocketComponent eomSpeed={eomSpeed} setEomSpeed={setEomSpeed}/>*/}
            <div className='info_pane'>
                <div className='top_fill'></div>
                <div className='contents'>
                    {
                        selectedMode == 'default' ? (
                            <>
                                <h4><i className="icofont-loop"></i> Default Mode</h4>
                                <div><i className="icofont-hand-drag1"></i> Push the NCM button to Play/Resume</div>
                                <div><i className="icofont-settings"></i> Set your stroke range, stroke count, pause seconds and speed</div>
                                <div><i className="icofont-loop"></i> Nimble will cycle between strokes and pauses</div>
                            </>
                        ) : selectedMode == 'shuffle' ? (
                            <>
                                <h4><i className="icofont-random"></i> Shuffle Mode</h4>
                                <div><i className="icofont-settings"></i> Set your Min/Max for stroke range, stroke count, pause seconds and speed</div>
                                <div><i className="icofont-hand-drag1"></i> Push the NCM button to Play/Resume</div>
                                <div><i className="icofont-loop"></i> Nimble will randomise within your selected min & max values.</div>
                                <div><i className="icofont-ui-rotation"></i> Turn the NCM knob to scale pause & stroke counts during your session.</div>
                            </>
                        ) : selectedMode == 'StopGo' ? (
                            <>
                                <h4><i className="icofont-traffic-light"></i> Stop & Go Mode</h4>
                                <div><i className="icofont-hand-drag1"></i> Push the NCM button to stroke, release the button to stop.</div>
                                <div><i className="icofont-chart-histogram-alt"></i> Speed will increase by 1% every RAMP milliseconds until the button is released. Choose 0 for no ramp.</div>
                                <div><i className="icofont-score-board"></i> Try and get your stroke total as high as you can!</div>
                            </>
                        ) : selectedMode == 'eom' ? (
                            <>
                                <h4><i className="icofont-traffic-light"></i> Edge-O-Matic Mode (only for use for EOM Owners)</h4>
                                <div><i class="icofont-ui-settings"></i> Change the IP to the one shown on your EOM, this can be found in the setting screen</div>
                                <div><i class="icofont-ui-settings"></i> Your EOM config.json should have use_ssl:false websocket_port:80 (these are the defaults)</div>
                                <div><i class="icofont-warning"></i> Important, Insecure content must be enabled for this site on chrome to enable the connection to the EOM</div>
                                <div><i class="icofont-info-circle"></i> The EOM settings do all the driving here, tweak these as you normaly would and the nimble will stroke when the EOM allows (any non zero speed), the nimble will not do any speed ramping. (Tried it, felt jankey)</div>
                            </>
                        ) : (null)
                    }

                </div>
                <div className='toggle_info' onClick={(e) => setShowInfo(!showInfo)}><i className="icofont-info-square"></i></div>
            </div>
          <ControllerMainWrapper
            showInfo={showInfo}
            setShowInfo={setShowInfo}
            code={code}
            encoderValue={encoderValue}
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
            handleCycleMode={handleCycleMode}
            modes={modes}
            selectedMode={selectedMode}
            setSelectedMode={setSelectedMode}
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
            totalStrokes={totalStrokes}
            cacheValues={cacheValues}
            rampInterval={rampInterval}
            setRampInterval={setRampInterval}
            connectionIp={connectionIp}
            setConnectionIp={setConnectionIp}
            eomSpeed={eomSpeed}
            connectToEom={connectToEom}
            eomConnecting={eomConnecting}
            eomConnected={eomConnected}
            eomArousal={eomArousal}
          />
        </div>
    );
};

export default NimbleController;
