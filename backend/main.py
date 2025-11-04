from fastapi import FastAPI
from database import Base, engine
from routers import productos, menus, facturas

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Restaurante API",
    description="API para la gestión de un restaurante",
)

app.include_router(productos.router)
app.include_router(menus.router)
app.include_router(facturas.router)

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API del Restaurante"}