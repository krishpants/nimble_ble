import React, { useEffect } from 'react';

const WebSocketComponent = ({eomSpeed,setEomSpeed}) => {
  useEffect(() => {
    const socket = new WebSocket('ws://192.168.1.31:80');
    // const socket = new WebSocket('wss://eom3k');
    // WebSocket event handlers
    socket.onopen = (event) => {
      console.log('WebSocket connection opened:', event);
      // You can perform actions when the connection is established here.
    };
    socket.onmessage = (event) => {
      try {
        var eventData = JSON.parse(event.data);
        setEomSpeed(eventData.readings.motor);
      } catch (error) {
        console.error('Error parsing event data:', error);
        console.log('Received event:', event);
      }
    };
    socket.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
      // Handle WebSocket connection close here.
    };
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Handle WebSocket errors here.
    };
    // Don't forget to close the WebSocket connection when the component unmounts.
    return () => {
      socket.close();
    };
  }, []);

  return (
    <div>
      {eomSpeed}
    </div>
  );
}

export default WebSocketComponent;
