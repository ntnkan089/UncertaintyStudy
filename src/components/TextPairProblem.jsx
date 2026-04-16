import { useState, useRef, useEffect } from "react";

const CERTAINTY_CHOICES = ["Text A", "Text B", "Tie"];
const MAGNITUDE_CHOICES = [
  "No Difference",
  "Subtle Difference",
  "Moderate Difference",
  "Strong Difference",
];

export default function TextPairProblem({
  textA,
  textB,
  problemIndex,
  totalProblems,
  onSubmit,
  showTooltip = true,
}) {
  const [certaintyChoice, setCertaintyChoice] = useState(null);
  const [magnitudeChoice, setMagnitudeChoice] = useState(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const startTimeRef = useRef(Date.now());
  const onScreenTimeRef = useRef(0);
  const lastVisibleRef = useRef(Date.now());
  const pageVisibleRef = useRef(true);

  useEffect(() => {
    startTimeRef.current = Date.now();
    onScreenTimeRef.current = 0;
    lastVisibleRef.current = Date.now();
    pageVisibleRef.current = true;
    setCertaintyChoice(null);
    setMagnitudeChoice(null);
  }, [textA, textB]);

  useEffect(() => {
    const handleVis = () => {
      const now = Date.now();
      if (pageVisibleRef.current) {
        onScreenTimeRef.current += now - lastVisibleRef.current;
      }
      pageVisibleRef.current = !document.hidden;
      lastVisibleRef.current = now;
    };
    document.addEventListener("visibilitychange", handleVis);
    return () => document.removeEventListener("visibilitychange", handleVis);
  }, []);

  const canSubmit = certaintyChoice !== null && magnitudeChoice !== null;

  const handleNext = () => {
    if (!canSubmit) return;

    if (pageVisibleRef.current) {
      onScreenTimeRef.current += Date.now() - lastVisibleRef.current;
      lastVisibleRef.current = Date.now();
    }

    const responseTime = Date.now() - startTimeRef.current;

    onSubmit({
      user_choice: certaintyChoice,
      user_magnitude_choice: magnitudeChoice,
      response_time: responseTime,
      on_screen_time: Math.min(onScreenTimeRef.current, responseTime),
    });
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20, textAlign: "left" }}>
      <div style={{ textAlign: "right", marginBottom: 10, fontSize: 14, color: "var(--color-text-muted)" }}>
        Example {problemIndex + 1} / {totalProblems}
      </div>

      <div style={pairContainer}>
        <div style={textBox}>
          <h3 style={textLabel}>Text A</h3>
          <p style={textContent}>{textA}</p>
        </div>
        <div style={textBox}>
          <h3 style={textLabel}>Text B</h3>
          <p style={textContent}>{textB}</p>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <p style={{ fontWeight: 600 }}>
          Which of the <strong>two texts is more certain about the main claim</strong>.
          If both texts express about the same level of certainty, select "Tie".
          {showTooltip && (
            <span
              style={tooltipTrigger}
              onMouseEnter={() => setTooltipOpen(true)}
              onMouseLeave={() => setTooltipOpen(false)}
              onClick={() => setTooltipOpen(!tooltipOpen)}
            >
              ?
              {tooltipOpen && (
                <div style={tooltipBox}>
                  <ul style={{ margin: 0, paddingLeft: 18, textAlign: "left", fontWeight: 400 }}>
                    <li><strong>Text A</strong> -- main finding in A sounds more certain than in B</li>
                    <li><strong>Text B</strong> -- main finding in B sounds more certain than in A</li>
                    <li><strong>Tie</strong> -- main finding sounds equally certain in both</li>
                  </ul>
                </div>
              )}
            </span>
          )}
        </p>

        <div style={radioRow}>
          {CERTAINTY_CHOICES.map((c) => (
            <label key={c} style={radioLabel}>
              <input
                type="radio"
                name="certainty"
                checked={certaintyChoice === c}
                onChange={() => setCertaintyChoice(c)}
              />
              {c}
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <p style={{ fontWeight: 600 }}>
          How different are the two texts in <strong>how strongly they express certainty</strong> about the main claim?
        </p>

        <div style={radioRow}>
          {MAGNITUDE_CHOICES.map((c) => (
            <label key={c} style={radioLabel}>
              <input
                type="radio"
                name="magnitude"
                checked={magnitudeChoice === c}
                onChange={() => setMagnitudeChoice(c)}
              />
              {c}
            </label>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "right", marginTop: 24 }}>
        <button
          onClick={handleNext}
          disabled={!canSubmit}
          style={{
            padding: "10px 28px",
            backgroundColor: canSubmit ? "#007bff" : "#9fbce8",
            color: "white",
            borderRadius: 8,
            cursor: canSubmit ? "pointer" : "not-allowed",
            fontSize: "1rem",
            border: "none",
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

const pairContainer = {
  display: "flex",
  gap: 20,
  flexWrap: "wrap",
};

const textBox = {
  flex: 1,
  minWidth: 280,
  border: "1px solid var(--color-text-muted)",
  borderRadius: 8,
  padding: 16,
};

const textLabel = {
  margin: "0 0 8px 0",
  fontSize: "1.1rem",
};

const textContent = {
  lineHeight: 1.7,
  margin: 0,
};

const radioRow = {
  display: "flex",
  gap: 20,
  flexWrap: "wrap",
  marginTop: 8,
};

const radioLabel = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
};

const tooltipTrigger = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 20,
  height: 20,
  borderRadius: "50%",
  backgroundColor: "#007bff",
  color: "white",
  fontSize: 12,
  fontWeight: 700,
  marginLeft: 6,
  cursor: "pointer",
  position: "relative",
};

const tooltipBox = {
  position: "absolute",
  top: 28,
  left: -100,
  width: 350,
  backgroundColor: "var(--color-bg)",
  border: "1px solid var(--color-text-muted)",
  borderRadius: 8,
  padding: 14,
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  zIndex: 100,
  fontSize: 13,
  lineHeight: 1.6,
};
