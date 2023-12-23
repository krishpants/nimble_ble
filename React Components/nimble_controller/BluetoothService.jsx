import React, { useState,useEffect } from 'react';

const ConnectBluetooth = async (
  setConnecting, 
  setBleCharacteristic, 
  setBleDevice, 
  setVersionMismatch, 
  setRunStage, 
  setLoopCount,
  setEncoderValue,
  COMPATABLE_HW_VERSION
) => {
      console.log(typeof setConnecting);
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
        const LOOP_COUNT_CHARACTERISTIC_UUID = "03f779e0-65b8-4dbf-a984-637d02b8c07c";
        const ENCODER_CHARACTERISTIC_UUID = "1a08f9e4-30b2-4d41-ad4e-330a1cc8311a"

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
        let encoderCharacteristic = await bleService.getCharacteristic(ENCODER_CHARACTERISTIC_UUID);

        startNotifications(runStageCharacteristic,setRunStage)
        startNotifications(loopCountCharacteristic,setLoopCount)
        startNotifications(encoderCharacteristic,setEncoderValue)

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
      console.log('Notifications have started');
    })
    .catch(error => {
      console.error('Error in starting notificationsx:', error);
    });
};

export default ConnectBluetooth;