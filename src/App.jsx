import { useState, useEffect, useMemo, useEffectEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import { auth, db } from "./config/firestore.js";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

import Header from "./components/Header.jsx";
import DuplicateParticipationModal from "./components/Block.jsx";
import Consent from "./components/Consent.jsx";
import IntegrityPledge from "./components/IntegrityPledge.jsx";
import Instructions from "./components/Instructions.jsx";
import Screening from "./components/Screening.jsx";
import Experiment from "./components/Experiment.jsx";
import Complete from "./components/Complete.jsx";
import InfoOverlay from "./components/InfoOverlay.jsx";

const ROOT_COLLECTION = "uncertainty_user";

const useQueryParams = () =>
  useMemo(() => new URLSearchParams(window.location.search), []);

export default function App() {
  const searchParams = useQueryParams();
  const qgroup = Number(searchParams.get("qgr")) || 1;
  const isDev = import.meta.env.MODE === "development";

  const [page, setPage] = useState("consent");
  const [firebaseUID, setFirebaseUID] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [instructionsStartPage, setInstructionsStartPage] = useState(0);
  const [exampleSelections, setExampleSelections] = useState({});

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) setFirebaseUID(user.uid);
    });
    return unsub;
  }, []);

  const [PID, setPID] = useState(() => {
    if (!isDev) {
      const pid = searchParams.get("PROLIFIC_PID");
      return pid || "none";
    }
    const urlPID = searchParams.get("PROLIFIC_PID");
    const storedPID = sessionStorage.getItem("TEST_PID");
    return urlPID || storedPID || null;
  });

  const generatePID = useEffectEvent(() => {
    if (PID) return;
    const pid = `test_${uuidv4()}`;
    sessionStorage.setItem("TEST_PID", pid);
    setPID(pid);
  });

  useEffect(() => {
    if (!isDev) return;
    generatePID();
  }, [isDev]);

  const OK = PID && PID !== "none";

  const checkDuplicate = useEffectEvent(async (pid) => {
    if (!pid || pid === "none" || !firebaseUID) return;
    try {
      const ref = doc(db, ROOT_COLLECTION, pid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setIsDuplicate(true);
      } else {
        await setDoc(ref, {
          consentPageVisited: true,
          timestamp: serverTimestamp(),
          qgr: qgroup,
          pass_comprehension: false,
          finish_comprehension: false,
          is_finish_all_experiments: false,
          PID: pid,
        });
      }
    } catch (err) {
      console.error("PID check failed:", err);
    }
  });

  useEffect(() => {
    if (!PID || !firebaseUID) return;
    checkDuplicate(PID);
  }, [PID, firebaseUID]);

  const appStyle = {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  };

  const containerStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    padding: "20px",
    backgroundColor: "var(--color-bg)",
    color: "var(--color-text)",
  };

  return (
    <>
      <DuplicateParticipationModal open={isDuplicate || !OK} />

      {OK && !isDuplicate && (
        <div style={appStyle}>
          <Header title="" />
          <div style={containerStyle}>
            {page === "consent" && firebaseUID && (
              <Consent
                PID={PID}
                onNext={() => setPage("instructions")}
              />
            )}

            {page === "instructions" && (
              <Instructions
                PID={PID}
                initialPage={instructionsStartPage}
                exampleSelections={exampleSelections}
                onSaveExampleSelection={(idx, sel) =>
                  setExampleSelections((prev) => ({ ...prev, [idx]: sel }))
                }
                onNext={() => {
                  setInstructionsStartPage(0);
                  setPage("pledge");
                }}
                onBack={() => setPage("consent")}
              />
            )}

            {page === "pledge" && (
              <IntegrityPledge
                PID={PID}
                onNext={() => setPage("screening")}
                onBack={() => {
                  setInstructionsStartPage(4);
                  setPage("instructions");
                }}
              />
            )}

            {page === "screening" && (
              <Screening
                PID={PID}
                onPass={() => setPage("pre-experiment")}
                onFail={() => setPage("fail")}
              />
            )}

            {page === "fail" && (
              <InfoOverlay
                title="Study Ended"
                message={
                  'You did not pass the screening check. Study ends.\n\nPlease return your submission by closing this study and clicking "Stop Without Completing" on Prolific.'
                }
              />
            )}

            {page === "pre-experiment" && (
              <InfoOverlay
                title="Screening Passed"
                message="Great job! You passed the screening check. You will now proceed to the main study."
                onOk={() => setPage("experiment")}
              />
            )}

            {page === "experiment" && firebaseUID && (
              <Experiment
                PID={PID}
                qgroup={qgroup}
                onFinish={() => setPage("complete")}
              />
            )}

            {page === "complete" && firebaseUID && (
              <Complete PID={PID} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
