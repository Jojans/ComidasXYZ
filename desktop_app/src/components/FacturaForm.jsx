import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

export default function FacturaForm() {
  const [productos, setProductos] = useState([]);
  const [items, setItems] = useState([]);
  const [cliente, setCliente] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/productos`)
      .then(res => setProductos(res.data))
      .catch(err => console.error('Error cargando productos:', err));
  }, []);

  const agregarItem = (producto) => {
    const existente = items.find(i => i.id === producto.id);
    if (existente) {
      existente.cantidad += 1;
      setItems([...items]);
    } else {
      setItems([...items, { ...producto, cantidad: 1 }]);
    }
  };

  const subtotal = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const iva = subtotal * 0.19;
  const total = subtotal + iva;

  const guardarFactura = () => {
    axios.post(`${API_URL}/facturas`, {
      cliente,
      items: items.map(i => ({ id: i.id, cantidad: i.cantidad })),
      total
    }).then(() => {
      alert('Factura guardada');
      setItems([]);
      setCliente('');
    }).catch(err => console.error('Error guardando factura:', err));
  };

  return (
    <div className="flex gap-8">
      <div className="w-1/2">
        <h2 className="text-xl font-semibold mb-2">Seleccionar productos</h2>
        <div className="border rounded p-2 h-[500px] overflow-y-auto">
          {productos.map(p => (
            <div key={p.id} className="flex justify-between items-center border-b py-2">
              <span>{p.nombre}</span>
              <button onClick={() => agregarItem(p)} className="bg-blue-500 text-white px-3 py-1 rounded">Agregar</button>
            </div>
          ))}
        </div>
      </div>

      <div className="w-1/2">
        <h2 className="text-xl font-semibold mb-2">Factura actual</h2>
        <input
          type="text"
          placeholder="Nombre del cliente"
          value={cliente}
          onChange={e => setCliente(e.target.value)}
          className="border rounded p-2 w-full mb-3"
        />
        <div className="border rounded p-2 h-[400px] overflow-y-auto mb-3">
          {items.map(i => (
            <div key={i.id} className="flex justify-between items-center py-2 border-b">
              <span>{i.nombre} x{i.cantidad}</span>
              <span>${i.precio * i.cantidad}</span>
            </div>
          ))}
        </div>
        <div className="text-right mb-2">
          <p>Subtotal: ${subtotal.toFixed(2)}</p>
          <p>IVA (19%): ${iva.toFixed(2)}</p>
          <p className="font-bold">Total: ${total.toFixed(2)}</p>
        </div>
        <button onClick={guardarFactura} className="bg-green-600 text-white px-4 py-2 rounded">Guardar Factura</button>
      </div>
    </div>
  );
}