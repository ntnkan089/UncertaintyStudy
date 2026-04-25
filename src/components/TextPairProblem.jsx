import { useState, useRef, useEffect } from "react";

export const CERTAINTY_CHOICES = [
  "Clearly A",
  "Slightly A",
  "No clear difference",
  "Slightly B",
  "Clearly B",
];

const CHOICE_DESCRIPTIONS = {
  "Clearly A": "the main finding in A is clearly more confident than in B",
  "Slightly A": "the main finding in A is slightly more confident than in B",
  "No clear difference": "there is no clear difference in how the main finding is communicated",
  "Slightly B": "the main finding in B is slightly more confident than in A",
  "Clearly B": "the main finding in B is clearly more confident than in A",
};

export default function TextPairProblem({
  textA,
  textB,
  problemIndex,
  totalProblems,
  onSubmit,
  questionText = null,
  showChoiceTooltips = true,
  counterLabel = "Example",
}) {
  const [choice, setChoice] = useState(null);

  const startTimeRef = useRef(Date.now());
  const onScreenTimeRef = useRef(0);
  const lastVisibleRef = useRef(Date.now());
  const pageVisibleRef = useRef(true);

  useEffect(() => {
    startTimeRef.current = Date.now();
    onScreenTimeRef.current = 0;
    lastVisibleRef.current = Date.now();
    pageVisibleRef.current = true;
    setChoice(null);
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

  const canSubmit = choice !== null;

  const handleNext = () => {
    if (!canSubmit) return;

    if (pageVisibleRef.current) {
      onScreenTimeRef.current += Date.now() - lastVisibleRef.current;
      lastVisibleRef.current = Date.now();
    }

    const responseTime = Date.now() - startTimeRef.current;

    onSubmit({
      user_choice: choice,
      response_time: responseTime,
      on_screen_time: Math.min(onScreenTimeRef.current, responseTime),
    });
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20, textAlign: "left" }}>
      <div style={{ textAlign: "right", marginBottom: 10, fontSize: 14, color: "var(--color-text-muted)" }}>
        {counterLabel} {problemIndex + 1} / {totalProblems}
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
          {questionText ? (
            questionText
          ) : (
            <>Which text communicates its main finding <strong>more confidently</strong>?</>
          )}
        </p>

        <div style={radioRow}>
          {CERTAINTY_CHOICES.map((c) => (
            <ChoiceRadio
              key={c}
              label={c}
              checked={choice === c}
              onSelect={() => setChoice(c)}
              description={showChoiceTooltips ? CHOICE_DESCRIPTIONS[c] : null}
            />
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

function ChoiceRadio({ label, checked, onSelect, description }) {
  const [hover, setHover] = useState(false);
  return (
    <label
      style={{ ...radioLabel, position: "relative" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <input
        type="radio"
        name="certainty"
        checked={checked}
        onChange={onSelect}
      />
      {label}
      {description && hover && (
        <div style={choiceTooltipBox}>
          <strong>{label}</strong> – {description}
        </div>
      )}
    </label>
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

const choiceTooltipBox = {
  position: "absolute",
  top: 28,
  left: 0,
  width: 280,
  backgroundColor: "var(--color-bg)",
  border: "1px solid var(--color-text-muted)",
  borderRadius: 8,
  padding: 10,
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  zIndex: 100,
  fontSize: 13,
  lineHeight: 1.5,
  fontWeight: 400,
  color: "var(--color-text)",
};
