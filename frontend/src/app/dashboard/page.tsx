'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { fichesApi, Fiche } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [fiches, setFiches] = useState<Fiche[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadFiches();
  }, []);

  const loadFiches = async () => {
    try {
      const { data } = await fichesApi.list();
      setFiches(data.fiches);
    } catch (error) {
      console.error('Erreur chargement fiches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handlePublishPDF = async (ficheId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Publier cette fiche et générer le PDF ?')) return;
    
    try {
      await fichesApi.publish(ficheId);
      alert('PDF généré avec succès ! La fiche est maintenant publiée.');
      
      // Naviguer vers la fiche avec le paramètre print=true
      router.push(`/editor/${ficheId}?print=true`);
    } catch (error: any) {
      alert('Erreur lors de la génération du PDF: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (ficheId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Supprimer cette fiche ?')) return;
    
    try {
      await fichesApi.delete(ficheId);
      loadFiches();
    } catch (error: any) {
      alert('Erreur lors de la suppression: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDownloadPDF = async (ficheId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Naviguer vers la fiche avec le paramètre print=true
    router.push(`/editor/${ficheId}?print=true`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-hqblue text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="font-bold text-xl tracking-widest text-hqorange uppercase">
                PORTAIL REX
              </div>
              <div className="hidden md:block h-6 w-px bg-white/20"></div>
              <span className="hidden md:block text-sm text-blue-200">
                Division Production HQ
              </span>
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

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-between items-end mb-8 border-b border-gray-300 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Archives des Preuves de Concept
            </h1>
            <p className="text-gray-600 mt-2">
              Index centralisé des fiches techniques validées pour Hydro-Québec.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/templates')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded transition-colors shadow-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              Templates
            </button>
            <button
              onClick={() => router.push('/editor')}
              className="bg-hqorange hover:bg-orange-600 text-white text-sm font-bold py-2 px-4 rounded transition-colors shadow-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Nouvelle Fiche
            </button>
          </div>
        </div>

        {/* Liste des fiches */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hqblue mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : fiches.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune archive</h3>
            <p className="mt-1 text-sm text-gray-500">
              Générez votre première fiche REX via l'assistant IA.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/editor')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-hqblue hover:bg-blue-800"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Créer une fiche
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fiches.map((fiche) => (
              <div
                key={fiche.id}
                onClick={() => router.push(`/editor/${fiche.id}`)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer relative group"
              >
                {/* Badge statut */}
                <div className="absolute top-4 right-4">
                  {fiche.status === 'published' ? (
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                      Publié
                    </span>
                  ) : (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                      Brouillon
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-lg text-gray-900 mb-2 pr-20">
                  {fiche.titre}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {fiche.infrastructure || 'Sans infrastructure'}
                </p>
                
                {/* Actions */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    {new Date(fiche.created_at).toLocaleDateString('fr-CA')}
                  </span>
                  
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {fiche.status === 'published' && fiche.pdf_url ? (
                      <button
                        onClick={(e) => handleDownloadPDF(fiche.id, e)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        PDF
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handlePublishPDF(fiche.id, e)}
                        className="text-green-600 hover:text-green-800 text-xs font-semibold flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Générer PDF
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => handleDelete(fiche.id, e)}
                      className="text-red-600 hover:text-red-800 text-xs font-semibold"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
