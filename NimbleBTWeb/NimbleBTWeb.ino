// Use "ESP32 Dev Module" as board
#include <string>
#include <sstream>
#include <vector>

#include "nimbleCon.h"
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>

// Define UUIDs for BLE service and characteristic
#define SERVICE_UUID "8143e16b-5798-407d-9535-c8f93fc37368"  // New UUID
#define CHARACTERISTIC_UUID "48b98d5e-9bdd-412a-9b1b-92dcb593c313"
#define VERSION_CHARACTERISTIC_UUID "4ecc1cb6-38c4-46f5-aaf5-549285f46cf1"
#define RUNSTAGE_CHARACTERISTIC_UUID "2e125644-ce12-4fbd-9589-596e544a4f17"
#define LOOP_COUNT_CHARACTERISTIC_UUID "03f779e0-65b8-4dbf-a984-637d02b8c07c"
#define DEVICE_NAME "Nimble_BT"

std::string HW_VERSION = "0.01";

// Set By App
bool running;
int targetSpeed; //0-100
long targetMinPosition; // -1000 > 1000 & < targetMaxPosition
long targetMaxPosition; // -1000 > 1000 & > targetMinPosition
int loopCap;
long loopDelay;
bool airIn;
bool airOut;

// Intenral variables to prevent jumping on update

long minPosition;
long maxPosition;
int speed;
float frequency;

bool inBasePosition = false;
int loopCount = 0;
long waveStartTime = 0;
long waveStopTime = 0;
int runningStage = 0;
long positionCommand = 0;

bool defaultsSet = false;


BLECharacteristic *pVersionCharacteristic;
BLECharacteristic *pCharacteristic;
BLECharacteristic *pRunstageCharacteristic;
BLECharacteristic *pLoopCountCharacteristic;
BLEServer *pServer;
BLEService *pService;

// **************************
// **. BLE Communications. **
// **************************

void printVariableValuesSingleLine() {
    String output = "Run: " + String(running) + 
                    ", TSpd: " + String(targetSpeed) +
                    ", TMinPos: " + String(targetMinPosition) +
                    ", TMaxPos: " + String(targetMaxPosition) +
                    ", LCap: " + String(loopCap) +
                    ", LDelay: " + String(loopDelay) +
                    ", AirIn: " + String(airIn) +
                    ", AirOut: " + String(airOut) +
                    ", DefSet: " + String(defaultsSet);
    Serial.println(output);
}


class MyServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) override {
    Serial.println("Client connected.");
    pServer->getAdvertising()->stop();
  }

  void onDisconnect(BLEServer* pServer) override {
    Serial.println("Client disconnected. Restarting advertising...");
    delay(500); // Short delay
    pServer->getAdvertising()->start();
  }
};

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) override {
        std::string value = pCharacteristic->getValue();
        // Split the string by commas and store the parts in a vector
        std::vector<std::string> parts;
        std::stringstream valueStream(value);
        std::string part;
        while (std::getline(valueStream, part, ',')) {
            parts.push_back(part);
        }
        if (parts.size() != 8) {
            Serial.println("Handle error: the received string does not have the expected number of parts");
            return;
        }

        // Convert each part to the correct type and assign to variables
        try {
            running = std::stoi(parts[0]) != 0; // Convert to bool
            targetSpeed = std::stoi(parts[1]); // Convert to int
            targetMinPosition = std::stol(parts[2]); // Convert to long
            targetMaxPosition = std::stol(parts[3]); // Convert to long
            loopCap = std::stoi(parts[4]); // Convert to int
            loopDelay = std::stol(parts[5]); // Convert to long
            airIn = std::stoi(parts[6]) != 0; // Convert to bool
            airOut = std::stoi(parts[7]) != 0; // Convert to bool
            defaultsSet = true;
            printVariableValuesSingleLine();
        } catch (const std::invalid_argument& e) {
            Serial.println("Handle error: one of the parts could not be converted to the correct type");
            return;
        }
    }
};

