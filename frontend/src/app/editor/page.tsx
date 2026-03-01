'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { generateApi, fichesApi } from '@/lib/api';

export default function EditorPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  
  const [showModal, setShowModal] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // État de la fiche
  const [fiche, setFiche] = useState({
    titre: 'REX XX : Titre à générer',
    infrastructure: '',
    unspsc_code: '',
    unspsc_desc: '',
    localisation: '',
    contrainte: '',
    environnement: '',
    lignerouge: '',
    technologie: '',
    ingenierie: '',
    securite: '',
    metrique1_val: '',
    metrique1_titre: '',
    metrique1_desc: '',
    metrique2_val: '',
    metrique2_titre: '',
    metrique2_desc: '',
    metrique3_val: '',
    metrique3_titre: '',
    metrique3_desc: '',
    citation: '',
    auteur: '',
  });

  const [saved, setSaved] = useState(false);

useEffect(() => {
  if (!isAuthenticated()) {
    router.push('/login');
  }
}, []);

  const handleGenerate = async () => {
    if (!userInput.trim()) {
      setError('Veuillez saisir des notes de chantier');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await generateApi.generate(userInput);
      
      // Map AI response directly — field names match the fiche schema
      setFiche((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(data.data).map(([k, v]) => [k, v ?? ''])
        ),
      }));

      setShowModal(false);
      setUserInput('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaved(false);
      await fichesApi.create({ ...fiche, status: 'draft' });
      setSaved(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      alert('Erreur lors de la sauvegarde: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-hqblue text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="font-bold text-xl tracking-widest text-hqorange uppercase">
                PORTAIL REX
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm hover:text-hqorange transition-colors"
              >
                ← Retour au Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">
            {saved ? '✅ Sauvegardé' : 'Brouillon non sauvegardé'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-2 px-4 rounded"
            >
              ✨ Générer avec l'IA
            </button>
            <button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 px-4 rounded"
            >
              💾 Sauvegarder
            </button>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* En-tête */}
          <div className="border-b-4 border-hqblue pb-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="text-2xl font-bold text-hqorange tracking-widest">
                PORTAIL REX
              </div>
              <div className="text-sm text-gray-600">
                Division Production • Hydro-Québec
              </div>
            </div>
            <input
              type="text"
              value={fiche.titre}
              onChange={(e) => setFiche({ ...fiche, titre: e.target.value })}
              className="text-2xl font-bold text-hqblue w-full border-none focus:ring-2 focus:ring-hqblue rounded px-2 py-1"
              placeholder="Titre de la fiche REX"
            />
          </div>

          {/* Métadonnées */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Infrastructure
              </label>
              <input
                type="text"
                value={fiche.infrastructure}
                onChange={(e) => setFiche({ ...fiche, infrastructure: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-hqblue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Localisation
              </label>
              <input
                type="text"
                value={fiche.localisation}
                onChange={(e) => setFiche({ ...fiche, localisation: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-hqblue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Code UNSPSC
              </label>
              <input
                type="text"
                value={fiche.unspsc_code}
                onChange={(e) => setFiche({ ...fiche, unspsc_code: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-hqblue"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Description UNSPSC
              </label>
              <input
                type="text"
                value={fiche.unspsc_desc}
                onChange={(e) => setFiche({ ...fiche, unspsc_desc: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-hqblue"
              />
            </div>
          </div>

          {/* Sections */}
          {[
            { label: 'Contrainte Principale', field: 'contrainte' },
            { label: 'Contexte Environnemental', field: 'environnement' },
            { label: 'Ligne Rouge', field: 'lignerouge' },
            { label: 'Technologies Déployées', field: 'technologie' },
            { label: 'Approche d\'Ingénierie', field: 'ingenierie' },
            { label: 'Mesures de Sécurité', field: 'securite' },
          ].map(({ label, field }) => (
            <div key={field} className="mb-6">
              <label className="block text-sm font-bold text-hqblue mb-2">
                {label}
              </label>
              <textarea
                value={fiche[field as keyof typeof fiche] as string}
                onChange={(e) => setFiche({ ...fiche, [field]: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-hqblue"
                rows={3}
              />
            </div>
          ))}

          {/* Métriques */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-hqblue mb-4">Métriques Clés</h3>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((num) => (
                <div key={num} className="border border-gray-200 rounded p-4">
                  <input
                    type="text"
                    value={fiche[`metrique${num}_val` as keyof typeof fiche] as string}
                    onChange={(e) =>
                      setFiche({ ...fiche, [`metrique${num}_val`]: e.target.value })
                    }
                    className="w-full text-xl font-bold text-hqblue mb-2 border-none focus:ring-2 focus:ring-hqblue rounded px-2"
                    placeholder="Valeur"
                  />
                  <input
                    type="text"
                    value={fiche[`metrique${num}_titre` as keyof typeof fiche] as string}
                    onChange={(e) =>
                      setFiche({ ...fiche, [`metrique${num}_titre`]: e.target.value })
                    }
                    className="w-full text-xs font-semibold mb-1 border border-gray-300 rounded px-2 py-1"
                    placeholder="Titre"
                  />
                  <textarea
                    value={fiche[`metrique${num}_desc` as keyof typeof fiche] as string}
                    onChange={(e) =>
                      setFiche({ ...fiche, [`metrique${num}_desc`]: e.target.value })
                    }
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    rows={2}
                    placeholder="Description"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Citation */}
          <div className="bg-gray-50 border-l-4 border-hqorange p-4">
            <textarea
              value={fiche.citation}
              onChange={(e) => setFiche({ ...fiche, citation: e.target.value })}
              className="w-full bg-transparent border-none text-sm italic mb-2 focus:ring-0"
              rows={2}
              placeholder="Citation inspirante..."
            />
            <input
              type="text"
              value={fiche.auteur}
              onChange={(e) => setFiche({ ...fiche, auteur: e.target.value })}
              className="w-full bg-transparent border-none text-xs text-right focus:ring-0"
              placeholder="— Auteur"
            />
          </div>
        </div>
      </main>

      {/* Modal IA */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-hqblue mb-4">
              ✨ Assistant IA - Génération de Fiche REX
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Décrivez votre projet, vos contraintes, les technologies utilisées, etc.
              L'IA générera automatiquement une fiche REX complète.
            </p>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-3 mb-4 focus:ring-2 focus:ring-hqblue"
              rows={8}
              placeholder="Exemple:&#10;Installation de nouveaux transformateurs à la centrale Manic-5.&#10;Amélioration de la capacité de 15%.&#10;Défi principal: température extrême (-40°C).&#10;Durée: 3 mois. Budget: 2M$."
            />
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setError('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="bg-hqorange hover:bg-orange-600 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
              >
                {loading ? '⏳ Génération...' : '✨ Générer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}