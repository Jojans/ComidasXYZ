import { useEffect, useState } from 'react';
import axios from 'axios';
const API_URL = 'http://127.0.0.1:8000';

export default function FacturaHistorial() {
  const [facturas, setFacturas] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/facturas`)
      .then(res => setFacturas(res.data))
      .catch(err => console.error('Error obteniendo facturas:', err));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Historial de facturas</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Cliente</th>
            <th className="border p-2">Fecha</th>
            <th className="border p-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {facturas.map(f => (
            <tr key={f.id}>
              <td className="border p-2">{f.cliente}</td>
              <td className="border p-2">{new Date(f.fecha).toLocaleString()}</td>
              <td className="border p-2">${f.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}