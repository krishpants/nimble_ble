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
#define ENCODER_CHARACTERISTIC_UUID "1a08f9e4-30b2-4d41-ad4e-330a1cc8311a"
#define DEVICE_NAME "Nimble_BT"

std::string HW_VERSION = "0.03";

// Set By App
bool running;
int targetSpeed; //0-100
float targetFrequency;
long targetMinPosition; // -1000 > 1000 & < targetMaxPosition
long targetMaxPosition; // -1000 > 1000 & > targetMinPosition
int loopCap;
long loopDelay;
bool airIn;
bool airOut;

// Intenral variables to prevent jumping on update

long minPosition;
long maxPosition;
float frequency;

bool inBasePosition = false;
int loopCount = 0;
long waveStartTime = 0;
long waveStopTime = 0;
int runningStage = 0;
long positionCommand = 0;

bool defaultsSet = false;

// COntrols
int encoderValue = 0;

// Generate Sin Wave Version
unsigned long lastGenUpdateTime;
float phase = 0.0;
bool isFirstCall = true;


BLECharacteristic *pVersionCharacteristic;
BLECharacteristic *pCharacteristic;
BLECharacteristic *pRunstageCharacteristic;
BLECharacteristic *pLoopCountCharacteristic;
BLECharacteristic *pEncoderCharacteristic;
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
            targetFrequency = mapSpeedToFrequency(targetSpeed);
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

void sendEncoderValue() {
    static int lastNotifiedEncoderValue = -1;
    if(encoderValue != lastNotifiedEncoderValue) {
        uint8_t data[2];
        data[0] = (uint8_t) (encoderValue & 0xFF);
        data[1] = (uint8_t) ((encoderValue >> 8) & 0xFF);

        pEncoderCharacteristic->setValue(data, sizeof(data));
        pEncoderCharacteristic->notify();
        lastNotifiedEncoderValue = encoderValue;
    }
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
  pEncoderCharacteristic = pService->createCharacteristic(
                                ENCODER_CHARACTERISTIC_UUID,
                                BLECharacteristic::PROPERTY_NOTIFY
                             );
  pEncoderCharacteristic->addDescriptor(new BLE2902());
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



// Global variables
long lastEncoderPosition = 0;  // Variable to store the last encoder position

void updateEncoderValue() {
    static unsigned long lastUpdateTime = 0;
    long currentEncoderPosition = encoder.getCount();
    
    if (millis() - lastUpdateTime > 50) {  // 50ms debounce interval
        if (currentEncoderPosition > lastEncoderPosition) {
            if (encoderValue < 100) {  // Ensure encoderValue does not exceed 100
                encoderValue+= 5;
                sendEncoderValue();
            }
        } else if (currentEncoderPosition < lastEncoderPosition) {
            if (encoderValue > 0) {  // Ensure encoderValue does not go below 0
                encoderValue-= 5;
                sendEncoderValue();
            }
        }
        lastEncoderPosition = currentEncoderPosition;
        lastUpdateTime = millis();
    }
}

unsigned long encPreviousMillis = 0;
void decreaseEncoderValueNonBlocking() {
  return;
  unsigned long currentMillis = millis();

  if (currentMillis - encPreviousMillis >= 2500) {
    // save the last time the encoder was updated
    encPreviousMillis = currentMillis;

    if (encoderValue > 0) {
      encoderValue-= 3;
      sendEncoderValue();
    }
  }
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
  updateEncoderValue(); 
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
      decreaseEncoderValueNonBlocking();
      if (running){
        runningStage ++;
      }
      break;
    case 1:
      easeToBasePosition();
      decreaseEncoderValueNonBlocking();
      if (inBasePosition){
        loopCount = 0;
        isFirstCall = true;
        runningStage ++;
      }
      break;
      
    case 2:
      generateSineWave();
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
      decreaseEncoderValueNonBlocking();
      if (millis() - waveStopTime >= loopDelay){
        runningStage = 1;
      }
      break;
      
    default:
      break;
  }
}



void updateAllValues(){
  minPosition = targetMinPosition;
  maxPosition = targetMaxPosition;
  frequency = targetFrequency;
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









// Loop Counting Variables
float prevSineWave = 2.0; // Initialize to a value outside the sine wave range
const float minThreshold = -0.99; // Threshold close to the minimum value

void generateSineWave() {

  easeMinMaxValues();

  if (targetFrequency != frequency) {
    frequency = targetFrequency;
  }

  // Check if first call
  if (isFirstCall) {
    lastGenUpdateTime = millis();
    phase = 3 * PI / 2; // Set phase to 3PI/2 to start at the minimum position
    isFirstCall = false;
  }

  unsigned long currentTime = millis();
  float timeElapsed = (currentTime - lastGenUpdateTime) / 1000.0; // Time in seconds
  lastGenUpdateTime = currentTime;

  // Calculate phase increment
  float phaseIncrement = 2 * PI * frequency * timeElapsed;

  // Update phase
  phase += phaseIncrement;
  if (phase > 2 * PI) {
    phase -= 2 * PI; // Keep phase within a 0-2PI range
  }

  // Generate sine wave value
  float sineVal = sin(phase);
  // Scale and offset sine wave
  long output = minPosition + (sineVal + 1) * (maxPosition - minPosition) / 2;

  // Check for crossing the threshold
  if (prevSineWave < minThreshold && sineVal >= minThreshold) {
    loopCount++;
  }
  // Update prevSineWave for the next cycle
  prevSineWave = sineVal;
  positionCommand = output;
}

void easeMinMaxValues() {
    static int lastEaseTime = 0;
    int easeInterval = 10; //Ease Every 100ms
    if(millis() - lastEaseTime >= easeInterval) {
        minPosition += (targetMinPosition > minPosition) ? 10 : (targetMinPosition < minPosition) ? -10 : 0;
        maxPosition += (targetMaxPosition > maxPosition) ? 10 : (targetMaxPosition < maxPosition) ? -10 : 0;
        lastEaseTime = millis();
    }
}

