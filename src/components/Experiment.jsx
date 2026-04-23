import { useState, useEffect, useRef } from "react";
import { db } from "../config/firestore.js";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import Papa from "papaparse";
import TextPairProblem from "./TextPairProblem.jsx";
import InfoOverlay from "./InfoOverlay.jsx";

const ROOT_COLLECTION = "uncertainty_user";
const PROBLEMS_PER_GROUP = 20;
const NUM_GROUPS = 6;
const ATTENTION_CHECK_POSITION = 10; // insert between problem 10 and 11

const ATTENTION_CHECK_CORRECT_ANSWER = "Slightly B";
const ATTENTION_CHECK_QUESTION =
  "This is an attention check. To pass, please select 'Slightly B'.";

const ATTENTION_CHECK = {
  textA: "Please read the question below and follow its instructions.",
  textB: "Please read the question below and follow its instructions.",
  is_attention_check: true,
};

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseAttentionFlag(val) {
  if (val === undefined || val === null) return false;
  const s = String(val).trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

// Supports the new `Original` / `Generated` schema and the legacy
// `text_A` / `text_B` / `Text_A` / `Text_B` schema.
function readOriginalGenerated(row) {
  const original = row.Original ?? row.original ?? null;
  const generated = row.Generated ?? row.generated ?? null;
  if (original != null && generated != null) {
    return { original, generated, hasOriginalFlag: true };
  }
  const a = row.text_A ?? row.Text_A ?? row.textA ?? "";
  const b = row.text_B ?? row.Text_B ?? row.textB ?? "";
  return { original: a, generated: b, hasOriginalFlag: false };
}

export default function Experiment({ PID, qgroup, onFinish }) {
  const [problems, setProblems] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showComplete, setShowComplete] = useState(false);
  const failedAttentionRef = useRef(0);

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    fetch(base + "questions.csv")
      .then((r) => r.text())
      .then((csv) => {
        const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
        const rows = parsed.data.filter(
          (r) => !parseAttentionFlag(r.is_attention_check),
        );

        // qgroup is 1..NUM_GROUPS; default to 1 if invalid.
        const g = Number.isInteger(qgroup) && qgroup >= 1 && qgroup <= NUM_GROUPS
          ? qgroup
          : 1;
        const groupStart = (g - 1) * PROBLEMS_PER_GROUP;
        const groupEnd = groupStart + PROBLEMS_PER_GROUP;
        const assigned = rows.slice(groupStart, Math.min(groupEnd, rows.length))
          .map((row, localIdx) => {
            const { original, generated, hasOriginalFlag } = readOriginalGenerated(row);
            return {
              original,
              generated,
              hasOriginalFlag,
              // 1-indexed question id within the full CSV.
              questionId: groupStart + localIdx + 1,
            };
          });

        // Shuffle question order within the group, then randomly assign
        // Original / Generated to Text A / Text B per problem.
        const shuffled = shuffleArray(assigned).map((q) => {
          const aIsOriginal = Math.random() < 0.5;
          return {
            textA: aIsOriginal ? q.original : q.generated,
            textB: aIsOriginal ? q.generated : q.original,
            questionId: q.questionId,
            text_A_is_original: q.hasOriginalFlag ? (aIsOriginal ? 1 : 0) : null,
            text_B_is_original: q.hasOriginalFlag ? (aIsOriginal ? 0 : 1) : null,
            is_attention_check: false,
          };
        });

        // Insert attention check at specified position.
        shuffled.splice(ATTENTION_CHECK_POSITION, 0, {
          ...ATTENTION_CHECK,
          questionId: -1,
          text_A_is_original: null,
          text_B_is_original: null,
        });

        setProblems(shuffled);
        setLoading(false);

        // Write experiment metadata
        const expRef = doc(db, ROOT_COLLECTION, PID, "experiment", "main");
        setDoc(expRef, {
          create_time: serverTimestamp(),
          num_problems: shuffled.length,
          is_finished: false,
          failed_attention_check_count: 0,
          qgr: g,
        }, { merge: true }).catch(console.error);
      })
      .catch((err) => {
        console.error("CSV load failed:", err);
        setLoading(false);
      });
  }, [PID, qgroup]);

  const handleSubmit = async (result) => {
    const problem = problems[currentIdx];
    const isAttention = problem.is_attention_check;
    // problem_id: 1..N in the order the participant sees them (skipping
    // attention-check slot). The attention check is stored separately.
    const mainProblemIdx = isAttention
      ? -1
      : problems.slice(0, currentIdx).filter(p => !p.is_attention_check).length + 1;

    const docName = isAttention ? "attention_check" : `problem_${mainProblemIdx}`;

    const data = {
      problem_id: mainProblemIdx,
      question_id: problem.questionId,
      is_attention_check: isAttention,
      text_A_is_original: problem.text_A_is_original,
      text_B_is_original: problem.text_B_is_original,
      user_choice: result.user_choice,
      response_time: result.response_time,
      on_screen_time: result.on_screen_time,
      create_time: serverTimestamp(),
    };

    if (isAttention) {
      const isCorrect = result.user_choice === ATTENTION_CHECK_CORRECT_ANSWER;
      data.correct_answer = ATTENTION_CHECK_CORRECT_ANSWER;
      data.is_correct = isCorrect;
      if (!isCorrect) failedAttentionRef.current += 1;
    }

    try {
      const problemRef = doc(
        db, ROOT_COLLECTION, PID,
        "experiment", "main",
        "problem", docName
      );
      await setDoc(problemRef, data);
    } catch (err) {
      console.error("Problem save failed:", err);
    }

    if (currentIdx < problems.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      try {
        const expRef = doc(db, ROOT_COLLECTION, PID, "experiment", "main");
        await updateDoc(expRef, {
          is_finished: true,
          end_time: serverTimestamp(),
          failed_attention_check_count: failedAttentionRef.current,
        });

        const userRef = doc(db, ROOT_COLLECTION, PID);
        await updateDoc(userRef, {
          is_finish_all_experiments: true,
        });
      } catch (_) {}

      setShowComplete(true);
    }
  };

  if (loading) return <div>Loading questions...</div>;
  if (!problems.length) return <div>No questions found for group {qgroup}.</div>;

  if (showComplete) {
    return (
      <InfoOverlay
        title="Study Complete"
        message={"Thanks for completing the main study!\n\nPlease take a moment to complete a brief survey."}
        onOk={onFinish}
      />
    );
  }

  const problem = problems[currentIdx];

  if (problem.is_attention_check) {
    return (
      <TextPairProblem
        key={`attn-${currentIdx}`}
        textA={problem.textA}
        textB={problem.textB}
        problemIndex={currentIdx}
        totalProblems={problems.length}
        onSubmit={handleSubmit}
        questionText={ATTENTION_CHECK_QUESTION}
        showChoiceTooltips={false}
        counterLabel="Problem"
      />
    );
  }

  return (
    <TextPairProblem
      key={`main-${currentIdx}`}
      textA={problem.textA}
      textB={problem.textB}
      problemIndex={currentIdx}
      totalProblems={problems.length}
      onSubmit={handleSubmit}
      counterLabel="Problem"
    />
  );
}
