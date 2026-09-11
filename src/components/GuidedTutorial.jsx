import React, {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";

export const TUTORIAL_STORAGE_KEY =
  "banana-bets-tutorial-complete";

const STEPS = [
  {
    selector: '[data-tour="snapshot"]',
    title: "Weekly Snapshot",
    text:
      "This is your weekly command center. Banana automatically surfaces a diverse group of model signals so you can quickly see where the model and market differ."
  },
  {
    selector: '[data-tour="snapshot-cards"]',
    title: "Snapshot Cards",
    text:
      "Each card can show a different type of signal: highest confidence, best expected value, biggest model-versus-market edge, or favorite and underdog value. You can also pin a selection while its live values continue updating."
  },
  {
    selector: '[data-tour="best-ev"]',
    title: "Expected Value (EV)",
    text:
      "EV estimates the theoretical value of the offered sportsbook price using Banana's probability. Positive EV does not mean the bet is guaranteed to win."
  },
  {
    selector: '[data-tour="threshold"]',
    title: "Qualified Plays",
    text:
      "These are results that meet the model's configured minimum requirements. A qualified play is a filter, not a guarantee."
  },
  {
    selector: '[data-tour="bet-finder"]',
    title: "Model vs. Market",
    text:
      "The Moneyline Value Finder starts with a simple explanation of where Banana disagrees with the market. Switch to Advanced Table when you want every underlying number side by side."
  },
  {
    selector: '[data-tour="model-status"]',
    title: "Confidence & Sample Size",
    text:
      "Confidence is not the same as win probability. This area also shows how much current-season data the model is working with, which is especially important early in the season."
  }
];

export default function GuidedTutorial({
  open,
  onClose
}) {
  const [stepIndex, setStepIndex] =
    useState(0);
  const [rect, setRect] =
    useState(null);

  const step =
    useMemo(
      () => STEPS[stepIndex],
      [stepIndex]
    );

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
      return undefined;
    }

    function position() {
      const element =
        document.querySelector(
          step.selector
        );

      if (!element) {
        setRect(null);
        return;
      }

      element.scrollIntoView({
        behavior: "auto",
        block: "center"
      });

      const nextRect =
        element.getBoundingClientRect();

      setRect({
        top: nextRect.top,
        left: nextRect.left,
        width: nextRect.width,
        height: nextRect.height
      });
    }

    const timer =
      setTimeout(position, 220);

    window.addEventListener(
      "resize",
      position
    );

    return () => {
      clearTimeout(timer);
      window.removeEventListener(
        "resize",
        position
      );
    };
  }, [open, step]);

  if (!open) {
    return null;
  }

  function finishTutorial() {
    localStorage.setItem(
      TUTORIAL_STORAGE_KEY,
      "true"
    );
    onClose();
  }

  const isLast =
    stepIndex === STEPS.length - 1;

  const popoverTop = rect
    ? Math.min(
        window.innerHeight - 250,
        Math.max(18, rect.top + rect.height + 14)
      )
    : 100;

  const popoverLeft = rect
    ? Math.min(
        window.innerWidth - 380,
        Math.max(18, rect.left)
      )
    : 24;

  return (
    <div className="tutorial-layer">
      <div className="tutorial-dimmer" />

      {rect && (
        <div
          className="tutorial-highlight"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12
          }}
        />
      )}

      <section
        className="tutorial-card"
        style={{
          top: popoverTop,
          left: popoverLeft
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Banana Bets guided tutorial"
      >
        <div className="tutorial-card-header">
          <span>
            STEP {stepIndex + 1} OF {STEPS.length}
          </span>

          <button
            type="button"
            onClick={finishTutorial}
            aria-label="Skip tutorial"
          >
            <X size={17} />
          </button>
        </div>

        <h2>{step.title}</h2>
        <p>{step.text}</p>

        <div className="tutorial-progress">
          {STEPS.map((item, index) => (
            <span
              key={item.title}
              className={
                index === stepIndex
                  ? "active"
                  : index < stepIndex
                    ? "done"
                    : ""
              }
            />
          ))}
        </div>

        <div className="tutorial-actions">
          <button
            type="button"
            className="tutorial-skip"
            onClick={finishTutorial}
          >
            Skip tour
          </button>

          <div>
            <button
              type="button"
              className="tutorial-nav"
              disabled={stepIndex === 0}
              onClick={() =>
                setStepIndex(
                  (index) =>
                    Math.max(0, index - 1)
                )
              }
            >
              <ChevronLeft size={15} />
              Back
            </button>

            <button
              type="button"
              className="tutorial-nav primary"
              onClick={() => {
                if (isLast) {
                  finishTutorial();
                  return;
                }

                setStepIndex(
                  (index) => index + 1
                );
              }}
            >
              {isLast ? "Finish" : "Next"}
              {!isLast && (
                <ChevronRight size={15} />
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
