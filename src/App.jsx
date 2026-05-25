import React, { useState, useEffect, useMemo, useRef } from 'react';
import './App.css';
import { 
  FileText, Store, UtensilsCrossed, Wrench, Building, 
  Search, ArrowLeft, Download, Edit, Trash2, Plus,
  UploadCloud, X, ShieldAlert, Loader2, FolderOpen
} from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://backendintranet2.crepesywaffles.com';
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

  useEffect(() => {
    const fetchCategorias = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/calidad-categorias`);
        if (!response.ok) throw new Error();
        const result = await response.json();
        setCategorias(result.data);
      } catch {
        setError('Error al cargar las categorías.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategorias();
  }, []);

  const fetchSubcategorias = async (categoriaId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/calidad-subcategorias?filters[calidad_categoria][id][$eq]=${categoriaId}&populate=file`);
      if (!response.ok) throw new Error();
      const result = await response.json();
      
      setSubcategorias(result.data.map(item => {
        const fileObj = item.attributes.file?.data?.attributes;
        const rawUrl = fileObj?.url;
        return {
          id: item.id,
          title: item.attributes.name || 'Sin título',
          restaurant: item.attributes.restaurant,
          category: item.attributes.categoria || 'equipos', 
          updatedAt: new Date(item.attributes.updatedAt).toLocaleDateString(),
          version: item.attributes.version || 'v1.0',
          fileUrl: rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `${BASE_URL}${rawUrl}`) : null
        };
      }));
    } catch {
      setError('Error al cargar los documentos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === 'detalle' && selectedCategoria) {
      fetchSubcategorias(selectedCategoria.id);
    }
  }, [currentView, selectedCategoria]);

  const handleSaveDocument = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const form = e.target.elements;
      const dataPayload = {
        name: form.title.value,
        restaurant: form.location.value === 'restaurante',
        categoria: form.category.value,
        calidad_categoria: selectedCategoria.id 
      };

      const submitData = new FormData();
      submitData.append('data', JSON.stringify(dataPayload));
      if (selectedFile) submitData.append('files.file', selectedFile);

      const url = selectedDoc ? `${API_URL}/calidad-subcategorias/${selectedDoc.id}` : `${API_URL}/calidad-subcategorias`;
      const response = await fetch(url, { method: selectedDoc ? 'PUT' : 'POST', body: submitData });

      if (!response.ok) throw new Error();
      await fetchSubcategorias(selectedCategoria.id);
      closeModal();
    } catch {
      alert('Error al guardar el documento.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDocument = async (id) => {
    if (!window.confirm('¿Eliminar este documento permanentemente?')) return;
    try {
      await fetch(`${API_URL}/calidad-subcategorias/${id}`, { method: 'DELETE' });
      setSubcategorias(prev => prev.filter(doc => doc.id !== id));
    } catch {
      alert('Error al eliminar.');
    }
  };

  const filteredDocs = useMemo(() => subcategorias.filter(doc => 
    (locationFilter === 'restaurante' ? doc.restaurant : !doc.restaurant) &&
    (categoryFilter === 'todas' || doc.category === categoryFilter) &&
    (doc.title?.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [subcategorias, locationFilter, categoryFilter, searchQuery]);

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

  return (
    <div className="calidad-dashboard">
      <div className="max-w-container">
        
        {/* MENÚ */}
        {currentView === 'menu' && (
          <div>
            {isLoading ? <Loader2 className="spinner" size={40} /> : error ? <p className="error-state">{error}</p> : (
              <div className="menu-grid">
                {categorias.map(({ id, attributes: { name, description, icon } }) => (
                  <button key={id} onClick={() => handleSelectCategoria({id, attributes: {name}})} className="menu-card">
                    <div className="card-icon-wrapper">
                      {icon && typeof icon === 'string' ? <img src={icon} alt={name} className="card-icon-img" /> : <FolderOpen size={32} />}
                    </div>
                    <h3 className="card-title">{name}</h3>
                    <p className="card-desc">{description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DETALLE */}
        {currentView === 'detalle' && (
          <div>
            <div className="view-header">
              <div className="header-title-group">
                <button onClick={() => setCurrentView('menu')} className="btn-icon-only"><ArrowLeft size={20} /></button>
                <h2 className="page-title">{selectedCategoria?.attributes?.name || 'Documentos'}</h2>
              </div>
              <div className="admin-toggle-wrapper">
                <span className="admin-label">Edición</span>
                <button onClick={() => setIsAdminMode(!isAdminMode)} className={`toggle-switch ${isAdminMode ? 'active' : ''}`}>
                  <span className="toggle-dot" />
                </button>
              </div>
            </div>

            <div className="location-tabs">
              <button onClick={() => { setLocationFilter('heladeria'); setCategoryFilter('todas'); }} className={`loc-tab-btn ${locationFilter === 'heladeria' ? 'active' : ''}`}>
                <Store size={18} /> Heladerías
              </button>
              <button onClick={() => { setLocationFilter('restaurante'); setCategoryFilter('todas'); }} className={`loc-tab-btn ${locationFilter === 'restaurante' ? 'active' : ''}`}>
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
                  <button key={cat.id} onClick={() => setCategoryFilter(cat.id)} className={`pill-btn ${categoryFilter === cat.id ? 'active' : ''}`}>
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>

              <div className="search-actions-group">
                <div className="search-wrapper">
                  <Search className="search-icon" size={16} />
                  <input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
                </div>
                {isAdminMode && (
                  <button onClick={() => { setSelectedDoc(null); setShowEditModal(true); }} className="btn-primary">
                    <Plus size={16} /> Nuevo
                  </button>
                )}
              </div>
            </div>

            {isLoading ? <Loader2 className="spinner" size={40} /> : error ? <p className="error-state">{error}</p> : (
              <div className="doc-list-container">
                {filteredDocs.length > 0 ? filteredDocs.map(doc => (
                  <div key={doc.id} className="doc-item">
                    <div className="doc-info">
                      <FileText size={24} className="doc-icon" />
                      <div>
                        <h4 className="doc-title-row">{doc.title} <span className="doc-version">{doc.version}</span></h4>
                        <div className="doc-meta">
                          <span>{doc.category}</span> • <span>{doc.updatedAt}</span>
                        </div>
                      </div>
                    </div>
                    <div className="doc-actions">
                      <a href={doc.fileUrl || '#'} target="_blank" rel="noreferrer" className="btn-outline">
                        <Download size={16} /> Ver PDF
                      </a>
                      {isAdminMode && (
                        <>
                          <button onClick={() => { setSelectedDoc(doc); setShowEditModal(true); }} className="btn-icon-only"><Edit size={18} /></button>
                          <button onClick={() => handleDeleteDocument(doc.id)} className="btn-icon-only"><Trash2 size={18} /></button>
                        </>
                      )}
                    </div>
                  </div>
                )) : <p className="empty-state">No se encontraron documentos.</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <form onSubmit={handleSaveDocument} className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title"><UploadCloud size={20} /> {selectedDoc ? 'Actualizar' : 'Nuevo Documento'}</h3>
              <button type="button" onClick={closeModal} className="btn-icon-only"><X size={20} /></button>
            </div>
            
            <div className="modal-body">
              <div className="alert-box">
                <ShieldAlert size={18} /> Categoría: {selectedCategoria?.attributes?.name}
              </div>
              <div className="form-group">
                <label>Nombre del Documento</label>
                <input name="title" required type="text" defaultValue={selectedDoc?.title || ''} className="form-control" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ubicación</label>
                  <select name="location" defaultValue={selectedDoc?.restaurant ? 'restaurante' : 'heladeria'} className="form-control">
                    <option value="heladeria">Heladería</option>
                    <option value="restaurante">Restaurante</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Categoría</label>
                  <select name="category" defaultValue={selectedDoc?.category || 'equipos'} className="form-control">
                    <option value="equipos">Equipos</option>
                    <option value="instalaciones">Instalaciones</option>
                    <option value="utensilios">Utensilios</option>
                  </select>
                </div>
              </div>
              <div className="file-dropzone" onClick={() => fileInputRef.current.click()}>
                <input type="file" accept="application/pdf" style={{display: 'none'}} ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files[0])} />
                <FileText size={24} />
                <p>{selectedFile ? selectedFile.name : "Seleccionar PDF"}</p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" onClick={closeModal} className="btn-outline" disabled={isSaving}>Cancelar</button>
              <button type="submit" disabled={isSaving} className="btn-primary">
                {isSaving ? <Loader2 size={16} className="spinner" /> : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}