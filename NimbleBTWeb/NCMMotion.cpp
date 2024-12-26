#include "NCMMotion.h"
#include <Arduino.h>

NCMMotion::NCMMotion() {
  loopCount = 0;
  isFirstCall = true;
  inBasePosition = false;
  easeToBaseEnabled = true;
  positionCommand = 0;
  lastMovement = 0;
  setMaxFrequency(5);
  // Initialize default modulation parameters
  minModChange = 0.0f; //0.0f
  maxModChange = 0.0f; //0.0f
  minUpDownSpeed = 1.0f; //1.0f
  maxUpDownSpeed = 1.0f; //1.0f
  minShapeMod = 1.0f; //1.0f
  maxShapeMod = 1.0f; //1.0f
  modulationInterval = 1000; // Default interval in milliseconds
}

void NCMMotion::begin() {
  // Initialize the library, if needed
}

void NCMMotion::setRawPosition(long position) {
  easeToBaseEnabled = false;
  inBasePosition = true;
  targetPosition = constrain(position, -1000, 1000);
}

void NCMMotion::easingHelper() {
    if (easeToBaseEnabled) return; // Skip easing if another mode is active

    static unsigned long lastUpdateTime = 0; // Last update time in microseconds
    const unsigned long stepInterval = 100; // Time between steps in microseconds (1ms)
    const int stepSize = 2; // Increment/decrement size
    unsigned long currentTime = micros();
    if (currentTime - lastUpdateTime >= stepInterval) {
        lastUpdateTime = currentTime;
        if (positionCommand < targetPosition) {
            positionCommand += stepSize;
            if (positionCommand > targetPosition) { // Prevent overshooting
                positionCommand = targetPosition;
            }
        } else if (positionCommand > targetPosition) {
            positionCommand -= stepSize;
            if (positionCommand < targetPosition) { // Prevent overshooting
                positionCommand = targetPosition;
            }
        }
        // Optional: Add any end-of-easing logic here when target is reached
        if (positionCommand == targetPosition) {
            // Easing complete
        }
    }
}



void NCMMotion::setMinPosition(long position) {
  targetMinPosition = constrain(position, -1000, 1000);
}

void NCMMotion::setMaxPosition(long position) {
  targetMaxPosition = constrain(position, -1000, 1000);
}

void NCMMotion::setSpeed(int speed) {
  frequency = mapSpeedToFrequency(speed);
}

void NCMMotion::generateSineWave() {
  static float prevSineWave = 2.0; // Initialize to a value outside the sine wave range
  const float minThreshold = -0.99; // Threshold close to the minimum value
  static unsigned long lastGenUpdateTime;
  static float phase;

  unsigned long currentTime = millis();
  easeMinMaxValues();
  if (isFirstCall) {
    lastGenUpdateTime = millis();
    phase = 3 * PI / 2; // Set phase to 3PI/2 to start at the minimum position
    isFirstCall = false;
  }
  float timeElapsed = (currentTime - lastGenUpdateTime) / 1000.0; // Time in seconds
  lastGenUpdateTime = currentTime;
  lastMovement = currentTime;
  float phaseIncrement = 2 * PI * frequency * timeElapsed;
  phase += phaseIncrement;
  if (phase > 2 * PI) {
    phase -= 2 * PI; // Keep phase within a 0-2PI range
  }
  float sineVal = sin(phase);
  long output = minPosition + (sineVal + 1) * (maxPosition - minPosition) / 2;
  if (prevSineWave < minThreshold && sineVal >= minThreshold) {
    loopCount++;
  }
  prevSineWave = sineVal;
  positionCommand = output;
}


