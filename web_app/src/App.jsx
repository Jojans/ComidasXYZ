import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ProductosList from "./components/ProductosList";
import MenuList from "./components/MenuList";

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Inicio</Link>
        <Link to="/productos">Productos</Link>
        <Link to="/menus">Menús</Link>
      </nav>

      <div className="container">
        <Routes>
          <Route path="/" element={<h1 className="text-3xl font-bold text-center mt-10">Bienvenido</h1>} />
          <Route path="/productos" element={<ProductosList />} />
          <Route path="/menus" element={<MenuList />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;