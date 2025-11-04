from sqlalchemy import Column, Integer, DECIMAL, String, Enum, ForeignKey, Computed, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base
import enum

class DiaSemana(enum.Enum):
    Lunes = "Lunes"
    Martes = "Martes"
    Miercoles = "Miércoles"
    Jueves = "Jueves"
    Viernes = "Viernes"
    Sabado = "Sábado"
    Domingo = "Domingo"

class TipoIdentificacion(enum.Enum):
    CC = "Cédula de Ciudadanía"
    TI = "Tarjeta de Identidad"
    CE = "Cedula de Extranjería"

class Producto(Base):
    __tablename__ = "Producto"

    id_producto = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, index=True, nullable=False)
    descripcion = Column(String(255), nullable=True)
    costo_sin_iva = Column(DECIMAL(10, 2), nullable=False)
    porcentaje_iva = Column(DECIMAL(5, 2), nullable=False, default=19.00)
    costo_con_iva = Column(Float, Computed("costo_sin_iva * (1 + porcentaje_iva / 100)"))
    tiempo_preparacion = Column(Integer, nullable=False)

    menus = relationship("Menu", secondary="MenuProducto", back_populates="productos")
    menu_productos = relationship("MenuProducto", back_populates="producto")
    detalles_factura = relationship("DetalleFactura", back_populates="producto")

class Menu(Base):
    __tablename__ = "Menu"

    id_menu = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, index=True, nullable=False)
    descripcion = Column(String(255), nullable=True)
    dia_semana = Column(Enum(DiaSemana), nullable=False)

    menu_productos = relationship("MenuProducto", back_populates="menu")
    productos = relationship("Producto", secondary="MenuProducto", back_populates="menus")

class MenuProducto(Base):
    __tablename__ = "MenuProducto"

    id_menu_producto = Column(Integer, primary_key=True, index=True)
    menu_id = Column(Integer, ForeignKey("Menu.id_menu"), nullable=False)
    producto_id = Column(Integer, ForeignKey("Producto.id_producto"), nullable=False)

    menu = relationship("Menu", back_populates="menu_productos")
    producto = relationship("Producto", back_populates="menu_productos")

class Cliente(Base):
    __tablename__ = "Cliente"

    id_cliente = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    tipo_identificacion = Column(Enum(TipoIdentificacion), nullable=False)
    numero_identificacion = Column(String(50), unique=True, index=True, nullable=False)
    telefono = Column(String(20), nullable=True)

    facturas = relationship("Factura", back_populates="cliente")

class Factura(Base):
    __tablename__ = "Factura"

    id_factura = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("Cliente.id_cliente"))
    fecha = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    subtotal = Column(Float, nullable=False, default=0)
    iva = Column(Float, nullable=False, default=0)
    impuesto_consumo = Column(Float, nullable=False, default=0)
    total = Column(Float, nullable=False, default=0)

    cliente = relationship("Cliente", back_populates="facturas")
    detalles = relationship("DetalleFactura", back_populates="factura")

class DetalleFactura(Base):
    __tablename__ = "DetalleFactura"

    id_detalle = Column(Integer, primary_key=True, index=True)
    factura_id = Column(Integer, ForeignKey("Factura.id_factura"), nullable=False)
    producto_id = Column(Integer, ForeignKey("Producto.id_producto"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(DECIMAL(10, 2), nullable=False)
    total_producto = Column(DECIMAL(10, 2), nullable=False)

    factura = relationship("Factura", back_populates="detalles")
    producto = relationship("Producto")