void NCMMotion::generateRandomWave() {
    static float prevWaveValue = 2.0; // Initialize outside typical wave range
    const float minThreshold = -0.95; // Threshold close to the minimum value
    static unsigned long lastGenUpdateTime;
    static float phase;
    static float upSpeedMod = 1.0; // Modulation for upward velocity
    static float downSpeedMod = 1.0; // Modulation for downward velocity
    static float shapeMod = 1.0; // Modulation for wave shape

    unsigned long currentTime = millis();
    if (isFirstCall) {
        lastGenUpdateTime = currentTime;
        phase = 3 * PI / 2; // Start at the minimum position
        upSpeedMod = 1.0;
        downSpeedMod = 1.0;
        shapeMod = 1.0;
        isFirstCall = false;
    }

    float timeElapsed = (currentTime - lastGenUpdateTime) / 1000.0; // Time in seconds
    lastGenUpdateTime = currentTime;
    lastMovement = currentTime;

    // Randomly modulate speeds and shape over time
    static unsigned long lastModulationTime = 0;
    if (currentTime - lastModulationTime > modulationInterval) { // Update modulation every interval
        upSpeedMod += (random(-100, 100) / 100.0f) * maxModChange;
        downSpeedMod += (random(-100, 100) / 100.0f) * maxModChange;
        shapeMod += (random(-100, 100) / 100.0f) * minModChange;

        // Clamp modulations to avoid extreme values
        upSpeedMod = constrain(upSpeedMod, minUpDownSpeed, maxUpDownSpeed);
        downSpeedMod = constrain(downSpeedMod, minUpDownSpeed, maxUpDownSpeed);
        shapeMod = constrain(shapeMod, minShapeMod, maxShapeMod);

        lastModulationTime = currentTime;
    }

    // Calculate the phase increment with separate up and down speeds
    float speedMod = (sin(phase) >= 0) ? upSpeedMod : downSpeedMod;
    float phaseIncrement = 2 * PI * frequency * timeElapsed * speedMod;
    phase += phaseIncrement;
    if (phase > 2 * PI) {
        phase -= 2 * PI; // Keep phase within a 0-2PI range
    }

    // Generate a more complex waveform by modulating the sine wave
    float baseWave = sin(phase);
    float modulatedWave = baseWave * shapeMod + cos(phase * shapeMod) * (1 - shapeMod);

    // Map the wave to the output range
    long output = minPosition + (modulatedWave + 1) * (maxPosition - minPosition) / 2;

    // Count loops when crossing the minimum threshold
    if (prevWaveValue < minThreshold && modulatedWave >= minThreshold) {
        loopCount++;
    }
    prevWaveValue = modulatedWave;

    // Set the position command
    positionCommand = output;
}



void NCMMotion::easeToBasePosition() {
  if (!easeToBaseEnabled) {
    return;
  }
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
          // Decrease positionCommand if it is more than 10 above minPosition (added some lee way to avoid bouncing)
          positionCommand -= stepSize;
          if (positionCommand < minPosition) {
              positionCommand = minPosition; // Ensure not to go below minPosition
          }
      } else if (positionCommand < minPosition - 10) {
          // Increase positionCommand if it is more than 10 below minPosition (added some lee way to avoid bouncing)
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

int NCMMotion::getLoopCount() {
  return loopCount;
}

long NCMMotion::getPositionCommand() {
  return positionCommand;
}

bool NCMMotion::isInBasePosition() {
  return inBasePosition;
}

long NCMMotion::timeSinceLastMovement() {
  //lastMovement is updated every cycle of generateSineWave, timeSinceLastMovement can be used to track how long we have been paused
  return millis() - lastMovement;
}

void NCMMotion::resetLoopCounter() {
  loopCount = 0;
}

void NCMMotion::resetFirstCall() {
  isFirstCall = true;
}

void NCMMotion::enableEaseToBaseWhileStopped() {
  easeToBaseEnabled = true;
  inBasePosition = false;
}

float NCMMotion::mapSpeedToFrequency(int speed) {
    if (speed <= 0) {
        return 0.0; // Off
    } else if (speed >= 100) {
        return maxFrequency; // Maximum frequency
    } else {
        // Quadratic mapping using user-specified coefficients
        float rtn_speed = (0.0001 * maxFrequency) * speed * speed;
        return rtn_speed < 0.1 ? 0.1 : rtn_speed;
    }
}

void NCMMotion::easeMinMaxValues() {
    static int lastEaseTime = 0;
    int easeInterval = 10; //Ease Every 10ms
    if(millis() - lastEaseTime >= easeInterval) {
        minPosition += (targetMinPosition > minPosition) ? 10 : (targetMinPosition < minPosition) ? -10 : 0;
        maxPosition += (targetMaxPosition > maxPosition) ? 10 : (targetMaxPosition < maxPosition) ? -10 : 0;
        lastEaseTime = millis();
    }
}

void NCMMotion::setMaxFrequency(float maxHz) {
    if (maxHz > 0.0) {
        maxFrequency = maxHz;
    }
}








void NCMMotion::setMinModChange(float value) {
    minModChange = value;
}

void NCMMotion::setMaxModChange(float value) {
    maxModChange = value;
}

void NCMMotion::setMinUpDownSpeed(float value) {
    minUpDownSpeed = value;
}

void NCMMotion::setMaxUpDownSpeed(float value) {
    maxUpDownSpeed = value;
}

void NCMMotion::setMinShapeMod(float value) {
    minShapeMod = value;
}

void NCMMotion::setMaxShapeMod(float value) {
    maxShapeMod = value;
}

void NCMMotion::setModulationInterval(unsigned long interval) {
    modulationInterval = interval;
}
