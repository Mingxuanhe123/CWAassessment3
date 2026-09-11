"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
interface Word {
  id: string;
  word: string;
  phonemes: string; // JSON string
  wordLength: number;
}
interface WordList {
  id: string;
  name: string;
  description: string | null;
  words: Word[];
}
export default function EditWordListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [wordList, setWordList] = useState<WordList | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Edit form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // Add word state
  const [newWord, setNewWord] = useState("");
  const [newPhonemes, setNewPhonemes] = useState("");
  const [adding, setAdding] = useState(false);

  // ========== New: Edit modal state for single word ==========
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [editWordText, setEditWordText] = useState("");
  const [editPhonemeText, setEditPhonemeText] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchWordList = async () => {
    try {
      const res = await fetch(`/api/word-lists/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setWordList(data);
      setName(data.name);
      setDescription(data.description || "");
    } catch (err) {
      alert(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchWordList(); }, [id]);
  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/word-lists/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || "Failed to update");
      }
      fetchWordList();
    } catch (err) {
      alert(err);
    } finally {
      setSaving(false);
    }
  };
  const handleAddWord = async () => {
    if (!newWord.trim() || !newPhonemes.trim()) return;
    setAdding(true);
    try {
      // Parse phonemes: comma or space separated
      const phonemes = newPhonemes.split(/[, ]+/).map((p) => p.trim()).filter(Boolean);
      const res = await fetch(`/api/word-lists/${id}/words`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: newWord.trim(), phonemes }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || "Failed to add word");
      }
      setNewWord("");
      setNewPhonemes("");
      fetchWordList();
    } catch (err) {
      alert(err);
    } finally {
      setAdding(false);
    }
  };
  const handleDeleteWord = async (wordId: string, word: string) => {
    if (!confirm(`Delete "${word}"?`)) return;
    try {
      const res = await fetch(`/api/word-lists/${id}/words?wordId=${wordId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchWordList();
    } catch (err) {
      alert(err);
    }
  };

  // ========== New: Update word function (call PUT API) ==========
  const handleUpdateWord = async () => {
    if (!editingWord || !editWordText.trim() || !editPhonemeText.trim()) return;
    setUpdating(true);
    try {
      const phonemes = editPhonemeText.split(/[, ]+/).map((p) => p.trim()).filter(Boolean);
      const res = await fetch(`/api/word-lists/${id}/words?wordId=${editingWord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: editWordText.trim(),
          phonemes
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || "Failed to update word");
      }
      setEditingWord(null); // Close modal
      fetchWordList(); // Refresh word list
    } catch (err) {
      alert(err);
    } finally {
      setUpdating(false);
    }
  };

  // Open edit modal and fill existing word data
  const openEditModal = (w: Word) => {
    setEditingWord(w);
    setEditWordText(w.word);
    setEditPhonemeText(JSON.parse(w.phonemes).join(", "));
  };

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-12"><p>Loading...</p></div>;
  if (!wordList) return <div className="max-w-4xl mx-auto px-4 py-12"><p>Word list not found.</p></div>;
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/word-lists" className="text-blue-600 hover:underline">&larr; Back</Link>
        <h2 className="text-3xl font-bold">Edit Word List</h2>
      </div>
      {/* Word List Info */}
      <div className="bg-white p-6 rounded-lg shadow border mb-6">
        <h3 className="text-lg font-semibold mb-4">Word List Info</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </div>
          <button onClick={handleSaveInfo} disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
      {/* Add Word */}
      <div className="bg-white p-6 rounded-lg shadow border mb-6">
        <h3 className="text-lg font-semibold mb-4">Add Word</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Word</label>
            <input type="text" value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="e.g. bed" className="w-full border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phonemes (comma/space separated)</label>
            <input type="text" value={newPhonemes} onChange={(e) => setNewPhonemes(e.target.value)} placeholder="e.g. b, e, d" className="w-full border rounded-md px-3 py-2" />
          </div>
          <div className="flex items-end">
            <button onClick={handleAddWord} disabled={adding || !newWord.trim() || !newPhonemes.trim()} className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {adding ? "Adding..." : "Add Word"}
            </button>
          </div>
        </div>
      </div>
      {/* Words Table */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-4">Words ({wordList.words.length})</h3>
        {wordList.words.length === 0 ? (
          <p className="text-gray-500">No words yet. Add some above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Word</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Phonemes</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Length</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {wordList.words.map((w) => (
                  <tr key={w.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{w.word}</td>
                    <td className="py-2 px-3 text-gray-600">{JSON.parse(w.phonemes).join(" ")}</td>
                    <td className="py-2 px-3 text-gray-500">{w.wordLength}</td>
                    <td className="py-2 px-3 text-right">
                      {/* Edit button */}
                      <button onClick={() => openEditModal(w)} className="text-blue-600 hover:text-blue-800 text-sm mr-3">Edit</button>
                      <button onClick={() => handleDeleteWord(w.id, w.word)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========== New: Edit Modal ========== */}
      {editingWord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Edit Word</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Word</label>
                <input
                  type="text"
                  value={editWordText}
                  onChange={(e) => setEditWordText(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phonemes (comma/space separated)</label>
                <input
                  type="text"
                  value={editPhonemeText}
                  onChange={(e) => setEditPhonemeText(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setEditingWord(null)} className="px-4 py-2 border rounded-md hover:bg-gray-100">Cancel</button>
                <button onClick={handleUpdateWord} disabled={updating} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {updating ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
