import { useEffect, useState } from "react";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../api";

export default function ProductosList() {
  const [productos, setProductos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    costo_sin_iva: "",
    tiempo_preparacion: "",
  });

  const fetchProductos = async () => {
    try {
      const data = await getProducts();
      setProductos(data);
    } catch (err) {
      console.error("Error fetching productos:", err);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selected) {
        await updateProduct(selected.id_producto, formData);
        alert("Producto actualizado correctamente");
      } else {
        await createProduct(formData);
        alert("Producto creado correctamente");
      }
      setFormData({
        nombre: "",
        descripcion: "",
        costo_sin_iva: "",
        tiempo_preparacion: "",
      });
      setSelected(null);
      fetchProductos();
    } catch (err) {
      console.error("Error al guardar producto:", err);
    }
  };

  const handleEdit = async (id) => {
    try {
      const data = await getProductById(id);
      setFormData(data);
      setSelected(data);
    } catch (err) {
      console.error("Error obteniendo producto:", err);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Deseas eliminar este producto?")) {
      try {
        await deleteProduct(id);
        fetchProductos();
      } catch (err) {
        console.error("Error eliminando producto:", err);
      }
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">Gestión de Productos</h2>

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-100 p-6 rounded-xl shadow-md mb-8"
      >
        <h3 className="text-xl font-semibold mb-4">
          {selected ? "Editar Producto" : "Crear Producto"}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Nombre"
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
          <input
            type="number"
            name="tiempo_preparacion"
            value={formData.tiempo_preparacion}
            onChange={handleChange}
            placeholder="Tiempo de Preparación (min)"
            className="p-2 border rounded-md"
            required
          />
          <input
            type="number"
            name="costo_sin_iva"
            value={formData.costo_sin_iva}
            onChange={handleChange}
            placeholder="Costo sin IVA"
            className="p-2 border rounded-md"
            required
          />
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
                  costo_sin_iva: "",
                  tiempo_preparacion: "",
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
      <div className="grid grid-cols-3 gap-6">
        {productos.map((p) => (
          <div
            key={p.id_producto}
            className="p-4 bg-white border rounded-xl shadow hover:shadow-lg transition"
          >
            <h3 className="font-bold text-lg mb-1">{p.nombre}</h3>
            <p className="text-gray-600 mb-2">{p.descripcion}</p>
            <p className="text-sm text-gray-500">Tiempo de preparación: {p.tiempo_preparacion} min</p>

            
            <p className="font-semibold mt-2">
              Total: ${(p.costo_sin_iva * (1 + p.porcentaje_iva / 100)).toFixed(2)}
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleEdit(p.id_producto)}
                className="bg-yellow-400 px-3 py-1 rounded-md hover:bg-yellow-500"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(p.id_producto)}
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