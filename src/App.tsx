import { AppProviders } from "./providers/AppProviders";
import { AppGate } from "./router/AppGate";
import { BrowserRouter as Router } from "react-router-dom";

export const App = () => {
  return (
    <Router>
      <AppProviders>
        <AppGate />
      </AppProviders>
    </Router>
  );
};
