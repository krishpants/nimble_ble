// Use "ESP32 Dev Module" as board
#include "NCMMotion.h"
#include "NCMBLE.h"
// This goes last or will error
#include "nimbleCon.h"

NCMMotion motion;
NCMBLE ncmb(motion);

int runningStage = 0;

void setup() {
  Serial.begin(115200);
  initNimbleSDK();
  motion.setMaxFrequency(5); // Set in hz of the max speed value of 100(%)
  ncmb.begin();
}


void loop() {
  updateBTStatusLed();
  if (!ncmb.defaultsSet){
    return;
  }
  sinc_state_leds();
  runMainOperation();
  ncmb.updateRunstage(runningStage); //Notifty Run Stage on BT Connection
  ncmb.updateLoopCount(); //Notifty Loop Count on BT Connection
  checkPhysicalInputs(); //And Notifty on BT if needed
  updateProvisionalActuatorValues();

  // From Orginal Nimble SDK Code
  // readFromAct(); // Read values from actuator. If the function returns true, the values were updated. Otherwise there was nothing new.
  // Check if it's time to send a packet.
  if(checkTimer()) sendToAct();
}

void updateProvisionalActuatorValues(){
  actuator.forceCommand = 1023;
  actuator.positionCommand = motion.getPositionCommand();
  actuator.airIn = ncmb.airIn;
  actuator.airOut = ncmb.airOut;
}


void runMainOperation() {
  if (!ncmb.running){
    runningStage = 0;
  }
  switch (runningStage) {
    case 0:
      motion.easeToBasePosition();
      if (ncmb.running){
        runningStage ++;
      }
      break;
    case 1:
      motion.easeToBasePosition();
      if (motion.isInBasePosition()){
        motion.resetLoopCounter();
        motion.resetFirstCall();
        runningStage ++;
      }
      break;
      
    case 2:
      // motion.generateSineWave();
      motion.generateRandomWave();
      if (motion.getLoopCount() > ncmb.loopCap){
        runningStage ++;
      }
      break;
      
    case 3:
      // remin here until millis() - stopTime > pauseTime and then move back to case 1
      motion.easeToBasePosition();
      if (motion.timeSinceLastMovement() >= ncmb.loopDelay){
        runningStage = 1;
      }
      break;
      
    default:
      break;
  }
}



void checkPhysicalInputs(){
  checkEncoderForInput(); 
  checkButtonForInput(); 
}

void checkButtonForInput() {
  static int lastButtonState = HIGH;
  static int buttonValue = 0;
  static unsigned long lastDebounceTime = 0;
  int reading = digitalRead(ENC_BUTT);
  if (reading != lastButtonState) {
    lastDebounceTime = millis();
  }
  if ((millis() - lastDebounceTime) > 50) {
    // Update button value only if it has been stable for debounceDelay time
    if (reading != buttonValue) {
      buttonValue = reading;
      ncmb.sendButtonValue(buttonValue); // Call sendButtonValue only when the button state changes
    }
  }
  lastButtonState = reading;
}

void checkEncoderForInput() {
    static unsigned long lastUpdateTime = 0;
    static unsigned long lastEncoderPosition = 0;
    long currentEncoderPosition = encoder.getCount();
    
    if (millis() - lastUpdateTime > 50) {  // 50ms debounce interval
        if (currentEncoderPosition > lastEncoderPosition) {
            ncmb.sendEncoderDirection("up");
        } else if (currentEncoderPosition < lastEncoderPosition) {
            ncmb.sendEncoderDirection("down");
        }
        lastEncoderPosition = currentEncoderPosition;
        lastUpdateTime = millis();
    }
}




void updateBTStatusLed(){
  if (!ncmb.isConnected()) {
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
  int airInValue = ncmb.airIn ? 50 : 0;
  int airOutValue = ncmb.airOut ? 50 : 0;
  int runningValue = runningStage > 0 ? 50 : 0;
  ledcWrite(2, runningValue);
  ledcWrite(5, airInValue);
  ledcWrite(7, airOutValue);
  pendant.present ? ledcWrite(PEND_LED, 50) : ledcWrite(PEND_LED, 0);  // Display pendant connection status on LED.
  actuator.present ? ledcWrite(ACT_LED, 50) : ledcWrite(ACT_LED, 0);  // Display actuator connection status on LED.
}

