document.addEventListener('DOMContentLoaded', function() {
    let dataStore = {
        productos: [],
        clientes: [],
        ventas: [],
        proveedores: [],
        facturas: [],
        creditos: [],
        cuentasPorPagar: [],
        movimientosCaja: [],
        usuarios: [],
        configuracion: {}
    };

    function saveData(key, data) {
        dataStore[key] = data;
    }

    function loadData(key) {
        return dataStore[key] || [];
    }

    // Variables globales
    let productos = loadData('productos');
    let clientes = loadData('clientes');
    let ventas = loadData('ventas');
    let proveedores = loadData('proveedores');
    let facturas = loadData('facturas');
    let creditos = loadData('creditos');
    let cuentasPorPagar = loadData('cuentasPorPagar');
    let movimientosCaja = loadData('movimientosCaja');
    let usuarios = loadData('usuarios');
    let configuracion = loadData('configuracion');

    // Función para gestionar configuración
    function saveConfig(config) {
        configuracion = { ...configuracion, ...config };
        saveData('configuracion', configuracion);
    }

    function loadConfig() {
        if (configuracion.nombreTienda && document.querySelector('.header h1')) {
            document.querySelector('.header h1').textContent = configuracion.nombreTienda;
        }
        if (document.getElementById('configNombreTienda')) {
            document.getElementById('configNombreTienda').value = configuracion.nombreTienda || '';
        }
        if (document.getElementById('configCorreo')) {
            document.getElementById('configCorreo').value = configuracion.correo || '';
        }
        if (document.getElementById('configTelefono')) {
            document.getElementById('configTelefono').value = configuracion.telefono || '';
        }
        if (document.getElementById('configDireccion')) {
            document.getElementById('configDireccion').value = configuracion.direccion || '';
        }
    }

    // Función para cambiar pestañas
    function showTab(tabId) {
        // Ocultar todas las pestañas
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Mostrar la pestaña seleccionada
        const selectedTab = document.getElementById(tabId);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        // Actualizar el estado activo de los botones de navegación
        document.querySelectorAll('.nav-tab').forEach(btn => {
            btn.classList.remove('active');
        });

        // Añadir clase 'active' al botón correspondiente
        const activeButton = document.querySelector(`.nav-tab[onclick="showTab('${tabId}')"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        // Actualizar datos según la pestaña
        updateDashboardAndReports();
        loadConfig();

        if(tabId === 'facturacion') {
            renderVentasPendientesFacturacion();
            renderFacturas();
        }
        if(tabId === 'alertas') {
            renderAlertas();
        }
        if(tabId === 'caja') {
            renderMovimientosCaja();
        }
        if(tabId === 'creditos') {
            renderCreditos();
        }
        if(tabId === 'cxp') {
            renderCuentasPorPagar();
        }
        if(tabId === 'usuarios') {
            renderUsuarios();
        }
    }

    // Asegurarse de que la función showTab esté accesible globalmente
    window.showTab = showTab;

    // Función para llenar selects de clientes
    function fillAllClientesSelects() {
        const selects = [
            document.getElementById('ventaCliente'),
            document.getElementById('creditoCliente'),
            document.getElementById('facturaCliente')
        ].filter(Boolean);

        selects.forEach(select => {
            const prevValue = select.value;
            select.innerHTML = '<option value="">Seleccionar cliente...</option>';
            clientes.forEach(cli => {
                select.innerHTML += `<option value="${cli.nombre}">${cli.nombre}</option>`;
            });
            if (select.id === 'ventaCliente') {
                select.innerHTML += '<option value="general">Cliente General</option>';
            }
            if ([...select.options].some(opt => opt.value === prevValue)) {
                select.value = prevValue;
            }
        });
    }

    // Función para llenar selects de productos
    function fillAllProductosSelects() {
        const selects = [
            document.getElementById('ventaProducto')
        ].filter(Boolean);

        selects.forEach(select => {
            const prevValue = select.value;
            select.innerHTML = '<option value="">Seleccionar producto...</option>';
            productos.forEach(prod => {
                select.innerHTML += `<option value="${prod.codigo}">${prod.nombre}</option>`;
            });
            if ([...select.options].some(opt => opt.value === prevValue)) {
                select.value = prevValue;
            }
        });
    }

    // Función para llenar selects de proveedores
    function fillAllProveedoresSelects() {
        const selects = [
            document.getElementById('productoProveedor'),
            document.getElementById('cxpProveedor')
        ].filter(Boolean);

        selects.forEach(select => {
            const prevValue = select.value;
            select.innerHTML = '<option value="">Seleccionar proveedor...</option>';
            proveedores.forEach(prov => {
                select.innerHTML += `<option value="${prov.nombre}">${prov.nombre}</option>`;
            });
            if ([...select.options].some(opt => opt.value === prevValue)) {
                select.value = prevValue;
            }
        });
    }

    // Función para actualizar estadísticas del encabezado
    function updateHeaderStats() {
        const ventasHoy = ventas.filter(venta => {
            const fechaVenta = new Date(venta.fecha);
            const hoy = new Date();
            return fechaVenta.toDateString() === hoy.toDateString();
        }).reduce((sum, venta) => sum + venta.total, 0);

        document.getElementById('headerVentas').textContent = `$${ventasHoy}`;
        document.getElementById('headerProductos').textContent = productos.length;
        document.getElementById('headerClientes').textContent = clientes.length;
    }

    // Función para actualizar dashboard y reportes
    function updateDashboardAndReports() {
        const ventasMes = ventas.filter(venta => {
            const fechaVenta = new Date(venta.fecha);
            const mesActual = new Date().getMonth();
            return fechaVenta.getMonth() === mesActual;
        }).reduce((sum, venta) => sum + venta.total, 0);

        const gastosMes = 0; // Aquí deberías calcular los gastos del mes
        const utilidadMes = ventasMes - gastosMes;
        const valorInventario = productos.reduce((sum, prod) => sum + (prod.stock * prod.compra), 0);

        document.getElementById('ventasMes').textContent = `$${ventasMes}`;
        document.getElementById('gastosMes').textContent = `$${gastosMes}`;
        document.getElementById('utilidadMes').textContent = `$${utilidadMes}`;
        document.getElementById('valorInventario').textContent = `$${valorInventario}`;
    }

    // GESTIÓN DE PRODUCTOS
    function renderProductos() {
        const tbody = document.getElementById('productosTableBody');
        if (!tbody) return;

        if (!productos.length) {
            tbody.innerHTML = `<tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
                    No hay productos registrados
                </td>
            </tr>`;
            fillAllProductosSelects();
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
        fillAllProductosSelects();
        updateHeaderStats();
        updateDashboardAndReports();
    }

    window.eliminarProducto = function(idx) {
        if (confirm('¿Está seguro de eliminar este producto?')) {
            productos.splice(idx, 1);
            saveData('productos', productos);
            renderProductos();
            updateHeaderStats();
            updateDashboardAndReports();
        }
    };

    // Form de productos
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

            if (!nombre || !codigo || !categoria) {
                alert('Por favor complete los campos obligatorios');
                return;
            }

            // Verificar código único
            if (productos.some(p => p.codigo === codigo)) {
                alert('Ya existe un producto con este código');
                return;
            }

            productos.push({ nombre, codigo, categoria, compra, venta, stock, minimo, proveedor });
            saveData('productos', productos);
            renderProductos();
            fillAllProductosSelects();
            this.reset();
            alert('Producto agregado exitosamente');
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
                        No se encontraron productos
                    </td>
                </tr>`;
                return;
            }

            tbody.innerHTML = '';
            filtered.forEach((prod, idx) => {
                const originalIdx = productos.findIndex(p => p.codigo === prod.codigo);
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
                            <button class="btn btn-danger btn-small" onclick="eliminarProducto(${originalIdx})">Eliminar</button>
                        </td>
                    </tr>
                `;
            });
        });
    }

    // GESTIÓN DE CLIENTES
    function renderClientes() {
        const tbody = document.getElementById('clientesTableBody');
        if (!tbody) return;

        if (!clientes.length) {
            tbody.innerHTML = `<tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #6b7280;">
                    No hay clientes registrados
                </td>
            </tr>`;
            fillAllClientesSelects();
            updateDashboardAndReports();
            return;
        }

        tbody.innerHTML = '';
        clientes.forEach((cli, idx) => {
            tbody.innerHTML += `
                <tr>
                    <td>${cli.nombre}</td>
                    <td>${cli.telefono || ''}</td>
                    <td>${cli.email || ''}</td>
                    <td>${cli.direccion || ''}</td>
                    <td>
                        <button class="btn btn-danger btn-small" onclick="eliminarCliente(${idx})">Eliminar</button>
                    </td>
                </tr>
            `;
        });
        fillAllClientesSelects();
        updateHeaderStats();
        updateDashboardAndReports();
    }

    window.eliminarCliente = function(idx) {
        if (confirm('¿Está seguro de eliminar este cliente?')) {
            clientes.splice(idx, 1);
            saveData('clientes', clientes);
            renderClientes();
            updateHeaderStats();
            updateDashboardAndReports();
        }
    };

    // Form de clientes
    const clienteForm = document.getElementById('clienteForm');
    if (clienteForm) {
        clienteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nombre = document.getElementById('clienteNombre').value.trim();
            const telefono = document.getElementById('clienteTelefono') ? document.getElementById('clienteTelefono').value.trim() : '';
            const email = document.getElementById('clienteEmail') ? document.getElementById('clienteEmail').value.trim() : '';
            const direccion = document.getElementById('clienteDireccion') ? document.getElementById('clienteDireccion').value.trim() : '';

            if (!nombre) {
                alert('El nombre es obligatorio');
                return;
            }

            clientes.push({ nombre, telefono, email, direccion });
            saveData('clientes', clientes);
            renderClientes();
            fillAllClientesSelects();
            this.reset();
            alert('Cliente agregado exitosamente');
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
                (cli.telefono && cli.telefono.toLowerCase().includes(q)) ||
                (cli.email && cli.email.toLowerCase().includes(q))
            );

            if (!filtered.length) {
                tbody.innerHTML = `<tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #6b7280;">
                        No se encontraron clientes
                    </td>
                </tr>`;
                return;
            }

            tbody.innerHTML = '';
            filtered.forEach((cli) => {
                const originalIdx = clientes.findIndex(c => c.nombre === cli.nombre);
                tbody.innerHTML += `
                    <tr>
                        <td>${cli.nombre}</td>
                        <td>${cli.telefono || ''}</td>
                        <td>${cli.email || ''}</td>
                        <td>${cli.direccion || ''}</td>
                        <td>
                            <button class="btn btn-danger btn-small" onclick="eliminarCliente(${originalIdx})">Eliminar</button>
                        </td>
                    </tr>
                `;
            });
        });
    }

    // GESTIÓN DE PROVEEDORES
    function renderProveedores() {
        const tbody = document.getElementById('proveedoresTableBody');
        if (!tbody) return;

        if (!proveedores.length) {
            tbody.innerHTML = `<tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #6b7280;">
                    No hay proveedores registrados
                </td>
            </tr>`;
            fillAllProveedoresSelects();
            return;
        }

        tbody.innerHTML = '';
        proveedores.forEach((prov, idx) => {
            tbody.innerHTML += `
                <tr>
                    <td>${prov.nombre}</td>
                    <td>${prov.contacto || ''}</td>
                    <td>${prov.email || ''}</td>
                    <td>${prov.direccion || ''}</td>
                    <td>
                        <button class="btn btn-danger btn-small" onclick="eliminarProveedor(${idx})">Eliminar</button>
                    </td>
                </tr>
            `;
        });
        fillAllProveedoresSelects();
    }

    window.eliminarProveedor = function(idx) {
        if (confirm('¿Está seguro de eliminar este proveedor?')) {
            proveedores.splice(idx, 1);
            saveData('proveedores', proveedores);
            renderProveedores();
        }
    };

    // Form de proveedores
    const proveedorForm = document.getElementById('proveedorForm');
    if (proveedorForm) {
        proveedorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nombre = document.getElementById('proveedorNombre').value.trim();
            const contacto = document.getElementById('proveedorContacto') ? document.getElementById('proveedorContacto').value.trim() : '';
            const email = document.getElementById('proveedorEmail') ? document.getElementById('proveedorEmail').value.trim() : '';
            const direccion = document.getElementById('proveedorDireccion') ? document.getElementById('proveedorDireccion').value.trim() : '';

            if (!nombre) {
                alert('El nombre es obligatorio');
                return;
            }

            proveedores.push({ nombre, contacto, email, direccion });
            saveData('proveedores', proveedores);
            renderProveedores();
            fillAllProveedoresSelects();
            this.reset();
            alert('Proveedor agregado exitosamente');
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
                (prov.contacto && prov.contacto.toLowerCase().includes(q)) ||
                (prov.email && prov.email.toLowerCase().includes(q))
            );

            if (!filtered.length) {
                tbody.innerHTML = `<tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #6b7280;">
                        No se encontraron proveedores
                    </td>
                </tr>`;
                return;
            }

            tbody.innerHTML = '';
            filtered.forEach((prov) => {
                const originalIdx = proveedores.findIndex(p => p.nombre === prov.nombre);
                tbody.innerHTML += `
                    <tr>
                        <td>${prov.nombre}</td>
                        <td>${prov.contacto || ''}</td>
                        <td>${prov.email || ''}</td>
                        <td>${prov.direccion || ''}</td>
                        <td>
                            <button class="btn btn-danger btn-small" onclick="eliminarProveedor(${originalIdx})">Eliminar</button>
                        </td>
                    </tr>
                `;
            });
        });
    }

    // GESTIÓN DE VENTAS
    function renderVentas() {
        const tbody = document.getElementById('ventasTableBody');
        if (!tbody) return;

        if (!ventas.length) {
            tbody.innerHTML = `<tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
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
                        <span class="status-badge ${venta.facturado ? 'active' : 'pending'}">
                            ${venta.facturado ? 'Facturado' : 'Pendiente'}
                        </span>
                    </td>
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
        if (confirm('¿Está seguro de eliminar esta venta?')) {
            const venta = ventas[idx];
            // Restaurar stock del producto
            const producto = productos.find(p => p.codigo === venta.productoId);
            if (producto) {
                producto.stock += venta.cantidad;
                saveData('productos', productos);
            }

            ventas.splice(idx, 1);
            saveData('ventas', ventas);
            renderVentas();
            updateHeaderStats();
            updateDashboardAndReports();
            renderVentasPendientesFacturacion();
        }
    };

    // Form de ventas
    const ventaForm = document.getElementById('ventaForm');
    if (ventaForm) {
        ventaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const cliente = document.getElementById('ventaCliente').value;
            const productoId = document.getElementById('ventaProducto').value;
            const cantidad = parseInt(document.getElementById('ventaCantidad').value);
            const precio = parseFloat(document.getElementById('ventaPrecio').value);
            const total = parseFloat(document.getElementById('ventaTotal').value);
            const metodo = document.getElementById('ventaMetodoPago').value;
            const fecha = new Date().toLocaleDateString();

            if (!cliente || !productoId || !cantidad || !precio || !total || !metodo) {
                alert('Por favor complete todos los campos');
                return;
            }

            // Verificar stock disponible
            const producto = productos.find(p => p.codigo === productoId);
            if (!producto) {
                alert('Producto no encontrado');
                return;
            }

            if (producto.stock < cantidad) {
                alert('Stock insuficiente. Stock disponible: ' + producto.stock);
                return;
            }

            // Reducir stock
            producto.stock -= cantidad;
            saveData('productos', productos);

            // Registrar venta
            ventas.push({
                fecha,
                cliente,
                producto: producto.nombre,
                productoId: productoId,
                cantidad,
                total,
                metodo,
                facturado: false
            });
            saveData('ventas', ventas);

            // Registrar movimiento de caja (si no es crédito)
            if (metodo !== 'credito') {
                movimientosCaja.push({
                    fecha,
                    tipo: 'ingreso',
                    monto: total,
                    concepto: `Venta: ${producto.nombre} (${cantidad} unidades)`
                });
                saveData('movimientosCaja', movimientosCaja);
            }

            renderVentas();
            renderProductos();
            renderVentasPendientesFacturacion();
            renderMovimientosCaja();
            this.reset();
            alert('Venta registrada exitosamente');
        });

        // Actualizar precio y total automáticamente
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
                    <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
                        No se encontraron ventas
                    </td>
                </tr>`;
                return;
            }

            tbody.innerHTML = '';
            filtered.forEach((venta) => {
                const originalIdx = ventas.findIndex(v => v.fecha === venta.fecha && v.cliente === venta.cliente && v.total === venta.total);
                tbody.innerHTML += `
                    <tr>
                        <td>${venta.fecha}</td>
                        <td>${venta.cliente}</td>
                        <td>${venta.producto}</td>
                        <td>${venta.cantidad}</td>
                        <td>$${venta.total}</td>
                        <td>${venta.metodo}</td>
                        <td>
                            <span class="status-badge ${venta.facturado ? 'active' : 'pending'}">
                                ${venta.facturado ? 'Facturado' : 'Pendiente'}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-danger btn-small" onclick="eliminarVenta(${originalIdx})">Eliminar</button>
                        </td>
                    </tr>
                `;
            });
        });
    }

    // GESTIÓN DE FACTURACIÓN
    function renderVentasPendientesFacturacion() {
        const tbody = document.getElementById('ventasPendientesFacturacionBody');
        if (!tbody) return;

        const pendientes = ventas.filter(v => !v.facturado);

        if (!pendientes.length) {
            tbody.innerHTML = `<tr><td colspan="7">No hay ventas pendientes de facturación</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        pendientes.forEach(v => {
            const originalIdx = ventas.findIndex(venta =>
                venta.fecha === v.fecha && venta.cliente === v.cliente && venta.total === v.total
            );
            tbody.innerHTML += `
                <tr>
                    <td>${v.fecha}</td>
                    <td>${v.cliente}</td>
                    <td>${v.producto}</td>
                    <td>${v.cantidad}</td>
                    <td>$${v.total}</td>
                    <td>${v.metodo}</td>
                    <td><button class="btn btn-success btn-small" onclick="generarFacturaDesdeVenta(${originalIdx})">Facturar</button></td>
                </tr>
            `;
        });
    }

    window.generarFacturaDesdeVenta = function(ventaIdx) {
        const venta = ventas[ventaIdx];
        if (!venta) return;

        if (venta.facturado) {
            alert('Esta venta ya tiene factura.');
            return;
        }

        const numeroFactura = 'F' + (Date.now().toString().slice(-6));
        const nuevaFactura = {
            numero: numeroFactura,
            ventaId: ventaIdx,
            fecha: new Date().toLocaleDateString(),
            cliente: venta.cliente,
            detalle: `${venta.producto} x${venta.cantidad}`,
            total: venta.total
        };

        facturas.push(nuevaFactura);
        saveData('facturas', facturas);

        // Marcar venta como facturada
        venta.facturado = true;
        saveData('ventas', ventas);

        renderFacturas();
        renderVentasPendientesFacturacion();
        renderVentas();
        alert('Factura ' + numeroFactura + ' generada exitosamente');
    };

    function renderFacturas() {
        const tbody = document.getElementById('facturasTableBody');
        if (!tbody) return;

        if (!facturas.length) {
            tbody.innerHTML = `<tr><td colspan="6">No hay facturas registradas</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        facturas.forEach(f => {
            tbody.innerHTML += `
                <tr>
                    <td>${f.numero}</td>
                    <td>${f.fecha}</td>
                    <td>${f.cliente}</td>
                    <td>${f.detalle}</td>
                    <td>$${f.total}</td>
                    <td>
                        <button class="btn btn-small" onclick="imprimirFactura('${f.numero}')">Imprimir/PDF</button>
                    </td>
                </tr>
            `;
        });
    }

    window.imprimirFactura = function(numeroFactura) {
        const f = facturas.find(f => f.numero === numeroFactura);
        if (!f) return;

        // Crear ventana de impresión
        const win = window.open('', '', 'width=600,height=400');
        win.document.write(`
            <html>
            <head>
                <title>Factura ${f.numero}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .info { margin: 10px 0; }
                    .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>${configuracion.nombreTienda || 'FerContable Pro'}</h2>
                    <p>Factura N° ${f.numero}</p>
                </div>
                <div class="info"><strong>Fecha:</strong> ${f.fecha}</div>
                <div class="info"><strong>Cliente:</strong> ${f.cliente}</div>
                <div class="info"><strong>Detalle:</strong> ${f.detalle}</div>
                <div class="total">Total: $${f.total}</div>
                <br><br>
                <button onclick="window.print()">Imprimir</button>
            </body>
            </html>
        `);
        win.document.close();
    };

    // Función para renderizar movimientos de caja
    function renderMovimientosCaja() {
        const tbody = document.getElementById('cajaTableBody');
        if (!tbody) return;

        if (!movimientosCaja.length) {
            tbody.innerHTML = `<tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #6b7280;">
                    No hay movimientos registrados
                </td>
            </tr>`;
            return;
        }

        tbody.innerHTML = '';
        let saldoActual = 0;
        movimientosCaja.forEach((mov, idx) => {
            saldoActual += mov.tipo === 'ingreso' ? mov.monto : -mov.monto;
            tbody.innerHTML += `
                <tr>
                    <td>${mov.fecha}</td>
                    <td>${mov.tipo}</td>
                    <td>$${mov.monto}</td>
                    <td>${mov.concepto}</td>
                    <td>
                        <button class="btn btn-danger btn-small" onclick="eliminarMovimientoCaja(${idx})">Eliminar</button>
                    </td>
                </tr>
            `;
        });
        document.getElementById('cajaSaldo').textContent = `$${saldoActual}`;
    }

    window.eliminarMovimientoCaja = function(idx) {
        if (confirm('¿Está seguro de eliminar este movimiento?')) {
            movimientosCaja.splice(idx, 1);
            saveData('movimientosCaja', movimientosCaja);
            renderMovimientosCaja();
        }
    };

    // Form de caja
    const cajaForm = document.getElementById('cajaForm');
    if (cajaForm) {
        cajaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const tipo = document.getElementById('cajaTipo').value;
            const monto = parseFloat(document.getElementById('cajaMonto').value);
            const concepto = document.getElementById('cajaConcepto').value.trim();
            const fecha = new Date().toLocaleDateString();

            if (!monto || !concepto) {
                alert('Por favor complete todos los campos');
                return;
            }

            movimientosCaja.push({ fecha, tipo, monto, concepto });
            saveData('movimientosCaja', movimientosCaja);
            renderMovimientosCaja();
            this.reset();
            alert('Movimiento registrado exitosamente');
        });
    }

    // Función para renderizar créditos
    function renderCreditos() {
        const tbody = document.getElementById('creditosTableBody');
        if (!tbody) return;

        if (!creditos.length) {
            tbody.innerHTML = `<tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #6b7280;">
                    No hay créditos registrados
                </td>
            </tr>`;
            return;
        }

        tbody.innerHTML = '';
        creditos.forEach((cred, idx) => {
            const fechaVencimiento = new Date(cred.fechaVencimiento);
            const hoy = new Date();
            const estado = fechaVencimiento < hoy ? 'Vencido' : 'Vigente';
            tbody.innerHTML += `
                <tr>
                    <td>${cred.cliente}</td>
                    <td>$${cred.monto}</td>
                    <td>${cred.fechaVencimiento}</td>
                    <td>${cred.descripcion || ''}</td>
                    <td>
                        <span class="status-badge ${estado === 'Vencido' ? 'low-stock' : 'active'}">
                            ${estado}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-danger btn-small" onclick="eliminarCredito(${idx})">Eliminar</button>
                    </td>
                </tr>
            `;
        });
    }

    window.eliminarCredito = function(idx) {
        if (confirm('¿Está seguro de eliminar este crédito?')) {
            creditos.splice(idx, 1);
            saveData('creditos', creditos);
            renderCreditos();
        }
    };

    // Form de créditos
    const creditoForm = document.getElementById('creditoForm');
    if (creditoForm) {
        creditoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const cliente = document.getElementById('creditoCliente').value;
            const monto = parseFloat(document.getElementById('creditoMonto').value);
            const fechaVencimiento = document.getElementById('creditoVencimiento').value;
            const descripcion = document.getElementById('creditoDescripcion').value.trim();

            if (!cliente || !monto || !fechaVencimiento) {
                alert('Por favor complete todos los campos');
                return;
            }

            creditos.push({ cliente, monto, fechaVencimiento, descripcion });
            saveData('creditos', creditos);
            renderCreditos();
            this.reset();
            alert('Crédito registrado exitosamente');
        });
    }

    // Función para renderizar cuentas por pagar
    function renderCuentasPorPagar() {
        const tbody = document.getElementById('cxpTableBody');
        if (!tbody) return;

        if (!cuentasPorPagar.length) {
            tbody.innerHTML = `<tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #6b7280;">
                    No hay cuentas por pagar registradas
                </td>
            </tr>`;
            return;
        }

        tbody.innerHTML = '';
        cuentasPorPagar.forEach((cxp, idx) => {
            const fechaVencimiento = new Date(cxp.fechaVencimiento);
            const hoy = new Date();
            const estado = fechaVencimiento < hoy ? 'Vencido' : 'Vigente';
            tbody.innerHTML += `
                <tr>
                    <td>${cxp.proveedor}</td>
                    <td>$${cxp.monto}</td>
                    <td>${cxp.fechaVencimiento}</td>
                    <td>${cxp.descripcion || ''}</td>
                    <td>
                        <span class="status-badge ${estado === 'Vencido' ? 'low-stock' : 'active'}">
                            ${estado}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-danger btn-small" onclick="eliminarCuentaPorPagar(${idx})">Eliminar</button>
                    </td>
                </tr>
            `;
        });
    }

    window.eliminarCuentaPorPagar = function(idx) {
        if (confirm('¿Está seguro de eliminar esta cuenta por pagar?')) {
            cuentasPorPagar.splice(idx, 1);
            saveData('cuentasPorPagar', cuentasPorPagar);
            renderCuentasPorPagar();
        }
    };

    // Form de cuentas por pagar
    const cxpForm = document.getElementById('cxpForm');
    if (cxpForm) {
        cxpForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const proveedor = document.getElementById('cxpProveedor').value;
            const monto = parseFloat(document.getElementById('cxpMonto').value);
            const fechaVencimiento = document.getElementById('cxpVencimiento').value;
            const descripcion = document.getElementById('cxpDescripcion').value.trim();

            if (!proveedor || !monto || !fechaVencimiento) {
                alert('Por favor complete todos los campos');
                return;
            }

            cuentasPorPagar.push({ proveedor, monto, fechaVencimiento, descripcion });
            saveData('cuentasPorPagar', cuentasPorPagar);
            renderCuentasPorPagar();
            this.reset();
            alert('Cuenta por pagar registrada exitosamente');
        });
    }

    // Función para renderizar usuarios
    function renderUsuarios() {
        const tbody = document.getElementById('usuariosTableBody');
        if (!tbody) return;

        if (!usuarios.length) {
            tbody.innerHTML = `<tr>
                <td colspan="4" style="text-align: center; padding: 40px; color: #6b7280;">
                    No hay usuarios registrados
                </td>
            </tr>`;
            return;
        }

        tbody.innerHTML = '';
        usuarios.forEach((user, idx) => {
            tbody.innerHTML += `
                <tr>
                    <td>${user.nombre}</td>
                    <td>${user.rol}</td>
                    <td>
                        <button class="btn btn-danger btn-small" onclick="eliminarUsuario(${idx})">Eliminar</button>
                    </td>
                </tr>
            `;
        });
    }

    window.eliminarUsuario = function(idx) {
        if (confirm('¿Está seguro de eliminar este usuario?')) {
            usuarios.splice(idx, 1);
            saveData('usuarios', usuarios);
            renderUsuarios();
        }
    };

    // Form de usuarios
    const usuarioForm = document.getElementById('usuarioForm');
    if (usuarioForm) {
        usuarioForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nombre = document.getElementById('usuarioNombre').value.trim();
            const password = document.getElementById('usuarioPassword').value.trim();
            const rol = document.getElementById('usuarioRol').value;

            if (!nombre || !password || !rol) {
                alert('Por favor complete todos los campos');
                return;
            }

            usuarios.push({ nombre, password, rol });
            saveData('usuarios', usuarios);
            renderUsuarios();
            this.reset();
            alert('Usuario registrado exitosamente');
        });
    }

    // Función para renderizar alertas
    function renderAlertas() {
        const alertasStockBajo = document.getElementById('alertasStockBajo');
        const alertasCreditosVencidos = document.getElementById('alertasCreditosVencidos');
        const alertasCxpVencidas = document.getElementById('alertasCxpVencidas');

        if (!alertasStockBajo || !alertasCreditosVencidos || !alertasCxpVencidas) return;

        // Alertas de stock bajo
        const productosBajoStock = productos.filter(prod => prod.stock <= prod.minimo);
        if (productosBajoStock.length) {
            alertasStockBajo.innerHTML = productosBajoStock.map(prod => `
                <div class="alert">
                    <strong>${prod.nombre}</strong> - Stock: ${prod.stock} (Mínimo: ${prod.minimo})
                </div>
            `).join('');
        } else {
            alertasStockBajo.innerHTML = '<div>No hay productos con stock bajo</div>';
        }

        // Alertas de créditos vencidos
        const hoy = new Date();
        const creditosVencidos = creditos.filter(cred => new Date(cred.fechaVencimiento) < hoy);
        if (creditosVencidos.length) {
            alertasCreditosVencidos.innerHTML = creditosVencidos.map(cred => `
                <div class="alert">
                    <strong>Cliente: ${cred.cliente}</strong> - Monto: $${cred.monto} (Vencimiento: ${cred.fechaVencimiento})
                </div>
            `).join('');
        } else {
            alertasCreditosVencidos.innerHTML = '<div>No hay créditos vencidos</div>';
        }

        const cuentasVencidas = cuentasPorPagar.filter(cxp => new Date(cxp.fechaVencimiento) < hoy);
        if (cuentasVencidas.length) {
            alertasCxpVencidas.innerHTML = cuentasVencidas.map(cxp => `
                <div class="alert">
                    <strong>Proveedor: ${cxp.proveedor}</strong> - Monto: $${cxp.monto} (Vencimiento: ${cxp.fechaVencimiento})
                </div>
            `).join('');
        } else {
            alertasCxpVencidas.innerHTML = '<div>No hay cuentas por pagar vencidas</div>';
        }
    }

    window.generarReporte = function(periodo) {
        let startDate = new Date();
        if (periodo === 'dia') {
            startDate.setDate(startDate.getDate() - 1);
        } else if (periodo === 'semana') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (periodo === 'mes') {
            startDate.setMonth(startDate.getMonth() - 1);
        }

        const ventasPeriodo = ventas.filter(venta => new Date(venta.fecha) >= startDate);
        const totalVentas = ventasPeriodo.reduce((sum, venta) => sum + venta.total, 0);

        alert(`Reporte de ${periodo}: Total de ventas = $${totalVentas}`);
    };

    window.exportarDatos = function() {
        alert('Función para exportar datos');
    };

    renderProductos();
    renderClientes();
    renderProveedores();
    renderVentas();
    renderMovimientosCaja();
    renderCreditos();
    renderCuentasPorPagar();
    renderUsuarios();
    renderAlertas();
    showTab('dashboard');
});
