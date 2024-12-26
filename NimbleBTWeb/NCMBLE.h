#ifndef NCMBLE_H
#define NCMBLE_H

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>
#include <string>
#include <sstream>
#include <vector>
#include "NCMMotion.h" // Include the header for NCMMotion

class NCMBLE {
public:
    NCMBLE(NCMMotion& motionInstance); // Accept a reference to NCMMotion
    void begin();
    bool isConnected();
    void sendEncoderDirection(const char* direction);
    void sendButtonValue(int buttonValue);
    void updateLoopCount();
    void updateRunstage(int runningStage);
    bool defaultsSet;
    bool running;
    bool airIn;
    bool airOut;
    int loopCap;
    long loopDelay;

private:
    std::string HW_VERSION = "0.06";
    BLECharacteristic *pVersionCharacteristic;
    BLECharacteristic *pVariablesCharacteristic;
    BLECharacteristic *pRunstageCharacteristic;
    BLECharacteristic *pLoopCountCharacteristic;
    BLECharacteristic *pEncoderCharacteristic;
    BLECharacteristic *pButtonCharacteristic;
    BLECharacteristic *pModulationCharacteristic;
    BLECharacteristic *pRawPositionCharacteristic;
    BLEServer *pServer;
    BLEService *pService;

    // Define UUIDs as class constants
    static constexpr char* SERVICE_UUID = "8143e16b-5798-407d-9535-c8f93fc37368";
    static constexpr char* CHARACTERISTIC_UUID = "48b98d5e-9bdd-412a-9b1b-92dcb593c313";
    static constexpr char* VERSION_CHARACTERISTIC_UUID = "4ecc1cb6-38c4-46f5-aaf5-549285f46cf1";
    static constexpr char* RUNSTAGE_CHARACTERISTIC_UUID = "2e125644-ce12-4fbd-9589-596e544a4f17";
    static constexpr char* LOOP_COUNT_CHARACTERISTIC_UUID = "03f779e0-65b8-4dbf-a984-637d02b8c07c";
    static constexpr char* ENCODER_CHARACTERISTIC_UUID = "1a08f9e4-30b2-4d41-ad4e-330a1cc8311a";
    static constexpr char* BUTTON_CHARACTERISTIC_UUID = "1997a6f1-8ab7-4036-82e4-a198e6dfcc52";
    static constexpr char* MODULATION_VARIABLES_CHARACTERISTIC_UUID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    static constexpr char* RAW_POSITION_CHARACTERISTIC_UUID = "782423b4-e5bf-4754-b66d-362966e264d2";
    static constexpr char* DEVICE_NAME = "Nimble_BT";

    // Reference to NCMMotion instance
    NCMMotion& motionInstance;

    // Callback class for BLEServer
    class MyServerCallbacks : public BLEServerCallbacks {
        void onConnect(BLEServer* pServer) override;
        void onDisconnect(BLEServer* pServer) override;
    };

    // Callback class for pVariablesCharacteristic
    class MyCallbacks : public BLECharacteristicCallbacks {
        NCMBLE& ncmbInstance; // Reference to NCMBLE

    public:
        MyCallbacks(NCMBLE& instance) : ncmbInstance(instance) {} // Constructor to initialize the reference
        void onWrite(BLECharacteristic *pVariablesCharacteristic) override;
    };

    // Callback class for pModulationCharacteristic
    class ModulationCallback : public BLECharacteristicCallbacks {
        NCMBLE& ncmbInstance; // Reference to NCMBLE

    public:
        ModulationCallback(NCMBLE& instance) : ncmbInstance(instance) {} // Constructor to initialize the reference
        void onWrite(BLECharacteristic *pModulationCharacteristic) override;
    };

    // Callback class for pModulationCharacteristic
    class RawPositionCallback : public BLECharacteristicCallbacks {
        NCMBLE& ncmbInstance; // Reference to NCMBLE

    public:
        RawPositionCallback(NCMBLE& instance) : ncmbInstance(instance) {} // Constructor to initialize the reference
        void onWrite(BLECharacteristic *pRawPositionCharacteristic) override;
    };

};

#endif
