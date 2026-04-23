import { useState } from "react";
import { db } from "../config/firestore.js";
import { doc, updateDoc } from "firebase/firestore";

const ROOT_COLLECTION = "uncertainty_user";

const NUM_PAGES = 4;

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
  answer: "Clearly A",
  reasoning: [
    "Text A uses declarative and assertive language (\"is\"). The use of \"known\" also implies established knowledge or consensus. Text A leaves no room for doubt or probability.",
    "Text B uses hedging with words like \"suggests\" and \"could\", framing the treatment as a possibility. The use of \"our trials\" narrows the scope of the evidence to a specific, private context.",
    "Therefore, Text A is clearly more confident than Text B.",
  ],
};

const EXAMPLE_2 = {
  textA: "This drug is a known effective treatment for condition X.",
  textB: "Evidence demonstrates the efficacy of this therapeutic agent in treating condition X.",
  answer: "No clear difference",
  reasoning: [
    "Text A uses declarative and assertive language (\"is\"). The use of \"known\" also implies established knowledge or consensus. Text A leaves no room for doubt or probability.",
    "Text B uses high-certainty verbs like \"demonstrates\". Text B discusses the drug as \"demonstrating efficacy\", which is functionally equivalent to stating a treatment is \"known effective\".",
    "Both texts present the relationship as a proven, objective reality. Therefore, there is no clear difference.",
  ],
};

export default function Instructions({ PID, onNext, onBack }) {
  const [pageIdx, setPageIdx] = useState(0);

  const handleNext = async () => {
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

  return (
    <div style={container}>
      {pageIdx === 0 && <Page1 />}
      {pageIdx === 1 && <Page2 />}
      {pageIdx === 2 && <WorkedExample example={EXAMPLE_1} title="Example Question 1" />}
      {pageIdx === 3 && <WorkedExample example={EXAMPLE_2} title="Example Question 2" />}

      <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 14, textAlign: "center" }}>
        Page {pageIdx + 1} of {NUM_PAGES}
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
        <button onClick={handleBack} style={navBtn}>Back</button>
        <button
          onClick={handleNext}
          style={{ ...navBtn, backgroundColor: "#007bff", color: "white" }}
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
      <h2>What You Will Do</h2>
      <p style={para}>
        In this experiment, you will be shown two versions of the same text.
        The versions may differ in how confidently the main finding is being
        presented. You will be asked to judge which version presents the main
        finding more confidently.
      </p>
      <p style={para}>To make your judgment, you will choose one of the following five options:</p>
      <ul style={{ textAlign: "left", lineHeight: 1.8 }}>
        {OPTIONS.map((o) => (
          <li key={o.label}>
            <strong>{o.label}</strong> – {o.desc}
          </li>
        ))}
      </ul>
      <p style={{ ...para, fontStyle: "italic", marginTop: 14 }}>
        <strong>Important Note:</strong> There is no "correct" answer for these
        comparisons. We are interested in your own opinion and how you personally
        interpret the strength of the claims.
      </p>
    </div>
  );
}

function Page2() {
  return (
    <div>
      <h2>Study Flow</h2>
      <p style={para}>You will first see two worked examples to familiarize yourself with the task.</p>
      <p style={para}>
        You will then complete 5 screening questions to confirm you understand
        the task. If you get at least 4 out of the 5 correct, you will proceed
        to the main study, which comprises 20 questions.
      </p>
    </div>
  );
}

function WorkedExample({ example, title }) {
  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>{title}</h2>
      <p style={{ color: "var(--color-text-muted)", fontSize: 13, marginTop: 0 }}>
        (worked example — answer and reasoning shown)
      </p>

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
        Which text communicates its main claim with more certainty? Focus on how
        confidently each text presents its conclusion.
      </p>

      <div style={optionRow}>
        {OPTIONS.map((o) => (
          <span key={o.label} style={chip(example.answer === o.label)}>
            {example.answer === o.label ? "● " : "○ "}{o.label}
          </span>
        ))}
      </div>

      <div style={reasoningBox}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Possible reasoning</div>
        {example.reasoning.map((r, i) => (
          <p key={i} style={{ margin: "6px 0", lineHeight: 1.6 }}>{r}</p>
        ))}
      </div>
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

const optionRow = { display: "flex", gap: 16, flexWrap: "wrap", marginTop: 6 };
const chip = (selected) => ({
  padding: "4px 8px",
  borderRadius: 6,
  fontWeight: selected ? 700 : 400,
  color: selected ? "var(--color-text)" : "var(--color-text-muted)",
});

const reasoningBox = {
  marginTop: 18,
  padding: 14,
  border: "1px solid var(--color-text-muted)",
  borderRadius: 8,
  background: "rgba(0,0,0,0.02)",
};
