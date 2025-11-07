import { useEffect, useState } from "react";
import api from "../api";

export default function MenuList() {
    const [menus, setMenus] = useState([]);
    const [productos, setProductos] = useState([]);
    const [selected, setSelected] = useState(null);

    const [formData, setFormData] = useState({
        nombre: "",
        descripcion: "",
        dia_semana: "",
        productos: [],
    });

    const fetchMenus = async () => {
        try {
            const response = await api.get("/menus");
            setMenus(response.data);
        } catch (error) {
            console.error("Error fetching menus:", error);
        }
    };

    const fetchProductos = async () => {
        try {
            const response = await api.get("/productos");
            setProductos(response.data);
        } catch (error) {
            console.error("Error fetching productos:", error);
        }
    };

    useEffect(() => {
        fetchMenus();
        fetchProductos();
    }, []);

    const handleChange = (e) => {
        setFormData((prev) => ({
          ...prev,
          [e.target.name]: e.target.value
        }));
    };

    const handleProductoSelect = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, (opt) => parseInt(opt.value));
        setFormData((prev) => ({
          ...prev,
          productos: selectedOptions
        }));
    }

    const handleMenu = async (e) => {
      e.preventDefault();
      try {
        const payload = {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          dia_semana: formData.dia_semana,
          productos_ids: formData.productos,
        };

        if (selected) {
          await api.put(`/menus/${selected.id_menu}`, payload);
          alert("Menú actualizado con éxito");
        } else {
          await api.post("/menus", payload);
          alert("Menú creado con éxito");
        }

        setFormData({
          nombre: "",
          descripcion: "",
          dia_semana: "",
          productos: []
        });
        setSelected(null);
        fetchMenus();
      } catch (error) {
        console.error("Error saving menu:", error.response?.data || error.message);
        alert("Error al guardar el menú");
      }
    };
    
    const handleEdit = (menu) => {
        setSelected(menu);
        setFormData({
            nombre: menu.nombre,
            descripcion: menu.descripcion,
            dia_semana: menu.dia_semana,
            productos: menu.productos.map(p => p.id_producto)
        });
    };

    const handleDelete = async(id) => {
      if (confirm("¿Está seguro de que desea eliminar este menú?")) {
        try {
          await api.delete(`/menus/${id}`);
          alert("Menú eliminado con éxito");
          fetchMenus();
        } catch (error) {
          console.error("Error deleting menu:", error);
          alert("Error al eliminar el menú");
        }
      }
    };

    return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">Gestión de Menús</h2>

      {/* Formulario */}
      <form
        onSubmit={handleMenu}
        className="bg-gray-100 p-6 rounded-xl shadow-md mb-8"
      >
        <h3 className="text-xl font-semibold mb-4">
          {selected ? "Editar Menú" : "Crear Menú"}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Nombre del menú"
            className="p-2 border rounded-md"
            required
          />
          <input
            type="text"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Descripción"
            className="p-2 border rounded-md"
          />
          <select
            name="dia_semana"
            value={formData.dia_semana}
            onChange={handleChange}
            className="p-2 border rounded-md"
            required
          >
            <option value="">Seleccione un día</option>
            <option value="Lunes">Lunes</option>
            <option value="Martes">Martes</option>
            <option value="Miércoles">Miércoles</option>
            <option value="Jueves">Jueves</option>
            <option value="Viernes">Viernes</option>
            <option value="Sábado">Sábado</option>
            <option value="Domingo">Domingo</option>
          </select>

          <select
            multiple
            value={formData.productos}
            onChange={handleProductoSelect}
            className="p-2 border rounded-md h-32"
          >
            {productos.map((p) => (
              <option key={p.id_producto} value={p.id_producto}>
                {p.nombre} (${p.costo_con_iva.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex justify-end gap-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            {selected ? "Actualizar" : "Crear"}
          </button>
          {selected && (
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setFormData({
                  nombre: "",
                  descripcion: "",
                  dia_semana: "",
                  productos: [],
                  total: 0
                });
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Listado */}
      <div className="grid grid-cols-2 gap-6">
        {menus.map((menu) => (
          <div
            key={menu.id_menu}
            className="p-4 bg-white border rounded-xl shadow hover:shadow-lg transition"
          >
            <h3 className="font-bold text-lg mb-1">{menu.nombre}</h3>
            <p className="text-gray-600 mb-2">{menu.descripcion}</p>
            <p className="text-sm text-gray-500 mb-3">
              Día: {menu.dia_semana}
            </p>

            <h4 className="font-semibold">Productos:</h4>
            <ul className="list-disc ml-5 text-gray-700">
              {menu.productos.map((p) => (
                <li key={p.id_producto}>
                  {p.nombre} (${p.costo_con_iva.toFixed(2)})
                </li>
              ))}
            </ul>

            <p className="mt-2 font-semibold text-blue-700">
              Total del menú: ${menu.total?.toFixed(2) || 0.00}
            </p>


            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleEdit(menu)}
                className="bg-yellow-400 px-3 py-1 rounded-md hover:bg-yellow-500"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(menu.id_menu)}
                className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}