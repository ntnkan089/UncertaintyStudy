export default function InfoOverlay({ title, message, onOk }) {
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {title && <h2 style={{ marginBottom: "15px" }}>{title}</h2>}
        <p style={textStyle}>{message}</p>
        {onOk && (
          <button onClick={onOk} style={btnStyle}>
            OK
          </button>
        )}
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

const textStyle = { marginBottom: "10px", lineHeight: "1.5", whiteSpace: "pre-line" };

const btnStyle = {
  marginTop: "20px", padding: "14px 26px",
  backgroundColor: "#007bff", color: "white",
  border: "none", borderRadius: 8,
  cursor: "pointer", fontSize: "1rem", fontWeight: 600,
};
