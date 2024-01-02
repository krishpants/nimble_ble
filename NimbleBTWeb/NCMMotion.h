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

  // Main functions
  void generateSineWave();
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
  float frequency; // Set After Converstion map 0-100 > 0 - maxFrequency HZ

  // Eased Variables
  long minPosition;
  long maxPosition;
  
  // Data Variables
  int loopCount;
  bool isFirstCall;
  bool inBasePosition;
  long positionCommand;
  long lastMovement;
  
  //Map Speed Variables
  float maxFrequency; // Maximum frequency in Hz

  // Helper functions
  float mapSpeedToFrequency(int speed);
  void easeMinMaxValues();

};

#endif
