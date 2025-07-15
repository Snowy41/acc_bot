import { useEffect } from "react";

export default function iPhoneControl() {
  useEffect(() => {
    const rfb = new WebSocket('ws://localhost:5000');  // Ensure this URL is correct for Flask WebSocket route
    rfb.onopen = function () {
      console.log('Connected to WebSocket');  // Debug print when WebSocket is connected
      const noVNCContainer = document.getElementById('noVNC');
      if (noVNCContainer) {
        const rfbInstance = new RFB(noVNCContainer, 'ws://localhost:5000');  // Initialize noVNC here
        rfbInstance.viewOnly = false;  // Allow interaction with the iPhone screen
        console.log("noVNC initialized!");  // Debug print when noVNC is initialized
      }
    };

    rfb.onerror = function (error) {
      console.error("WebSocket Error: ", error);  // Log WebSocket errors
    };

    rfb.onclose = function () {
      console.log("WebSocket connection closed");  // Debug print when WebSocket connection is closed
    };
  }, []);

  return (
    <div>
      <h2>iPhone Control</h2>
      <div id="noVNC" style={{ width: '100%', height: '500px' }}></div> {/* Display the iPhone screen here */}
    </div>
  );
}
