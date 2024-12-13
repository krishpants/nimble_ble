#include "NCMBLE.h"
#include <Arduino.h>

NCMBLE::NCMBLE(NCMMotion& motionInstance) : motionInstance(motionInstance) {
    defaultsSet = false;
    airIn = false;
    airOut = false;
}

void NCMBLE::begin() {
    // Initialize BLE and set up characteristics and services
    BLEDevice::init(DEVICE_NAME);
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());
    pService = pServer->createService(BLEUUID(SERVICE_UUID), 30, 0);

    // Create and set up characteristics
    pVersionCharacteristic = pService->createCharacteristic(
        VERSION_CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ
    );
    pVersionCharacteristic->setValue(HW_VERSION);

    pVariablesCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |
        BLECharacteristic::PROPERTY_WRITE
    );
    pVariablesCharacteristic->addDescriptor(new BLE2902());
    pVariablesCharacteristic->setCallbacks(new MyCallbacks(*this));


    pModulationCharacteristic = pService->createCharacteristic(
        MODULATION_VARIABLES_CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |
        BLECharacteristic::PROPERTY_WRITE
    );
    pModulationCharacteristic->addDescriptor(new BLE2902());
    pModulationCharacteristic->setCallbacks(new ModulationCallback(*this));

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

    pButtonCharacteristic = pService->createCharacteristic(
        BUTTON_CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_NOTIFY
    );
    pButtonCharacteristic->addDescriptor(new BLE2902());

    pEncoderCharacteristic = pService->createCharacteristic(
        ENCODER_CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_NOTIFY
    );
    pEncoderCharacteristic->addDescriptor(new BLE2902());

    pService->start();
    pServer->getAdvertising()->start();
}

bool NCMBLE::isConnected() {
    if (pServer != nullptr && !pServer->getConnectedCount()) {
        return false;
    }
    return true;
}


// Implement callback functions

void NCMBLE::MyServerCallbacks::onConnect(BLEServer* pServer) {
    // Serial.println("Client connected.");
    pServer->getAdvertising()->stop();
}

void NCMBLE::MyServerCallbacks::onDisconnect(BLEServer* pServer) {
    // Serial.println("Client disconnected. Restarting advertising...");
    delay(500); // Short delay
    pServer->getAdvertising()->start();
}

void NCMBLE::MyCallbacks::onWrite(BLECharacteristic *pVariablesCharacteristic) {
    std::string value = pVariablesCharacteristic->getValue();
    // Split the string by commas and store the parts in a vector
    std::vector<std::string> parts;
    std::stringstream valueStream(value);
    std::string part;
    while (std::getline(valueStream, part, ',')) {
        parts.push_back(part);
    }
    if (parts.size() != 8) {
        // Serial.println("Handle error: the received string does not have the expected number of parts");
        return;
    }

    // Convert each part to the correct type and assign to variables
    try {
        ncmbInstance.running = std::stoi(parts[0]) != 0; // Convert to bool
        ncmbInstance.motionInstance.setSpeed(std::stoi(parts[1]));
        ncmbInstance.motionInstance.setMinPosition(std::stol(parts[2]));
        ncmbInstance.motionInstance.setMaxPosition(std::stol(parts[3]));
        ncmbInstance.loopCap = std::stoi(parts[4]); // Convert to int
        ncmbInstance.loopDelay = std::stol(parts[5]); // Convert to long
        ncmbInstance.airIn = std::stoi(parts[6]) != 0; // Convert to bool
        ncmbInstance.airOut = std::stoi(parts[7]) != 0; // Convert to bool
        ncmbInstance.defaultsSet = true;
    } catch (const std::invalid_argument& e) {
        // Serial.println("Handle error: one of the parts could not be converted to the correct type");
        return;
    }
}

void NCMBLE::ModulationCallback::onWrite(BLECharacteristic *pModulationCharacteristic) {
    std::string value = pModulationCharacteristic->getValue();
    // Split the string by commas and store the parts in a vector
    std::vector<std::string> parts;
    std::stringstream valueStream(value);
    std::string part;
    while (std::getline(valueStream, part, ',')) {
        parts.push_back(part);
    }
    if (parts.size() != 7) {        return;
    }

    // Convert each part to the correct type and assign to variables
    try {
        ncmbInstance.motionInstance.setMinModChange(std::stof(parts[0]));
        ncmbInstance.motionInstance.setMaxModChange(std::stof(parts[1]));
        ncmbInstance.motionInstance.setMinUpDownSpeed(std::stof(parts[2]));
        ncmbInstance.motionInstance.setMaxUpDownSpeed(std::stof(parts[3]));
        ncmbInstance.motionInstance.setMinShapeMod(std::stof(parts[4]));
        ncmbInstance.motionInstance.setMaxShapeMod(std::stof(parts[5]));
        ncmbInstance.motionInstance.setModulationInterval(std::stoi(parts[6]));
    } catch (const std::invalid_argument& e) {
        return;
    }
}


void NCMBLE::sendEncoderDirection(const char* direction) {
    static unsigned long lastUpdateTime = 0;
    if (millis() - lastUpdateTime >= 100) {
        pEncoderCharacteristic->setValue(direction);
        pEncoderCharacteristic->notify();
        lastUpdateTime = millis();
    }
}

void NCMBLE::sendButtonValue(int buttonValue) {
    static int lastNotifiedButtonValue = -1;
    if(buttonValue != lastNotifiedButtonValue) {
        uint8_t data[2];
        data[0] = (uint8_t) (buttonValue & 0xFF);
        data[1] = (uint8_t) ((buttonValue >> 8) & 0xFF);

        pButtonCharacteristic->setValue(data, sizeof(data));
        pButtonCharacteristic->notify();
        lastNotifiedButtonValue = buttonValue;
    }
}

void NCMBLE::updateLoopCount() {
    static int lastNotifiedLoopCount = -1;
    int loopCount = motionInstance.getLoopCount();
    if(loopCount != lastNotifiedLoopCount) {
        uint8_t data[2];
        data[0] = (uint8_t) (loopCount & 0xFF);
        data[1] = (uint8_t) ((loopCount >> 8) & 0xFF);

        pLoopCountCharacteristic->setValue(data, sizeof(data));
        pLoopCountCharacteristic->notify();
        lastNotifiedLoopCount = loopCount;
    }
}

void NCMBLE::updateRunstage(int runningStage) {
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
