import logo from "@/imports/Moncarca.png";

export default function App() {
  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#080808" }}
    >
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(234,179,8,0.07) 0%, transparent 70%)",
        }}
      />

      {/* thin top rule */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(246,201,14,0.5), transparent)" }}
      />

      <div className="relative z-10 flex flex-col items-center px-6 py-16 text-center max-w-2xl w-full mx-auto">
        {/* logo */}
        <img
          src={logo}
          alt="Monarca Group — CEO Carlos Bernardo"
          className="object-contain mb-10"
          style={{ width: "clamp(160px, 36vw, 260px)", filter: "brightness(1.05)" }}
        />

        {/* headline */}
        <h1
          style={{
            fontFamily: "'Cormorant', serif",
            fontWeight: 300,
            fontSize: "clamp(1.1rem, 3.5vw, 1.6rem)",
            letterSpacing: "0.45em",
            color: "rgba(246,201,14,0.85)",
            textTransform: "uppercase",
            marginBottom: "0.5rem",
          }}
        >
          Em Breve
        </h1>

        {/* divider */}
        <div className="flex items-center gap-3 mb-8" style={{ width: "clamp(160px, 40vw, 280px)" }}>
          <div className="flex-1 h-px" style={{ background: "rgba(246,201,14,0.25)" }} />
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: "rgba(246,201,14,0.5)" }} />
          <div className="flex-1 h-px" style={{ background: "rgba(246,201,14,0.25)" }} />
        </div>

        <p
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 300,
            fontSize: "clamp(0.78rem, 1.8vw, 0.92rem)",
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
            marginBottom: "3rem",
            lineHeight: 1.8,
          }}
        >
          Algo grandioso está a caminho.
          <br />
          Estamos preparando tudo para você.
        </p>

      </div>

      {/* bottom rule */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(246,201,14,0.3), transparent)" }}
      />
    </div>
  );
}
