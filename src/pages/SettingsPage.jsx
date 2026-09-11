import React, { useEffect, useState } from "react";
import { RotateCcw, Save, CheckCircle2, PlayCircle } from "lucide-react";

const STORAGE_KEY = "banana-bets-settings";

const DEFAULTS = {
  oddsFormat: "american",
  defaultPage: "Dashboard",
  preferredBook: "Any",
  minEv: "0",
  metricDetail: "detailed"
};

function loadSettings() {
  try {
    return {
      ...DEFAULTS,
      ...JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "{}"
      )
    };
  } catch {
    return DEFAULTS;
  }
}

export default function SettingsPage() {
  const [settings, setSettings] =
    useState(loadSettings);

  const [saved, setSaved] =
    useState(false);

  useEffect(() => {
    if (!saved) {
      return undefined;
    }

    const timer = setTimeout(
      () => setSaved(false),
      1800
    );

    return () =>
      clearTimeout(timer);
  }, [saved]);

  function updateSetting(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value
    }));
  }

  function saveSettings() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settings)
    );

    setSaved(true);
  }

  function resetSettings() {
    setSettings(DEFAULTS);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(DEFAULTS)
    );

    setSaved(true);
  }

  return (
    <section className="settings-page">
      <div className="settings-heading">
        <div>
          <span className="product-page-eyebrow">
            PERSONALIZE BANANA BETS
          </span>

          <h1>Settings</h1>

          <p>
            These preferences are stored on this
            browser for now. Account-level settings
            can replace local storage later.
          </p>
        </div>

        <div className="settings-actions">
          <button
            className="settings-button secondary"
            onClick={resetSettings}
          >
            <RotateCcw size={16} />
            Reset
          </button>

          <button
            className="settings-button primary"
            onClick={saveSettings}
          >
            {saved ? (
              <CheckCircle2 size={16} />
            ) : (
              <Save size={16} />
            )}
            {saved ? "Saved" : "Save settings"}
          </button>
        </div>
      </div>

      <div className="settings-grid">
        <section className="panel settings-card">
          <span className="panel-kicker">
            DISPLAY
          </span>
          <h2>Odds & detail</h2>

          <label className="settings-field">
            <span>Odds format</span>
            <select
              value={settings.oddsFormat}
              onChange={(event) =>
                updateSetting(
                  "oddsFormat",
                  event.target.value
                )
              }
            >
              <option value="american">
                American (-110)
              </option>
              <option value="decimal">
                Decimal (1.91)
              </option>
              <option value="probability">
                Implied probability (52.4%)
              </option>
            </select>
          </label>

          <label className="settings-field">
            <span>Metric detail</span>
            <select
              value={settings.metricDetail}
              onChange={(event) =>
                updateSetting(
                  "metricDetail",
                  event.target.value
                )
              }
            >
              <option value="detailed">
                Detailed
              </option>
              <option value="simple">
                Simplified
              </option>
            </select>
          </label>
        </section>

        <section className="panel settings-card">
          <span className="panel-kicker">
            STARTUP
          </span>
          <h2>Default view</h2>

          <label className="settings-field">
            <span>Landing page</span>
            <select
              value={settings.defaultPage}
              onChange={(event) =>
                updateSetting(
                  "defaultPage",
                  event.target.value
                )
              }
            >
              <option>Dashboard</option>
              <option>Game Predictions</option>
              <option>Player Props</option>
              <option>Matchup Breakdown</option>
            </select>
          </label>
        </section>

        <section className="panel settings-card">
          <span className="panel-kicker">
            BETTING PREFERENCES
          </span>
          <h2>Market defaults</h2>

          <label className="settings-field">
            <span>Preferred sportsbook</span>
            <select
              value={settings.preferredBook}
              onChange={(event) =>
                updateSetting(
                  "preferredBook",
                  event.target.value
                )
              }
            >
              <option>Any</option>
              <option>DraftKings</option>
              <option>FanDuel</option>
              <option>BetMGM</option>
              <option>Caesars</option>
            </select>
          </label>

          <label className="settings-field">
            <span>Minimum EV highlight</span>
            <select
              value={settings.minEv}
              onChange={(event) =>
                updateSetting(
                  "minEv",
                  event.target.value
                )
              }
            >
              <option value="0">Show all</option>
              <option value="3">3%+</option>
              <option value="5">5%+</option>
              <option value="10">10%+</option>
            </select>
          </label>
        </section>

        <section className="panel settings-card">
          <span className="panel-kicker">
            TUTORIAL
          </span>
          <h2>Guided tour</h2>

          <p className="settings-copy">
            Replay the guided dashboard tour at any
            time. Starting it again does not change
            your saved settings or model data.
          </p>

          <button
            className="settings-button secondary"
            onClick={() => {
              window.dispatchEvent(
                new Event(
                  "banana-bets:start-tutorial"
                )
              );
            }}
          >
            <PlayCircle size={16} />
            Run tutorial again
          </button>
        </section>
      </div>
    </section>
  );
}
