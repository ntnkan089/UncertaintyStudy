export default function DuplicateParticipationModal({ open }) {
  if (!open) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ marginBottom: "15px" }}>Duplicate Participation Detected</h2>
        <p style={textStyle}>
          <strong>You have already participated in this study.</strong>
        </p>
        <p style={textStyle}>Participation is limited to one time only.</p>
        <p style={textStyle}>
          Please <strong>return</strong> your submission by closing this study
          and clicking <strong>"Stop Without Completing"</strong> on Prolific.
        </p>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed", top: 0, left: 0,
  width: "100vw", height: "100vh",
  backgroundColor: "var(--color-bg)", color: "var(--color-text)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 9999,
};

const modalStyle = {
  backgroundColor: "var(--color-bg)", padding: "30px",
  borderRadius: "8px", maxWidth: "500px", width: "90%",
  textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
};

const textStyle = { marginBottom: "10px", lineHeight: "1.5" };
