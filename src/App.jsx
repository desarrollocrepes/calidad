import React, { useState, useMemo } from 'react';
import { FileText, ClipboardList, Store, UtensilsCrossed, Wrench, Building, Search, ArrowLeft, Download, Edit, Trash2, Plus, UploadCloud, X, ShieldAlert} from 'lucide-react';
import './App.css';

// --- MOCK DATA ---
const mockDocuments = [
  { id: 1, title: 'file1', type: 'procedimiento', location: 'heladeria', category: 'equipos', updatedAt: '2026-05-10', version: 'v1.2' },
  { id: 2, title: 'file2', type: 'procedimiento', location: 'restaurante', category: 'instalaciones', updatedAt: '2026-05-12', version: 'v2.0' },
  { id: 3, title: 'file3', type: 'procedimiento', location: 'heladeria', category: 'utensilios', updatedAt: '2026-05-15', version: 'v1.0' },
  { id: 4, title: 'file4', type: 'procedimiento', location: 'restaurante', category: 'equipos', updatedAt: '2026-04-20', version: 'v3.1' },
  { id: 5, title: 'file5', type: 'procedimiento', location: 'heladeria', category: 'equipos', updatedAt: '2026-05-01', version: 'v1.5' },
  { id: 6, title: 'file6', type: 'procedimiento', location: 'restaurante', category: 'instalaciones', updatedAt: '2026-03-10', version: 'v2.2' },
  { id: 7, title: 'file7', type: 'procedimiento', location: 'restaurante', category: 'utensilios', updatedAt: '2026-05-20', version: 'v1.1' },
  { id: 8, title: 'file8', type: 'procedimiento', location: 'heladeria', category: 'equipos', updatedAt: '2026-05-22', version: 'v1.0' },
];

