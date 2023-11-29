# nimble_ble
Nimble Controller - BLE Web App

## Getting Started:
Upload the NimbleBTWeb.ino sketch to your Nimble Control Module using the Arduino IDE
Note: you may need to change the partition scheme to 2mb/2mb as the blt libraries included are quite large and do not fit on the default partition scheme for the ESP32 Dev Module that the Arduino IDE default to.

On successfully upload the, the blue led on the Nimble Control Module will flash indicating it is awaiting a ble connection.

## Usage:
The web app can be found at https://www.jrk-it.com/nimble_controller

Note: the Web Bluetooth API is not supported across all browsers. The only browser this is confirmed to be working on is Chrome Desktop. There maybe some mobile browsers which support it but native Safari on iOS does not. Not tested on android.
Note: If the hardware sketch is updated I will change the version on the React app and you will need to update your Nimble Controll module before you can reconnect.

The current web app provides the following functionality:
Range Slider - Controlls the top and bottom movement range
Speed Slider - Sets the stroke speed
Play/Pause
When playing the nimble will stroke between the points on the range slider for X Strokes and then pause for Y Seconds as set by the 2 lower inputs.
AirIn/AirOut - buttons are found in the lower right.

When paused the reciever will ease to the base position to limit slip off.

If you want continuous stroking a delay of 0s can be used.
Note: currently perameters are only adjusted during the pause phase to avoid the reciever jumping location. Next step will be to work on real time adjustability of Speed and Range while keeping a smooth opperation.

## Advanced Usage:
ESP Sketch
Adjusting the lower part of the sketch is possible without changing the web app as long as the web app's communication structure does not need to be adjusted. If you need to change parts of the communication protocol then you will need to edit the react component. 
React Component
This is supplied as just a single file, you will need to serve this via a react app and set this up yourself and then render the component supplied as a startign point. You must also have HTTPS enabled even on local host as the Web Bluetooth API requires this before it will connect to devices.

## Trouble Shooting
Some controll changes during motion may result in jumpy movements, this is on my priority fix list
You may need to enable Web Bluetooth API as an experimental feature in chrome before you can connect

Device not showing up in bluetooth menu on computer?
BLE communications will not appear in an OS bluetooth menu and there is no "Pairing" stage as such. connection is done directly from the browser window and the ESP should be presented when clicking the BT connect button on page load if it is on and waiting for a connection.
