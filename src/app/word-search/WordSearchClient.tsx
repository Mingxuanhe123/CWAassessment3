"use client";

import { reportGeneration } from "@/lib/telemetry";

import { useState, useEffect } from "react";
import { phonemeHints, allPhonemes } from "@/data/phonemeCorpus";

type Direction = "horizontal" | "vertical" | "diagonal";

interface PlacedWord {
  word: string;
  phonemes: string[];
  english: string;
  positions: { row: number; col: number }[];
  direction: Direction;
}

interface BackendWord {
  id: string;
  word: string;
  phonemes: string;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateGrid(words: { word: string; phonemes: string[] }[], gridSize: number): { grid: string[][]; placed: PlacedWord[] } {
  const grid: string[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(""));
  const placed: PlacedWord[] = [];
  const directions: Direction[] = ["horizontal", "vertical", "diagonal"];
  const sorted = [...words].sort((a, b) => b.phonemes.length - a.phonemes.length);

  for (const pw of sorted) {
    let attempts = 0;
    let success = false;
    while (attempts < 100 && !success) {
      attempts++;
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const dr = dir === "vertical" ? 1 : dir === "diagonal" ? 1 : 0;
      const dc = dir === "horizontal" ? 1 : dir === "diagonal" ? 1 : 0;
      const maxRow = gridSize - dr * (pw.phonemes.length - 1);
      const maxCol = gridSize - dc * (pw.phonemes.length - 1);
      if (maxRow <= 0 || maxCol <= 0) continue;
      const startRow = Math.floor(Math.random() * maxRow);
      const startCol = Math.floor(Math.random() * maxCol);
      const positions: { row: number; col: number }[] = [];
      let canPlace = true;
      for (let i = 0; i < pw.phonemes.length; i++) {
        const r = startRow + dr * i;
        const c = startCol + dc * i;
        if (grid[r][c] !== "" && grid[r][c] !== pw.phonemes[i]) { canPlace = false; break; }
        positions.push({ row: r, col: c });
      }
      if (canPlace) {
        positions.forEach((pos, i) => { grid[pos.row][pos.col] = pw.phonemes[i]; });
        placed.push({ word: pw.word, phonemes: pw.phonemes, english: pw.word, positions, direction: dir });
        success = true;
      }
    }
  }

  const fillerPhonemes = shuffleArray(allPhonemes);
  let fi = 0;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] === "") { grid[r][c] = fillerPhonemes[fi % fillerPhonemes.length]; fi++; }
    }
  }
  return { grid, placed };
}

