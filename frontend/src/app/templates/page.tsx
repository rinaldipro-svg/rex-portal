'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { templatesApi, Template, TemplateSection } from '@/lib/api';
import Link from 'next/link';

export default function TemplatesPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'templates' | 'sections'>('templates');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editingSection, setEditingSection] = useState<TemplateSection | null>(null);

  // Form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'general',
    is_shared: true,
  });

  const [sectionForm, setSectionForm] = useState({
    name: '',
    description: '',
    section_type: 'infrastructure',
    content: '',
    category: 'general',
    is_shared: true,
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadTemplates();
  }, [searchQuery, selectedCategory, activeTab]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      if (activeTab === 'templates') {
        const { data } = await templatesApi.list({
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          search: searchQuery || undefined,
        });
        setTemplates(data.templates);
      } else {
        const { data } = await templatesApi.sections.list({
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          search: searchQuery || undefined,
        });
        setSections(data.sections);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      if (!templateForm.name.trim()) {
        alert('Le nom du template est requis');
        return;
      }

      if (editingTemplate) {
        await templatesApi.update(editingTemplate.id, templateForm);
      } else {
        await templatesApi.create(templateForm);
      }

      loadTemplates();
      setShowTemplateModal(false);
      setEditingTemplate(null);
      setTemplateForm({
        name: '',
        description: '',
        category: 'general',
        is_shared: true,
      });
    } catch (error: any) {
      alert('Erreur: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSaveSection = async () => {
    try {
      if (!sectionForm.name.trim()) {
        alert('Le nom de la section est requis');
        return;
      }

      if (editingSection) {
        await templatesApi.sections.update(editingSection.id, sectionForm);
      } else {
        await templatesApi.sections.create(sectionForm);
      }

      loadTemplates();
      setShowSectionModal(false);
      setEditingSection(null);
      setSectionForm({
        name: '',
        description: '',
        section_type: 'infrastructure',
        content: '',
        category: 'general',
        is_shared: true,
      });
    } catch (error: any) {
      alert('Erreur: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return;

    try {
      await templatesApi.delete(id);
      loadTemplates();
    } catch (error: any) {
      alert('Erreur: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette section ?')) return;

    try {
      await templatesApi.sections.delete(id);
      loadTemplates();
    } catch (error: any) {
      alert('Erreur: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      category: template.category,
      is_shared: template.is_shared,
    });
    setShowTemplateModal(true);
  };

  const handleEditSection = (section: TemplateSection) => {
    setEditingSection(section);
    setSectionForm({
      name: section.name,
      description: section.description || '',
      section_type: section.section_type,
      content: section.content,
      category: section.category,
      is_shared: section.is_shared,
    });
    setShowSectionModal(true);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleCloseTemplateModal = () => {
    setShowTemplateModal(false);
    setEditingTemplate(null);
    setTemplateForm({
      name: '',
      description: '',
      category: 'general',
      is_shared: true,
    });
  };

  const handleCloseSectionModal = () => {
    setShowSectionModal(false);
    setEditingSection(null);
    setSectionForm({
      name: '',
      description: '',
      section_type: 'infrastructure',
      content: '',
      category: 'general',
      is_shared: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-hqblue text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <div className="font-bold text-xl tracking-widest text-hqorange uppercase hover:opacity-80">
                  PORTAIL REX
                </div>
              </Link>
              <div className="hidden md:block h-6 w-px bg-white/20"></div>
              <span className="hidden md:block text-sm text-blue-200">Templates</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm hover:text-hqorange transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-hqblue mb-2">Gestion des Templates</h1>
          <p className="text-gray-600">
            Créez, modifiez et gérez les templates réutilisables pour vos fiches REX
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'templates'
                ? 'text-hqblue border-b-2 border-hqblue'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 Templates de Fiches ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'sections'
                ? 'text-hqblue border-b-2 border-hqblue'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔧 Sections Réutilisables ({sections.length})
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hqblue"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hqblue"
          >
            <option value="all">Toutes les catégories</option>
            <option value="general">Général</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="technologie">Technologie</option>
            <option value="securite">Sécurité</option>
          </select>
          <button
            onClick={() =>
              activeTab === 'templates' ? setShowTemplateModal(true) : setShowSectionModal(true)
            }
            className="bg-hqblue text-white px-6 py-2 rounded-lg hover:bg-blue-900 transition-colors font-medium"
          >
            + Nouveau
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Chargement...</div>
            </div>
          ) : activeTab === 'templates' ? (
            templates.length > 0 ? (
              templates.map((template) => (
                <div key={template.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-hqblue">{template.name}</h3>
                      {template.description && (
                        <p className="text-gray-600 text-sm mt-1">{template.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        template.is_shared
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.is_shared ? '🔓 Partagé' : '🔒 Personnel'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        {template.category}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Créé le {new Date(template.created_at).toLocaleDateString('fr-FR')}
                  </p>

                  {template.titre && (
                    <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
                      <strong>Titre:</strong> {template.titre}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors text-sm"
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={() => {
                        router.push(`/editor?templateId=${template.id}`);
                      }}
                      className="px-4 py-2 bg-hqblue text-white rounded hover:bg-blue-900 transition-colors text-sm"
                    >
                      ➕ Utiliser comme base
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <p className="text-gray-500 mb-4">Aucun template trouvé</p>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="bg-hqblue text-white px-6 py-2 rounded-lg hover:bg-blue-900 transition-colors"
                >
                  Créer le premier template
                </button>
              </div>
            )
          ) : sections.length > 0 ? (
            sections.map((section) => (
              <div key={section.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-hqblue">{section.name}</h3>
                    {section.description && (
                      <p className="text-gray-600 text-sm mt-1">{section.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      section.is_shared
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {section.is_shared ? '🔓 Partagé' : '🔒 Personnel'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      {section.section_type}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded mb-4 text-sm max-h-32 overflow-y-auto">
                  <strong>Contenu:</strong>
                  <p className="text-gray-700 mt-1">{section.content}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleEditSection(section)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors text-sm"
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <p className="text-gray-500 mb-4">Aucune section trouvée</p>
              <button
                onClick={() => setShowSectionModal(true)}
                className="bg-hqblue text-white px-6 py-2 rounded-lg hover:bg-blue-900 transition-colors"
              >
                Créer la première section
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-hqblue mb-4">
                {editingTemplate ? 'Modifier le template' : 'Créer un nouveau template'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du template *
                  </label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hqblue"
                    placeholder="Ex: Template Infrastructure Standard"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hqblue h-20"
                    placeholder="Description du template..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catégorie
                    </label>
                    <select
                      value={templateForm.category}
                      onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hqblue"
                    >
                      <option value="general">Général</option>
                      <option value="infrastructure">Infrastructure</option>
                      <option value="technologie">Technologie</option>
                      <option value="securite">Sécurité</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={templateForm.is_shared}
                        onChange={(e) =>
                          setTemplateForm({ ...templateForm, is_shared: e.target.checked })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-700">Partagé</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCloseTemplateModal}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="flex-1 px-4 py-2 bg-hqblue text-white rounded hover:bg-blue-900 transition-colors font-medium"
                >
                  {editingTemplate ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-hqblue mb-4">
                {editingSection ? 'Modifier la section' : 'Créer une nouvelle section'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la section *
                  </label>
                  <input
                    type="text"
                    value={sectionForm.name}
                    onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hqblue"
                    placeholder="Ex: Infrastructure Standard"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={sectionForm.description}
                    onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hqblue h-16"
                    placeholder="Description..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type de section *
                    </label>
                    <select
                      value={sectionForm.section_type}
                      onChange={(e) => setSectionForm({ ...sectionForm, section_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hqblue"
                    >
                      <option value="infrastructure">Infrastructure</option>
                      <option value="technologie">Technologie</option>
                      <option value="securite">Sécurité</option>
                      <option value="environnement">Environnement</option>
                      <option value="contrainte">Contrainte</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catégorie
                    </label>
                    <select
                      value={sectionForm.category}
                      onChange={(e) => setSectionForm({ ...sectionForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hqblue"
                    >
                      <option value="general">Général</option>
                      <option value="infrastructure">Infrastructure</option>
                      <option value="technologie">Technologie</option>
                      <option value="securite">Sécurité</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contenu *
                  </label>
                  <textarea
                    value={sectionForm.content}
                    onChange={(e) => setSectionForm({ ...sectionForm, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hqblue h-32"
                    placeholder="Contenu de la section..."
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sectionForm.is_shared}
                      onChange={(e) =>
                        setSectionForm({ ...sectionForm, is_shared: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">Partagé</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCloseSectionModal}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveSection}
                  className="flex-1 px-4 py-2 bg-hqblue text-white rounded hover:bg-blue-900 transition-colors font-medium"
                >
                  {editingSection ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
