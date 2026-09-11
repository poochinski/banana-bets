import React from "react";
import MatchupRetroPage from "./MatchupRetroPage";
import MatchupApiV2Insights from "./MatchupApiV2Insights";
import MatchupHelmetAssetBridge from "./MatchupHelmetAssetBridge";
import "./MatchupIntegratedFlow.css";

export default function MatchupBreakdownPage(props) {
  return (
    <>
      <MatchupRetroPage {...props} />
      <MatchupHelmetAssetBridge {...props} />
      <MatchupApiV2Insights {...props} />
    </>
  );
}
