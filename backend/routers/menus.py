from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session, joinedload
from database import get_db
import models, schemas  

router = APIRouter(
    prefix="/menus",
    tags=["Menus"])

@router.post("/", response_model=schemas.MenuResponse)
def crear_menu(menu: schemas.MenuCreate, db: Session = Depends(get_db)):
    nuevo_menu = models.Menu(
        nombre=menu.nombre,
        descripcion=menu.descripcion,
        dia_semana=menu.dia_semana
    )

    db.add(nuevo_menu)
    db.commit()
    db.refresh(nuevo_menu)

    if menu.productos_ids:
        for producto_id in menu.productos_ids:
            producto = db.query(models.Producto).filter(models.Producto.id_producto == producto_id).first()
            if not producto:
                raise HTTPException(status_code=404, detail=f"Producto  con ID {producto_id} no existe")

            relacion = models.MenuProducto(
                menu_id=nuevo_menu.id_menu,
                producto_id=producto_id
            )
            db.add(relacion)
        db.commit()

    nuevo_menu = (
        db.query(models.Menu)
        .options(joinedload(models.Menu.productos))
        .filter(models.Menu.id_menu == nuevo_menu.id_menu)
        .first()
    )

    total = sum(producto.costo_con_iva for producto in nuevo_menu.productos)
    return {
        "id_menu": nuevo_menu.id_menu,
        "nombre": nuevo_menu.nombre,
        "descripcion": nuevo_menu.descripcion,
        "dia_semana": nuevo_menu.dia_semana,
        "productos": nuevo_menu.productos,
        "total": total
    }

@router.get("/", response_model=list[schemas.MenuResponse])
def listar_menus(db: Session = Depends(get_db)):
    menus = db.query(models.Menu).options(joinedload(models.Menu.productos)).all()

    results = []
    for menu in menus:
        total = sum(producto.costo_con_iva for producto in menu.productos)
        results.append({
            "id_menu": menu.id_menu,
            "nombre": menu.nombre,
            "descripcion": menu.descripcion,
            "dia_semana": menu.dia_semana,
            "productos": menu.productos,
            "total": total
        })
    return results

@router.put("/{menu_id}", response_model=schemas.MenuResponse)
def actualizar_menu(menu_id: int, menu: schemas.MenuCreate, db: Session = Depends(get_db)):
    menu_db = db.query(models.Menu).filter(models.Menu.id_menu == menu_id).first()
    if not menu_db:
        raise HTTPException(status_code=404, detail="Menu no encontrado")
    
    menu_db.nombre = menu.nombre
    menu_db.descripcion = menu.descripcion
    menu_db.dia_semana = menu.dia_semana

    db.query(models.MenuProducto).filter(models.MenuProducto.menu_id == menu_id).delete()

    if menu.productos_ids:
        for producto_id in menu.productos_ids:
            producto = db.query(models.Producto).filter(models.Producto.id_producto == producto_id).first()
            if not producto:
                raise HTTPException(status_code=404, detail=f"Producto con ID {producto_id} no existe")

            relacion = models.MenuProducto(
                menu_id=menu_db.id_menu,
                producto_id=producto_id
            )
            db.add(relacion)
    
    db.commit()

    menu_db = (
        db.query(models.Menu)
        .options(joinedload(models.Menu.productos))
        .filter(models.Menu.id_menu == menu_db.id_menu)
        .first()
    )

    total = sum(producto.costo_con_iva for producto in menu_db.productos)

    return {
        "id_menu": menu_db.id_menu,
        "nombre": menu_db.nombre,
        "descripcion": menu_db.descripcion,
        "dia_semana": menu_db.dia_semana,
        "productos": menu_db.productos,
        "total": total
    }

@router.delete("/{menu_id}")
def eliminar_menu(menu_id: int, db: Session = Depends(get_db)):
    menu_db = db.query(models.Menu).filter(models.Menu.id_menu == menu_id).first()
    if not menu_db:
        raise HTTPException(status_code=404, detail="Menu no encontrado")
    
    db.delete(menu_db)
    db.commit()
    return {"detail": "Menu eliminado correctamente"}