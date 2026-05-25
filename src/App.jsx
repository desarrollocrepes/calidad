import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CategoriasCalidad from './CategoriasCalidad'; 
import DetalleCategoria from './DetalleCategoria';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CategoriasCalidad />} />
        <Route path="/calidad/:id" element={<DetalleCategoria />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;