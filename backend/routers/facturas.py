from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session, joinedload
from decimal import Decimal
from database import get_db
import models, schemas
from schemas import FacturaCreate, FacturaResponse, DetalleFacturaResponse, MenuDetalleResponse, ProductoResponse
from models import Factura, DetalleFactura, Menu, Cliente, Producto

router = APIRouter(
    prefix="/facturas",
    tags=["Facturas"])

@router.get("/", response_model=list[schemas.FacturaResponse])
def listar_facturas(db: Session = Depends(get_db)):
    facturas = (
        db.query(Factura)
        .options(
            joinedload(Factura.detalles).joinedload(DetalleFactura.producto),
            joinedload(Factura.cliente),
        )
        .all()
    )

    respuesta = []

    for factura in facturas:
        subtotal_factura = Decimal(0)
        detalles_dict = {}

        for detalle in factura.detalles:
            producto = detalle.producto
            menu = (
                db.query(Menu)
                .join(Menu.productos)
                .filter(Producto.id_producto == producto.id_producto)
                .first()
            )
            if not menu:
                continue

            costo_menu = sum(
                Decimal(p.costo_sin_iva) * (1 + Decimal(p.porcentaje_iva) / 100)
                for p in menu.productos
            )

            if menu.id_menu not in detalles_dict:
                detalles_dict[menu.id_menu] = {
                    "menu": menu,
                    "productos_por_menu": len(menu.productos),
                    "productos_en_factura": 0,
                }

            detalles_dict[menu.id_menu]["productos_en_factura"] += detalle.cantidad

            subtotal_factura += (
                Decimal(producto.costo_sin_iva)
                * (1 + Decimal(producto.porcentaje_iva) / 100)
                * detalle.cantidad
            )

        detalles_finales = []
        for m in detalles_dict.values():
            cantidad_menus = int(m["productos_en_factura"] / m["productos_por_menu"])

            menu = m["menu"]
            menu_data = {
                "id_menu": menu.id_menu,
                "nombre": menu.nombre,
                "descripcion": menu.descripcion,
                "dia_semana": menu.dia_semana,
                "productos": [
                    {
                        "id_producto": p.id_producto,
                        "nombre": p.nombre,
                        "descripcion": p.descripcion,
                        "costo_sin_iva": float(p.costo_sin_iva),
                        "porcentaje_iva": float(p.porcentaje_iva),
                        "costo_con_iva": round(
                            p.costo_sin_iva * (1 + p.porcentaje_iva / 100), 2
                        ),
                        "tiempo_preparacion": p.tiempo_preparacion,
                    }
                    for p in menu.productos
                ],
            }

            detalles_finales.append({
                "menu": menu_data,
                "cantidad": cantidad_menus,
            })

        impuesto_consumo = (subtotal_factura * Decimal("0.08")).quantize(Decimal("0.01"))
        total_factura = subtotal_factura + impuesto_consumo

        respuesta.append({
            "id_factura": factura.id_factura,
            "nombre_cliente": factura.cliente.nombre,
            "telefono": factura.cliente.telefono,
            "tipo_identificacion": factura.cliente.tipo_identificacion.value,
            "numero_identificacion": factura.cliente.numero_identificacion,
            "subtotal": float(subtotal_factura),
            "impuesto_consumo": float(impuesto_consumo),
            "total": float(total_factura),
            "detalles": detalles_finales,
        })

    return respuesta