export default function WordSearchClient() {
  const [wordLength, setWordLength] = useState<3 | 4 | 5>(3);
  const [selectedWords, setSelectedWords] = useState<{ word: string; phonemes: string[] }[]>([]);
  const [gridData, setGridData] = useState<{ grid: string[][]; placed: PlacedWord[] } | null>(null);
  const [foundWords, setFoundWords] = useState<Set<number>>(new Set());
  const [selecting, setSelecting] = useState<{ row: number; col: number }[]>([]);
  const [selectionStart, setSelectionStart] = useState<{ row: number; col: number } | null>(null);
  const [gridSize, setGridSize] = useState(10);

  // Backend words
  const [backendWords, setBackendWords] = useState<BackendWord[]>([]);
  const [useBackend, setUseBackend] = useState(false);

  useEffect(() => {
    const fetchWords = async () => {
      try {
        const res = await fetch("/api/word-lists");
        if (!res.ok) return;
        const lists = await res.json();
        for (const list of lists) {
          const detailRes = await fetch(`/api/word-lists/${list.id}`);
          if (!detailRes.ok) continue;
          const detail = await detailRes.json();
          const matching = detail.words?.filter((w: BackendWord & { wordLength: number }) => {
            const phonemes = JSON.parse(w.phonemes);
            return phonemes.length === wordLength;
          });
          if (matching && matching.length > 0) {
            setBackendWords(matching);
            setUseBackend(true);
            return;
          }
        }
        setUseBackend(false);
      } catch {
        setUseBackend(false);
      }
    };
    fetchWords();
  }, [wordLength]);

  const pickRandomWords = () => {
    let pool: { word: string; phonemes: string[] }[];
    if (useBackend && backendWords.length > 0) {
      pool = backendWords.map((w) => ({ word: w.word, phonemes: JSON.parse(w.phonemes) }));
    } else {
      const { words3, words4, words5 } = require("@/data/phonemeCorpus");
      pool = wordLength === 3 ? words3 : wordLength === 4 ? words4 : words5;
    }
    const shuffled = shuffleArray(pool);
    setSelectedWords(shuffled.slice(0, 5));
  };

  const buildGrid = () => {
    const genStart = performance.now();
    if (!selectedWords.length) {
      reportGeneration("word-search", false, { failureReason: "Word list is empty" });
      return;
    }
    try {
      const size = Math.max(wordLength + 3, gridSize);
      const data = generateGrid(selectedWords, size);
      setGridData(data);
      setFoundWords(new Set());
      reportGeneration("word-search", true, {
        durationMs: Math.round(performance.now() - genStart),
      });
    } catch (e) {
      reportGeneration("word-search", false, {
        failureReason: e instanceof Error ? e.message : "Grid generation failed",
        durationMs: Math.round(performance.now() - genStart),
      });
    }
  };

  const handleCellMouseDown = (row: number, col: number) => {
    setSelectionStart({ row, col });
    setSelecting([{ row, col }]);
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (!selectionStart) return;
    const dr = Math.sign(row - selectionStart.row);
    const dc = Math.sign(col - selectionStart.col);
    const dist = Math.max(Math.abs(row - selectionStart.row), Math.abs(col - selectionStart.col));
    const cells: { row: number; col: number }[] = [];
    for (let i = 0; i <= dist; i++) {
      cells.push({ row: selectionStart.row + dr * i, col: selectionStart.col + dc * i });
    }
    setSelecting(cells);
  };

  const handleCellMouseUp = () => {
    if (!gridData || !selecting.length) return;
    gridData.placed.forEach((pw, idx) => {
      if (foundWords.has(idx)) return;
      if (pw.positions.length !== selecting.length) return;
      const match = selecting.every((s, i) => s.row === pw.positions[i].row && s.col === pw.positions[i].col);
      const reverseMatch = selecting.every((s, i) => {
        const rev = pw.positions[pw.positions.length - 1 - i];
        return s.row === rev.row && s.col === rev.col;
      });
      if (match || reverseMatch) {
        setFoundWords(new Set([...foundWords, idx]));
      }
    });
    setSelectionStart(null);
    setSelecting([]);
  };

  const isCellFound = (row: number, col: number): boolean => {
    if (!gridData) return false;
    return Array.from(foundWords).some((idx) => gridData.placed[idx].positions.some((p) => p.row === row && p.col === col));
  };

  const isCellSelecting = (row: number, col: number): boolean => selecting.some((s) => s.row === row && s.col === col);

  const generateHTML = () => {
    if (!gridData) return;
    const wordsJSON = JSON.stringify(gridData.placed.map((p) => ({ phonemes: p.phonemes, english: p.word, positions: p.positions })));
    const gridJSON = JSON.stringify(gridData.grid);
    const hintsJSON = JSON.stringify(phonemeHints);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Phoneme Word Search</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;align-items:center;min-height:100vh;background:#f0f4f8;padding:20px}
h1{font-size:1.5rem;margin-bottom:8px;color:#166534}
.subtitle{color:#6b7280;margin-bottom:20px}
.container{display:flex;gap:30px;flex-wrap:wrap;justify-content:center}
.grid{display:inline-grid;gap:2px;background:#d1d5db;padding:2px;border-radius:6px}
.cell{width:48px;height:48px;background:white;display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:600;cursor:pointer;user-select:none;transition:all 0.15s;border-radius:4px;position:relative}
.cell:hover{background:#dbeafe}
.cell.selecting{background:#93c5fd}
.cell.found{background:#86efac}
.cell .tooltip{display:none;position:absolute;bottom:120%;left:50%;transform:translateX(-50%);background:#1f2937;color:white;padding:4px 8px;border-radius:4px;font-size:0.7rem;white-space:nowrap;z-index:10}
.cell:hover .tooltip{display:block}
.wordlist{background:white;padding:16px;border-radius:8px;border:1px solid #e5e7eb;min-width:180px}
.wordlist h3{font-size:1rem;margin-bottom:10px;color:#374151}
.word-item{padding:6px 0;font-size:0.95rem;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;gap:8px}
.word-item.found{color:#16a34a;text-decoration:line-through}
.word-item .phonemes{font-weight:600}
.word-item .english{color:#6b7280;font-size:0.85rem}
#message{text-align:center;font-size:1.2rem;font-weight:600;min-height:28px;margin-top:15px;color:#166534}
.new-game{margin-top:15px;padding:10px 24px;background:#16a34a;color:white;border:none;border-radius:8px;font-size:1rem;cursor:pointer}
.new-game:hover{background:#15803d}
.footer{margin-top:auto;padding:16px;background:#1f2937;color:#9ca3af;text-align:center;width:100%;font-size:0.85rem}
</style>
</head>
<body>
<h1>Phoneme Word Search</h1>
<p class="subtitle">Find all ${gridData.placed.length} phoneme words in the grid</p>
<div class="container">
<div class="grid" id="grid"></div>
<div class="wordlist"><h3>Words to Find</h3><div id="wordlist"></div></div>
</div>
<div id="message"></div>
<button class="new-game" onclick="location.reload()">New Puzzle</button>
<div style="display:flex;gap:10px;margin:10px 0">
  <button onclick="confirmSelection()" style="padding:8px 20px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer" aria-label="Confirm selection">✓ Confirm</button>
  <button onclick="clearSelection()" style="padding:8px 20px;background:#e5e7eb;color:#374151;border:none;border-radius:6px;cursor:pointer" aria-label="Clear selection">✕ Clear</button>
</div>
<script>
const GRID=${gridJSON};
const WORDS=${wordsJSON};
const HINTS=${hintsJSON};
const N=GRID.length;
const found=new Set();
let selected=[];
const cells=[];

function initGrid(){
  const g=document.getElementById('grid');
  g.style.gridTemplateColumns='repeat('+N+',48px)';
  g.innerHTML='';
  for(let r=0;r<N;r++){
    cells[r]=[];
    for(let c=0;c<N;c++){
      const cell=document.createElement('button');
      cell.className='cell';
      cell.textContent=GRID[r][c];
      cell.setAttribute('aria-label','Row '+(r+1)+' Column '+(c+1)+': '+GRID[r][c]);
      const tip=document.createElement('span');tip.className='tooltip';tip.textContent=HINTS[GRID[r][c]]||'';cell.appendChild(tip);
      (function(row,col){cell.addEventListener('click',function(){toggleCell(row,col)})})(r,c);
      cells[r][c]=cell;g.appendChild(cell);
    }
  }
  updateWordList();
}

function toggleCell(row,col){
  const idx=selected.findIndex(s=>s.row===row&&s.col===col);
  if(idx>=0)selected.splice(idx,1);else selected.push({row,col});
  updateCellStyles();updateMessage();
}

function updateCellStyles(){
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    const cell=cells[r][c];
    const isFound=WORDS.some((w,i)=>found.has(i)&&w.positions.some(p=>p.row===r&&p.col===c));
    const isSel=selected.some(s=>s.row===r&&s.col===c);
    cell.classList.remove('found','selecting');
    if(isFound)cell.classList.add('found');else if(isSel)cell.classList.add('selecting');
  }
}

function updateMessage(){
  if(selected.length===0)document.getElementById('message').textContent='Click cells to select a word';
  else{const phonemes=selected.map(s=>GRID[s.row][s.col]);document.getElementById('message').textContent='Selected: '+phonemes.join(' ')+' ('+selected.length+' cells)'}
}

function updateWordList(){
  const wl=document.getElementById('wordlist');wl.innerHTML='';
  WORDS.forEach((w,i)=>{
    const d=document.createElement('div');d.className='word-item'+(found.has(i)?' found':'');
    d.innerHTML='<span class="phonemes">'+w.phonemes.join(' ')+'</span><span class="english">('+w.english+')</span>';
    wl.appendChild(d);
  });
  if(found.size===WORDS.length)document.getElementById('message').textContent='🎉 Congratulations! You found all words!';
}

function confirmSelection(){
  if(selected.length===0)return;
  const selectedPhonemes=selected.map(s=>GRID[s.row][s.col]);
  let matchedAny=false;
  WORDS.forEach((w,i)=>{
    if(found.has(i))return;
    const len=w.positions.length;
    if(selected.length<len)return;
    for(let start=0;start<=selected.length-len;start++){
      let forwardMatch=true,reverseMatch=true;
      for(let j=0;j<len;j++){
        const sel=selected[start+j];const wp=w.positions[j];const wpRev=w.positions[len-1-j];
        if(sel.row!==wp.row||sel.col!==wp.col)forwardMatch=false;
        if(sel.row!==wpRev.row||sel.col!==wpRev.col)reverseMatch=false;
      }
      if(forwardMatch||reverseMatch){found.add(i);matchedAny=true;document.getElementById('message').textContent='✅ Found: '+w.english+'!';break}
    }
  });
  if(!matchedAny)document.getElementById('message').textContent='❌ No match. You selected: '+selectedPhonemes.join(' ');
  selected=[];updateCellStyles();updateWordList();
}

function clearSelection(){selected=[];updateCellStyles();updateMessage()}
initGrid();
</script>
<div class="footer">Mingxuan He | Student ID: 19884912 | Phoneme Activity Builder — Assessment 3</div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "word-search-phonemes.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const allFound = gridData && foundWords.size === gridData.placed.length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">Phoneme Word Search Builder</h2>

      <div className="bg-white p-6 rounded-lg shadow border mb-6">
        <h3 className="text-lg font-semibold mb-4">Configure Activity</h3>
        <div className="flex flex-wrap gap-4 items-end mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Word Length</label>
            <select value={wordLength} onChange={(e) => { setWordLength(parseInt(e.target.value) as 3 | 4 | 5); setSelectedWords([]); setGridData(null); }} className="border rounded-md px-3 py-2">
              <option value={3}>3 phonemes</option>
              <option value={4}>4 phonemes</option>
              <option value={5}>5 phonemes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grid Size</label>
            <select value={gridSize} onChange={(e) => setGridSize(parseInt(e.target.value))} className="border rounded-md px-3 py-2">
              {[8, 10, 12, 14].map((n) => <option key={n} value={n}>{n}x{n}</option>)}
            </select>
          </div>
          <button onClick={pickRandomWords} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Pick 5 Random Words
          </button>
          <button onClick={buildGrid} disabled={selectedWords.length === 0} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
            Generate Grid
          </button>
        </div>
        {useBackend && <p className="text-sm text-green-600 mb-2">✓ Using words from database</p>}

        {selectedWords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedWords.map((w, i) => (
              <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {w.phonemes.join(" ")} ({w.word})
              </span>
            ))}
          </div>
        )}
      </div>

      {gridData && (
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div
            className="inline-grid gap-0.5 bg-gray-300 p-0.5 rounded-md select-none"
            style={{ gridTemplateColumns: `repeat(${gridData.grid.length}, 3.5rem)` }}
            onMouseLeave={() => { setSelectionStart(null); setSelecting([]); }}
          >
            {gridData.grid.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Row ${r + 1} Column ${c + 1}: ${cell}`}
                  onMouseDown={() => handleCellMouseDown(r, c)}
                  onMouseEnter={() => handleCellMouseEnter(r, c)}
                  onMouseUp={handleCellMouseUp}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleCellMouseDown(r, c); }}
                  className={`w-14 h-14 flex items-center justify-center text-base font-bold cursor-pointer transition-colors rounded-sm relative group ${
                    isCellFound(r, c) ? "bg-green-300" : isCellSelecting(r, c) ? "bg-blue-300" : "bg-white hover:bg-blue-50"
                  }`}
                >
                  {cell}
                  {phonemeHints[cell] && (
                    <span className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {phonemeHints[cell]}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="bg-white p-4 rounded-lg shadow border min-w-[200px]">
            <h3 className="font-semibold mb-3">Words to Find</h3>
            {gridData.placed.map((pw, idx) => (
              <div key={idx} className={`py-1.5 border-b border-gray-100 text-sm ${foundWords.has(idx) ? "text-green-600 line-through" : ""}`}>
                <span className="font-medium">{pw.phonemes.join(" ")}</span>
                <span className="text-gray-500 ml-2">({pw.word})</span>
              </div>
            ))}
            {allFound && <p className="text-green-600 font-bold mt-3">🎉 All found!</p>}
          </div>
        </div>
      )}

      {gridData && (
        <div className="text-center">
          <button onClick={generateHTML} className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium text-lg">
            ⬇ Generate & Download HTML
          </button>
          <p className="text-sm text-gray-500 mt-2">Downloads a standalone playable .html file</p>
        </div>
      )}
    </div>
  );
}
