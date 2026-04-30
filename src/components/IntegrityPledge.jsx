import { useState } from "react";
import { db } from "../config/firestore.js";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

const ROOT_COLLECTION = "uncertainty_user";

export default function IntegrityPledge({ PID, onNext, onBack }) {
  const [pledged, setPledged] = useState(false);

  const handleSubmit = async () => {
    if (!pledged) return;
    try {
      const ref = doc(db, ROOT_COLLECTION, PID);
      await updateDoc(ref, {
        integrityPledged: true,
        integrityTimestamp: serverTimestamp(),
      });
      onNext();
    } catch (err) {
      console.error("Pledge save failed:", err);
    }
  };

  return (
    <div style={{ maxWidth: "min(900px, 92vw)", margin: "0 auto", padding: 20 }}>
      <h2>Integrity Pledge</h2>
      <p style={{ lineHeight: 1.6, textAlign: "left" }}>
        By checking the box below, I pledge that I will complete this study
        honestly and to the best of my ability. I will not use any external
        tools, references, or assistance while participating.
      </p>

      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginTop: 15 }}>
        <input
          type="checkbox"
          checked={pledged}
          onChange={(e) => setPledged(e.target.checked)}
        />
        <span>I agree to this pledge.</span>
      </label>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 25 }}>
        <button onClick={onBack} style={navBtn}>
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!pledged}
          style={{
            ...navBtn,
            backgroundColor: pledged ? "#007bff" : "#9fbce8",
            color: "white",
            cursor: pledged ? "pointer" : "not-allowed",
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

const navBtn = {
  padding: "10px 24px",
  borderRadius: 8,
  fontSize: "1rem",
};