void updateRunstage() {
    static int lastNotifiedRunstage = -1;
    if(runningStage != lastNotifiedRunstage) {
        uint8_t data[2];
        data[0] = (uint8_t) (runningStage & 0xFF);
        data[1] = (uint8_t) ((runningStage >> 8) & 0xFF);

        pRunstageCharacteristic->setValue(data, sizeof(data));
        pRunstageCharacteristic->notify();
        lastNotifiedRunstage = runningStage;
    }
}

void updateLoopCount() {
    static int lastNotifiedLoopCount = -1;
    if(loopCount != lastNotifiedLoopCount) {
        uint8_t data[2];
        data[0] = (uint8_t) (loopCount & 0xFF);
        data[1] = (uint8_t) ((loopCount >> 8) & 0xFF);

        pLoopCountCharacteristic->setValue(data, sizeof(data));
        pLoopCountCharacteristic->notify();
        lastNotifiedLoopCount = loopCount;
    }
}


void setup() {
  initNimbleSDK();
  Serial.begin(19200);
  BLEDevice::init(DEVICE_NAME);
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ |
                      BLECharacteristic::PROPERTY_WRITE
                    );
  pCharacteristic->addDescriptor(new BLE2902());
  pCharacteristic->setCallbacks(new MyCallbacks());
  // Create a characteristic for runstage notifications
  pRunstageCharacteristic = pService->createCharacteristic(
                                RUNSTAGE_CHARACTERISTIC_UUID,
                                BLECharacteristic::PROPERTY_NOTIFY
                             );
  pRunstageCharacteristic->addDescriptor(new BLE2902());
  pLoopCountCharacteristic = pService->createCharacteristic(
                                LOOP_COUNT_CHARACTERISTIC_UUID,
                                BLECharacteristic::PROPERTY_NOTIFY
                             );
  pLoopCountCharacteristic->addDescriptor(new BLE2902());
  pVersionCharacteristic = pService->createCharacteristic(
                                VERSION_CHARACTERISTIC_UUID,
                                BLECharacteristic::PROPERTY_READ
                             );
  pVersionCharacteristic->setValue(HW_VERSION);
  pService->start();
  pServer->getAdvertising()->start();
  Serial.println("Ready To Connect...");
}

void bt_status_led(){
  if (pServer != nullptr && !pServer->getConnectedCount()) {
    if ((millis() / 1000) % 2 == 0) {
      ledcWrite(10, 10);
    } else {
      ledcWrite(10, 0);
    }
  } else {
    ledcWrite(10, 50);
  }
}

void sinc_state_leds(){
  int airInValue = airIn ? 50 : 0;
  int airOutValue = airOut ? 50 : 0;
  int runningValue = runningStage > 0 ? 50 : 0;
  ledcWrite(2, runningValue);
  ledcWrite(5, airInValue);
  ledcWrite(7, airOutValue);
  pendant.present ? ledcWrite(PEND_LED, 50) : ledcWrite(PEND_LED, 0);  // Display pendant connection status on LED.
  actuator.present ? ledcWrite(ACT_LED, 50) : ledcWrite(ACT_LED, 0);  // Display actuator connection status on LED.
}

void sinc_actuator_values(){
  actuator.forceCommand = 1023;
  actuator.positionCommand = positionCommand;
  actuator.airIn = airIn;
  actuator.airOut = airOut;
}

void loop() {
  bt_status_led();
  if (!defaultsSet){
    return;
  }

  sinc_state_leds();
  sinc_actuator_values();
  runMainOperation();
  updateRunstage();
  updateLoopCount();
  if (!running){
    runningStage = 0;
  }
  
  // readFromAct(); // Read values from actuator. If the function returns true, the values were updated. Otherwise there was nothing new.

// ***************** Do stuff to the values to be sent above this line. Use no delays.

  // Check if it's time to send a packet.
  if(checkTimer()) sendToAct();
}



