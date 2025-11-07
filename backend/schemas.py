from pydantic import BaseModel, validator

class ProductoBase(BaseModel):
    nombre: str
    descripcion: str | None = None
    costo_sin_iva: float
    tiempo_preparacion: int | None = None

class ProductoCreate(ProductoBase):
    pass

class ProductoResponse(ProductoBase):
    id_producto: int
    nombre: str
    descripcion: str
    costo_sin_iva: float
    porcentaje_iva: float
    costo_con_iva: float

    class Config:
        from_attributes = True

class MenuBase(BaseModel):
    nombre: str
    descripcion: str | None = None
    dia_semana: str

    @validator("dia_semana")
    def normalizar_dia(cls, v):
        return v.upper()

class MenuCreate(MenuBase):
    productos_ids: list[int]

class ProductoSimple(BaseModel):
    id_producto: int
    nombre: str
    costo_con_iva: float

    class Config:
        from_attributes = True

class MenuResponse(MenuBase):
    id_menu: int
    productos: list[ProductoSimple] = []
    total: float | None = None

    class Config:
        from_attributes = True

class DetalleProductoBase(BaseModel):
    producto_id: int
    cantidad: int

class MenuFacturaBase(BaseModel):
    menu_id: int
    cantidad: int

class FacturaCreate(BaseModel):
    nombre_cliente: str
    tipo_identificacion: str
    numero_identificacion: str
    telefono: str
    menus: list[MenuFacturaBase]

class MenuDetalleResponse(BaseModel):
    id_menu: int
    nombre: str
    descripcion: str
    dia_semana: str
    productos: list[ProductoResponse]

class DetalleFacturaResponse(BaseModel):
    menu: MenuDetalleResponse
    cantidad: int

    class Config:
        from_attributes = True

class FacturaResponse(BaseModel):
    id_factura: int
    nombre_cliente: str
    tipo_identificacion: str
    numero_identificacion: str
    subtotal: float
    impuesto_consumo: float
    total: float
    detalles: list[DetalleFacturaResponse]

    class Config:
        from_attributes = True