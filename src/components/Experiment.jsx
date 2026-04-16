import { useState, useEffect, useRef } from "react";
import { db } from "../config/firestore.js";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import Papa from "papaparse";
import TextPairProblem from "./TextPairProblem.jsx";
import InfoOverlay from "./InfoOverlay.jsx";

const ROOT_COLLECTION = "uncertainty_user";
const PROBLEMS_PER_GROUP = 20;
const NUM_GROUPS = 5;
const ATTENTION_CHECK_POSITION = 10; // insert between problem 10 and 11

const ATTENTION_CHECK = {
  textA: "This is an attention check. Please select Text A to confirm you are reading carefully.",
  textB: "This text should not be selected.",
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

export default function Experiment({ PID, qgroup, onFinish }) {
  const [problems, setProblems] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showComplete, setShowComplete] = useState(false);
  const failedAttentionRef = useRef(0);
  const experimentStartRef = useRef(Date.now());

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    fetch(base + "questions.csv")
      .then((r) => r.text())
      .then((csv) => {
        const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
        const rows = parsed.data;

        const groupStart = qgroup * PROBLEMS_PER_GROUP;
        const groupEnd = groupStart + PROBLEMS_PER_GROUP;
        const assigned = rows.slice(groupStart, Math.min(groupEnd, rows.length));

        const shuffled = shuffleArray(assigned).map((row, i) => ({
          textA: row.Text_A || row.text_A || "",
          textB: row.Text_B || row.text_B || "",
          questionId: groupStart + i,
          is_attention_check: false,
        }));

        // Insert attention check at specified position
        shuffled.splice(ATTENTION_CHECK_POSITION, 0, {
          ...ATTENTION_CHECK,
          questionId: -1,
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
          qgr: qgroup,
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
    const mainProblemIdx = isAttention ? -1 : problems.slice(0, currentIdx).filter(p => !p.is_attention_check).length;

    const docName = isAttention ? "attention_check" : `problem_${mainProblemIdx}`;

    const data = {
      problem_id: mainProblemIdx,
      question_id: problem.questionId,
      is_attention_check: isAttention,
      user_choice: result.user_choice,
      user_magnitude_choice: result.user_magnitude_choice,
      response_time: result.response_time,
      on_screen_time: result.on_screen_time,
      create_time: serverTimestamp(),
    };

    if (isAttention) {
      data.is_correct = result.user_choice === "Text A";
      if (!data.is_correct) failedAttentionRef.current += 1;
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

  return (
    <div>
      {problem.is_attention_check && (
        <h2 style={{ color: "#e67e22", marginBottom: 4 }}>Attention Check</h2>
      )}
      <TextPairProblem
        textA={problem.textA}
        textB={problem.textB}
        problemIndex={currentIdx}
        totalProblems={problems.length}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
