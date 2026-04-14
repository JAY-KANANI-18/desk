import { AppProviders } from "./providers/AppProviders";
import { AppGate } from "./router/AppGate";
import { BrowserRouter as Router } from "react-router-dom";
import { PwaLifecycle } from "./components/pwa/PwaLifecycle";

export const App = () => {
  return (
    <Router>
      <AppProviders>
        <PwaLifecycle />
        <AppGate />
      </AppProviders>
    </Router>
  );
};
