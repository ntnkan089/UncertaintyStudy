import { useState } from "react";
import { db } from "../config/firestore.js";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

const ROOT_COLLECTION = "uncertainty_user";

export default function Consent({ PID, onNext }) {
  const [checked, setChecked] = useState(false);
  const base = import.meta.env.BASE_URL;

  const handleSubmit = async () => {
    if (!checked) return;
    try {
      const ref = doc(db, ROOT_COLLECTION, PID);
      await updateDoc(ref, {
        consentGiven: true,
        consentTimestamp: serverTimestamp(),
      });
      onNext();
    } catch (err) {
      console.error("Consent save failed:", err);
    }
  };

  return (
    <div style={{ maxWidth: "min(1100px, 92vw)", margin: "0 auto", textAlign: "left", padding: 20 }}>
      <div style={{ textAlign: "center" }}>
        <img
          src={base + "uci_seal.png"}
          alt="UCI Seal"
          style={{ width: 80, marginBottom: 10 }}
        />
        <h2>Welcome to the experiment!</h2>
      </div>

      <ul style={{ marginBottom: 15 }}>
        <li>
          Please carefully read the information below before you decide to
          participate in this study. If you have any questions, please contact
          the lead researcher.
        </li>
        <li>
          <strong>Participation in this study is voluntary.</strong> There are no
          alternative procedures available. The only alternative is not to
          participate in this study. You may refuse to participate or withdraw
          at any time.
        </li>
      </ul>

      <h3 style={{ textAlign: "center" }}>Study Information Sheet</h3>
      <h4 style={{ textAlign: "center" }}>
        Human Judgment of Certainty in Text Pairs
      </h4>

      <p>
        <strong>Project Summary</strong>
        <br />
        This study examines how people perceive and compare the level of
        certainty in different text statements. Participants will be shown pairs
        of texts that convey similar information and asked to evaluate their
        perception of the relative level of certainty expressed in each text.
      </p>

      <p>
        <strong>Time Commitment</strong>
        <br />
        This study typically takes less than <strong>30 minutes</strong> to
        complete.
      </p>

      <p>
        <strong>Benefits &amp; Risks</strong>
        <br />
        There is no risk in participating in this study.
        <br />
        There are no direct benefits from participation in the study.
      </p>

      <p>
        <strong>Eligibility Requirements</strong>
        <br />
        You may participate <strong>only once</strong> in this study. You are
        eligible to participate in this study if you are:
      </p>
      <ul>
        <li>United States citizen/resident</li>
        <li>18 years or older</li>
        <li>English speaker</li>
        <li>A holder of an undergraduate degree (BA/BSc/other) or higher</li>
      </ul>

      <p>
        <strong>Reimbursement &amp; Compensation</strong>
        <br />
        You will receive <strong>$6 USD</strong> for your participation via
        Prolific.
        <br />
        <u>Note</u>: If your performance is below a minimal threshold for
        quality, you will not be compensated.
        <br />
        This study includes comprehension and attention checks to ensure
        participants complete the tasks honestly and thoroughly. If you fail
        these checks, you will not be compensated.
        <br />
        Do not refresh your browser during the study, as it will cause data
        loss and you will not be compensated.
      </p>

      <p>
        <strong>Confidentiality &amp; Anonymity</strong>
        <br />
        All research data collected will be stored securely and confidentially
        on a password protected server indefinitely. Identifying details will
        not be associated with any data provided by you as part of any
        publication or presentation.
      </p>

      <p>
        <strong>Future Research Use</strong>
        <br />
        Once the study is done, we may share the information collected with
        other researchers so they can use it for other studies in the future.
      </p>

      <p>
        <strong>Contact Information</strong>
        <br />
        University of California, Irvine - Department of Computer Science
        <br />
        Lead Researcher: <em>Catarina Belem</em> (cbelem@uci.edu)
        <br />
        Faculty Sponsor: <em>Padhraic Smyth</em> (smyth@ics.uci.edu)
      </p>

      <hr />

      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          style={{ marginTop: 4 }}
        />
        <span>
          1. You have read and understood this Study Information Sheet, you are
          taking part in this research study voluntarily, you meet the
          eligibility requirements, and you agree that your anonymized data may
          be shared in public repositories.
          <br />
          2. You will complete this study independently, without help from any
          external sources, tools, or individuals.
        </span>
      </label>

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button
          onClick={handleSubmit}
          disabled={!checked}
          style={{
            padding: "12px 28px",
            backgroundColor: checked ? "#007bff" : "#9fbce8",
            color: "white",
            borderRadius: 8,
            cursor: checked ? "pointer" : "not-allowed",
            fontSize: "1rem",
          }}
        >
          Submit and Proceed
        </button>
      </div>
    </div>
  );
}
