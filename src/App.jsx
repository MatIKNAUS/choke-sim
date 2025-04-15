import { useState } from 'react';
import './App.css';

function App() {
  const [csvData, setCsvData] = useState([]);
  const [decisiones, setDecisiones] = useState([]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const lines = evt.target.result.split('\n').slice(1); // ignorar encabezado
      const parsed = lines.map((line) => {
        const [tiempo, spp, sbp, mw, qin, qout] = line.split(',');
        return {
          tiempo,
          spp: parseFloat(spp),
          sbp: parseFloat(sbp),
          mw: parseFloat(mw),
          qin: parseFloat(qin),
          qout: parseFloat(qout),
        };
      });
      setCsvData(parsed);
      generarDecisiones(parsed);
    };
    reader.readAsText(file);
  };

  const generarDecisiones = (datos) => {
    const resultado = datos.map((fila) => {
      let aperturaChoke = 50;
      if (fila.sbp > 80) aperturaChoke -= 10;
      if (fila.sbp < 40) aperturaChoke += 10;
      return { ...fila, aperturaChoke: Math.max(0, Math.min(100, aperturaChoke)) };
    });
    setDecisiones(resultado);
  };

  const exportarCSV = () => {
    const encabezado = "Tiempo,SPP,SBP,MW,Qin,Qout,AperturaChoke\n";
    const contenido = decisiones.map(f => 
      `${f.tiempo},${f.spp},${f.sbp},${f.mw},${f.qin},${f.qout},${f.aperturaChoke}`
    ).join('\n');
    const blob = new Blob([encabezado + contenido], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'decisiones_choke.csv';
    a.click();
  };

  return (
    <div className="app">
      <h1>Simulador de Válvula Choke</h1>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      <button onClick={exportarCSV}>Exportar decisiones</button>

      <table>
        <thead>
          <tr>
            <th>Tiempo</th><th>SPP</th><th>SBP</th><th>MW</th><th>Qin</th><th>Qout</th><th>Apertura</th>
          </tr>
        </thead>
        <tbody>
          {decisiones.map((f, i) => (
            <tr key={i}>
              <td>{f.tiempo}</td>
              <td>{f.spp}</td>
              <td>{f.sbp}</td>
              <td>{f.mw}</td>
              <td>{f.qin}</td>
              <td>{f.qout}</td>
              <td>{f.aperturaChoke}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
