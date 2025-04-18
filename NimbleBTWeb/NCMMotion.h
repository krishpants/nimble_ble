#ifndef NCMMotion_h
#define NCMMotion_h

class NCMMotion {
public:
  NCMMotion(); // Constructor

  void begin(); // Initialize the library

  // Setters for values
  void setRawPosition(long position);
  void setMinPosition(long position);
  void setMaxPosition(long position);
  void setSpeed(int speed);
  void setMaxFrequency(float maxHz);

  // Setter functions for modulation parameters
  void setMinModChange(float value);
  void setMaxModChange(float value);
  void setMinUpDownSpeed(float value);
  void setMaxUpDownSpeed(float value);
  void setMinShapeMod(float value);
  void setMaxShapeMod(float value);
  void setModulationInterval(unsigned long interval);


  // Setter functions for vibration parameters
  void setVibrationEasingRate(float value);
  void setTargetVibrationAmplitude(float value);
  void setTargetVibrationFrequency(float value);
  long addVibration(long value);
  void easeVibrationParams();

  // Main functions
  void generateSineWave();
  void generateRandomWave();
  void easeToBasePosition();
  void easingHelper();

  // Reset functions
  void resetLoopCounter();
  void resetFirstCall();
  void enableEaseToBaseWhileStopped();

  // Getters
  int getLoopCount();
  bool isInBasePosition();
  long getPositionCommand();
  long timeSinceLastMovement();

private:
  // Set variables
  long targetPosition;
  long targetMinPosition;
  long targetMaxPosition;
  float frequency; // Set After Conversion map 0-100 > 0 - maxFrequency HZ

  // Eased Variables
  long minPosition;
  long maxPosition;
  
  // Data Variables
  int loopCount;
  bool isFirstCall;
  bool inBasePosition;
  long positionCommand;
  long lastMovement;

  // Map Speed Variables
  float maxFrequency; // Maximum frequency in Hz

  // Waveform Modulation Parameters (with defaults for a normal sine wave)
  float minModChange;
  float maxModChange;
  float minUpDownSpeed;
  float maxUpDownSpeed;
  float minShapeMod;
  float maxShapeMod;
  unsigned long modulationInterval;

  // Vibration Modulation Parameters
  float vibrationEasingRate;
  float targetVibrationFrequency;
  float targetVibrationAmplitude;
  float vibrationAmplitude;   // The smoothed current amplitude
  float vibrationFrequency;   // The smoothed current frequency
  float vibrationPhase;       // To track high-freq vibration phase
  unsigned long lastVibrationUpdate; // Time of last update



  //
  bool easeToBaseEnabled;

  
  // Helper functions
  float mapSpeedToFrequency(int speed);
  void easeMinMaxValues();
};

#endif
