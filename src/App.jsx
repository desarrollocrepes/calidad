import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CategoriasCalidad from './CategoriasCalidad'; 
import DetalleCategoria from './DetalleCategoria'; // Importa el nuevo componente

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CategoriasCalidad />} />
        {/* Usamos el componente creado en el paso anterior */}
        <Route path="/calidad/:id" element={<DetalleCategoria />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;