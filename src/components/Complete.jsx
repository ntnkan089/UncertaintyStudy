import { useState, useEffect } from "react";
import { db, auth } from "../config/firestore.js";
import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";

const ROOT_COLLECTION = "uncertainty_user";

const PASS_URL = "https://app.prolific.com/submissions/complete?cc=C1L81448";
const FAIL_URL = "https://app.prolific.com/submissions/complete?cc=C1AOAVMH";

// Likert / multiple-choice questions are commented out for the pilot study;
// only the free-response questions remain.
// const scale = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
// const LIKERT_QUESTIONS = [
//   { key: "challenging", text: "The study was challenging." },
//   { key: "boring", text: "I found the study to be boring." },
//   { key: "confident", text: "I felt confident in my choices throughout the study." },
// ];

const REQUIRED_FIELDS = [];

export default function Complete({ PID }) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState(null);

  const [responses, setResponses] = useState({
    strategy_text: "",
    overall_text: "",
  });

  const handleChange = (field, value) =>
    setResponses((prev) => ({ ...prev, [field]: value }));

  const allAnswered = () => REQUIRED_FIELDS.every((f) => responses[f] !== "");

  useEffect(() => {
    const checkAttention = async () => {
      try {
        const attRef = doc(
          db, ROOT_COLLECTION, PID,
          "experiment", "main",
          "problem", "attention_check"
        );
        const snap = await getDoc(attRef);
        const passed = !snap.exists() || snap.data()?.is_correct !== false;
        setRedirectUrl(passed ? PASS_URL : FAIL_URL);
      } catch (err) {
        console.error("Attention check lookup failed:", err);
        setRedirectUrl(PASS_URL);
      }
    };
    checkAttention();
  }, [PID]);

  const submitSurvey = async () => {
    if (!allAnswered()) {
      alert("Please answer all questions before submitting.");
      return;
    }
    try {
      setLoading(true);
      const userRef = doc(db, ROOT_COLLECTION, PID);
      await updateDoc(userRef, {
        survey: {
          timestamp: serverTimestamp(),
          strategy_free_response: responses.strategy_text.trim(),
          overall_experience: responses.overall_text.trim(),
        },
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Survey save failed:", err);
      alert("Error saving survey. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "min(1400px, 92vw)", margin: "0 auto", padding: 20, textAlign: "left" }}>
      <h2 style={{ fontWeight: 700, textAlign: "center" }}>Final Survey</h2>
      <p style={{ textAlign: "center" }}>
        Please complete the following questions before finishing the study.
      </p>

      <hr style={{ margin: "20px 0" }} />

      {/*
        Likert "Study Experience" questions intentionally omitted for the
        pilot study. Only the free-response questions are collected.
      */}

      <h3>Free Response</h3>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600 }}>
          Please share the strategy you used for this study. (500 characters max)
        </div>
        <textarea
          maxLength={500}
          rows={3}
          value={responses.strategy_text}
          onChange={(e) => handleChange("strategy_text", e.target.value)}
          style={{ width: "100%", padding: 10, marginTop: 6 }}
        />
      </div>

      <div style={{ marginBottom: 30 }}>
        <div style={{ fontWeight: 600 }}>
          Overall experience and suggestions for improvement. (500 characters max)
        </div>
        <textarea
          maxLength={500}
          rows={3}
          value={responses.overall_text}
          onChange={(e) => handleChange("overall_text", e.target.value)}
          style={{ width: "100%", padding: 10, marginTop: 6 }}
        />
      </div>

      {!submitted && (
        <div style={{ textAlign: "center" }}>
          <button
            onClick={submitSurvey}
            disabled={loading}
            style={{
              padding: "12px 22px",
              background: "#333",
              color: "white",
              borderRadius: 6,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      )}

      {submitted && (
        <div style={{
          marginTop: 20, marginBottom: 30, padding: 15,
          background: "var(--color-bg)",
          border: "1px solid var(--color-accent)",
          borderRadius: 8, textAlign: "center",
        }}>
          <p style={{ margin: 0, fontSize: 16 }}>
            <strong>Thanks for participating!</strong>
          </p>
          <p style={{ marginTop: 6 }}>
            Your compensation will be distributed shortly.
          </p>
        </div>
      )}

      <hr style={{ margin: "25px 0" }} />

      <div style={{ textAlign: "center" }}>
        <button
          onClick={() => redirectUrl && window.location.replace(redirectUrl)}
          disabled={!submitted}
          style={{
            padding: "14px 26px",
            backgroundColor: submitted ? "#007bff" : "#9fbce8",
            color: "white",
            borderRadius: 8,
            width: "100%",
            maxWidth: 350,
            cursor: submitted ? "pointer" : "not-allowed",
          }}
        >
          Return to Prolific
        </button>
        <div style={{ marginTop: 10, color: "#555", fontSize: 13 }}>
          Once redirected, you cannot return to this study page.
        </div>
      </div>
    </div>
  );
}
