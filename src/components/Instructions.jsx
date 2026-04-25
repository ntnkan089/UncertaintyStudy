import { useState } from "react";
import { db } from "../config/firestore.js";
import { doc, updateDoc } from "firebase/firestore";

const ROOT_COLLECTION = "uncertainty_user";

const NUM_PAGES = 5;

const OPTIONS = [
  { label: "Clearly A", desc: "the main finding in A is clearly more confident than in B" },
  { label: "Slightly A", desc: "the main finding in A is slightly more confident than in B" },
  { label: "No clear difference", desc: "there is no clear difference in how the main finding is communicated" },
  { label: "Slightly B", desc: "the main finding in B is slightly more confident than in A" },
  { label: "Clearly B", desc: "the main finding in B is clearly more confident than in A" },
];

const EXAMPLE_1 = {
  textA: "This drug is a known effective treatment for condition X.",
  textB: "What we've seen in our trials suggests this medicine could work for people who have X.",
  correctAnswer: "Clearly A",
  explanation:
    "Text A uses assertive, declarative language (“is,” “known”), presenting the claim as established fact with no uncertainty. Text B uses hedging terms like “suggests” and “could,” with some users also mentioning that the claim is presented as a possibility based on limited trial evidence. Overall, Text A expresses higher confidence than Text B.",
};

const EXAMPLE_2 = {
  textA: "This drug is a known effective treatment for condition X.",
  textB: "Evidence demonstrates the efficacy of this therapeutic agent in treating condition X.",
  correctAnswer: "No clear difference",
  explanation:
    "Text A uses assertive, declarative language (“is,” “known”), presenting the claim as established fact with no uncertainty. Text B uses high-certainty phrasing (“demonstrates efficacy”), which similarly conveys the claim as proven. Overall, both texts express the relationship as a confirmed reality, with no meaningful difference in certainty.",
};

export default function Instructions({
  PID,
  initialPage = 0,
  exampleSelections = {},
  onSaveExampleSelection,
  onNext,
  onBack,
}) {
  const [pageIdx, setPageIdx] = useState(initialPage);

  // For example pages (idx 2 and 3), the participant must make a choice
  // before they can proceed. If they revisit the page, their previous
  // selection is restored.
  const isExamplePage = pageIdx === 2 || pageIdx === 3;
  const exampleIdx = pageIdx === 2 ? 0 : 1;
  const currentSelection = isExamplePage ? exampleSelections[exampleIdx] || null : null;
  const canAdvance = !isExamplePage || currentSelection !== null;

  const handleNext = async () => {
    if (!canAdvance) return;
    if (pageIdx < NUM_PAGES - 1) {
      setPageIdx(pageIdx + 1);
    } else {
      try {
        const ref = doc(db, ROOT_COLLECTION, PID);
        await updateDoc(ref, { inst: NUM_PAGES });
      } catch (_) {}
      onNext();
    }
  };

  const handleBack = () => {
    if (pageIdx > 0) setPageIdx(pageIdx - 1);
    else onBack();
  };

  const setExampleChoice = (choice) => {
    onSaveExampleSelection?.(exampleIdx, choice);
  };

  return (
    <div style={container}>
      {pageIdx === 0 && <Page1 />}
      {pageIdx === 1 && <Page2 />}
      {pageIdx === 2 && (
        <ExamplePage
          example={EXAMPLE_1}
          title="Example Question 1"
          selection={currentSelection}
          onSelect={setExampleChoice}
        />
      )}
      {pageIdx === 3 && (
        <ExamplePage
          example={EXAMPLE_2}
          title="Example Question 2"
          selection={currentSelection}
          onSelect={setExampleChoice}
        />
      )}
      {pageIdx === 4 && <Page5 />}

      <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 14, textAlign: "center" }}>
        Page {pageIdx + 1} of {NUM_PAGES}
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
        <button onClick={handleBack} style={navBtn}>Back</button>
        <button
          onClick={handleNext}
          disabled={!canAdvance}
          style={{
            ...navBtn,
            backgroundColor: canAdvance ? "#007bff" : "#9fbce8",
            color: "white",
            cursor: canAdvance ? "pointer" : "not-allowed",
          }}
        >
          {pageIdx < NUM_PAGES - 1 ? "Next" : "Continue"}
        </button>
      </div>
    </div>
  );
}

function Page1() {
  return (
    <div>
      <h2>Your Task</h2>
      <p style={para}>
        In this study, you will compare two versions of the same text and judge
        which presents its main finding more confidently.
      </p>
      <p style={para}>
        Understanding how certainty is communicated is important because it can
        influence how people interpret information, form beliefs, and make
        decisions&mdash;especially in contexts where overconfidence may
        contribute to misinformation.
      </p>
    </div>
  );
}