@router.get("/{factura_id}", response_model=schemas.FacturaResponse)
def obtener_factura(factura_id: int, db: Session = Depends(get_db)):
    factura = (
        db.query(Factura)
        .options(
            joinedload(Factura.detalles).joinedload(DetalleFactura.producto),
            joinedload(Factura.cliente),
        )
        .filter(Factura.id_factura == factura_id)
        .first()
    )

    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    subtotal_factura = Decimal(0)
    detalles_dict = {}

    for detalle in factura.detalles:
        producto = detalle.producto
        menu = (
            db.query(Menu)
            .join(Menu.productos)
            .filter(Producto.id_producto == producto.id_producto)
            .first()
        )
        if not menu:
            continue

        if menu.id_menu not in detalles_dict:
            detalles_dict[menu.id_menu] = {
                "menu": menu,
                "productos_por_menu": len(menu.productos),
                "productos_en_factura": 0,
            }

        detalles_dict[menu.id_menu]["productos_en_factura"] += detalle.cantidad

        subtotal_factura += (
            Decimal(producto.costo_sin_iva)
            * (1 + Decimal(producto.porcentaje_iva) / 100)
            * detalle.cantidad
        )

    detalles_finales = []
    for m in detalles_dict.values():
        cantidad_menus = int(m["productos_en_factura"] / m["productos_por_menu"])
        menu = m["menu"]

        menu_data = {
            "id_menu": menu.id_menu,
            "nombre": menu.nombre,
            "descripcion": menu.descripcion,
            "dia_semana": menu.dia_semana,
            "productos": [
                {
                    "id_producto": p.id_producto,
                    "nombre": p.nombre,
                    "descripcion": p.descripcion,
                    "costo_sin_iva": float(p.costo_sin_iva),
                    "porcentaje_iva": float(p.porcentaje_iva),
                    "costo_con_iva": round(
                        p.costo_sin_iva * (1 + p.porcentaje_iva / 100), 2
                    ),
                    "tiempo_preparacion": p.tiempo_preparacion,
                }
                for p in menu.productos
            ],
        }

        detalles_finales.append({
            "menu": menu_data,
            "cantidad": cantidad_menus,
        })

    impuesto_consumo = (subtotal_factura * Decimal("0.08")).quantize(Decimal("0.01"))
    total_factura = subtotal_factura + impuesto_consumo

    return schemas.FacturaResponse(
        id_factura=factura.id_factura,
        nombre_cliente=factura.cliente.nombre,
        telefono=factura.cliente.telefono,
        tipo_identificacion=factura.cliente.tipo_identificacion.value,
        numero_identificacion=factura.cliente.numero_identificacion,
        subtotal=float(subtotal_factura),
        impuesto_consumo=float(impuesto_consumo),
        total=float(total_factura),
        detalles=detalles_finales,
    )

