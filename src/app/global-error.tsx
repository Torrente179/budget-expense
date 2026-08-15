"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
        <main
          style={{
            minHeight: "100dvh",
            display: "grid",
            placeItems: "center",
            padding: 24,
            background: "#1A1B23",
            color: "white",
            textAlign: "center",
          }}
        >
          <section style={{ maxWidth: 520 }}>
            <p style={{ color: "#FF7A64", fontSize: 48, fontWeight: 750, margin: 0 }}>
              Still safe.
            </p>
            <h1 style={{ margin: "16px 0 8px", fontSize: 28 }}>
              The app needs a fresh start. / La app necesita reiniciarse.
            </h1>
            <p style={{ color: "rgba(255,255,255,.62)", lineHeight: 1.5 }}>
              No financial action should be repeated until the app is visible
              again. / No repitas ninguna acción financiera hasta volver a ver
              la app.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                minHeight: 44,
                marginTop: 20,
                border: 0,
                borderRadius: 999,
                padding: "0 22px",
                background: "#FF7A64",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Restart / Reiniciar
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
