#ifndef NCMMotion_h
#define NCMMotion_h

class NCMMotion {
public:
  NCMMotion(); // Constructor

  void begin(); // Initialize the library

  // Setters for values
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


  // Main functions
  void generateSineWave();
  void generateRandomWave();
  void easeToBasePosition();

  // Reset functions
  void resetLoopCounter();
  void resetFirstCall();

  // Getters
  int getLoopCount();
  bool isInBasePosition();
  long getPositionCommand();
  long timeSinceLastMovement();

private:
  // Set variables
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

  
  // Helper functions
  float mapSpeedToFrequency(int speed);
  void easeMinMaxValues();
};

#endif
