import { useEffect } from "react";

export default function iPhoneControl() {

  return (
    <div>
      <h2>iPhone Control</h2>
      <div id="noVNC" style={{ width: '100%', height: '500px' }}></div> {/* Display the iPhone screen here */}
    </div>
  );
}
