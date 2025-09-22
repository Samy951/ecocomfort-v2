import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// PWA registration disabled for development
// if ("serviceWorker" in navigator) {
//   navigator.serviceWorker.register("/sw.js").catch((error) => {
//     console.error("Service Worker registration failed:", error);
//   });
// }

// Fix viewport height on mobile devices
const setViewportHeight = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
};

// Set initial viewport height
setViewportHeight();

// Update viewport height on resize
window.addEventListener("resize", setViewportHeight);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);