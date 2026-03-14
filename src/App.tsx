import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import ChampionsPage from "./pages/ChampionsPage";
import PredictPage from "./pages/PredictPage";
import TelemetryPage from "./pages/TelemetryPage";
// import ResultsPage from "./pages/ResultsPage";
import StandingsPage from "./pages/StandingsPage";
import "./index.css";

function AppRoutes() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <>
      {!isLanding && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"           element={<LandingPage />} />
          <Route path="/dashboard"  element={<DashboardPage />} />
          <Route path="/history"    element={<DashboardPage />} />
          <Route path="/champions"  element={<ChampionsPage />} />
          <Route path="/predict"    element={<PredictPage />} />
          <Route path="/telemetry"  element={<TelemetryPage />} />
          {/* <Route path="/results"    element={<ResultsPage />} /> */}
          <Route path="/standings"  element={<StandingsPage />} />
          <Route path="*"           element={<DashboardPage />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="scanlines">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}
