import React, { useState, useEffect, useMemo, useRef } from 'react';
import './App.css';
import { Popsicle, CookingPot, ArrowLeft, Edit, Trash2, Plus, X, Loader2, FolderOpen, File } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL;
const API_URL = `${BASE_URL}/api`;

// normalizar texto categorías
const formatCategory = (str) => {
  if (!str) return 'Sin categoría';
  const trimmed = str.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

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
        const filesArray = item.attributes.file?.data;
        const fileObj = filesArray && filesArray.length > 0 ? filesArray[0].attributes : null;
        const rawUrl = fileObj?.url;
        
        return {
          id: item.id,
          title: fileObj?.name || 'Documento sin archivo',
          restaurant: item.attributes.restaurant || false,
          heladeria: item.attributes.heladeria || false,
          // formateo de categoría de api
          category: formatCategory(item.attributes.name),
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
      
      if (!selectedDoc && !selectedFile) {
        alert("Debes adjuntar un archivo PDF para el nuevo documento.");
        setIsSaving(false);
        return;
      }

      const dataPayload = {
        // formatear categoría antes de enviar a api
        name: formatCategory(form.category.value),
        restaurant: form.restaurant.checked,
        heladeria: form.heladeria.checked,
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

  const filteredDocs = useMemo(() => subcategorias.filter(doc => {
    const matchLocation = locationFilter === 'restaurante' ? doc.restaurant : doc.heladeria;
    const matchCategory = categoryFilter === 'todas' || doc.category === categoryFilter;
    const matchSearch = doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) || doc.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLocation && matchCategory && matchSearch;
  }), [subcategorias, locationFilter, categoryFilter, searchQuery]);

  const dynamicCategories = useMemo(() => {
    const cats = new Set(subcategorias.map(doc => doc.category));
    return Array.from(cats);
  }, [subcategorias]);

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
                {categorias.map(({ id, attributes: { name, description } }) => (
                  <button key={id} onClick={() => handleSelectCategoria({id, attributes: {name}})} className="menu-card">
                    <div className="card-icon-wrapper">
                      <FolderOpen size={32} />
                    </div>
                    <h3 className="card-title">{name || "Sin nombre"}</h3>
                    <p className="card-desc">{description || "Sin descripción"}</p>
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
                <h2 className="page-title">{selectedCategoria?.attributes?.name || 'Sin nombre'}</h2>
              </div>
            </div>

            <div className="location-tabs">
              <button onClick={() => { setLocationFilter('heladeria'); setCategoryFilter('todas'); }} className={`loc-tab-btn ${locationFilter === 'heladeria' ? 'active' : ''}`}>
                <Popsicle size={18} /> Heladerías
              </button>
              <button onClick={() => { setLocationFilter('restaurante'); setCategoryFilter('todas'); }} className={`loc-tab-btn ${locationFilter === 'restaurante' ? 'active' : ''}`}>
                <CookingPot size={18} /> Restaurantes
              </button>
            </div>

            <div className="filters-bar">
              <div className="pills-group">
                <button onClick={() => setCategoryFilter('todas')} className={`pill-btn ${categoryFilter === 'todas' ? 'active' : ''}`}>
                  Todos
                </button>
                {dynamicCategories.map(cat => (
                  <button key={cat} onClick={() => setCategoryFilter(cat)} className={`pill-btn ${categoryFilter === cat ? 'active' : ''}`}>
                    {cat}
                  </button>
                ))}
              </div>

              <div className="search-actions-group">
                <div className="search-wrapper">
                  <input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
                </div>
                <button onClick={() => { setSelectedDoc(null); setShowEditModal(true); }} className="btn-primary">
                  <Plus size={16} />Nuevo
                </button>
              </div>
            </div>

            {isLoading ? <Loader2 className="spinner" size={40} /> : error ? <p className="error-state">{error}</p> : (
              <div className="doc-list-container">
                {filteredDocs.length > 0 ? filteredDocs.map(doc => (
                  <div key={doc.id} className="doc-item">
                    <div className="doc-info">
                      <File size={24} className="doc-icon" />
                      <div>
                        <h4 className="doc-title-row">{doc.title}</h4>
                        <div className="doc-meta">
                          <span className="pill">{doc.category}</span>
                          <span> Creado: {doc.updatedAt}</span>
                        </div>
                      </div>
                    </div>
                    <div className="doc-actions">
                      <a href={doc.fileUrl || '#'} target="_blank" rel="noreferrer" className="btn-outline">
                        Ver PDF
                      </a>
                      <button onClick={() => { setSelectedDoc(doc); setShowEditModal(true); }} className="btn-icon-only"><Edit size={18} /></button>
                      <button onClick={() => handleDeleteDocument(doc.id)} className="btn-icon-only"><Trash2 size={18} /></button>
                    </div>
                  </div>
                )) : <p className="empty-state">No se encontraron documentos en esta vista.</p>}
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
              <h3 className="modal-title"> {selectedDoc ? 'Actualizar documento' : 'Nuevo documento'}</h3>
              <button type="button" onClick={closeModal} className="btn-icon-only"><X size={20} /></button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Categoría</label>
                <input 
                  name="category" 
                  type="text" 
                  required 
                  defaultValue={selectedDoc?.category || ''} 
                  className="form-control" 
                  placeholder="Ej. Utensilios, Equipos, RHM..." 
                />
              </div>

              <div className="form-group">
                <label>Ubicación</label>
                <div className="checkbox-group">
                  <label className="check-label">
                    <input type="checkbox" name="heladeria" defaultChecked={selectedDoc ? selectedDoc.heladeria : true} />
                    Heladería
                  </label>
                  <label className="check-label">
                    <input type="checkbox" name="restaurant" defaultChecked={selectedDoc ? selectedDoc.restaurant : false} />
                    Restaurante
                  </label>
                </div>
              </div>

              <div className="file-dropzone" onClick={() => fileInputRef.current.click()}>
                <input type="file" accept="application/pdf" style={{display: 'none'}} ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files[0])} />
                <File size={24} />
                <p>
                  {selectedFile ? selectedFile.name : (selectedDoc ? `Actual: ${selectedDoc.title}` : "Haz clic para seleccionar el PDF")}
                </p>
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