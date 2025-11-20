import React, { useState, useEffect, useCallback } from 'react';
import { Play, Activity, CheckCircle, XCircle, Settings, ArrowLeft, Eye, Shuffle } from 'lucide-react';
import { ShapeRow, OperatorBox, Arrow } from './components/GameComponents';
import { LEVELS } from './constants';
import { generatePuzzle, formatTime } from './services/gameLogic';
import { AppMode, PracticeType, Puzzle, Layer, HistoryRecord } from './types';

export default function SwitchChallengeApp() {
  // App Mode
  const [appMode, setAppMode] = useState<AppMode>('HOME'); 
  
  // Practice Config
  const [practiceType, setPracticeType] = useState<PracticeType>('PROGRESSIVE'); 
  const [startLevel, setStartLevel] = useState(0);

  // Session State
  const [round, setRound] = useState(1);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [timeLeft, setTimeLeft] = useState(300); 
  const [isRandomPhase, setIsRandomPhase] = useState(false);

  // Puzzle State
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [mysterySolvedCount, setMysterySolvedCount] = useState(0);
  
  // Practice Review State
  const [reviewIndex, setReviewIndex] = useState(-1); 
  const [practiceResult, setPracticeResult] = useState<{ success: boolean; correctCode?: number[] } | null>(null);

  // --- HELPERS ---

  const getWeightedRandomLevel = () => {
    // 80% chance for levels 3+, 20% for levels 1-2 (indices 0-1)
    const useHarder = Math.random() < 0.8;
    
    // Ensure we have enough levels to split logic
    if (LEVELS.length <= 2) {
      return Math.floor(Math.random() * LEVELS.length);
    }

    if (useHarder) {
      // Random between index 2 and LEVELS.length - 1
      const min = 2;
      const max = LEVELS.length - 1;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    } else {
      // Random between index 0 and 1
      return Math.floor(Math.random() * 2);
    }
  };

  // --- ACTIONS ---

  const startAssessment = () => {
    setScore(0);
    setRound(1);
    setCurrentLevelIdx(0);
    setHistory([]);
    setTimeLeft(300);
    setPuzzle(generatePuzzle(0));
    setMysterySolvedCount(0);
    setReviewIndex(-1);
    setAppMode('ASSESSMENT');
  };

  const startPractice = () => {
    setScore(0);
    setRound(1);
    setCurrentLevelIdx(startLevel);
    setHistory([]);
    setPuzzle(generatePuzzle(startLevel));
    setMysterySolvedCount(0);
    setReviewIndex(-1);
    setPracticeResult(null);
    setIsRandomPhase(false);
    setAppMode('PRACTICE_PLAY');
  };

  const advanceToNextQuestion = useCallback((nextLevelIdx: number) => {
    setRound(r => r + 1);
    setCurrentLevelIdx(nextLevelIdx);
    setPuzzle(generatePuzzle(nextLevelIdx));
    setMysterySolvedCount(0);
    setPracticeResult(null); 
    setReviewIndex(-1); 
  }, []);

  const saveHistory = (isSuccess: boolean, finalLayers: Layer[]) => {
    if (!puzzle) return;
    const record: HistoryRecord = {
      round,
      level: puzzle.levelConfig.id,
      pointsPotential: puzzle.levelConfig.points,
      earned: isSuccess ? puzzle.levelConfig.points : 0,
      correct: isSuccess,
      puzzleSnapshot: { ...puzzle, layers: finalLayers }
    };
    setHistory(prev => [...prev, record]);
    if (isSuccess) setScore(s => s + puzzle.levelConfig.points);
  };

  const finishQuestion = (isSuccess: boolean, finalLayers: Layer[]) => {
    saveHistory(isSuccess, finalLayers); 

    let nextLevelIdx = currentLevelIdx;
    // In Assessment or Progressive Practice, we might advance level
    if (appMode === 'ASSESSMENT') {
        if (isSuccess && currentLevelIdx < LEVELS.length - 1) {
          nextLevelIdx = currentLevelIdx + 1;
        }
        
        if (round >= 24) {
          setAppMode('FINISHED');
          setReviewIndex(-1);
        } else {
          advanceToNextQuestion(nextLevelIdx);
        }
    } 
  };

  const handleAnswer = (selectedCode: number[], layerIndex: number) => {
    if (!puzzle) return;
    if (reviewIndex !== -1 || (appMode === 'PRACTICE_PLAY' && practiceResult !== null)) return;

    const layer = puzzle.layers[layerIndex];
    const isCorrect = selectedCode.join('') === layer.code.join('');
    
    const updatedLayers = [...puzzle.layers];
    updatedLayers[layerIndex] = { 
      ...layer, 
      userSelected: selectedCode 
    };

    if (isCorrect) {
      updatedLayers[layerIndex].isSolved = true;
      setPuzzle(prev => prev ? ({ ...prev, layers: updatedLayers }) : null);
      
      const newSolvedCount = mysterySolvedCount + 1;
      setMysterySolvedCount(newSolvedCount);

      if (newSolvedCount === puzzle.totalMystery) {
        if (appMode === 'ASSESSMENT') {
           finishQuestion(true, updatedLayers);
        } else {
           // PRACTICE MODE SUCCESS
           setPracticeResult({ success: true });
           saveHistory(true, updatedLayers);

           let nextLevelIdx = currentLevelIdx;
           
           if (practiceType === 'PROGRESSIVE') {
              if (currentLevelIdx < LEVELS.length - 1) {
                 nextLevelIdx = currentLevelIdx + 1;
              }
           } else if (practiceType === 'RANDOM') {
              // If we are in random phase OR we just beat the final level
              if (isRandomPhase || currentLevelIdx >= LEVELS.length - 1) {
                 setIsRandomPhase(true);
                 nextLevelIdx = getWeightedRandomLevel();
              } else {
                 // Still in the initial progressive climb
                 nextLevelIdx = currentLevelIdx + 1;
              }
           }
           
           setTimeout(() => {
             advanceToNextQuestion(nextLevelIdx);
           }, 500);
        }
      }
    } else {
      // Wrong Answer
      setPuzzle(prev => prev ? ({ ...prev, layers: updatedLayers }) : null);
      if (appMode === 'ASSESSMENT') {
        finishQuestion(false, updatedLayers);
      } else {
        setPracticeResult({ success: false, correctCode: layer.code });
        saveHistory(false, updatedLayers);
      }
    }
  };

  const handlePracticeNext = () => {
    const lastResult = history[history.length - 1];
    let nextLevelIdx = currentLevelIdx;
    
    if (practiceType === 'PROGRESSIVE') {
      if (lastResult && lastResult.correct && currentLevelIdx < LEVELS.length - 1) {
        nextLevelIdx = currentLevelIdx + 1;
      }
    } else if (practiceType === 'RANDOM') {
      if (isRandomPhase) {
         // In random phase, we just grab another random one regardless of pass/fail
         // (Or we could force retry, but random flow usually implies moving on)
         nextLevelIdx = getWeightedRandomLevel();
      } else {
         // In progressive phase of random mode
         if (lastResult && lastResult.correct && currentLevelIdx < LEVELS.length - 1) {
             nextLevelIdx = currentLevelIdx + 1;
         }
      }
    }
    advanceToNextQuestion(nextLevelIdx);
  };

  const handleBack = () => {
    if (appMode === 'FINISHED') {
      setReviewIndex(-1);
    } else {
      setAppMode('HOME');
    }
  };

  // --- EFFECTS ---

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (appMode === 'ASSESSMENT') {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setAppMode('FINISHED');
            setReviewIndex(-1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [appMode]);


  // --- RENDERERS ---

  const renderOperatorLayer = (layer: Layer, layerIdx: number) => {
    const isMystery = layer.type === 'M';
    
    if (!isMystery || (isMystery && layer.isSolved)) {
       return <OperatorBox code={layer.code} type={isMystery ? 'M' : 'F'} />;
    } 
    
    return (
      <div className="grid grid-cols-2 gap-2 w-full max-w-[280px]">
          {layer.options?.map((opt, optIdx) => {
            const optStr = opt.join('');
            const correctStr = layer.code.join('');
            const userSelectedStr = layer.userSelected ? layer.userSelected.join('') : null;
            
            let btnClass = "bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50";
            
            // Feedback Styling
            if (practiceResult || reviewIndex !== -1) {
               if (optStr === correctStr) {
                 btnClass = "bg-green-100 border-green-500 text-green-800 ring-2 ring-green-200";
               } else if (optStr === userSelectedStr && !layer.isSolved) {
                 btnClass = "bg-red-100 border-red-500 text-red-800 opacity-50";
               } else {
                 btnClass = "opacity-30 border-slate-100";
               }
            }

            return (
              <button
                key={optIdx}
                onClick={() => handleAnswer(opt, layerIdx)}
                disabled={reviewIndex !== -1 || practiceResult !== null}
                className={`h-14 border-2 rounded-lg shadow-sm flex items-center justify-center transition-all ${btnClass}`}
              >
                <span className="text-lg sm:text-xl font-mono font-black tracking-widest">{optStr}</span>
              </button>
            );
          })}
      </div>
    );
  };

  // --- VIEWS ---

  if (appMode === 'HOME') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl text-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Switch Challenge</h1>
          <p className="text-slate-500 mb-8">Prepare for your assessment</p>
          
          <div className="space-y-4">
            <button 
              onClick={startAssessment}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-xl shadow-lg flex items-center justify-between group transition-transform active:scale-95"
            >
              <div className="text-left">
                <span className="block font-bold text-lg">Assessment Sim</span>
                <span className="text-xs text-slate-400 group-hover:text-slate-300">24 Rounds • 5 Mins • Silent</span>
              </div>
              <Play className="w-6 h-6" />
            </button>

            <button 
              onClick={() => setAppMode('PRACTICE_CONFIG')}
              className="w-full bg-white border-2 border-indigo-100 hover:border-indigo-500 text-slate-700 p-4 rounded-xl shadow-sm flex items-center justify-between group transition-all active:scale-95"
            >
              <div className="text-left">
                <span className="block font-bold text-lg group-hover:text-indigo-700">Practice Mode</span>
                <span className="text-xs text-slate-400">Instant Feedback • Infinite</span>
              </div>
              <Settings className="w-6 h-6 text-slate-300 group-hover:text-indigo-500" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appMode === 'PRACTICE_CONFIG') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl">
          <button onClick={() => setAppMode('HOME')} className="mb-4 text-slate-400 hover:text-slate-700 flex items-center gap-1 text-sm font-bold">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h2 className="text-2xl font-bold mb-6">Practice Setup</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Mode</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setPracticeType('PROGRESSIVE')}
                  className={`p-2 rounded-lg text-xs sm:text-sm font-bold border-2 transition-all flex flex-col items-center justify-center gap-1 ${practiceType === 'PROGRESSIVE' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}
                >
                  <Activity className="w-4 h-4" />
                  Progressive
                </button>
                <button 
                  onClick={() => setPracticeType('RANDOM')}
                  className={`p-2 rounded-lg text-xs sm:text-sm font-bold border-2 transition-all flex flex-col items-center justify-center gap-1 ${practiceType === 'RANDOM' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}
                >
                   <Shuffle className="w-4 h-4" />
                   Random
                </button>
                <button 
                   onClick={() => setPracticeType('LEVEL')}
                   className={`p-2 rounded-lg text-xs sm:text-sm font-bold border-2 transition-all flex flex-col items-center justify-center gap-1 ${practiceType === 'LEVEL' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}
                >
                  <Settings className="w-4 h-4" />
                  Single Lvl
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {practiceType === 'PROGRESSIVE' && 'Difficulty increases as you get answers right.'}
                {practiceType === 'LEVEL' && 'Practice the same difficulty level repeatedly.'}
                {practiceType === 'RANDOM' && 'Go up to Max Level, then shuffle (biased towards higher levels).'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Start Level</label>
              <select 
                value={startLevel} 
                onChange={(e) => setStartLevel(Number(e.target.value))}
                className="w-full p-3 rounded-lg border-2 border-slate-200 font-bold text-slate-700 bg-white focus:border-indigo-500 outline-none"
              >
                {LEVELS.map((l, i) => (
                  <option key={l.id} value={i}>Level {l.id}: {l.label}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={startPractice}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg mt-4 transition-transform active:scale-95"
            >
              Start Practice
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- FINISHED VIEW ---
  if (appMode === 'FINISHED' && reviewIndex === -1) {
    const roundsPlayed = history.length;
    const accuracy = roundsPlayed > 0 ? Math.round((history.filter(h => h.correct).length / roundsPlayed) * 100) : 0;
    const bestLevel = history.length > 0 ? Math.max(...history.map(h => h.level)) : 0;
    const mistakes = history.filter(h => !h.correct);

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white max-w-lg w-full p-8 rounded-2xl shadow-xl my-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Assessment Complete</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-indigo-50 p-4 rounded-xl text-center">
              <span className="block text-indigo-600 text-xs font-bold uppercase tracking-wider">Score</span>
              <span className="block text-3xl font-black text-indigo-900">{score}</span>
            </div>
            <div className="bg-green-50 p-4 rounded-xl text-center">
              <span className="block text-green-600 text-xs font-bold uppercase tracking-wider">Accuracy</span>
              <span className="block text-3xl font-black text-green-900">{accuracy}%</span>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl text-center">
              <span className="block text-purple-600 text-xs font-bold uppercase tracking-wider">Peak Level</span>
              <span className="block text-3xl font-black text-purple-900">{bestLevel}</span>
            </div>
            <div className="bg-slate-100 p-4 rounded-xl text-center">
              <span className="block text-slate-500 text-xs font-bold uppercase tracking-wider">Questions</span>
              <span className="block text-3xl font-black text-slate-700">{roundsPlayed}</span>
            </div>
          </div>

          {mistakes.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Mistakes Review</h3>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2">
                {mistakes.map((m) => (
                  <button 
                    key={m.round}
                    onClick={() => setReviewIndex(history.indexOf(m))}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100 hover:border-red-300 hover:bg-red-100 transition-all group w-full"
                  >
                    <div className="flex items-center gap-3">
                       <span className="text-red-500 font-mono font-bold text-sm w-8">Q{m.round}</span>
                       <div className="text-left leading-tight">
                          <span className="block text-xs font-bold text-red-800">Level {m.level}</span>
                          <span className="block text-[10px] text-red-400">Incorrect Selection</span>
                       </div>
                    </div>
                    <Eye className="w-4 h-4 text-red-300 group-hover:text-red-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {mistakes.length === 0 && roundsPlayed > 0 && (
             <div className="mb-8 bg-green-50 p-4 rounded-xl flex items-center gap-3 text-green-800">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div className="text-sm font-bold">Perfect Run! No mistakes found.</div>
             </div>
          )}

          <button 
            onClick={() => setAppMode('HOME')}
            className="w-full border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-900 hover:text-white text-slate-700 font-bold py-3 rounded-xl transition-all"
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  // --- GAME PLAY RENDER ---

  const isReviewing = reviewIndex !== -1;
  const isPractice = appMode === 'PRACTICE_PLAY';
  // Determine which puzzle to show
  const displayedPuzzle = (isReviewing && history[reviewIndex]) ? history[reviewIndex].puzzleSnapshot : puzzle;

  if (!displayedPuzzle) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-6 font-sans text-slate-800 px-4">
      
      {/* Header / Stats */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-slate-100">
         
         {/* Left: Exit or Mode Info */}
         <div className="flex items-center gap-2">
           <button onClick={handleBack} className="p-2 rounded-full hover:bg-slate-100 text-slate-400">
             <ArrowLeft className="w-4 h-4" />
           </button>
           <div>
             <span className="text-[10px] font-bold text-slate-400 uppercase block">
                {appMode === 'FINISHED' ? 'Review' : (isPractice ? 'Practice' : 'Assessment')}
             </span>
             <span className="font-bold text-sm leading-none flex items-center gap-1">
               Q{isReviewing && history[reviewIndex] ? history[reviewIndex].round : round}
               <span className="text-slate-300">|</span> 
               Lvl {displayedPuzzle.levelConfig.id}
             </span>
           </div>
         </div>

         {/* Right: Timer (Assessment) or Score (Practice) */}
         <div className="text-right">
           {appMode === 'ASSESSMENT' ? (
              <>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Time Left</span>
                <span className={`font-mono font-bold text-lg ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>{formatTime(timeLeft)}</span>
              </>
           ) : (
              <>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Score</span>
                <span className="font-mono font-bold text-lg text-indigo-600">
                   {appMode === 'FINISHED' && isReviewing ? history[reviewIndex]?.earned : score}
                </span>
              </>
           )}
         </div>
      </div>

      {/* Practice Navigation Bar (Only in Practice Mode) */}
      {isPractice && (
        <div className="w-full max-w-md mb-6 flex items-center justify-between bg-slate-200 p-1 rounded-lg">
           <button 
             onClick={() => setReviewIndex(prev => Math.max(0, (prev === -1 ? history.length : prev) - 1))}
             disabled={history.length === 0 || reviewIndex === 0}
             className="px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-white hover:shadow-sm rounded-md transition-all"
           >
             &larr; Prev
           </button>
           
           <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
             {isReviewing ? `Reviewing Q${history[reviewIndex]?.round}` : 'Current Question'}
           </span>

           <button 
             onClick={() => setReviewIndex(prev => (prev === -1 || prev >= history.length - 1) ? -1 : prev + 1)}
             disabled={!isReviewing}
             className="px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-white hover:shadow-sm rounded-md transition-all"
           >
             {reviewIndex === history.length - 1 ? 'Current' : 'Next'} &rarr;
           </button>
        </div>
      )}

      {/* Puzzle Area */}
      <div className="w-full max-w-md flex-1 flex flex-col items-center gap-1 pb-24 relative">
        
        {/* History Overlay Label */}
        {isReviewing && (
          <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded border border-yellow-300 flex items-center gap-1 z-10">
            <Eye className="w-3 h-3" /> Review Mode
          </div>
        )}

        <ShapeRow shapes={displayedPuzzle.input} label="Input" />
        <Arrow />

        {displayedPuzzle.layers.map((layer, idx) => (
          <React.Fragment key={idx}>
            {renderOperatorLayer(layer, idx)}
            <Arrow />
          </React.Fragment>
        ))}

        <ShapeRow shapes={displayedPuzzle.output} label="Output" />

      </div>

      {/* Practice Mode: Feedback */}
      {isPractice && !isReviewing && practiceResult && (
        <div className="fixed bottom-6 left-0 w-full px-4 pointer-events-none flex justify-center z-50">
          {practiceResult.success ? (
             // Success Toast
             <div className="bg-green-600 text-white px-6 py-3 rounded-full shadow-xl font-bold flex items-center gap-2 animate-bounce">
                <CheckCircle className="w-5 h-5" /> Correct!
             </div>
          ) : (
             // Error Modal (Interactive)
             <div className="max-w-md w-full flex items-center justify-between bg-white p-4 rounded-xl shadow-2xl border border-red-100 pointer-events-auto">
                <div className="flex items-center gap-3">
                   <XCircle className="w-8 h-8 text-red-500" />
                   <div>
                     <p className="font-bold text-red-700">Incorrect</p>
                     <p className="text-xs text-slate-500">Correct answer highlighted in green</p>
                   </div>
                </div>
                <button 
                  onClick={handlePracticeNext}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-transform active:scale-95"
                >
                  Next &rarr;
                </button>
             </div>
          )}
        </div>
      )}

    </div>
  );
}