import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import LiveMarketsBridge from "./LiveMarketsBridge.jsx";
import "./styles.css";
import "./pages/BetBuilderReceipt.css";
import "./pages/BetBuilderReceiptLogo.css";
import "./pages/MatchupBreakdownV2.css";
import "./pages/MatchupRetro.css";
import "./pages/MatchupHybrid.css";
import "./pages/MatchupDirectHelmets.css";
import "./MobileResponsive.css";
import "./IPhoneSafeArea.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <>
      <App />
      <LiveMarketsBridge />
    </>
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.log("Service worker registration skipped:", error);
    });
  });
}
