"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface WordListSummary {
  id: string;
  name: string;
}

interface Activity {
  id: string;
  name: string;
  activityType: string;
  wordLength: number;
  maxGuesses: number;
  showHints: boolean;
  gridSize: number;
  wordCount: number;
  wordList: WordListSummary;
  createdAt: string;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [wordLists, setWordLists] = useState<WordListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"wordle" | "word-search">("wordle");
  const [formWordLength, setFormWordLength] = useState(3);
  const [formMaxGuesses, setFormMaxGuesses] = useState(6);
  const [formShowHints, setFormShowHints] = useState(true);
  const [formGridSize, setFormGridSize] = useState(10);
  const [formWordCount, setFormWordCount] = useState(5);
  const [formWordListId, setFormWordListId] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      const [actRes, wlRes] = await Promise.all([
        fetch("/api/activities"),
        fetch("/api/word-lists"),
      ]);
      if (actRes.ok) setActivities(await actRes.json());
      if (wlRes.ok) {
        const wlData = await wlRes.json();
        setWordLists(wlData.map((w: { id: string; name: string }) => ({ id: w.id, name: w.name })));
        if (wlData.length > 0 && !formWordListId) setFormWordListId(wlData[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!formName.trim() || !formWordListId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          activityType: formType,
          wordLength: formWordLength,
          maxGuesses: formMaxGuesses,
          showHints: formShowHints,
          gridSize: formGridSize,
          wordCount: formWordCount,
          wordListId: formWordListId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || "Failed to create");
      }
      setFormName("");
      setShowCreate(false);
      fetchData();
    } catch (err) {
      alert(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete activity "${name}"?`)) return;
    try {
      const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchData();
    } catch (err) {
      alert(err);
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-12"><p>Loading...</p></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold">Activities</h2>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          {showCreate ? "Cancel" : "+ New Activity"}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white p-6 rounded-lg shadow border mb-6">
          <h3 className="text-lg font-semibold mb-4">Create Activity</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. My Wordle" className="w-full border rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Word List *</label>
              <select value={formWordListId} onChange={(e) => setFormWordListId(e.target.value)} className="w-full border rounded-md px-3 py-2">
                {wordLists.map((wl) => <option key={wl.id} value={wl.id}>{wl.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
              <select value={formType} onChange={(e) => setFormType(e.target.value as "wordle" | "word-search")} className="w-full border rounded-md px-3 py-2">
                <option value="wordle">Wordle</option>
                <option value="word-search">Word Search</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Word Length</label>
              <select value={formWordLength} onChange={(e) => setFormWordLength(parseInt(e.target.value))} className="w-full border rounded-md px-3 py-2">
                <option value={3}>3 phonemes</option>
                <option value={4}>4 phonemes</option>
                <option value={5}>5 phonemes</option>
              </select>
            </div>
            {formType === "wordle" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Guesses</label>
                  <select value={formMaxGuesses} onChange={(e) => setFormMaxGuesses(parseInt(e.target.value))} className="w-full border rounded-md px-3 py-2">
                    {[3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" checked={formShowHints} onChange={(e) => setFormShowHints(e.target.checked)} className="w-4 h-4" />
                  <label className="text-sm font-medium text-gray-700">Show Hints</label>
                </div>
              </>
            )}
            {formType === "word-search" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grid Size</label>
                  <select value={formGridSize} onChange={(e) => setFormGridSize(parseInt(e.target.value))} className="w-full border rounded-md px-3 py-2">
                    {[8, 10, 12, 14].map((n) => <option key={n} value={n}>{n}x{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Word Count</label>
                  <select value={formWordCount} onChange={(e) => setFormWordCount(parseInt(e.target.value))} className="w-full border rounded-md px-3 py-2">
                    {[3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>
          <button onClick={handleCreate} disabled={creating || !formName.trim() || !formWordListId} className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {creating ? "Creating..." : "Create Activity"}
          </button>
        </div>
      )}

      {activities.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No activities yet.</p>
          <p className="mt-2">Click &quot;+ New Activity&quot; to create one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((act) => (
            <div key={act.id} className="bg-white p-6 rounded-lg shadow border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{act.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    act.activityType === "wordle" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                  }`}>
                    {act.activityType}
                  </span>
                </div>
                <div className="flex gap-4 mt-2 text-sm text-gray-400">
                  <span>{act.wordLength} phonemes</span>
                  <span>List: {act.wordList.name}</span>
                  {act.activityType === "wordle" && <span>{act.maxGuesses} guesses</span>}
                  {act.activityType === "word-search" && <span>{act.gridSize}x{act.gridSize} grid, {act.wordCount} words</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={act.activityType === "wordle" ? `/wordle?activityId=${act.id}` : `/word-search?activityId=${act.id}`}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
                >
                  Open
                </Link>
                <button onClick={() => handleDelete(act.id, act.name)} className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium">
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
