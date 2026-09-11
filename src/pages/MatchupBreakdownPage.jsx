import React from "react";
import MatchupRetroPage from "./MatchupRetroPage";
import MatchupApiV2Insights from "./MatchupApiV2Insights";
import "./MatchupIntegratedFlow.css";

export default function MatchupBreakdownPage(props) {
  return (
    <>
      <MatchupRetroPage {...props} />
      <MatchupApiV2Insights {...props} />
    </>
  );
}
