document.addEventListener('DOMContentLoaded', function() {
    // --- Utilidades de persistencia ---
    function saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }
    function loadData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    // --- Datos en memoria (cargados desde localStorage) ---
    let productos = loadData('productos');
    let clientes = loadData('clientes');
    let ventas = loadData('ventas');
    let proveedores = loadData('proveedores');

    // --- Configuración (nombre de tienda, correo, etc.) ---
    function saveConfig(config) {
        localStorage.setItem('configuracion', JSON.stringify(config));
    }
    function loadConfig() {
        const config = JSON.parse(localStorage.getItem('configuracion')) || {};
        if (config.nombreTienda && document.querySelector('.header h1')) {
            document.querySelector('.header h1').textContent = config.nombreTienda;
        }
        if (document.getElementById('configNombreTienda')) {
            document.getElementById('configNombreTienda').value = config.nombreTienda || '';
        }
        if (document.getElementById('configCorreo')) {
            document.getElementById('configCorreo').value = config.correo || '';
        }
    }

    // --- Navegación de pestañas ---
    function showTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');

        document.querySelectorAll('.nav-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.nav-tab').forEach(btn => {
            if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabId)) {
                btn.classList.add('active');
            }
        });
        // Actualiza dashboard y reportes al cambiar de pestaña
        updateDashboardAndReports();
        loadConfig();
    }
    window.showTab = showTab;

    // =========================
    // FUNCIONES AUXILIARES PARA VENTAS
    // =========================
    function fillVentaProductos() {
        const ventaProducto = document.getElementById('ventaProducto');
        if (!ventaProducto) return;
        const prevValue = ventaProducto.value;
        ventaProducto.innerHTML = '<option value="">Seleccionar producto...</option>';
        productos.forEach(prod => {
            ventaProducto.innerHTML += '<option value="${prod.codigo}">${prod.nombre}</option>';
        });
        if ([...ventaProducto.options].some(opt => opt.value === prevValue)) {
            ventaProducto.value = prevValue;
        }
    }
    function fillVentaClientes() {
        const ventaCliente = document.getElementById('ventaCliente');
        if (!ventaCliente) return;
        const prevValue = ventaCliente.value;
        ventaCliente.innerHTML = '<option value="">Seleccionar cliente...</option>';
        clientes.forEach(cli => {
            ventaCliente.innerHTML += '<option value="${cli.nombre}">${cli.nombre}</option>';
        });
        ventaCliente.innerHTML += '<option value="general">Cliente General</option>';
        if ([...ventaCliente.options].some(opt => opt.value === prevValue)) {
            ventaCliente.value = prevValue;
        }
    }

    // =========================
    // INVENTARIO
    // =========================
    function renderProductos() {
        const tbody = document.getElementById('productosTableBody');
        if (!tbody) return;
        if (!productos.length) {
            tbody.innerHTML = `<tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
                    No hay productos registrados
                </td>
            </tr>`;
            fillVentaProductos();
            updateDashboardAndReports();
            return;
        }
        tbody.innerHTML = '';
        productos.forEach((prod, idx) => {
            tbody.innerHTML += `
                <tr>
                    <td>${prod.codigo}</td>
                    <td>${prod.nombre}</td>
                    <td>${prod.categoria}</td>
                    <td>${prod.stock}</td>
                    <td>$${prod.compra}</td>
                    <td>$${prod.venta}</td>
                    <td>
                        <span class="status-badge ${prod.stock <= prod.minimo ? 'low-stock' : 'active'}">
                            ${prod.stock <= prod.minimo ? 'Bajo stock' : 'Activo'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-danger btn-small" onclick="eliminarProducto(${idx})">Eliminar</button>
                    </td>
                </tr>
            `;
        });
        fillVentaProductos();
        updateHeaderStats();
        updateDashboardAndReports();
    }

    window.eliminarProducto = function(idx) {
        productos.splice(idx, 1);
        saveData('productos', productos);
        renderProductos();
        updateHeaderStats();
        updateDashboardAndReports();
    };

    const productoForm = document.getElementById('productoForm');
    if (productoForm) {
        productoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nombre = document.getElementById('productoNombre').value.trim();
            const codigo = document.getElementById('productoCodigo').value.trim();
            const categoria = document.getElementById('productoCategoria').value;
            const compra = parseFloat(document.getElementById('productoCompra').value);
            const venta = parseFloat(document.getElementById('productoVenta').value);
            const stock = parseInt(document.getElementById('productoStock').value);
            const minimo = parseInt(document.getElementById('productoMinimo').value);
            const proveedor = document.getElementById('productoProveedor') ? document.getElementById('productoProveedor').value : '';

            if (!nombre || !codigo || !categoria) return;

            productos.push({ nombre, codigo, categoria, compra, venta, stock, minimo, proveedor });
            saveData('productos', productos);
            renderProductos();
            this.reset();
        });
    }

    // Búsqueda de productos
    const searchProductos = document.getElementById('searchProductos');
    if (searchProductos) {
        searchProductos.addEventListener('input', function() {
            const q = this.value.trim().toLowerCase();
            const tbody = document.getElementById('productosTableBody');
            const filtered = productos.filter(prod =>
                prod.nombre.toLowerCase().includes(q) ||
                prod.codigo.toLowerCase().includes(q) ||
                prod.categoria.toLowerCase().includes(q)
            );
            if (!filtered.length) {
                tbody.innerHTML = `<tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
                        No hay productos registrados
                    </td>
                </tr>`;
                return;
            }
            tbody.innerHTML = '';
            filtered.forEach((prod, idx) => {
                tbody.innerHTML += `
                    <tr>
                        <td>${prod.codigo}</td>
                        <td>${prod.nombre}</td>
                        <td>${prod.categoria}</td>
                        <td>${prod.stock}</td>
                        <td>$${prod.compra}</td>
                        <td>$${prod.venta}</td>
                        <td>
                            <span class="status-badge ${prod.stock <= prod.minimo ? 'low-stock' : 'active'}">
                                ${prod.stock <= prod.minimo ? 'Bajo stock' : 'Activo'}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-danger btn-small" onclick="eliminarProducto(${idx})">Eliminar</button>
                        </td>
                    </tr>
                `;
            });
        });
    }

    // =========================
    // CLIENTES
    // =========================
    function renderClientes() {
        const tbody = document.getElementById('clientesTableBody');
        if (!tbody) return;
        if (!clientes.length) {
            tbody.innerHTML = `<tr>
                <td colspan="3" style="text-align: center; padding: 40px; color: #6b7280;">
                    No hay clientes registrados
                </td>
            </tr>`;
            fillVentaClientes();
            updateDashboardAndReports();
            return;
        }
        tbody.innerHTML = '';
        clientes.forEach((cli, idx) => {
            tbody.innerHTML += `
                <tr>
                    <td>${cli.nombre}</td>
                    <td>${cli.telefono || ''}</td>
                    <td>
                        <button class="btn btn-danger btn-small" onclick="eliminarCliente(${idx})">Eliminar</button>
                    </td>
                </tr>
            `;
        });
        fillVentaClientes();
        updateHeaderStats();
        updateDashboardAndReports();
    }

    window.eliminarCliente = function(idx) {
        clientes.splice(idx, 1);
        saveData('clientes', clientes);
        renderClientes();
        updateHeaderStats();
        updateDashboardAndReports();
    };

    const clienteForm = document.getElementById('clienteForm');
    if (clienteForm) {
        clienteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nombre = document.getElementById('clienteNombre').value.trim();
            const telefono = document.getElementById('clienteTelefono') ? document.getElementById('clienteTelefono').value.trim() : '';
            if (!nombre) return;
            clientes.push({ nombre, telefono });
            saveData('clientes', clientes);
            renderClientes();
            this.reset();
        });
    }

    // Búsqueda de clientes
    const searchClientes = document.getElementById('searchClientes');
    if (searchClientes) {
        searchClientes.addEventListener('input', function() {
            const q = this.value.trim().toLowerCase();
            const tbody = document.getElementById('clientesTableBody');
            const filtered = clientes.filter(cli =>
                cli.nombre.toLowerCase().includes(q) ||
                (cli.telefono && cli.telefono.toLowerCase().includes(q))
            );
            if (!filtered.length) {
                tbody.innerHTML = `<tr>
                    <td colspan="3" style="text-align: center; padding: 40px; color: #6b7280;">
                        No hay clientes registrados
                    </td>
                </tr>`;
                return;
            }
            tbody.innerHTML = '';
            filtered.forEach((cli, idx) => {
                tbody.innerHTML += `
                    <tr>
                        <td>${cli.nombre}</td>
                        <td>${cli.telefono || ''}</td>
                        <td>
                            <button class="btn btn-danger btn-small" onclick="eliminarCliente(${idx})">Eliminar</button>
                        </td>
                    </tr>
                `;
            });
        });
    }

    // =========================
    // PROVEEDORES
    // =========================
    function renderProveedores() {
        const tbody = document.getElementById('proveedoresTableBody');
        if (!tbody) return;
        if (!proveedores.length) {
            tbody.innerHTML = `<tr>
                <td colspan="3" style="text-align: center; padding: 40px; color: #6b7280;">
                    No hay proveedores registrados
                </td>
            </tr>`;
            return;
        }
        tbody.innerHTML = '';
        proveedores.forEach((prov, idx) => {
            tbody.innerHTML += `
                <tr>
                    <td>${prov.nombre}</td>
                    <td>${prov.contacto || ''}</td>
                    <td>
                        <button class="btn btn-danger btn-small" onclick="eliminarProveedor(${idx})">Eliminar</button>
                    </td>
                </tr>
            `;
        });
    }

    window.eliminarProveedor = function(idx) {
        proveedores.splice(idx, 1);
        saveData('proveedores', proveedores);
        renderProveedores();
    };

    const proveedorForm = document.getElementById('proveedorForm');
    if (proveedorForm) {
        proveedorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nombre = document.getElementById('proveedorNombre').value.trim();
            const contacto = document.getElementById('proveedorContacto') ? document.getElementById('proveedorContacto').value.trim() : '';
            if (!nombre) return;
            proveedores.push({ nombre, contacto });
            saveData('proveedores', proveedores);
            renderProveedores();
            this.reset();
        });
    }

    // Búsqueda de proveedores
    const searchProveedores = document.getElementById('searchProveedores');
    if (searchProveedores) {
        searchProveedores.addEventListener('input', function() {
            const q = this.value.trim().toLowerCase();
            const tbody = document.getElementById('proveedoresTableBody');
            const filtered = proveedores.filter(prov =>
                prov.nombre.toLowerCase().includes(q) ||
                (prov.contacto && prov.contacto.toLowerCase().includes(q))
            );
            if (!filtered.length) {
                tbody.innerHTML = `<tr>
                    <td colspan="3" style="text-align: center; padding: 40px; color: #6b7280;">
                        No hay proveedores registrados
                    </td>
                </tr>`;
                return;
            }
            tbody.innerHTML = '';
            filtered.forEach((prov, idx) => {
                tbody.innerHTML += `
                    <tr>
                        <td>${prov.nombre}</td>
                        <td>${prov.contacto || ''}</td>
                        <td>
                            <button class="btn btn-danger btn-small" onclick="eliminarProveedor(${idx})">Eliminar</button>
                        </td>
                    </tr>
                `;
            });
        });
    }

    // =========================
    // VENTAS
    // =========================
    function renderVentas() {
        const tbody = document.getElementById('ventasTableBody');
        if (!tbody) return;
        if (!ventas.length) {
            tbody.innerHTML = `<tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
                    No hay ventas registradas
                </td>
            </tr>`;
            updateDashboardAndReports();
            return;
        }
        tbody.innerHTML = '';
        ventas.forEach((venta, idx) => {
            tbody.innerHTML += `
                <tr>
                    <td>${venta.fecha}</td>
                    <td>${venta.cliente}</td>
                    <td>${venta.producto}</td>
                    <td>${venta.cantidad}</td>
                    <td>$${venta.total}</td>
                    <td>${venta.metodo}</td>
                    <td>
                        <button class="btn btn-danger btn-small" onclick="eliminarVenta(${idx})">Eliminar</button>
                    </td>
                </tr>
            `;
        });
        updateHeaderStats();
        updateDashboardAndReports();
    }

    window.eliminarVenta = function(idx) {
        ventas.splice(idx, 1);
        saveData('ventas', ventas);
        renderVentas();
        updateHeaderStats();
        updateDashboardAndReports();
    };

    const ventaForm = document.getElementById('ventaForm');
    if (ventaForm) {
        ventaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const cliente = document.getElementById('ventaCliente').value;
            const producto = document.getElementById('ventaProducto').value;
            const cantidad = parseInt(document.getElementById('ventaCantidad').value);
            const precio = parseFloat(document.getElementById('ventaPrecio').value);
            const total = parseFloat(document.getElementById('ventaTotal').value);
            const metodo = document.getElementById('ventaMetodoPago').value;
            const fecha = new Date().toLocaleDateString();

            if (!cliente || !producto || !cantidad || !precio || !total || !metodo) return;

            ventas.push({ fecha, cliente, producto, cantidad, total, metodo });
            saveData('ventas', ventas);
            renderVentas();
            this.reset();
        });

        // Actualizar precio y total al seleccionar producto/cantidad
        const ventaProducto = document.getElementById('ventaProducto');
        const ventaCantidad = document.getElementById('ventaCantidad');
        if (ventaProducto && ventaCantidad) {
            function updatePrecioYTotal() {
                const prod = productos.find(p => p.codigo === ventaProducto.value);
                const precio = prod ? prod.venta : 0;
                document.getElementById('ventaPrecio').value = precio;
                const cantidad = parseInt(ventaCantidad.value) || 1;
                document.getElementById('ventaTotal').value = precio * cantidad;
            }
            ventaProducto.addEventListener('change', updatePrecioYTotal);
            ventaCantidad.addEventListener('input', updatePrecioYTotal);
        }
    }

    // Búsqueda de ventas
    const searchVentas = document.getElementById('searchVentas');
    if (searchVentas) {
        searchVentas.addEventListener('input', function() {
            const q = this.value.trim().toLowerCase();
            const tbody = document.getElementById('ventasTableBody');
            const filtered = ventas.filter(venta =>
                venta.cliente.toLowerCase().includes(q) ||
                venta.producto.toLowerCase().includes(q) ||
                venta.metodo.toLowerCase().includes(q)
            );
            if (!filtered.length) {
                tbody.innerHTML = `<tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
                        No hay ventas registradas
                    </td>
                </tr>`;
                return;
            }
            tbody.innerHTML = '';
            filtered.forEach((venta, idx) => {
                tbody.innerHTML += `
                    <tr>
                        <td>${venta.fecha}</td>
                        <td>${venta.cliente}</td>
                        <td>${venta.producto}</td>
                        <td>${venta.cantidad}</td>
                        <td>$${venta.total}</td>
                        <td>${venta.metodo}</td>
                        <td>
                            <button class="btn btn-danger btn-small" onclick="eliminarVenta(${idx})">Eliminar</button>
                        </td>
                    </tr>
                `;
            });
        });
    }

    // =========================
    // DASHBOARD, REPORTES Y CONFIGURACIÓN
    // =========================
    function updateDashboardAndReports() {
        // Ventas del Mes (suma de ventas del mes actual)
        const now = new Date();
        const mesActual = now.getMonth();
        const añoActual = now.getFullYear();
        let ventasMes = 0;
        ventas.forEach(v => {
            const [d, m, a] = v.fecha.split('/').map(Number);
            // Soporta fechas tipo dd/mm/aaaa o dd/mm/aa
            let yearVenta = a;
            if (yearVenta < 100) yearVenta += 2000;
            if (yearVenta === añoActual && (m - 1 === mesActual)) {
                ventasMes += Number(v.total);
            }
        });
        if (document.getElementById('ventasMes')) document.getElementById('ventasMes').textContent = "$" + ventasMes;

        // Gastos del Mes (puedes sumar compras de productos si tienes esa lógica, aquí lo dejamos en 0)
        if (document.getElementById('gastosMes')) document.getElementById('gastosMes').textContent = "$0";

        // Utilidad Neta (ventas del mes - gastos del mes)
        if (document.getElementById('utilidadMes')) document.getElementById('utilidadMes').textContent = "$" + ventasMes;

        // Valor Inventario (suma de stock * precio de compra)
        let valorInventario = 0;
        productos.forEach(p => {
            valorInventario += (Number(p.stock) || 0) * (Number(p.compra) || 0);
        });
        if (document.getElementById('valorInventario')) document.getElementById('valorInventario').textContent = "$" + valorInventario;

        // Reportes
        if (document.getElementById('reporteVentasTotales')) {
            let totalVentas = 0;
            ventas.forEach(v => totalVentas += Number(v.total));
            document.getElementById('reporteVentasTotales').textContent = "$" + totalVentas;
        }
        if (document.getElementById('reporteProductosTotales')) {
            document.getElementById('reporteProductosTotales').textContent = productos.length;
        }
        if (document.getElementById('reporteClientesTotales')) {
            document.getElementById('reporteClientesTotales').textContent = clientes.length;
        }
    }

    // =========================
    // HEADER STATS
    // =========================
    function updateHeaderStats() {
        const prod = document.getElementById('headerProductos');
        if (prod) prod.textContent = productos.length;
        const cli = document.getElementById('headerClientes');
        if (cli) cli.textContent = clientes.length;
        const vent = document.getElementById('headerVentas');
        if (vent) {
            let total = 0;
            ventas.forEach(v => total += Number(v.total));
            vent.textContent = "$" + total;
        }
    }

    // =========================
    // CONFIGURACIÓN FORM
    // =========================
    const configForm = document.getElementById('configForm');
    if (configForm) {
        configForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nombreTienda = document.getElementById('configNombreTienda').value.trim();
            const correo = document.getElementById('configCorreo').value.trim();
            saveConfig({ nombreTienda, correo });
            loadConfig();
            alert('¡Configuración guardada!');
        });
    }

    // =========================
    // INICIALIZACIÓN
    // =========================
    renderProductos();
    renderClientes();
    renderProveedores();
    renderVentas();
    updateHeaderStats();
    updateDashboardAndReports();
    loadConfig();
});
