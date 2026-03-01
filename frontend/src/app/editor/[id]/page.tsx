'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { fichesApi, Fiche } from '@/lib/api';

// ✅ CORRIGER : FicheData doit avoir les mêmes propriétés que Fiche
interface FicheData extends Fiche {
  // Si Fiche n'a pas ces propriétés, les ajouter ici avec des valeurs par défaut
  metrique1_val?: string;
  metrique1_titre?: string;
  metrique1_desc?: string;
  metrique2_val?: string;
  metrique2_titre?: string;
  metrique2_desc?: string;
  metrique3_val?: string;
  metrique3_titre?: string;
  metrique3_desc?: string;
}

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [fiche, setFiche] = useState<FicheData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ficheId, setFicheId] = useState<string | null>(null);

  useEffect(() => {
    // Unwrap la Promise params avec use()
    const unwrapParams = async () => {
      const resolvedParams = await Promise.resolve(params);
      setFicheId(resolvedParams.id);
    };
    unwrapParams();
  }, [params]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (ficheId) {
      loadFiche();
    }
  }, [ficheId]);

  useEffect(() => {
    // Déclencher l'impression si ?print=true
    if (searchParams.get('print') === 'true' && fiche) {
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [fiche, searchParams]);

  const loadFiche = async () => {
    try {
      if (!ficheId) return;
      const { data } = await fichesApi.get(ficheId);
      // ✅ CORRIGER : S'assurer que toutes les propriétés existent
      const ficheData: FicheData = {
        ...data,
        metrique1_val: data.metrique1_val || '',
        metrique1_titre: data.metrique1_titre || '',
        metrique1_desc: data.metrique1_desc || '',
        metrique2_val: data.metrique2_val || '',
        metrique2_titre: data.metrique2_titre || '',
        metrique2_desc: data.metrique2_desc || '',
        metrique3_val: data.metrique3_val || '',
        metrique3_titre: data.metrique3_titre || '',
        metrique3_desc: data.metrique3_desc || '',
      };
      setFiche(ficheData);
    } catch (error) {
      console.error('Erreur chargement fiche:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hqblue mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la fiche...</p>
        </div>
      </div>
    );
  }

  if (!fiche) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Fiche non trouvée</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 bg-hqblue text-white px-4 py-2 rounded hover:bg-blue-800"
          >
            Retour au Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Barre d'outils (Invisible à l'impression) */}
      <div className="no-print bg-gray-900 text-white p-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="font-bold text-lg text-hqorange">Visualiseur de Fiche REX</h2>
            <p className="text-xs text-gray-300 mt-1">Gabarit optimisé pour 2 pages A4.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors flex items-center gap-2 shadow-md"
            >
              ← Retour
            </button>
            <button
              onClick={() => window.print()}
              className="bg-hqorange hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition-colors flex items-center gap-2 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
              </svg>
              Imprimer / PDF
            </button>
          </div>
        </div>
      </div>

      {/* Pages A4 */}
      <div className="flex flex-col print:flex-col">
        {/* PAGE 1 */}
        <div className="page bg-white max-w-[21cm] min-h-[29.7cm] mx-auto my-8 print:my-0 shadow-lg print:shadow-none border-t-8 border-hqblue p-10 print:p-10 flex flex-col">
          
          {/* En-tête */}
          <header className="flex justify-between items-start mb-10 border-b border-gray-200 pb-6">
            <div>
              <p className="text-hqorange font-bold tracking-widest uppercase text-sm mb-1">
                Dossier de Qualification Technique
              </p>
              <h1 className="text-3xl font-extrabold text-hqblue leading-tight max-w-2xl">
                {fiche.titre || 'Sans titre'}
              </h1>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-300 tracking-widest uppercase mb-2">[LOGO]</div>
              <span className="inline-block bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                POC Validé
              </span>
            </div>
          </header>

          {/* Accroche */}
          <div className="mb-10 text-base text-gray-600 leading-relaxed font-medium border-l-4 border-hqblue pl-4">
            {fiche.infrastructure || 'Infrastructure non spécifiée'}
          </div>

          {/* Section 1: Qualification */}
          <section className="mb-10">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
              1. En-tête de Qualification
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {/* Infrastructure */}
              <div className="bg-gray-50 p-4 rounded border border-gray-100">
                <p className="text-xs text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <svg className="w-4 h-4 text-hqblue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                  Infrastructure
                </p>
                <p className="font-bold text-gray-900 text-sm">{fiche.infrastructure || 'N/A'}</p>
              </div>

              {/* Code UNSPSC */}
              <div className="bg-gray-50 p-4 rounded border border-gray-100">
                <p className="text-xs text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <svg className="w-4 h-4 text-hqorange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                  </svg>
                  Code UNSPSC
                </p>
                <p className="font-bold text-hqblue text-sm">{fiche.unspsc_code || 'N/A'}</p>
                <p className="text-xs text-gray-500 mt-1">{fiche.unspsc_desc || ''}</p>
              </div>

              {/* Localisation */}
              <div className="bg-gray-50 p-4 rounded border border-gray-100">
                <p className="text-xs text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Localisation & Climat
                </p>
                <p className="font-bold text-gray-900 text-sm">{fiche.localisation || 'N/A'}</p>
              </div>
            </div>
          </section>

          {/* Section 2: Défis Techniques */}
          <section className="flex-grow">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
              2. Anatomie du Défi Technique
            </h2>
            
            <div className="space-y-4">
              {/* Contrainte */}
              <div className="flex gap-4 items-start">
                <div className="mt-1 bg-red-100 text-red-600 p-2 rounded-full flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm uppercase">La Contrainte Primordiale</h3>
                  <p className="text-sm text-gray-700 mt-1">{fiche.contrainte || 'N/A'}</p>
                </div>
              </div>

              {/* Environnement */}
              <div className="flex gap-4 items-start">
                <div className="mt-1 bg-blue-100 text-blue-600 p-2 rounded-full flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm uppercase">L'Environnement Hostile</h3>
                  <p className="text-sm text-gray-700 mt-1">{fiche.environnement || 'N/A'}</p>
                </div>
              </div>

              {/* Ligne Rouge */}
              <div className="flex gap-4 items-start border-l-2 border-hqorange pl-4 ml-3 mt-6">
                <div>
                  <h3 className="font-bold text-hqorange text-sm uppercase">La Ligne Rouge Opérationnelle</h3>
                  <p className="text-sm text-gray-800 font-medium mt-1">{fiche.lignerouge || 'N/A'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Page 1 */}
          <div className="mt-10 border-t border-gray-200 pt-4 flex justify-between text-xs text-gray-400">
            <span>Dossier Confidentiel - Ingénierie & REX</span>
            <span>Page 1 / 2</span>
          </div>
        </div>

        {/* PAGE 2 */}
        <div className="page bg-white max-w-[21cm] min-h-[29.7cm] mx-auto my-8 print:my-0 shadow-lg print:shadow-none border-t-8 border-corporate p-10 print:p-10 flex flex-col">
          
          {/* Section 3: Déploiement */}
          <section className="mb-10">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
              3. Le Déploiement de la Solution
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Technologie */}
              <div className="border border-gray-200 p-5 rounded-lg shadow-sm bg-white">
                <h3 className="font-bold text-hqblue text-sm mb-2 border-b pb-2">Technologie Déployée</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {fiche.technologie || 'N/A'}
                </p>
              </div>
              
              {/* Ingénierie & Sécurité */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-hqorange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                    </svg>
                    Ingénierie Inverse et Intégration
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{fiche.ingenierie || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                    Doctrine de Sécurité (LOTO)
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{fiche.securite || 'N/A'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Métriques */}
          <section className="mb-10 bg-corporate text-white p-8 rounded-xl shadow-inner">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
              4. Les Métriques de la Preuve Absolue
            </h2>
            
            <div className="grid grid-cols-3 gap-8">
              {/* Métrique 1 */}
              <div>
                <div className="text-hqorange font-bold text-4xl mb-2">{fiche.metrique1_val || '0'}</div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-2">
                  {fiche.metrique1_titre || 'Métrique 1'}
                </h3>
                <p className="text-xs text-slate-400">{fiche.metrique1_desc || ''}</p>
              </div>

              {/* Métrique 2 */}
              <div>
                <div className="text-hqorange font-bold text-4xl mb-2">{fiche.metrique2_val || '0'}</div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-2">
                  {fiche.metrique2_titre || 'Métrique 2'}
                </h3>
                <p className="text-xs text-slate-400">{fiche.metrique2_desc || ''}</p>
              </div>

              {/* Métrique 3 */}
              <div>
                <div className="text-hqorange font-bold text-4xl mb-2">{fiche.metrique3_val || '0'}</div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-2">
                  {fiche.metrique3_titre || 'Métrique 3'}
                </h3>
                <p className="text-xs text-slate-400">{fiche.metrique3_desc || ''}</p>
              </div>
            </div>
          </section>

          {/* Citation */}
          <section className="mb-auto">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
              Validation Client
            </h2>
            
            <blockquote className="border-l-4 border-hqblue bg-blue-50/50 p-6 rounded-r-lg">
              <p className="text-sm text-gray-800 font-medium italic mb-3 leading-relaxed">
                "{fiche.citation || 'Citation non disponible'}"
              </p>
              <footer className="text-xs font-bold text-hqblue">
                — {fiche.auteur || 'Auteur non spécifié'}
              </footer>
            </blockquote>
          </section>

          {/* Footer Page 2 */}
          <div className="mt-10 border-t border-gray-200 pt-4 flex justify-between text-xs text-gray-400">
            <span>Dossier Confidentiel - Ingénierie & REX</span>
            <span>Page 2 / 2</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .page {
            margin: 0;
            box-shadow: none;
            page-break-after: always;
            min-height: 29.7cm;
          }
          .page:last-child {
            page-break-after: avoid;
          }
        }
      `}</style>
    </div>
  );
}