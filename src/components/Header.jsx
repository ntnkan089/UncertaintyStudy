export default function Header({ title }) {
  const base = import.meta.env.BASE_URL;

  return (
    <header style={headerStyle}>
      <img src={base + "BCeater-right.png"} alt="Left Logo" style={leftLogoStyle} />
      <h2 style={titleStyle}>{title}</h2>
      <img src={base + "BCeater-left.png"} alt="Right Logo" style={rightLogoStyle} />
    </header>
  );
}

const headerStyle = {
  backgroundColor: "#0064a4",
  padding: "10px 0",
  width: "100%",
  height: "75px",
  position: "relative",
};

const logoBase = {
  height: "75px",
  width: "auto",
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
};

const leftLogoStyle = { ...logoBase, left: "10px" };
const rightLogoStyle = { ...logoBase, right: "10px" };

const titleStyle = {
  color: "#fff",
  textAlign: "center",
  margin: 0,
  lineHeight: "75px",
  fontSize: "1.5em",
};
