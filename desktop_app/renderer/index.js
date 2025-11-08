const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", async () => {
  const menuSelect = document.querySelector(".menuSelect");
  const productoSelect = document.querySelector(".productoSelect");
  const menusContainer = document.getElementById("menusContainer");
  const productosContainer = document.getElementById("productosContainer");
  const agregarMenuBtn = document.getElementById("agregarMenu");
  const agregarProductoBtn = document.getElementById("agregarProducto");
  const form = document.getElementById("facturaForm");
  const respuestaDiv = document.getElementById("respuesta");
  const listaFacturasDiv = document.getElementById("listaFacturas");
  const btnListar = document.getElementById("listarFacturas");

  let menus = [];
  let productos = [];

  try {
    const [resMenus, resProductos] = await Promise.all([
      fetch(`${API_URL}/menus`),
      fetch(`${API_URL}/productos`)
    ]);
    menus = await resMenus.json();
    productos = await resProductos.json();

    menus.forEach(menu => {
      const opt = document.createElement("option");
      opt.value = menu.id_menu;
      opt.textContent = `${menu.nombre} - ${menu.dia_semana}`;
      menuSelect.appendChild(opt);
    });

    productos.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id_producto;
      opt.textContent = p.nombre;
      productoSelect.appendChild(opt);
    });
  } catch (error) {
    console.error("Error cargando datos:", error);
  }

  agregarMenuBtn.addEventListener("click", () => {
    const nuevo = menusContainer.firstElementChild.cloneNode(true);
    menusContainer.appendChild(nuevo);
  });

  agregarProductoBtn.addEventListener("click", () => {
    const nuevo = productosContainer.firstElementChild.cloneNode(true);
    productosContainer.appendChild(nuevo);
  });

  // Enviar factura al backend
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const menusSeleccionados = Array.from(document.querySelectorAll(".menuItem")).map(div => ({
      menu_id: parseInt(div.querySelector(".menuSelect").value),
      cantidad: parseInt(div.querySelector(".cantidadMenu").value),
    }));

    const productosSeleccionados = Array.from(document.querySelectorAll(".productoItem")).map(div => ({
      producto_id: parseInt(div.querySelector(".productoSelect").value),
      cantidad: parseInt(div.querySelector(".cantidadProducto").value),
    }));

    const factura = {
      nombre_cliente: form.nombre_cliente.value,
      tipo_identificacion: form.tipo_identificacion.value,
      numero_identificacion: form.numero_identificacion.value,
      telefono: form.telefono.value,
      menus: menusSeleccionados,
      productos: productosSeleccionados
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

  btnListar.addEventListener("click", async () => {
    try {
      const res = await fetch(`${API_URL}/facturas`);
      const facturas = await res.json();

      if (!Array.isArray(facturas) || facturas.length === 0) {
        listaFacturasDiv.innerHTML = "<p>No hay facturas registradas.</p>";
        return;
      }

      listaFacturasDiv.innerHTML = facturas
        .map(
          (f) => `
          <div class="factura-item">
            <h3>Factura #${f.id_factura}</h3>
            <p><strong>Cliente:</strong> ${f.nombre_cliente}</p>
            <p><strong>Identificación:</strong> ${f.tipo_identificacion} ${f.numero_identificacion}</p>
            <p><strong>Subtotal:</strong> $${f.subtotal.toFixed(2)}</p>
            <p><strong>Impuesto consumo:</strong> $${f.impuesto_consumo.toFixed(2)}</p>
            <p><strong>Total:</strong> $${f.total.toFixed(2)}</p>

            <details>
              <summary><strong>Ver detalles del pedido</strong></summary>
              <ul>
                ${f.detalles
                  .map(
                    (d) => `
                  <li>
                    <strong>${d.menu.nombre}</strong> (${d.menu.dia_semana}) — ${d.cantidad} und.
                    <ul>
                      ${d.menu.productos
                        .map(
                          (p) =>
                            `<li>${p.nombre}: $${p.costo_con_iva.toFixed(
                              2
                            )}</li>`
                        )
                        .join("")}
                    </ul>
                  </li>
                `
                  )
                  .join("")}
              </ul>
            </details>

            <button onclick="imprimirFactura(${f.id_factura})">Imprimir</button>
            <button onclick="editarFactura(${f.id_factura})">Editar</button>
            <button onclick="eliminarFactura(${f.id_factura})">Eliminar</button>
          </div>
        `
        )
        .join("");
    } catch (error) {
      console.error("Error listando facturas:", error);
      listaFacturasDiv.innerHTML = "<p>Error cargando facturas.</p>";
    }
  });
  
  window.imprimirFactura = async (id) => {
    try {
      const res = await fetch(`${API_URL}/facturas/${id}`);
      if (!res.ok) throw new Error("Factura no encontrada");
      const factura = await res.json();

      const printWindow = window.open("", "_blank");
      const detalleHTML = factura.detalles
        .map(
          (d) => `
          <li>
            <strong>${d.menu.nombre}</strong> (${d.menu.dia_semana}) — ${d.cantidad} und.
            <ul>
              ${d.menu.productos
                .map(
                  (p) =>
                    `<li>${p.nombre}: $${p.costo_con_iva.toFixed(2)}</li>`
                )
                .join("")}
            </ul>
          </li>
        `
        )
        .join("");

      printWindow.document.write(`
        <html>
          <head>
            <title>Factura #${factura.id_factura}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #2b6cb0; }
              ul { list-style-type: none; padding-left: 0; }
              li { margin-bottom: 6px; }
              .total { margin-top: 20px; font-weight: bold; }
              button { padding: 8px 12px; background: #2b6cb0; color: white; border: none; border-radius: 6px; cursor: pointer; }
            </style>
          </head>
          <body>
            <h1>Factura #${factura.id_factura}</h1>
            <p><strong>Cliente:</strong> ${factura.nombre_cliente}</p>
            <p><strong>Identificación:</strong> ${factura.tipo_identificacion} ${factura.numero_identificacion}</p>
            <p><strong>Teléfono:</strong> ${factura.telefono}</p>
            <h3>Detalle:</h3>
            <ul>${detalleHTML}</ul>
            <div class="total">
              Subtotal: $${factura.subtotal.toFixed(2)} <br>
              Impuesto consumo: $${factura.impuesto_consumo.toFixed(2)} <br>
              Total: $${factura.total.toFixed(2)}
            </div>
            <button onclick="window.print()">Imprimir</button>
          </body>
        </html>
      `);
    } catch (error) {
      console.error(error);
      alert("Error al imprimir factura.");
    }
  };

  window.editarFactura = async (id_factura) => {
    try {
      const nuevoNombre = prompt("Nuevo nombre del cliente:");
      const nuevoTipo = prompt("Nuevo tipo de identificación (CC, CE, TI):", "CC");
      const nuevoNumero = prompt("Nuevo número de identificación:");
      const nuevoTelefono = prompt("Nuevo teléfono (opcional):", "");

      if (!nuevoNombre || !nuevoTipo || !nuevoNumero) {
        alert("Todos los campos requeridos deben completarse.");
        return;
      }

      const resMenus = await fetch(`${API_URL}/menus`);
      const menus = await resMenus.json();

      if (!menus.length) {
        alert("No hay menús disponibles para asignar.");
        return;
      }

      const menu_id = prompt(
        `ID del menú a asociar (por ejemplo ${menus[0].id_menu}):`,
        menus[0]?.id_menu || 1
      );
      const cantidad = prompt("Cantidad:", "1");

      const payload = {
        nombre_cliente: nuevoNombre,
        tipo_identificacion: nuevoTipo,
        numero_identificacion: nuevoNumero,
        telefono: nuevoTelefono,
        menus: [
          {
            menu_id: parseInt(menu_id),
            cantidad: parseInt(cantidad),
          },
        ],
      };

      console.log("Payload enviado:", payload);

      const res = await fetch(`${API_URL}/facturas/${id_factura}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      console.log("Respuesta del servidor:", text);

      if (!res.ok) {
        alert(`Error al editar factura (${res.status}):\n\n${text}`);
        return;
      }

      alert("✅ Factura actualizada correctamente.");
      document.getElementById("btnListar").click();
    } catch (err) {
      console.error(err);
      alert("Error inesperado al editar factura. Revisa la consola para más detalles.");
    }
  };


  window.eliminarFactura = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar esta factura?")) return;

    try {
      const res = await fetch(`${API_URL}/facturas/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Factura eliminada.");
        btnListar.click();
      } else {
        alert("Error eliminando factura.");
      }
    } catch (error) {
      console.error(error);
    }
  };
});