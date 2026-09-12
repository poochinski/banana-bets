import React from "react";
import MatchupRetroPage from "./MatchupRetroPage";
import MatchupApiV2Insights from "./MatchupApiV2Insights";
import MatchupHelmetDirectLoader from "./MatchupHelmetDirectLoader";
import "./MatchupIntegratedFlow.css";

export default function MatchupBreakdownPage(props) {
  return (
    <>
      <MatchupRetroPage {...props} />
      <MatchupHelmetDirectLoader rows={props.rows || []} />
      <MatchupApiV2Insights {...props} />
    </>
  );
}
