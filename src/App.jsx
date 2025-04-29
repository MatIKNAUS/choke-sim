import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";

function App() {
  const [data, setData] = useState([]);
  const [decisions, setDecisions] = useState([]);

  useEffect(() => {
    Papa.parse("/sample_choke_data.csv", {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (result) => {
        const enriched = result.data.map((row, i, arr) => {
          const tolerance = 50; // psi
          const nextP_bh = arr[i + 1]?.P_bh || row.P_bh;
          let action = "Mantener apertura";

          if (row.Circulating === "No") {
            action = "Flujo detenido";
          } else if (Math.abs(nextP_bh - row.P_bh) > tolerance) {
            action = nextP_bh > row.P_bh ? "Reducir apertura" : "Incrementar apertura";
          }

          return {
            ...row,
            decision: action,
            index: i,
          };
        });

        setData(enriched);
        setDecisions(enriched.map(({ index, decision }) => ({ index, decision })));
      },
    });
  }, []);

  const downloadCSV = () => {
    const csvContent = [
      ["Index", "Decision"],
      ...decisions.map((row) => [row.index, row.decision]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "choke_decisions.csv";
    a.click();
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Simulación de Automatización de Válvula Choke</h1>

      <LineChart width={900} height={350} data={data}>
        <CartesianGrid stroke="#ccc" />
        <XAxis dataKey="index" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="P_bh" stroke="#8884d8" name="Presión de fondo (P_bh)" />
        <Line type="monotone" dataKey="SBP" stroke="#82ca9d" name="Presión de superficie (SBP)" />
        <Line type="monotone" dataKey="SPP" stroke="#ffc658" name="Presión de bomba (SPP)" />
      </LineChart>

      <h2>Justificación de decisiones</h2>
      <ul>
        {decisions.map(({ index, decision }) => (
          <li key={index}>
            Paso {index}: {decision}
          </li>
        ))}
      </ul>

      <button onClick={downloadCSV} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
        Descargar decisiones como CSV
      </button>
    </div>
  );
}

export default App;
