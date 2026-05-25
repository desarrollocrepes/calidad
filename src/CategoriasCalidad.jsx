import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CategoriasCalidad = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await fetch('https://backendintranet2.crepesywaffles.com/api/calidad-categorias');
    
        if (!response.ok) {
          throw new Error('Error al conectar con la API de calidad');
        }

        const result = await response.json();
        setCategorias(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategorias();
  }, []);

  if (loading) {
    return <p>Cargando categorías...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div>
      <h2>Categorías de Calidad</h2>
      
      <div>
        {categorias.map((categoria) => {
          const { name, description, icon } = categoria.attributes;
          
          return (
            <Link 
              to={`/calidad/${categoria.id}`} 
              key={categoria.id}
            >
              <div>
                {icon && (
                  <img 
                    src={icon} 
                    alt={`Icono de ${name}`} 
                  />
                )}
                <h3>
                  {name}
                </h3>
              </div>
              <p>
                {description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default CategoriasCalidad;