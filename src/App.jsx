import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CategoriasCalidad from '../src/assets/CategoriasCalidad';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CategoriasCalidad />} />
        <Route path="/calidad/:id" element={<div>Detalle de la categoría</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;