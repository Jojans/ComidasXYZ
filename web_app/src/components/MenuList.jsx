import { useEffect, useState } from "react";
import api from "../api";

export default function MenuList() {
    const [menus, setMenus] = useState([]);

    useEffect(() => {
        api.get("/menus")
            .then((response) => {
                setMenus(response.data);
            })
            .catch((error) => {
                console.error("Error fetching menus:", error);
            });
    }, []);

    return (
        <div>
      <h2 className="text-2xl font-bold mb-4">Menús</h2>
      {menus.map(menu => (
        <div key={menu.id_menu} className="border rounded-lg p-4 mb-4 shadow-sm">
          <h3 className="text-xl font-semibold">{menu.nombre}</h3>
          <p className="text-gray-700">{menu.descripcion}</p>
          <p className="text-sm text-gray-500 mt-1">
            <strong>Día:</strong> {menu.dia_semana}
          </p>

          <h4 className="mt-3 font-semibold">Productos:</h4>
          <ul className="list-disc ml-6 text-gray-800">
            {menu.productos.map(prod => (
              <li key={prod.id_producto}>
                {prod.nombre} (${prod.costo_con_iva.toFixed(2)})
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}