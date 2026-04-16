import { useState } from "react";
import { db } from "../config/firestore.js";
import { doc, updateDoc } from "firebase/firestore";

const ROOT_COLLECTION = "uncertainty_user";

const PAGES = [
  {
    title: "What You Will Do",
    body: "In this experiment, you will be shown two versions of the same text. The versions may differ in how confidently the main finding is being presented. You will be asked to judge which version presents the main finding more confidently.",
  },
  {
    title: "How to Answer",
    body: `For each pair, you will answer two questions:

1. Which of the two texts is more certain about the main claim? (Text A / Text B / Tie)

2. How different are the two texts in how strongly they express certainty? (No Difference / Subtle / Moderate / Strong)`,
  },
  {
    title: "Study Flow",
    body: `You will first complete 5 screening questions to confirm you understand the task. You must answer at least 4 correctly to proceed.

Then you will complete 20 main questions. There is no time limit per question, but the full study should take less than 30 minutes.`,
  },
];

export default function Instructions({ PID, onNext, onBack }) {
  const [pageIdx, setPageIdx] = useState(0);

  const handleNext = async () => {
    if (pageIdx < PAGES.length - 1) {
      setPageIdx(pageIdx + 1);
    } else {
      try {
        const ref = doc(db, ROOT_COLLECTION, PID);
        await updateDoc(ref, { inst: PAGES.length });
      } catch (_) {}
      onNext();
    }
  };

  const handleBack = () => {
    if (pageIdx > 0) setPageIdx(pageIdx - 1);
    else onBack();
  };

  const p = PAGES[pageIdx];

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h2>{p.title}</h2>
      <p style={{ whiteSpace: "pre-line", textAlign: "left", lineHeight: 1.7 }}>
        {p.body}
      </p>

      <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 10 }}>
        Page {pageIdx + 1} of {PAGES.length}
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 25 }}>
        <button onClick={handleBack} style={navBtn}>
          Back
        </button>
        <button onClick={handleNext} style={{ ...navBtn, backgroundColor: "#007bff", color: "white" }}>
          {pageIdx < PAGES.length - 1 ? "Next" : "Continue"}
        </button>
      </div>
    </div>
  );
}

const navBtn = { padding: "10px 24px", borderRadius: 8, fontSize: "1rem" };
