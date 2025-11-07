const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", async () => {
  const menuSelect = document.getElementById("menuSelect");
  const form = document.getElementById("facturaForm");
  const respuestaDiv = document.getElementById("respuesta");

  try {
    const res = await fetch(`${API_URL}/menus`);
    const menus = await res.json();
    menus.forEach(menu => {
      const opt = document.createElement("option");
      opt.value = menu.id_menu;
      opt.textContent = `${menu.nombre} - ${menu.dia_semana}`;
      menuSelect.appendChild(opt);
    });
  } catch (error) {
    console.error("Error cargando menús:", error);
  }

  // Enviar factura al backend
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const factura = {
      nombre_cliente: form.nombre_cliente.value,
      tipo_identificacion: form.tipo_identificacion.value,
      numero_identificacion: form.numero_identificacion.value,
      telefono: form.telefono.value,
      menus: [
        {
          menu_id: parseInt(form.menuSelect.value),
          cantidad: parseInt(form.cantidad.value),
        },
      ],
    };

    try {
      const response = await fetch(`${API_URL}/facturas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(factura),
      });

      const data = await response.json();
      respuestaDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch (error) {
      respuestaDiv.textContent = "Error al crear factura.";
      console.error(error);
    }
  });
});