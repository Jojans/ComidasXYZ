from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Producto
from schemas import ProductoCreate, ProductoResponse

router = APIRouter(
    prefix="/productos",
    tags=["Productos"])

@router.get("/", response_model=list[ProductoResponse])
def listar_productos(db: Session = Depends(get_db)):
    productos = db.query(Producto).all()
    return productos

@router.get("/{producto_id}", response_model=ProductoResponse)
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id_producto == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto

@router.post("/", response_model=ProductoResponse)
def crear_producto(producto: ProductoCreate, db: Session = Depends(get_db)):
    nuevo_producto = Producto(
        nombre=producto.nombre,
        descripcion=producto.descripcion,
        costo_sin_iva=producto.costo_sin_iva,
        porcentaje_iva=19.00,
        tiempo_preparacion=producto.tiempo_preparacion
    )
    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)
    return nuevo_producto

@router.put("/{producto_id}", response_model=ProductoResponse)
def actualizar_producto(producto_id: int, producto: ProductoCreate, db: Session = Depends(get_db)):
    producto_db = db.query(Producto).filter(Producto.id_producto == producto_id).first()
    if not producto_db:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    producto_db.nombre = producto.nombre
    producto_db.descripcion = producto.descripcion
    producto_db.costo_sin_iva = producto.costo_sin_iva
    producto_db.porcentaje_iva = 19.00
    producto_db.tiempo_preparacion=producto.tiempo_preparacion

    db.commit()
    db.refresh(producto_db)
    return producto_db

@router.delete("/{producto_id}")
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    producto_db = db.query(Producto).filter(Producto.id_producto == producto_id).first()
    if not producto_db:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    db.delete(producto_db)
    db.commit()
    return {"detail": "Producto eliminado exitosamente"}