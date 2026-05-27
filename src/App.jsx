import React, { useState, useEffect, useMemo, useRef } from 'react';
import './App.css';
import { Popsicle, CookingPot, ArrowLeft, Trash2, Plus, X, Loader2, FolderOpen, File } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337';
const API_URL = `${BASE_URL}/api`;

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
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadFormState, setUploadFormState] = useState({ subcategoryId: '', restaurant: false, heladeria: true });
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
        setError('Error al cargar las categorías principales.');
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
      
      const fetchedGroups = result.data.map(item => ({
        id: item.id,
        name: formatCategory(item.attributes.name),
        restaurant: item.attributes.restaurant || false,
        heladeria: item.attributes.heladeria || false,
        files: item.attributes.file?.data?.map(f => {
          const rawUrl = f.attributes.url;
          return {
            id: f.id,
            name: f.attributes.name,
            url: rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `${BASE_URL}${rawUrl}`) : null,
            updatedAt: new Date(f.attributes.updatedAt).toLocaleDateString()
          };
        }) || []
      }));
      
      setSubcategorias(fetchedGroups);
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

  const allDocuments = useMemo(() => {
    return subcategorias.flatMap(sub => 
      sub.files.map(file => ({
        ...file,
        subcategoryId: sub.id,
        categoryName: sub.name,
        restaurant: sub.restaurant,
        heladeria: sub.heladeria
      }))
    );
  }, [subcategorias]);

  const filteredDocs = useMemo(() => {
    return allDocuments.filter(doc => {
      const matchLocation = locationFilter === 'restaurante' ? doc.restaurant : doc.heladeria;
      const matchCategory = categoryFilter === 'todas' || doc.categoryName === categoryFilter;
      const matchSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || doc.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchLocation && matchCategory && matchSearch;
    });
  }, [allDocuments, locationFilter, categoryFilter, searchQuery]);

  const dynamicCategories = useMemo(() => {
    return subcategorias.filter(sub => locationFilter === 'restaurante' ? sub.restaurant : sub.heladeria);
  }, [subcategorias, locationFilter]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const form = e.target.elements;
      const payload = {
        name: formatCategory(form.categoryName.value),
        restaurant: form.restaurant.checked,
        heladeria: form.heladeria.checked,
        calidad_categoria: selectedCategoria.id
      };

      const response = await fetch(`${API_URL}/calidad-subcategorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload })
      });

      if (!response.ok) throw new Error('Error al crear la categoría.');
      
      await fetchSubcategorias(selectedCategoria.id);
      setShowCategoryModal(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Debes adjuntar un archivo PDF.");
    setIsSaving(true);
    
    try {
      const form = e.target.elements;
      const subId = form.subcategoryId.value;

      await fetch(`${API_URL}/calidad-subcategorias/${subId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: { restaurant: form.restaurant.checked, heladeria: form.heladeria.checked } 
        })
      });

      const submitData = new FormData();
      submitData.append('files', selectedFile);
      submitData.append('refId', subId);
      submitData.append('ref', 'api::calidad-subcategoria.calidad-subcategoria');
      submitData.append('field', 'file');

      const response = await fetch(`${API_URL}/upload`, { 
        method: 'POST', 
        body: submitData 
      });

      if (!response.ok) throw new Error('Error al adjuntar el archivo.');

      await fetchSubcategorias(selectedCategoria.id);
      closeUploadModal();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('¿Eliminar este documento permanentemente?')) return;
    try {
      await fetch(`${API_URL}/upload/files/${fileId}`, { method: 'DELETE' });
      await fetchSubcategorias(selectedCategoria.id);
    } catch {
      alert('Error al eliminar el documento.');
    }
  };

  const handleDeleteCategory = async (subId) => {
    if (!window.confirm('¿Eliminar esta categoría y todos sus documentos internos?')) return;
    try {
      await fetch(`${API_URL}/calidad-subcategorias/${subId}`, { method: 'DELETE' });
      setCategoryFilter('todas');
      await fetchSubcategorias(selectedCategoria.id);
    } catch {
      alert('Error al eliminar la categoría.');
    }
  };

  const handleSelectCategoria = (cat) => {
    setSelectedCategoria(cat);
    setCurrentView('detalle');
    setSearchQuery('');
    setLocationFilter('heladeria');
    setCategoryFilter('todas');
  };

  const openUploadModal = () => {
    if (subcategorias.length === 0) {
      alert("Primero debes crear al menos una categoría en los filtros.");
      return;
    }
    const firstSub = subcategorias[0];
    setUploadFormState({ subcategoryId: firstSub.id, restaurant: firstSub.restaurant, heladeria: firstSub.heladeria });
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
  };

  const handleSubcategorySelectChange = (e) => {
    const id = e.target.value;
    const sub = subcategorias.find(s => s.id.toString() === id);
    if (sub) {
      setUploadFormState({ subcategoryId: id, restaurant: sub.restaurant, heladeria: sub.heladeria });
    }
  };

  return (
    <div className="calidad-dashboard">
      <div className="max-w-container">
        
        {/* menu */}
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

        {/* detalle */}
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
                {dynamicCategories.map(sub => (
                  <button key={sub.id} onClick={() => setCategoryFilter(sub.name)} className={`pill-btn ${categoryFilter === sub.name ? 'active' : ''}`}>
                    {sub.name}
                  </button>
                ))}
                
                <button onClick={() => setShowCategoryModal(true)} className="pill-btn add-pill">
                  <Plus size={16} />Nueva Categoría
                </button>
              </div>

              <div className="search-actions-group">
                <div className="search-wrapper">
                  <input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
                </div>
                <button onClick={openUploadModal} className="btn-primary">
                  <Plus size={16} /> Subir Documento
                </button>
              </div>
            </div>

            {categoryFilter !== 'todas' && (
              <div className="active-category-actions">
                <span className="info-text">Mostrando documentos de: <strong>{categoryFilter}</strong></span>
                <button 
                  className="btn-outline danger-outline" 
                  onClick={() => handleDeleteCategory(dynamicCategories.find(c => c.name === categoryFilter)?.id)}
                >
                  <Trash2 size={16} /> Eliminar Categoría
                </button>
              </div>
            )}

            {isLoading ? <Loader2 className="spinner" size={40} /> : error ? <p className="error-state">{error}</p> : (
              <div className="doc-list-container">
                {filteredDocs.length === 0 ? (
                   <p className="empty-state">No se encontraron documentos en esta vista.</p>
                ) : (
                  filteredDocs.map(doc => (
                    <div key={doc.id} className="doc-item">
                      <div className="doc-info">
                        <File size={24} className="doc-icon" />
                        <div>
                          <h4 className="doc-title-row">{doc.name}</h4>
                          <div className="doc-meta">
                            <span className="pill">{doc.categoryName}</span>
                            <span>Subido: {doc.updatedAt}</span>
                          </div>
                        </div>
                      </div>
                      <div className="doc-actions">
                        <a href={doc.url || '#'} target="_blank" rel="noreferrer" className="btn-outline">Ver PDF</a>
                        <button onClick={() => handleDeleteFile(doc.id)} className="btn-icon-only"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* modal categoria */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <form onSubmit={handleCreateCategory} className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Crear Nueva Categoría</h3>
              <button type="button" onClick={() => setShowCategoryModal(false)} className="btn-icon-only"><X size={20} /></button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Nombre de la Categoría</label>
                <input name="categoryName" type="text" required className="form-control" placeholder="Ej. Manuales de Cocina..."/>
              </div>

              <div className="form-group">
                <label>Ubicación</label>
                <div className="checkbox-group">
                  <label className="check-label">
                    <input type="checkbox" name="heladeria" defaultChecked={locationFilter === 'heladeria'} />
                    Heladería
                  </label>
                  <label className="check-label">
                    <input type="checkbox" name="restaurant" defaultChecked={locationFilter === 'restaurante'} />
                    Restaurante
                  </label>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" onClick={() => setShowCategoryModal(false)} className="btn-outline" disabled={isSaving}>Cancelar</button>
              <button type="submit" disabled={isSaving} className="btn-primary">
                {isSaving ? <Loader2 size={16} className="spinner" /> : 'Crear Categoría'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* modal subir */}
      {showUploadModal && (
        <div className="modal-overlay">
          <form onSubmit={handleUploadDocument} className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Subir Documento PDF</h3>
              <button type="button" onClick={closeUploadModal} className="btn-icon-only"><X size={20} /></button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Seleccionar Categoría (ID Destino)</label>
                <select 
                  name="subcategoryId" 
                  className="form-control" 
                  value={uploadFormState.subcategoryId}
                  onChange={handleSubcategorySelectChange}
                >
                  {subcategorias.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Ubicación del Documento y Categoría</label>
                <div className="checkbox-group">
                  <label className="check-label">
                    <input type="checkbox" name="heladeria" 
                           checked={uploadFormState.heladeria} 
                           onChange={(e) => setUploadFormState({...uploadFormState, heladeria: e.target.checked})} />
                    Heladería
                  </label>
                  <label className="check-label">
                    <input type="checkbox" name="restaurant" 
                           checked={uploadFormState.restaurant} 
                           onChange={(e) => setUploadFormState({...uploadFormState, restaurant: e.target.checked})} />
                    Restaurante
                  </label>
                </div>
              </div>

              <div className="file-dropzone" onClick={() => fileInputRef.current.click()}>
                <input type="file" accept="application/pdf" style={{display: 'none'}} ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files[0])} />
                <File size={24} />
                <p>{selectedFile ? selectedFile.name : "Haz clic para seleccionar el PDF"}</p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" onClick={closeUploadModal} className="btn-outline" disabled={isSaving}>Cancelar</button>
              <button type="submit" disabled={isSaving} className="btn-primary">
                {isSaving ? <Loader2 size={16} className="spinner" /> : 'Subir Documento'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}