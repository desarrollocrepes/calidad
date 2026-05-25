import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const DetalleCategoria = () => {
  const { id } = useParams();
  const [subcategorias, setSubcategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubcategorias = async () => {
      try {
        // Filtramos subcategorías por el ID de la categoría padre
        const url = `https://backendintranet2.crepesywaffles.com/api/calidad-subcategorias?filters[calidad_categoria][id][$eq]=${id}&populate=file`;
        const response = await fetch(url);
        const result = await response.json();
        setSubcategorias(result.data);
      } catch (error) {
        console.error("Error al cargar:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubcategorias();
  }, [id]);

  if (loading) return <p>Cargando documentos...</p>;

  return (
    <div>
      <h1>Detalle de Calidad</h1>
      {subcategorias.map((sub) => (
        <div key={sub.id}>
          <h3>{sub.attributes.name}</h3>
          <p>Restaurante: {sub.attributes.restaurant ? 'Sí' : 'No'}</p>
          {/* Aquí iría el link al PDF */}
        </div>
      ))}
    </div>
  );
};

export default DetalleCategoria;