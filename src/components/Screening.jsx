import { useState } from "react";
import { db } from "../config/firestore.js";
import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import TextPairProblem from "./TextPairProblem.jsx";

const ROOT_COLLECTION = "uncertainty_user";

// Screening pairs from v1 p.21 — same for all participants.
// Correct answers are which text is MORE certain. "Tie" means same certainty.
const SCREENING_PAIRS = [
  {
    textA: "Microtubules grew outward radially within each aster.",
    textB: "Within each aster, microtubules extended outward in a radial pattern.",
    answer: "Tie",
  },
  {
    textA: "This ad was not aligned with the browsing behavior or demographic responses in either of the targeted conditions; this enabled us to examine the effects of participants' perceptions of being targeted while keeping the advertisement constant across conditions.",
    textB: "This ad was not matched to the browsing behavior or demographic responses in either of the targeted conditions; this allowed us to test the effects of participants' perceptions of being targeted while holding the advertisement constant across conditions.",
    answer: "Tie",
  },
  {
    textA: "Finding: 'Element separation may be required where components of the call have different amplitudes.'",
    textB: "Element separation is required where components of the call have different amplitudes.",
    answer: "Text B",
  },
  {
    textA: "Further, beta band phenomena are clearly strongly affected by normal voluntary movement, which is likely to complicate their use as signatures of motor impairment.",
    textB: "Further, beta band phenomena are strongly affected by normal voluntary movement, which may complicate their use as signatures of motor impairment.",
    answer: "Text A",
  },
  {
    textA: "Initial checks of task compliance (see methods for details) revealed that a significant proportion of participants (55%) from India were not able to complete the task.",
    textB: "Initial checks of task compliance (see methods for details) suggested that a substantial proportion of participants (around 55%) from India may not have been able to complete the task.",
    answer: "Text A",
  },
];

const PASS_THRESHOLD = 4;

export default function Screening({ PID, onPass, onFail }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const handleSubmit = async (result) => {
    const pair = SCREENING_PAIRS[currentIdx];
    const isCorrect = result.user_choice === pair.answer;
    const newCorrect = correctCount + (isCorrect ? 1 : 0);

    try {
      const problemRef = doc(
        db, ROOT_COLLECTION, PID,
        "experiment", "main",
        "problem", `screening_${currentIdx}`
      );
      await setDoc(problemRef, {
        problem_id: currentIdx,
        question_id: currentIdx,
        is_screening: true,
        is_attention_check: false,
        user_choice: result.user_choice,
        user_magnitude_choice: result.user_magnitude_choice,
        correct_answer: pair.answer,
        is_correct: isCorrect,
        response_time: result.response_time,
        on_screen_time: result.on_screen_time,
        create_time: serverTimestamp(),
      });
    } catch (err) {
      console.error("Screening save failed:", err);
    }

    if (currentIdx < SCREENING_PAIRS.length - 1) {
      setCorrectCount(newCorrect);
      setCurrentIdx(currentIdx + 1);
      return;
    }

    setFinished(true);

    const passed = newCorrect >= PASS_THRESHOLD;

    try {
      const userRef = doc(db, ROOT_COLLECTION, PID);
      await updateDoc(userRef, {
        pass_comprehension: passed,
        finish_comprehension: true,
      });
    } catch (_) {}

    if (passed) onPass();
    else onFail();
  };

  if (finished) return null;

  const pair = SCREENING_PAIRS[currentIdx];

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>Screening Check</h2>
      <p style={{ color: "var(--color-text-muted)", marginBottom: 16, fontSize: 14 }}>
        Answer at least {PASS_THRESHOLD} of {SCREENING_PAIRS.length} correctly to proceed.
      </p>
      <TextPairProblem
        textA={pair.textA}
        textB={pair.textB}
        problemIndex={currentIdx}
        totalProblems={SCREENING_PAIRS.length}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
