import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import TripPlannerApp from "../app/trip-planner";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TripPlannerApp />
  </StrictMode>,
);
