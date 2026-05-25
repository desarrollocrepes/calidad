import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, UtensilsCrossed, Wrench, Building, Search, Plus, FileText, Download, Edit, Trash2, UploadCloud, X } from 'lucide-react';

const DetalleCategoria = () => {
  const { id } = useParams(); // Captura el ID de la categoría (ej. 5 o 6)
  const navigate = useNavigate(); // Hook para volver a la pantalla anterior

  // Estados para manejar la interfaz
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [locationFilter, setLocationFilter] = useState('heladeria');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados para el Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Mock de datos (Aquí luego conectarás otro fetch a Strapi para traer los PDFs reales)
  const [docs, setDocs] = useState([
    { id: 1, title: 'Limpieza de Freidora', version: 'v1.2', category: 'equipos', location: 'restaurante', updatedAt: '2026-05-20' },
    { id: 2, title: 'Sanitización de Mesas', version: 'v2.0', category: 'instalaciones', location: 'heladeria', updatedAt: '2026-05-22' },
    { id: 3, title: 'Desinfección de Cucharas', version: 'v1.0', category: 'utensilios', location: 'heladeria', updatedAt: '2026-05-24' }
  ]);

  // Lógica de filtrado en tiempo real
  const filteredDocs = docs.filter(doc => {
    const matchLocation = doc.location === locationFilter;
    const matchCategory = categoryFilter === 'todas' || doc.category === categoryFilter;
    const matchSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLocation && matchCategory && matchSearch;
  });

  // Título dinámico basado en el ID recibido de Strapi
  const getTituloCategoria = () => {
    if (id === '5') return 'Procedimientos RHM';
    if (id === '6') return 'Procedimientos de Limpieza';
    return 'Procedimientos de Calidad';
  };

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', backgroundColor: '#FFF5E4', minHeight: '100vh', padding: '20px' }}>
      
      {/* VISTA PRINCIPAL */}
      <div className="animate-fade-in" style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', maxWidth: '1000px', margin: '0 auto', border: '1px solid #503629' }}>
        
        <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div className="header-title-group" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Navegación hacia atrás con React Router */}
            <button onClick={() => navigate('/')} className="btn-icon-only" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#503629' }}>
              <ArrowLeft size={28} />
            </button>
            <h2 className="title-main" style={{ margin: 0, color: '#3C1F1C' }}>
              {getTituloCategoria()}
            </h2>
          </div>

          <div className="admin-toggle-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className={`toggle-label ${isAdminMode ? 'active' : ''}`} style={{ color: '#503629', fontWeight: 'bold' }}>Modo Edición</span>
            <input 
              type="checkbox"
              checked={isAdminMode}
              onChange={() => setIsAdminMode(!isAdminMode)}
              style={{ accentColor: '#503629', width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>
        </div>

        <div className="location-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => { setLocationFilter('heladeria'); setCategoryFilter('todas'); }}
            style={{ padding: '10px 20px', display: 'flex', gap: '8px', alignItems: 'center', borderRadius: '8px', border: '1px solid #503629', backgroundColor: locationFilter === 'heladeria' ? '#F1E4B2' : 'transparent', cursor: 'pointer', color: '#3C1F1C' }}
          >
            <Store size={18} /> Heladerías
          </button>
          <button
            onClick={() => { setLocationFilter('restaurante'); setCategoryFilter('todas'); }}
            style={{ padding: '10px 20px', display: 'flex', gap: '8px', alignItems: 'center', borderRadius: '8px', border: '1px solid #503629', backgroundColor: locationFilter === 'restaurante' ? '#F1E4B2' : 'transparent', cursor: 'pointer', color: '#3C1F1C' }}
          >
            <UtensilsCrossed size={18} /> Restaurantes
          </button>
        </div>

        <div className="filters-bar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
          <div className="category-pills" style={{ display: 'flex', gap: '10px' }}>
            {[
              { id: 'todas', label: 'Todos' },
              { id: 'equipos', label: 'Equipos', icon: <Wrench size={14} /> },
              { id: 'instalaciones', label: 'Instalaciones', icon: <Building size={14} /> },
              { id: 'utensilios', label: 'Utensilios', icon: <UtensilsCrossed size={14} /> }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                style={{ padding: '8px 16px', display: 'flex', gap: '6px', alignItems: 'center', borderRadius: '20px', border: '1px solid #503629', backgroundColor: categoryFilter === cat.id ? '#503629' : 'transparent', color: categoryFilter === cat.id ? '#FFF5E4' : '#503629', cursor: 'pointer' }}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          <div className="search-actions" style={{ display: 'flex', gap: '10px' }}>
            <div className="search-box" style={{ display: 'flex', alignItems: 'center', border: '1px solid #503629', borderRadius: '8px', padding: '5px 10px' }}>
              <Search className="search-icon" size={16} color="#503629" />
              <input 
                type="text" 
                placeholder="Buscar documento..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', padding: '5px', backgroundColor: 'transparent', color: '#3C1F1C' }}
              />
            </div>
            {isAdminMode && (
              <button 
                onClick={() => { setSelectedDoc(null); setShowEditModal(true); }}
                style={{ backgroundColor: '#503629', color: '#FFF5E4', border: 'none', borderRadius: '8px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <Plus size={16} /> Nuevo Doc
              </button>
            )}
          </div>
        </div>

        <div className="doc-list-container">
          {filteredDocs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredDocs.map(doc => (
                <div key={doc.id} className="doc-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                  <div className="doc-info" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className="doc-file-icon" style={{ color: '#503629' }}><FileText size={32} /></div>
                    <div>
                      <h4 className="doc-title" style={{ margin: '0 0 4px 0', color: '#3C1F1C' }}>
                        {doc.title} <span style={{ fontSize: '0.8em', color: '#888' }}>{doc.version}</span>
                      </h4>
                      <div className="doc-meta" style={{ fontSize: '0.85em', color: '#666', display: 'flex', gap: '8px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'capitalize' }}>
                          {doc.category === 'equipos' && <Wrench size={12}/>}
                          {doc.category === 'instalaciones' && <Building size={12}/>}
                          {doc.category === 'utensilios' && <UtensilsCrossed size={12}/>}
                          {doc.category}
                        </span>
                        <span>•</span>
                        <span>Actualizado: {doc.updatedAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="doc-actions" style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ backgroundColor: 'transparent', border: '1px solid #503629', color: '#503629', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <Download size={16} /> Ver PDF
                    </button>
                    {isAdminMode && (
                      <>
                        <button onClick={() => { setSelectedDoc(doc); setShowEditModal(true); }} style={{ background: 'none', border: 'none', color: '#503629', cursor: 'pointer' }}>
                          <Edit size={18} />
                        </button>
                        <button style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer' }}>
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ textAlign: 'center', padding: '40px', color: '#503629' }}>
              <Search size={40} style={{ opacity: 0.5, marginBottom: '16px' }} />
              <h3>No se encontraron documentos</h3>
              <p>Prueba cambiando los filtros o el término de búsqueda.</p>
            </div>
          )}
        </div>
        
        <p className="list-summary" style={{ textAlign: 'right', fontSize: '0.9em', color: '#666', marginTop: '16px' }}>
          Mostrando {filteredDocs.length} documentos {searchQuery && 'encontrados'}
        </p>
      </div>

      {/* MODAL DE EDICIÓN */}
      {showEditModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ backgroundColor: '#fff', width: '500px', borderRadius: '12px', padding: '24px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '16px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#3C1F1C' }}>
                <UploadCloud size={20} /> {selectedDoc ? 'Actualizar Documento' : 'Nuevo Documento'}
              </h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#3C1F1C" />
              </button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 'bold', color: '#503629' }}>Título del Procedimiento</label>
                <input 
                  type="text" 
                  defaultValue={selectedDoc?.title || ''}
                  placeholder="Ej. Limpieza de Máquina..."
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontFamily: 'Poppins, sans-serif' }}
                />
              </div>

              <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 'bold', color: '#503629' }}>Ubicación</label>
                  <select defaultValue={selectedDoc?.location || locationFilter} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontFamily: 'Poppins, sans-serif' }}>
                    <option value="heladeria">Heladería</option>
                    <option value="restaurante">Restaurante</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 'bold', color: '#503629' }}>Categoría</label>
                  <select defaultValue={selectedDoc?.category || 'equipos'} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontFamily: 'Poppins, sans-serif' }}>
                    <option value="equipos">Equipos</option>
                    <option value="instalaciones">Instalaciones</option>
                    <option value="utensilios">Utensilios</option>
                  </select>
                </div>
              </div>

              <div className="drop-zone" style={{ border: '2px dashed #503629', borderRadius: '8px', padding: '30px', textAlign: 'center', backgroundColor: '#FFF5E4', cursor: 'pointer' }}>
                <FileText size={32} color="#503629" style={{ marginBottom: '10px' }} />
                <p style={{ margin: 0, color: '#503629' }}>Haz clic o arrastra un archivo PDF aquí</p>
              </div>
            </div>
            
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setShowEditModal(false)} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: 'transparent', cursor: 'pointer' }}>Cancelar</button>
              <button 
                onClick={() => { alert('Simulación: Guardando en Strapi...'); setShowEditModal(false); }}
                style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#503629', color: '#fff', cursor: 'pointer' }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleCategoria;