import { BrowserRouter as Router } from "react-router-dom";
import AppLayout from "./AppLayout"; // This is your new main logic file (see below)

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
export default App;
