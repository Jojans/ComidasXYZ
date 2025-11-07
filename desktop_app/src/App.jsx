import { useState } from 'react'
import FacturaForm from './components/FacturaForm.jsx';
import FacturaHistorial from './components/FacturaHistorial.jsx';
import './App.css'

export default function App() {
  const [view, setView] = useState('nueva');

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="text-3xl font-bold mb-6">Sistema de Facturación</h1>
        <nav className="mb-6">
          <button
            className={`mr-4 px-4 py-2 rounded ${view === 'nueva' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setView('nueva')}
          >
            Nueva Factura
          </button>
          <button
            className={`px-4 py-2 rounded ${view === 'historial' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setView('historial')}
          >
            Historial de Facturas
          </button>
        </nav>
      </header>
      <main>
        {view === 'nueva' ? <FacturaForm /> : <FacturaHistorial />}
      </main>
    </div>
  );
}