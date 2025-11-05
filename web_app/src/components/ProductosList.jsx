import { useEffect, useState } from "react";
import api from "../api";

export default function ProductosList() {
    const [productos, setProductos] = useState([]);

    useEffect(() => {
        api.get("/productos")
            .then((response) => {
                setProductos(response.data);
            })
            .catch((error) => {
                console.error("Error fetching productos:", error);
            });
    }, []);

    return (
        <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Productos</h2>
      <div className="grid grid-cols-3 gap-4">
        {productos.map((p) => (
          <div
            key={p.id_producto}
            className="p-4 border rounded-lg shadow hover:shadow-lg transition"
          >
            <h3 className="font-bold">{p.nombre}</h3>
            <p>{p.descripcion}</p>
            <p>Costo sin IVA: ${p.costo_sin_iva}</p>
            <p>IVA: {p.porcentaje_iva}%</p>
            <p>Total: ${(p.costo_sin_iva * (1 + p.porcentaje_iva / 100)).toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}