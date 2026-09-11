"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface WordList {
  id: string;
  name: string;
  description: string | null;
  _count: { words: number; activities: number };
}

export default function WordListsPage() {
  const [wordLists, setWordLists] = useState<WordList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchWordLists = async () => {
    try {
      const res = await fetch("/api/word-lists");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setWordLists(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWordLists(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/word-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || "Failed to create");
      }
      setNewName("");
      setNewDesc("");
      setShowCreate(false);
      fetchWordLists();
    } catch (err) {
      alert(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all its words and activities?`)) return;
    try {
      const res = await fetch(`/api/word-lists/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchWordLists();
    } catch (err) {
      alert(err);
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-12"><p>Loading...</p></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold">Word Lists</h2>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          {showCreate ? "Cancel" : "+ New Word List"}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white p-6 rounded-lg shadow border mb-6">
          <h3 className="text-lg font-semibold mb-4">Create Word List</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. 3-Phoneme Words" className="w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Optional description" className="w-full border rounded-md px-3 py-2" />
            </div>
            <button onClick={handleCreate} disabled={creating || !newName.trim()} className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-red-600 mb-4">Error: {error}</p>}

      {wordLists.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No word lists yet.</p>
          <p className="mt-2">Click &quot;+ New Word List&quot; to create one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {wordLists.map((wl) => (
            <div key={wl.id} className="bg-white p-6 rounded-lg shadow border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{wl.name}</h3>
                {wl.description && <p className="text-gray-500 text-sm mt-1">{wl.description}</p>}
                <div className="flex gap-4 mt-2 text-sm text-gray-400">
                  <span>{wl._count.words} words</span>
                  <span>{wl._count.activities} activities</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/word-lists/${wl.id}/edit`} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium">
                  Edit
                </Link>
                <button onClick={() => handleDelete(wl.id, wl.name)} className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
