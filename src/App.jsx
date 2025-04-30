import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function App() {
  const [data, setData] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [chokeData, setChokeData] = useState([]);

  useEffect(() => {
    Papa.parse("/sample_choke_data.csv", {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (result) => {
        const enriched = [];
        const chokeStates = [];

        let choke = 50; // apertura inicial %

        result.data.forEach((row, i, arr) => {
          const tolerance = 50;
          const nextP_bh = arr[i + 1]?.P_bh || row.P_bh;
          let action = "Mantener apertura";

          if (row.Circulating === "No") {
            action = "Flujo detenido";
          } else if (Math.abs(nextP_bh - row.P_bh) > tolerance) {
            action = nextP_bh > row.P_bh ? "Reducir apertura" : "Incrementar apertura";
          }

          // Simular efecto en apertura del choke
          if (action === "Reducir apertura") choke = Math.max(0, choke - 5);
          else if (action === "Incrementar apertura") choke = Math.min(100, choke + 5);

          enriched.push({ ...row, index: i, decision: action });
          chokeStates.push({ index: i, choke });
        });

        setData(enriched);
        setDecisions(enriched.map(({ index, decision }) => ({ index, decision })));
        setChokeData(chokeStates);
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

  const exportChartsToPDF = () => {
    const input = document.getElementById("charts-container");
    if (!input) return;

    const pdf = new jsPDF("p", "mm", "a4");

    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);
      pdf.save("graficos_simulacion.pdf");
    });
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Simulación de Automatización de Válvula Choke</h1>

      <div id="charts-container">
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

        <h3>Apertura del choke (%)</h3>
        <LineChart width={900} height={300} data={chokeData}>
          <CartesianGrid stroke="#ccc" />
          <XAxis dataKey="index" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="choke"
            stroke="#ff7300"
            name="Apertura del choke (%)"
            dot={false}
          />
        </LineChart>
      </div>

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

      <button onClick={exportChartsToPDF} style={{ marginLeft: "1rem", padding: "0.5rem 1rem" }}>
        Exportar gráficos a PDF
      </button>
    </div>
  );
}

export default App;
