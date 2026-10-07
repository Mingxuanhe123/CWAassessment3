"use client";

import { reportGeneration } from "@/lib/telemetry";

import { useState, useEffect, useCallback } from "react";
import { phonemeHints, allPhonemes } from "@/data/phonemeCorpus";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

type GuessResult = "correct" | "present" | "absent";

interface LetterState {
  phoneme: string;
  result: GuessResult;
}

interface BackendWord {
  word: string;
  phonemes: string; // JSON string
}

export default function WordleClient() {
  const [wordLength, setWordLength] = useState(3);
  const [targetPhonemes, setTargetPhonemes] = useState<string[]>([]);
  const [targetWord, setTargetWord] = useState("");
  const [maxGuesses, setMaxGuesses] = useState(6);
  const [showHints, setShowHints] = useState(true);

  const [guesses, setGuesses] = useState<LetterState[][]>([]);
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing");
  const [usedPhonemes, setUsedPhonemes] = useState<Record<string, GuessResult>>({});

  // Backend words
  const [backendWords, setBackendWords] = useState<BackendWord[]>([]);
  const [useBackend, setUseBackend] = useState(false);

  useEffect(() => {
    const savedGuesses = getCookie("guessCount");
    if (savedGuesses) setMaxGuesses(parseInt(savedGuesses));
    const savedHints = getCookie("showHints");
    if (savedHints !== null) setShowHints(savedHints === "true");
  }, []);

  // Fetch words from backend when wordLength changes
  useEffect(() => {
    const fetchWords = async () => {
      try {
        const res = await fetch("/api/word-lists");
        if (!res.ok) return;
        const lists = await res.json();
        // Find a word list that has words of this length
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

  const startNewGame = useCallback(() => {
    const genStart = performance.now();
    if (useBackend && backendWords.length > 0) {
      const random = backendWords[Math.floor(Math.random() * backendWords.length)];
      setTargetPhonemes(JSON.parse(random.phonemes));
      setTargetWord(random.word);
    } else {
      // Fallback to local corpus
      const { words3, words4, words5 } = require("@/data/phonemeCorpus");
      const list = wordLength === 3 ? words3 : wordLength === 4 ? words4 : words5;
      const random = list[Math.floor(Math.random() * list.length)];
      setTargetPhonemes(random.phonemes);
      setTargetWord(random.word);
    }
    setGuesses([]);
    setCurrentGuess([]);
    setGameStatus("playing");
    setUsedPhonemes({});
    reportGeneration("wordle", true, {
      durationMs: Math.round(performance.now() - genStart),
    });
  }, [useBackend, backendWords, wordLength]);

  const evaluateGuess = (guess: string[]): LetterState[] => {
    const target = [...targetPhonemes];
    const result: LetterState[] = guess.map((p, i) => ({
      phoneme: p,
      result: p === target[i] ? "correct" : target.includes(p) ? "present" : "absent",
    }));

    // Two-pass algorithm for correct duplicate handling
    const targetUsed = new Set<number>();
    for (let i = 0; i < result.length; i++) {
      if (result[i].result === "correct") targetUsed.add(i);
    }
    for (let i = 0; i < result.length; i++) {
      if (result[i].result === "correct") continue;
      const idx = target.findIndex((t, j) => t === guess[i] && !targetUsed.has(j));
      if (idx >= 0) {
        result[i].result = "present";
        targetUsed.add(idx);
      } else {
        result[i].result = "absent";
      }
    }
    return result;
  };

  const handlePhonemeInput = (phoneme: string) => {
    if (gameStatus !== "playing" || targetPhonemes.length === 0) return;
    if (currentGuess.length >= targetPhonemes.length) return;
    setCurrentGuess([...currentGuess, phoneme]);
  };

  const handleBackspace = () => setCurrentGuess(currentGuess.slice(0, -1));

  const handleSubmit = () => {
    if (targetPhonemes.length === 0 || currentGuess.length !== targetPhonemes.length) return;
    const result = evaluateGuess(currentGuess);
    const newGuesses = [...guesses, result];
    setGuesses(newGuesses);

    const newUsed = { ...usedPhonemes };
    result.forEach(({ phoneme, result: r }) => {
      if (r === "correct" || (r === "present" && newUsed[phoneme] !== "correct") || !newUsed[phoneme]) {
        newUsed[phoneme] = r;
      }
    });
    setUsedPhonemes(newUsed);

    if (result.every((r) => r.result === "correct")) {
      setGameStatus("won");
    } else if (newGuesses.length >= maxGuesses) {
      setGameStatus("lost");
    }
    setCurrentGuess([]);
  };

  const getCellColor = (result: GuessResult) => {
    switch (result) {
      case "correct": return "bg-green-500 text-white";
      case "present": return "bg-yellow-500 text-white";
      case "absent": return "bg-gray-400 text-white";
    }
  };

  const getKeyColor = (phoneme: string) => {
    const r = usedPhonemes[phoneme];
    if (!r) return "bg-gray-200 hover:bg-gray-300 text-gray-800";
    return getCellColor(r);
  };

  // Fixed: uses same two-pass algorithm as React preview
  const generateHTML = () => {
    if (targetPhonemes.length === 0) return;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Phoneme Wordle - ${targetWord}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;align-items:center;min-height:100vh;background:#f0f4f8;padding:20px}
h1{font-size:1.5rem;margin-bottom:8px;color:#1e40af}
.subtitle{color:#6b7280;margin-bottom:20px}
.grid{display:flex;flex-direction:column;gap:6px;margin-bottom:20px}
.row{display:flex;gap:6px}
.cell{width:50px;height:50px;border:2px solid #d1d5db;display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:bold;border-radius:6px;background:white;position:relative}
.cell.correct{background:#22c55e;color:white;border-color:#22c55e}
.cell.present{background:#eab308;color:white;border-color:#eab308}
.cell.absent{background:#9ca3af;color:white;border-color:#9ca3af}
.cell.current{border-color:#3b82f6}
.keyboard{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:500px;margin-bottom:20px}
.key{padding:8px 12px;border:none;border-radius:6px;font-size:0.95rem;cursor:pointer;background:#e5e7eb;color:#374151;transition:all 0.15s;position:relative}
.key:hover{background:#d1d5db}
.key.correct{background:#22c55e;color:white}
.key.present{background:#eab308;color:white}
.key.absent{background:#9ca3af;color:white}
.key.wide{padding:8px 18px}
.hint .tooltip{display:none;position:absolute;bottom:120%;left:50%;transform:translateX(-50%);background:#1f2937;color:white;padding:4px 8px;border-radius:4px;font-size:0.75rem;white-space:nowrap;z-index:10}
.hint:hover .tooltip{display:block}
#message{text-align:center;font-size:1.1rem;font-weight:600;min-height:28px;margin-bottom:10px;color:#1e40af}
.new-game{padding:10px 24px;background:#3b82f6;color:white;border:none;border-radius:8px;font-size:1rem;cursor:pointer}
.new-game:hover{background:#2563eb}
.answer{margin-top:10px;font-size:1rem;color:#374151}
.footer{margin-top:auto;padding:16px;background:#1f2937;color:#9ca3af;text-align:center;width:100%;font-size:0.85rem}
</style>
</head>
<body>
<h1>Phoneme Wordle</h1>
<p class="subtitle">Guess the ${targetPhonemes.length}-phoneme word</p>
<div id="message"></div>
<div class="grid" id="grid"></div>
<div class="keyboard" id="keyboard"></div>
<button class="new-game" onclick="newGame()">New Game</button>
<div class="answer" id="answer"></div>
<script>
const WORD=${JSON.stringify(targetPhonemes)};
const ENGLISH="${targetWord}";
const MAX=${maxGuesses};
const HINTS=${JSON.stringify(phonemeHints)};
let guesses=[];let current=[];let done=false;

function evaluateGuess(guess){
  const target=[...WORD];
  const result=guess.map((p,i)=>({phoneme:p,result:p===target[i]?'correct':target.includes(p)?'present':'absent'}));
  const targetUsed=new Set();
  for(let i=0;i<result.length;i++){if(result[i].result==='correct')targetUsed.add(i)}
  for(let i=0;i<result.length;i++){
    if(result[i].result==='correct')continue;
    const idx=target.findIndex((t,j)=>t===guess[i]&&!targetUsed.has(j));
    if(idx>=0){result[i].result='present';targetUsed.add(idx)}
    else{result[i].result='absent'}
  }
  return result;
}

function render(){
  const g=document.getElementById('grid');g.innerHTML='';
  for(let i=0;i<MAX;i++){
    const row=document.createElement('div');row.className='row';
    for(let j=0;j<WORD.length;j++){
      const cell=document.createElement('div');cell.className='cell';
      if(i<guesses.length){cell.textContent=guesses[i][j].phoneme;cell.classList.add(guesses[i][j].result)}
      else if(i===guesses.length&&j<current.length){cell.textContent=current[j];cell.classList.add('current')}
      row.appendChild(cell);
    }
    g.appendChild(row);
  }
  const kb=document.getElementById('keyboard');kb.innerHTML='';
  const allP=${JSON.stringify(allPhonemes)};
  const used={};
  guesses.forEach(g=>g.forEach(l=>{used[l.phoneme]=l.result}));
  allP.forEach(p=>{
    const btn=document.createElement('button');btn.className='key hint';
    btn.textContent=p;
    if(used[p])btn.classList.add(used[p]);
    const tip=document.createElement('span');tip.className='tooltip';tip.textContent=HINTS[p]||'';btn.appendChild(tip);
    btn.onclick=()=>addPhoneme(p);btn.setAttribute('role','button');btn.setAttribute('aria-label',HINTS[p]||p);kb.appendChild(btn);
  });
  const del=document.createElement('button');del.className='key wide';del.textContent='⌫';del.setAttribute('aria-label','Backspace');del.onclick=backspace;kb.appendChild(del);
  const sub=document.createElement('button');sub.className='key wide';sub.textContent='ENTER';sub.style.background='#3b82f6';sub.style.color='white';sub.setAttribute('aria-label','Submit guess');sub.onclick=submit;kb.appendChild(sub);
}

function addPhoneme(p){if(done||current.length>=WORD.length)return;current.push(p);render()}
function backspace(){if(done)return;current.pop();render()}
function submit(){
  if(done||current.length!==WORD.length)return;
  const result=evaluateGuess(current);
  guesses.push(result);
  if(result.every(r=>r.result==='correct')){
    document.getElementById('message').textContent='🎉 Correct! The word is: '+WORD.join(' ');
    document.getElementById('answer').textContent='English word: '+ENGLISH;done=true;
  }else if(guesses.length>=MAX){
    document.getElementById('message').textContent='😞 Game Over!';
    document.getElementById('answer').textContent='The word was: '+WORD.join(' ')+' ('+ENGLISH+')';done=true;
  }
  current=[];render();
}
function newGame(){guesses=[];current=[];done=false;document.getElementById('message').textContent='';document.getElementById('answer').textContent='';render()}
render();
</script>
<div class="footer">Mingxuan He | Student ID: 19884912 | Phoneme Activity Builder — Assessment 3</div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wordle-${targetWord}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">Phoneme Wordle Builder</h2>

      <div className="bg-white p-6 rounded-lg shadow border mb-6">
        <h3 className="text-lg font-semibold mb-4">Configure Activity</h3>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phoneme Word Length</label>
            <select
              value={wordLength}
              onChange={(e) => { setWordLength(parseInt(e.target.value)); setTargetPhonemes([]); setTargetWord(""); setGuesses([]); setCurrentGuess([]); setGameStatus("playing"); }}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value={3}>3 phonemes</option>
              <option value={4}>4 phonemes</option>
              <option value={5}>5 phonemes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guesses</label>
            <select value={maxGuesses} onChange={(e) => setMaxGuesses(parseInt(e.target.value))} className="w-full border rounded-md px-3 py-2">
              {[3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Show Hints</label>
            <select value={showHints ? "yes" : "no"} onChange={(e) => setShowHints(e.target.value === "yes")} className="w-full border rounded-md px-3 py-2">
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
        {useBackend && <p className="text-sm text-green-600 mb-2">✓ Using words from database</p>}
        <button onClick={startNewGame} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
          Start New Game
        </button>
      </div>

      {targetPhonemes.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow border mb-6">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500">Guess the {targetPhonemes.length}-phoneme word</p>
            {gameStatus === "won" && (
              <>
                <p className="text-green-600 font-bold text-lg mt-2">🎉 Correct! The word is: {targetPhonemes.join(" ")}</p>
                <p className="text-gray-600">English word: <strong>{targetWord}</strong></p>
              </>
            )}
            {gameStatus === "lost" && (
              <p className="text-red-600 font-bold text-lg mt-2">Game Over! The word was: {targetPhonemes.join(" ")} ({targetWord})</p>
            )}
          </div>

          <div className="flex flex-col items-center gap-1.5 mb-6">
            {Array.from({ length: maxGuesses }).map((_, rowIdx) => (
              <div key={rowIdx} className="flex gap-1.5">
                {Array.from({ length: targetPhonemes.length }).map((_, colIdx) => {
                  const guess = guesses[rowIdx];
                  const isCurrentRow = rowIdx === guesses.length;
                  let cellText = "";
                  let cellClass = "border-2 border-gray-300";

                  if (guess) {
                    cellText = guess[colIdx].phoneme;
                    cellClass = getCellColor(guess[colIdx].result);
                  } else if (isCurrentRow && currentGuess[colIdx]) {
                    cellText = currentGuess[colIdx];
                    cellClass = "border-2 border-blue-500";
                  }

                  return (
                    <div key={colIdx} className={`w-14 h-14 flex items-center justify-center text-lg font-bold rounded-md ${cellClass} relative group`}>
                      {cellText}
                      {showHints && cellText && phonemeHints[cellText] && (
                        <span className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                          {phonemeHints[cellText]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {gameStatus === "playing" && (
            <div>
              <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                {allPhonemes.map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePhonemeInput(p)}
                    aria-label={phonemeHints[p] || p}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative group ${getKeyColor(p)}`}
                  >
                    {p}
                    {showHints && phonemeHints[p] && (
                      <span className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                        {phonemeHints[p]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex justify-center gap-2">
                <button onClick={handleBackspace} aria-label="Backspace" className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 font-medium">⌫</button>
                <button onClick={handleSubmit} aria-label="Submit guess" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">ENTER</button>
              </div>
            </div>
          )}
        </div>
      )}

      {targetPhonemes.length > 0 && (
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