function Page2() {
  return (
    <div>
      <h2>Study Flow</h2>
      <p style={para}>
        We will first work through examples to help you familiarize with the
        task. You will then complete 5 screening questions to confirm you
        understand the task. If your answer agrees with the majority choice in
        4 out of 5 screening examples, you will proceed to the main study which
        consists of about 20 questions.
      </p>
      <p style={para}>Let's start with the first example.</p>
    </div>
  );
}

function Page5() {
  return (
    <div>
      <h2>Now it's your turn</h2>
      <p style={para}>
        You will now complete 5 screening questions to confirm understanding of
        the task. If your responses are consistent with the majority choice on
        at least 4 out of 5 examples, you will continue to the main study
        (about 20 questions).
      </p>
    </div>
  );
}

function ExamplePage({ example, title, selection, onSelect }) {
  const isCorrect = selection === example.correctAnswer;

  return (
    <div>
      <h2 style={{ marginBottom: 10 }}>{title}</h2>

      <div style={pairContainer}>
        <div style={textBox}>
          <h3 style={textLabel}>Text A</h3>
          <p style={textContent}>{example.textA}</p>
        </div>
        <div style={textBox}>
          <h3 style={textLabel}>Text B</h3>
          <p style={textContent}>{example.textB}</p>
        </div>
      </div>

      <p style={{ ...para, fontWeight: 600, marginTop: 18 }}>
        Which text communicates its main finding <strong>more confidently</strong>?
      </p>

      <div style={optionRow}>
        {OPTIONS.map((o) => {
          const isThisCorrect = o.label === example.correctAnswer;
          const isThisSelected = selection === o.label;
          const showAfterSelect = selection !== null;

          // After selection: bold the correct answer, gray the rest.
          // Before selection: normal styling, all selectable.
          const labelStyle = {
            ...optionItem,
            fontWeight: showAfterSelect && isThisCorrect ? 700 : 400,
            color: showAfterSelect && !isThisCorrect
              ? "var(--color-text-muted)"
              : "var(--color-text)",
            opacity: showAfterSelect && !isThisCorrect ? 0.55 : 1,
          };

          return (
            <div key={o.label} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <label style={labelStyle}>
                <input
                  type="radio"
                  name={`example-${title}`}
                  checked={isThisSelected}
                  onChange={() => selection === null && onSelect(o.label)}
                  disabled={selection !== null}
                />
                <span>{o.label}</span>
              </label>
              {showAfterSelect && isThisCorrect && (
                <div style={majorityTag}>(Majority choice)</div>
              )}
            </div>
          );
        })}
      </div>

      {selection !== null && (
        <div style={isCorrect ? blueBox : redBox}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            {isCorrect
              ? "Your answer agrees with the majority of individuals! Many explained their choice as follows:"
              : "Your answer differs from the majority of participants! Many who chose differently explained their reasoning as follows:"}
          </div>
          <p style={{ margin: 0, lineHeight: 1.6 }}>{example.explanation}</p>
        </div>
      )}
    </div>
  );
}

const container = { maxWidth: 900, margin: "0 auto", padding: 20, textAlign: "left" };
const para = { lineHeight: 1.7 };
const navBtn = { padding: "10px 24px", borderRadius: 8, fontSize: "1rem" };

const pairContainer = { display: "flex", gap: 20, flexWrap: "wrap", marginTop: 10 };
const textBox = {
  flex: 1,
  minWidth: 280,
  border: "1px solid var(--color-text-muted)",
  borderRadius: 8,
  padding: 16,
};
const textLabel = { margin: "0 0 8px 0", fontSize: "1.1rem" };
const textContent = { lineHeight: 1.7, margin: 0 };

const optionRow = {
  display: "flex",
  gap: 18,
  flexWrap: "wrap",
  marginTop: 10,
  alignItems: "flex-start",
};

const optionItem = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
};

const majorityTag = {
  marginTop: 4,
  marginLeft: 22,
  fontSize: 13,
  fontWeight: 700,
  color: "#1565c0",
};

const blueBox = {
  marginTop: 18,
  padding: 14,
  border: "1px solid #1565c0",
  borderRadius: 8,
  background: "rgba(21, 101, 192, 0.08)",
  color: "var(--color-text)",
};

const redBox = {
  marginTop: 18,
  padding: 14,
  border: "1px solid #c62828",
  borderRadius: 8,
  background: "rgba(198, 40, 40, 0.08)",
  color: "var(--color-text)",
};