@router.post("/", response_model=schemas.FacturaResponse)
def crear_factura(factura_in: schemas.FacturaCreate, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(
        Cliente.numero_identificacion == factura_in.numero_identificacion
    ).first()
    if not cliente:
        cliente = Cliente(
            nombre=factura_in.nombre_cliente,
            tipo_identificacion=factura_in.tipo_identificacion,
            numero_identificacion=factura_in.numero_identificacion,
            telefono=factura_in.telefono
        )
        db.add(cliente)
        db.commit()
        db.refresh(cliente)

    nueva_factura = Factura(cliente_id=cliente.id_cliente)
    db.add(nueva_factura)
    db.commit()
    db.refresh(nueva_factura)

    total_factura = Decimal(0)
    detalles_list = []

    for menu_fact in factura_in.menus:
        menu = db.query(Menu).filter(Menu.id_menu == menu_fact.menu_id).first()
        if not menu:
            continue

        subtotal_menu = Decimal(0)
        for producto in menu.productos:
            costo_con_iva = Decimal(producto.costo_sin_iva) * (1 + Decimal(producto.porcentaje_iva) / 100)
            subtotal_menu += costo_con_iva

        subtotal_menu_total = subtotal_menu * menu_fact.cantidad
        total_factura += subtotal_menu_total

        for producto in menu.productos:
            costo_con_iva = Decimal(producto.costo_sin_iva) * (1 + Decimal(producto.porcentaje_iva) / 100)
            subtotal_producto = costo_con_iva * menu_fact.cantidad

            detalle = DetalleFactura(
                factura_id=nueva_factura.id_factura,
                producto_id=producto.id_producto,
                cantidad=menu_fact.cantidad,
                precio_unitario=costo_con_iva,
                total_producto=subtotal_producto
            )
            db.add(detalle)
        db.commit()

        menu_resp = schemas.MenuDetalleResponse(
            id_menu=menu.id_menu,
            nombre=menu.nombre,
            descripcion=menu.descripcion or "",
            dia_semana=menu.dia_semana,
            productos=[
                schemas.ProductoResponse(
                    id_producto=p.id_producto,
                    nombre=p.nombre,
                    descripcion=p.descripcion or "",
                    costo_sin_iva=float(p.costo_sin_iva),
                    porcentaje_iva=float(p.porcentaje_iva),
                    costo_con_iva=round(float(p.costo_sin_iva) * (1 + float(p.porcentaje_iva) / 100), 2),
                    tiempo_preparacion=p.tiempo_preparacion
                )
                for p in menu.productos
            ]
        )

        detalle_resp = schemas.DetalleFacturaResponse(
            menu=menu_resp,
            cantidad=menu_fact.cantidad
        )
        detalles_list.append(detalle_resp)

    impuesto_consumo = (total_factura * Decimal("0.08")).quantize(Decimal("0.01"))
    total_final = total_factura + impuesto_consumo

    nueva_factura.subtotal = float(total_factura)
    nueva_factura.impuesto_consumo = float(impuesto_consumo)
    nueva_factura.total = float(total_final)
    db.commit()
    db.refresh(nueva_factura)

    return schemas.FacturaResponse(
        id_factura=nueva_factura.id_factura,
        nombre_cliente=cliente.nombre,
        telefono=cliente.telefono,
        tipo_identificacion=cliente.tipo_identificacion,
        numero_identificacion=cliente.numero_identificacion,
        subtotal=float(total_factura),
        iva=0,
        impuesto_consumo=float(impuesto_consumo),
        total=float(total_final),
        detalles=detalles_list
    )

@router.put("/{factura_id}", response_model=schemas.FacturaResponse)
def actualizar_factura(factura_id: int, factura_in: schemas.FacturaCreate, db: Session = Depends(get_db)):
    factura = db.query(Factura).filter(Factura.id_factura == factura_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    cliente = db.query(Cliente).filter(
        Cliente.numero_identificacion == factura_in.numero_identificacion
    ).first()
    if not cliente:
        cliente = Cliente(
            nombre=factura_in.nombre_cliente,
            tipo_identificacion=factura_in.tipo_identificacion,
            numero_identificacion=factura_in.numero_identificacion,
            telefono=factura_in.telefono
        )
        db.add(cliente)
        db.commit()
        db.refresh(cliente)

    else:
        cliente.nombre = factura_in.nombre_cliente
        cliente.tipo_identificacion = factura_in.tipo_identificacion
        cliente.numero_identificacion = factura_in.numero_identificacion
        cliente.telefono = factura_in.telefono
        db.commit()
        db.refresh(cliente)

    factura.cliente_id = cliente.id_cliente
    db.commit()

    db.query(DetalleFactura).filter(DetalleFactura.factura_id == factura.id_factura).delete()
    db.commit()

    total_factura = Decimal(0)
    detalles_list = []

    for menu_fact in factura_in.menus:
        menu = db.query(Menu).filter(Menu.id_menu == menu_fact.menu_id).first()
        if not menu:
            continue

        subtotal_menu = Decimal(0)
        for producto in menu.productos:
            costo_con_iva = Decimal(producto.costo_sin_iva) * (1 + Decimal(producto.porcentaje_iva) / 100)
            subtotal_menu += costo_con_iva

        subtotal_menu_total = subtotal_menu * menu_fact.cantidad
        total_factura += subtotal_menu_total

        for _ in range(menu_fact.cantidad):
            for producto in menu.productos:
                costo_con_iva = Decimal(producto.costo_sin_iva) * (1 + Decimal(producto.porcentaje_iva) / 100)
                detalle = DetalleFactura(
                    factura_id=factura.id_factura,
                    producto_id=producto.id_producto,
                    cantidad=1,
                    precio_unitario=costo_con_iva,
                    total_producto=costo_con_iva
                )
                db.add(detalle)
        db.commit()

        menu_resp = schemas.MenuDetalleResponse(
            id_menu=menu.id_menu,
            nombre=menu.nombre,
            descripcion=menu.descripcion or "",
            dia_semana=menu.dia_semana,
            productos=[
                schemas.ProductoResponse(
                    id_producto=p.id_producto,
                    nombre=p.nombre,
                    descripcion=p.descripcion or "",
                    costo_sin_iva=float(p.costo_sin_iva),
                    porcentaje_iva=float(p.porcentaje_iva),
                    costo_con_iva=round(float(p.costo_sin_iva) * (1 + float(p.porcentaje_iva) / 100), 2),
                    tiempo_preparacion=p.tiempo_preparacion
                )
                for p in menu.productos
            ]
        )

        detalle_resp = schemas.DetalleFacturaResponse(
            menu=menu_resp,
            cantidad=menu_fact.cantidad
        )
        detalles_list.append(detalle_resp)

    impuesto_consumo = (total_factura * Decimal("0.08")).quantize(Decimal("0.01"))
    total_final = total_factura + impuesto_consumo

    factura.subtotal = float(total_factura)
    factura.impuesto_consumo = float(impuesto_consumo)
    factura.total = float(total_final)
    db.commit()
    db.refresh(factura)

    return schemas.FacturaResponse(
        id_factura=factura.id_factura,
        nombre_cliente=cliente.nombre,
        telefono=cliente.telefono,
        tipo_identificacion=cliente.tipo_identificacion,
        numero_identificacion=cliente.numero_identificacion,
        subtotal=float(total_factura),
        impuesto_consumo=float(impuesto_consumo),
        total=float(total_final),
        detalles=detalles_list
    )

@router.delete("/{factura_id}")
def eliminar_factura(factura_id: int, db: Session = Depends(get_db)):
    factura = db.query(Factura).filter(Factura.id_factura == factura_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    db.query(DetalleFactura).filter(DetalleFactura.factura_id == factura.id_factura).delete()
    db.delete(factura)
    db.commit()

    return {"detalle": "Factura eliminada exitosamente"}