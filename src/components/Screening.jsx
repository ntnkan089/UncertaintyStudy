import { useState, useEffect } from "react";
import { db } from "../config/firestore.js";
import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import Papa from "papaparse";
import TextPairProblem from "./TextPairProblem.jsx";

const ROOT_COLLECTION = "uncertainty_user";
const PASS_THRESHOLD = 4;

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Parses an expected_answer cell like "Clearly {Generated},Slightly {Original}"
// into a list of raw labels containing {Original} / {Generated} placeholders.
function parseExpectedTemplates(raw) {
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Resolve a placeholder template against a specific A/B mapping.
// `aIsOriginal` tells us whether Original was rendered as Text A.
// "Clearly {Generated}" → "Clearly B" if Generated is Text B; "Clearly A" otherwise.
function resolveExpected(template, aIsOriginal) {
  return template
    .replace("{Original}", aIsOriginal ? "A" : "B")
    .replace("{Generated}", aIsOriginal ? "B" : "A");
}

export default function Screening({ PID, onPass, onFail }) {
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    fetch(base + "screening_examples.csv")
      .then((r) => r.text())
      .then((csv) => {
        const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
        const rows = parsed.data
          .map((r, idx) => ({
            original: r.Original ?? r.original ?? "",
            generated: r.Generated ?? r.generated ?? "",
            expectedTemplates: parseExpectedTemplates(r.expected_answer),
            // 1-indexed position in screening_examples.csv, captured before shuffling.
            questionId: idx + 1,
          }))
          .filter((r) => r.original && r.generated);

        const shuffled = shuffleArray(rows).map((r) => {
          const aIsOriginal = Math.random() < 0.5;
          const correctAnswers = r.expectedTemplates.map((t) =>
            resolveExpected(t, aIsOriginal),
          );
          return {
            textA: aIsOriginal ? r.original : r.generated,
            textB: aIsOriginal ? r.generated : r.original,
            text_A_is_original: aIsOriginal ? 1 : 0,
            text_B_is_original: aIsOriginal ? 0 : 1,
            correctAnswers,
            questionId: r.questionId,
          };
        });

        setPairs(shuffled);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Screening CSV load failed:", err);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (result) => {
    const pair = pairs[currentIdx];
    const isCorrect = pair.correctAnswers.includes(result.user_choice);
    const newCorrect = correctCount + (isCorrect ? 1 : 0);

    try {
      const problemRef = doc(
        db, ROOT_COLLECTION, PID,
        "experiment", "main",
        "problem", `screening_${currentIdx}`
      );
      await setDoc(problemRef, {
        problem_id: currentIdx,
        question_id: pair.questionId,
        is_screening: true,
        is_attention_check: false,
        text_A_is_original: pair.text_A_is_original,
        text_B_is_original: pair.text_B_is_original,
        user_choice: result.user_choice,
        correct_answers: pair.correctAnswers,
        is_correct: isCorrect,
        response_time: result.response_time,
        on_screen_time: result.on_screen_time,
        create_time: serverTimestamp(),
      });
    } catch (err) {
      console.error("Screening save failed:", err);
    }

    if (currentIdx < pairs.length - 1) {
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

  if (loading) return <div>Loading screening questions...</div>;
  if (!pairs.length) return <div>No screening questions found.</div>;
  if (finished) return null;

  const pair = pairs[currentIdx];

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>Screening Check</h2>
      <p style={{ color: "var(--color-text-muted)", marginBottom: 16, fontSize: 14 }}>
        Answer at least {PASS_THRESHOLD} of {pairs.length} correctly to proceed.
      </p>
      <TextPairProblem
        key={`screen-${currentIdx}`}
        textA={pair.textA}
        textB={pair.textB}
        problemIndex={currentIdx}
        totalProblems={pairs.length}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
