import React, { useState, useEffect, useMemo, useRef } from 'react';
import './CalidadDashboard.css'; // <-- Importación del CSS puro
import { 
  FileText, 
  ClipboardList, 
  Store, 
  UtensilsCrossed, 
  Wrench, 
  Building, 
  Search, 
  ArrowLeft, 
  Download, 
  Edit, 
  Trash2, 
  Plus,
  UploadCloud,
  X,
  ShieldAlert,
  Loader2,
  FolderOpen
} from 'lucide-react';

// URLs base usando variables de entorno (.env) configuradas en Vite
const BASE_URL = import.meta.env.VITE_API_URL || '[https://backendintranet2.crepesywaffles.com](https://backendintranet2.crepesywaffles.com)';
const API_URL = `${BASE_URL}/api`;

export default function CalidadDashboard() {
  const [currentView, setCurrentView] = useState('menu'); 
  const [categorias, setCategorias] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [subcategorias, setSubcategorias] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [locationFilter, setLocationFilter] = useState('heladeria'); 
  const [categoryFilter, setCategoryFilter] = useState('todas'); 
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // 1. Obtener Categorías
  useEffect(() => {
    const fetchCategorias = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/calidad-categorias`);
        if (!response.ok) throw new Error('Error al conectar con la API de categorías');
        const result = await response.json();
        setCategorias(result.data);
      } catch (err) {
        setError('No se pudieron cargar las categorías. Verifica tu conexión.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategorias();
  }, []);

  // 2. Obtener Subcategorías
  const fetchSubcategorias = async (categoriaId) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `${API_URL}/calidad-subcategorias?filters[calidad_categoria][id][$eq]=${categoriaId}&populate=file`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar los documentos');
      
      const result = await response.json();
      
      const formattedDocs = result.data.map(item => {
        const fileObj = item.attributes.file?.data?.attributes;
        const rawUrl = fileObj?.url;
        const fileUrl = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `${BASE_URL}${rawUrl}`) : null;

        return {
          id: item.id,
          title: item.attributes.name || 'Sin título',
          restaurant: item.attributes.restaurant,
          category: item.attributes.categoria || 'equipos', 
          updatedAt: new Date(item.attributes.updatedAt).toLocaleDateString(),
          version: item.attributes.version || 'v1.0',
          fileUrl: fileUrl
        };
      });
      
      setSubcategorias(formattedDocs);
    } catch (err) {
      setError('No se pudieron cargar los documentos de esta categoría.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === 'detalle' && selectedCategoria) {
      fetchSubcategorias(selectedCategoria.id);
    }
  }, [currentView, selectedCategoria]);

  // 3. Guardar / Actualizar Documento
  const handleSaveDocument = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const formElements = e.target.elements;
      const dataPayload = {
        name: formElements.title.value,
        restaurant: formElements.location.value === 'restaurante',
        categoria: formElements.category.value,
        calidad_categoria: selectedCategoria.id 
      };

      const submitData = new FormData();
      submitData.append('data', JSON.stringify(dataPayload));
      
      if (selectedFile) {
        submitData.append('files.file', selectedFile); 
      }

      const method = selectedDoc ? 'PUT' : 'POST';
      const url = selectedDoc 
        ? `${API_URL}/calidad-subcategorias/${selectedDoc.id}` 
        : `${API_URL}/calidad-subcategorias`;

      const response = await fetch(url, { method, body: submitData });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || 'Error al guardar en Strapi');
      }

      await fetchSubcategorias(selectedCategoria.id);
      closeModal();
    } catch (err) {
      alert(`Error al guardar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Eliminar Documento
  const handleDeleteDocument = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este documento permanentemente?')) return;
    try {
      const response = await fetch(`${API_URL}/calidad-subcategorias/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar el documento');
      setSubcategorias(prev => prev.filter(doc => doc.id !== id));
    } catch (err) {
      alert('Error al eliminar el documento.');
    }
  };

  const filteredDocs = useMemo(() => {
    return subcategorias.filter(doc => {
      const matchesLocation = locationFilter === 'restaurante' ? doc.restaurant : !doc.restaurant;
      const matchesCategory = categoryFilter === 'todas' || doc.category === categoryFilter;
      const matchesSearch = doc.title?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLocation && matchesCategory && matchesSearch;
    });
  }, [subcategorias, locationFilter, categoryFilter, searchQuery]);

  const handleSelectCategoria = (cat) => {
    setSelectedCategoria(cat);
    setCurrentView('detalle');
    setSearchQuery('');
    setLocationFilter('heladeria');
    setCategoryFilter('todas');
  };

  const closeModal = () => {
    setShowEditModal(false);
    setSelectedDoc(null);
    setSelectedFile(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // --- VISTAS ---

  const renderMainMenu = () => (
    <div>
      <h2 className="page-title">Módulo de Calidad</h2>
      <p className="page-subtitle">Seleccione el área que desea consultar o administrar.</p>
      
      {isLoading && categorias.length === 0 ? (
        <div className="loading-state">
          <Loader2 className="spinner" size={40} />
          <p>Cargando categorías...</p>
        </div>
      ) : error && categorias.length === 0 ? (
        <div className="error-state">
          <ShieldAlert size={32} style={{margin: '0 auto 0.5rem auto'}} />
          <p>{error}</p>
        </div>
      ) : (
        <div className="menu-grid">
          {categorias.map((categoria) => {
            const { name, description, icon } = categoria.attributes;
            return (
              <button 
                key={categoria.id}
                onClick={() => handleSelectCategoria(categoria)}
                className="menu-card blue"
              >
                <div className="card-icon-wrapper blue">
                  {icon && typeof icon === 'string' ? (
                    <img src={icon} alt={name} className="card-icon-img" />
                  ) : (
                    <FolderOpen size={32} />
                  )}
                </div>
                <h3 className="card-title">{name}</h3>
                <p className="card-desc">{description}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderDetalleView = () => (
    <div>
      <div className="view-header">
        <div className="header-title-group">
          <button onClick={() => setCurrentView('menu')} className="btn-icon-only">
            <ArrowLeft size={20} />
          </button>
          <h2 className="page-title" style={{margin: 0}}>
            {selectedCategoria?.attributes?.name || 'Documentos'}
          </h2>
        </div>

        <div className="admin-toggle-wrapper">
          <span className={`admin-label ${isAdminMode ? 'active' : 'inactive'}`}>
            Modo Edición
          </span>
          <button 
            onClick={() => setIsAdminMode(!isAdminMode)}
            className={`toggle-switch ${isAdminMode ? 'active' : 'inactive'}`}
          >
            <span className="toggle-dot" />
          </button>
        </div>
      </div>

      <div className="location-tabs">
        <button
          onClick={() => { setLocationFilter('heladeria'); setCategoryFilter('todas'); }}
          className={`loc-tab-btn heladeria ${locationFilter === 'heladeria' ? 'active' : ''}`}
        >
          <Store size={18} /> Heladerías
        </button>
        <button
          onClick={() => { setLocationFilter('restaurante'); setCategoryFilter('todas'); }}
          className={`loc-tab-btn restaurante ${locationFilter === 'restaurante' ? 'active' : ''}`}
        >
          <UtensilsCrossed size={18} /> Restaurantes
        </button>
      </div>

      <div className="filters-bar">
        <div className="pills-group">
          {[
            { id: 'todas', label: 'Todos' },
            { id: 'equipos', label: 'Equipos', icon: <Wrench size={14} /> },
            { id: 'instalaciones', label: 'Instalaciones', icon: <Building size={14} /> },
            { id: 'utensilios', label: 'Utensilios', icon: <UtensilsCrossed size={14} /> }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`pill-btn ${categoryFilter === cat.id ? 'active' : ''}`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        <div className="search-actions-group">
          <div className="search-wrapper">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              placeholder="Buscar documento..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          {isAdminMode && (
            <button 
              onClick={() => { setSelectedDoc(null); setShowEditModal(true); }}
              className="btn-primary"
            >
              <Plus size={16} /> Nuevo Doc
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 className="spinner" size={40} />
          <p>Cargando documentos desde Strapi...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <ShieldAlert size={32} style={{margin: '0 auto 0.5rem auto'}} />
          <p>{error}</p>
          <button onClick={() => fetchSubcategorias(selectedCategoria.id)} className="btn-outline mt-4" style={{margin: '1rem auto 0 auto'}}>
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <div className="doc-list-container">
            {filteredDocs.length > 0 ? (
              filteredDocs.map(doc => (
                <div key={doc.id} className="doc-item">
                  <div className="doc-info">
                    <div className="doc-icon-box">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h4 className="doc-title-row">
                        {doc.title}
                        <span className="doc-version">{doc.version}</span>
                      </h4>
                      <div className="doc-meta">
                        <span className="meta-category">
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

                  <div className="doc-actions">
                    <a 
                      href={doc.fileUrl || '#'} 
                      target="_blank" 
                      rel="noreferrer"
                      className={`btn-outline ${!doc.fileUrl ? 'disabled' : ''}`}
                      title={!doc.fileUrl ? "No hay archivo adjunto" : "Ver PDF"}
                    >
                      <Download size={16} /> Ver PDF
                    </a>

                    {isAdminMode && (
                      <>
                        <button 
                          onClick={() => { setSelectedDoc(doc); setShowEditModal(true); }}
                          className="action-icon-btn edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="action-icon-btn delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Search size={40} style={{marginBottom: '1rem', color: '#cbd5e1'}} />
                <h3 style={{margin: '0 0 0.25rem 0', color: '#1e293b'}}>No se encontraron documentos</h3>
                <p style={{margin: 0}}>Sube un nuevo documento o cambia los filtros.</p>
              </div>
            )}
          </div>
          <p className="text-right text-sm text-muted mt-4">
            Mostrando {filteredDocs.length} documentos {searchQuery && 'encontrados'}
          </p>
        </>
      )}
    </div>
  );

  const renderEditModal = () => {
    if (!showEditModal) return null;
    
    return (
      <div className="modal-overlay">
        <form onSubmit={handleSaveDocument} className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">
              <UploadCloud size={20} color="#2563eb" />
              {selectedDoc ? 'Actualizar Documento' : 'Nuevo Documento'}
            </h3>
            <button type="button" onClick={closeModal} className="btn-icon-only">
              <X size={20} />
            </button>
          </div>
          
          <div className="modal-body">
            <div className="alert-box">
              <ShieldAlert size={18} style={{flexShrink: 0, marginTop: '2px'}} />
              <p style={{margin: 0}}>El documento se vinculará a la categoría <strong>{selectedCategoria?.attributes?.name}</strong>.</p>
            </div>

            <div className="form-group">
              <label>Nombre del Documento</label>
              <input 
                name="title" required type="text" 
                defaultValue={selectedDoc?.title || ''}
                className="form-control"
                placeholder="Ej. Limpieza de Máquina..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Ubicación</label>
                <select 
                  name="location"
                  defaultValue={selectedDoc?.restaurant ? 'restaurante' : 'heladeria'}
                  className="form-control"
                >
                  <option value="heladeria">Heladería</option>
                  <option value="restaurante">Restaurante</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tipo / Categoría</label>
                <select 
                  name="category"
                  defaultValue={selectedDoc?.category || 'equipos'}
                  className="form-control"
                >
                  <option value="equipos">Equipos</option>
                  <option value="instalaciones">Instalaciones</option>
                  <option value="utensilios">Utensilios</option>
                </select>
              </div>
            </div>

            <div className="file-dropzone" onClick={() => fileInputRef.current.click()}>
              <input 
                type="file" accept="application/pdf"
                style={{display: 'none'}} ref={fileInputRef}
                onChange={handleFileChange}
              />
              <div className="dropzone-icon-box">
                <FileText size={24} color={selectedFile ? "#3b82f6" : "#f87171"} />
              </div>
              <p className="dropzone-text">
                {selectedFile ? selectedFile.name : (selectedDoc ? "Haz clic para reemplazar PDF" : "Haz clic para seleccionar PDF")}
              </p>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" onClick={closeModal} className="btn-secondary" disabled={isSaving}>
              Cancelar
            </button>
            <button type="submit" disabled={isSaving} className="btn-primary">
              {isSaving && <Loader2 size={16} className="spinner" style={{margin: 0}} />}
              {isSaving ? 'Guardando...' : 'Guardar en Strapi'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="calidad-dashboard">
      <div className="max-w-container">
        {currentView === 'menu' && renderMainMenu()}
        {currentView === 'detalle' && renderDetalleView()}
      </div>
      {renderEditModal()}
    </div>
  );
}