void runMainOperation() {
  switch (runningStage) {
    case 0:
      easeToBasePosition();
      if (running){
        runningStage ++;
      }
      break;
    case 1:
      loopCount = 0;
      updateAllValues();
      waveStartTime = setStartTimeForSineWave(frequency);
      easeToBasePosition();
      if (inBasePosition){
        runningStage ++;
      }
      break;
      
    case 2:
      // Run Loop stage until loopCount >= loopCap then move to case 3
      // updatePositionCommand(waveStartTime,30,0,minPosition,maxPosition);
      updatePositionCommand(waveStartTime,minPosition,maxPosition);
      if (loopCount > loopCap){
        runningStage ++;
      }
      break;
      
    case 3:
      waveStopTime = millis();
      runningStage ++;
      break;

    case 4:
      // remin here until millis() - stopTime > pauseTime and then move back to case 1
      easeToBasePosition();
      if (millis() - waveStopTime >= loopDelay){
        runningStage = 1;
      }
      break;
      
    default:
      break;
  }
}



void easeToBasePosition() {
    minPosition = targetMinPosition;
    maxPosition = targetMaxPosition;
    static unsigned long lastUpdateTime = 0; // Static to maintain state across function calls
    unsigned long updateInterval = 10; // Time interval in ms between position updates
    int maxTravelDistance = abs(maxPosition - minPosition);
    int stepSize = maxTravelDistance / (1000 / updateInterval); // Calculate step size
    // Ensure step size is at least 1
    if (stepSize < 1) stepSize = 1;
    if (millis() - lastUpdateTime > updateInterval) {
        inBasePosition = false;
        if (positionCommand > minPosition + 10) {
            // Decrease positionCommand if it is more than 10 above minPosition
            positionCommand -= stepSize;
            if (positionCommand < minPosition) {
                positionCommand = minPosition; // Ensure not to go below minPosition
            }
        } else if (positionCommand < minPosition - 10) {
            // Increase positionCommand if it is more than 10 below minPosition
            positionCommand += stepSize;
            if (positionCommand > minPosition) {
                positionCommand = minPosition; // Ensure not to go above minPosition
            }
        } else {
          inBasePosition = true;
        }

        lastUpdateTime = millis(); // Update the last update time
    }
}

// Global variables
float prevSineWave = 2.0; // Initialize to a value outside the sine wave range
const float minThreshold = -0.99; // Threshold close to the minimum value

void updatePositionCommand(long startTime, int minValue, int maxValue) {
    long currentTime = millis() - startTime;
    // Calculate the phase
    float phase = TWO_PI * frequency * currentTime / 1000.0;
    // Calculate current sine wave value
    float currentSineWave = sin(phase);
    positionCommand = minValue + (maxValue - minValue) * (currentSineWave + 1) / 2;
    // Detect passing the bottom of the wave (close to minimum value)
    if (prevSineWave < minThreshold && currentSineWave >= minThreshold) {
        loopCount++;
    }
    // Update prevSineWave for the next cycle
    prevSineWave = currentSineWave;
}

void updateAllValues(){
  minPosition = targetMinPosition;
  maxPosition = targetMaxPosition;
  speed = targetSpeed;
  frequency = mapSpeedToFrequency(speed);
}


// Function to set the start time for the sine wave
// This function assumes that the sine wave should start at its minimum value
long setStartTimeForSineWave(float fq) {
    // Phase corresponding to the minimum of the sine wave
    float initialPhase = -PI / 2; // Sine wave at its minimum
    // Get the current time
    long currentTime = millis();
    // Adjust startTime so that the sine wave starts at its minimum
    long calculatedStartTime = currentTime - (initialPhase / (TWO_PI * fq)) * 1000.0;
    return calculatedStartTime;
}


float mapSpeedToFrequency(int speed) {
    if (speed <= 0) {
        return 0.0; // Off
    } else if (speed >= 100) {
        return 5.0; // Maximum frequency
    } else {
        // Quadratic mapping
        float rtn_speed = (1.0 / 5000.0) * speed * speed + (3.0 / 100.0) * speed;
        return rtn_speed < 0.1 ? 0.1 : rtn_speed;
    }
}