export default function CalidadDashboard() {
  const [currentView, setCurrentView] = useState('menu'); 
  const [locationFilter, setLocationFilter] = useState('heladeria');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const filteredDocs = useMemo(() => {
    return mockDocuments.filter(doc => {
      const matchesType = doc.type === 'procedimiento';
      const matchesLocation = doc.location === locationFilter;
      const matchesCategory = categoryFilter === 'todas' || doc.category === categoryFilter;
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesLocation && matchesCategory && matchesSearch;
    });
  }, [locationFilter, categoryFilter, searchQuery]);

  // 1. Vista del Menú Principal
  const renderMainMenu = () => (
    <div className="animate-fade-in">
      
      <div className="menu-grid">
        <button onClick={() => setCurrentView('rhm')} className="menu-card rhm">
          <div className="card-icon blue"><ClipboardList size={32} /></div>
          <h3 className="card-title">RHM</h3>
          <p className="card-desc">Registros de Higiene y Mantenimiento</p>
        </button>

        <button onClick={() => setCurrentView('procedimientos')} className="menu-card procedimientos">
          <div className="card-icon teal"><FileText size={32} /></div>
          <h3 className="card-title">Procedimientos de limpieza</h3>
          <p className="card-desc">Manuales, instructivos y guías de aseo</p>
        </button>
      </div>
    </div>
  );

  // 2. Vista de Procedimientos
  const renderProcedimientos = () => (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="view-header">
        <div className="header-title-group">
          <button onClick={() => setCurrentView('menu')} className="btn-icon-only">
            <ArrowLeft size={20} />
          </button>
          <h2 className="title-main" style={{margin: 0}}>Procedimientos de limpieza</h2>
        </div>

        <div className="admin-toggle-wrapper">
          <span className={`toggle-label ${isAdminMode ? 'active' : ''}`}>Modo Edición</span>
          <button 
            onClick={() => setIsAdminMode(!isAdminMode)}
            className={`toggle-switch ${isAdminMode ? 'on' : ''}`}
          >
            <span className="toggle-knob" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="location-tabs">
        <button
          onClick={() => { setLocationFilter('heladeria'); setCategoryFilter('todas'); }}
          className={`loc-tab ${locationFilter === 'heladeria' ? 'active-heladeria' : ''}`}
        >
          <Store size={18} /> Heladerías
        </button>
        <button
          onClick={() => { setLocationFilter('restaurante'); setCategoryFilter('todas'); }}
          className={`loc-tab ${locationFilter === 'restaurante' ? 'active-restaurante' : ''}`}
        >
          <UtensilsCrossed size={18} /> Restaurantes
        </button>
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <div className="category-pills">
          {[
            { id: 'todas', label: 'Todos' },
            { id: 'equipos', label: 'Equipos', icon: <Wrench size={14} /> },
            { id: 'instalaciones', label: 'Instalaciones', icon: <Building size={14} /> },
            { id: 'utensilios', label: 'Utensilios', icon: <UtensilsCrossed size={14} /> }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`pill ${categoryFilter === cat.id ? 'active' : ''}`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        <div className="search-actions">
          <div className="search-box">
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

      {/* Lista */}
      <div className="doc-list-container">
        {filteredDocs.length > 0 ? (
          <div>
            {filteredDocs.map(doc => (
              <div key={doc.id} className="doc-item">
                <div className="doc-info">
                  <div className="doc-file-icon"><FileText size={24} /></div>
                  <div>
                    <h4 className="doc-title">
                      {doc.title} <span className="doc-version">{doc.version}</span>
                    </h4>
                    <div className="doc-meta">
                      <span className="doc-meta-cat">
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
                  <button className="btn-secondary">
                    <Download size={16} /> Ver PDF
                  </button>
                  {isAdminMode && (
                    <>
                      <button 
                        onClick={() => { setSelectedDoc(doc); setShowEditModal(true); }}
                        className="btn-action-icon edit" title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button className="btn-action-icon delete" title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Search size={40} className="empty-icon" />
            <h3 className="empty-title">No se encontraron documentos</h3>
            <p className="empty-desc">Prueba cambiando los filtros o el término de búsqueda.</p>
          </div>
        )}
      </div>
      
      <p className="list-summary">
        Mostrando {filteredDocs.length} documentos {searchQuery && 'encontrados'}
      </p>
    </div>
  );

  // 3. Modal
  const renderEditModal = () => {
    if (!showEditModal) return null;
    
    return (
      <div className="modal-overlay animate-fade-in">
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">
              <UploadCloud size={20} /> {selectedDoc ? 'Actualizar Documento' : 'Nuevo Documento'}
            </h3>
            <button onClick={() => setShowEditModal(false)} className="btn-icon-only">
              <X size={20} />
            </button>
          </div>
          
          <div className="modal-body">

            <div className="form-group">
              <label className="form-label">Título del Procedimiento</label>
              <input 
                type="text" 
                defaultValue={selectedDoc?.title || ''}
                className="form-control"
                placeholder="Ej. Limpieza de Máquina..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Ubicación</label>
                <select defaultValue={selectedDoc?.location || locationFilter} className="form-control">
                  <option value="heladeria">Heladería</option>
                  <option value="restaurante">Restaurante</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select defaultValue={selectedDoc?.category || 'equipos'} className="form-control">
                  <option value="equipos">categ1</option>
                  <option value="instalaciones">categ2</option>
                  <option value="utensilios">categ3</option>
                </select>
              </div>
            </div>

            <div className="drop-zone">
              <div className="drop-icon-wrapper">
                <FileText size={24} />
              </div>
              <p className="drop-text">Haz clic o arrastra un archivo PDF aquí</p>
              <p className="drop-subtext">peso max de ___</p>
            </div>
          </div>
          
          <div className="modal-footer">
            <button onClick={() => setShowEditModal(false)} className="btn-cancel">Cancelar</button>
            <button 
              onClick={() => { alert('Simulación: Guardando en Strapi...'); setShowEditModal(false); }}
              className="btn-primary"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
      
        {/* Vistas Dinámicas */}
        {currentView === 'menu' && renderMainMenu()}
        {currentView === 'procedimientos' && renderProcedimientos()}
        {currentView === 'rhm' && (
          <div className="rhm-placeholder animate-fade-in">
            <button onClick={() => setCurrentView('menu')} className="btn-back-center">
              <ArrowLeft size={16}/> Volver
            </button>
            <ClipboardList size={48} className="rhm-icon" />
            <h2 className="title-main">Sección RHM</h2>
            <p className="subtitle">subtitulo</p>
          </div>
        )}

      </div>
      {renderEditModal()}
    </div>
  );
}