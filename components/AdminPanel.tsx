'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  BookOpen,
  Users,
  Shield,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Code2,
  Copy,
  MinusCircle,
  PlusCircle,
  Zap,
} from 'lucide-react';
import {
  QuizState,
  QuizRules,
  Participant,
  QuestionRound1,
  RapidFireSet,
  BuzzerQuestion,
  TieBreakerQuestion,
} from '@/lib/types';

interface AdminPanelProps {
  state: QuizState;
  executeAction: (action: string, payload?: Record<string, unknown>) => Promise<{ success: boolean }>;
}

type AdminTab = 'rules' | 'participants' | 'round1' | 'round2' | 'round3' | 'tiebreaker' | 'bulk' | 'backup';

let customIdCounter = 1000;
function nextId(prefix: string): string {
  customIdCounter += 1;
  return `${prefix}-${customIdCounter}`;
}

export function AdminPanel({ state, executeAction }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('round1');
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Editable rules state
  const [rules, setRules] = useState<QuizRules>(state.rules);

  // Editable participants state
  const [participants, setParticipants] = useState<Participant[]>(state.participants);

  // Editable questions
  const [round1Questions, setRound1Questions] = useState<QuestionRound1[]>(state.round1Questions);
  const [round2Sets, setRound2Sets] = useState<RapidFireSet[]>(state.round2Sets);
  const [round3Questions, setRound3Questions] = useState<BuzzerQuestion[]>(state.round3Questions);
  const [tieBreakerQuestions, setTieBreakerQuestions] = useState<TieBreakerQuestion[]>(state.tieBreakerQuestions || []);

  // New question form state
  const [showAddR1, setShowAddR1] = useState(false);
  const [newR1, setNewR1] = useState<QuestionRound1>({
    id: '',
    question: '',
    correctAnswer: '',
    assignedSeat: 1,
    explanation: '',
    category: 'Srila Prabhupada & Viplava 2026',
  });

  const [showAddR2Seat, setShowAddR2Seat] = useState<number | null>(null);
  const [newR2Question, setNewR2Question] = useState({ question: '', answer: '' });

  const [showAddR3, setShowAddR3] = useState(false);
  const [newR3, setNewR3] = useState<BuzzerQuestion>({
    id: '',
    question: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    explanation: '',
    pointsCorrect: 15,
    pointsWrong: -5,
  });

  const [showAddTB, setShowAddTB] = useState(false);
  const [newTB, setNewTB] = useState<TieBreakerQuestion>({
    id: '',
    question: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    explanation: '',
  });

  // Bulk JSON editor state
  const [bulkJSON, setBulkJSON] = useState<string>(() =>
    JSON.stringify(
      {
        round1Questions: state.round1Questions,
        round2Sets: state.round2Sets,
        round3Questions: state.round3Questions,
        tieBreakerQuestions: state.tieBreakerQuestions || [],
      },
      null,
      2
    )
  );

  // Temporary notification toast
  const notifySave = (msg: string) => {
    setSaveMessage(msg);
    setErrorMessage('');
    setTimeout(() => setSaveMessage(''), 3500);
  };

  const notifyError = (msg: string) => {
    setErrorMessage(msg);
    setSaveMessage('');
    setTimeout(() => setErrorMessage(''), 5000);
  };

  // ---------------- HANDLERS ----------------
  const handleSaveRules = async () => {
    await executeAction('update_rules', { rules });
    notifySave('Pre-round rules updated for all screens!');
  };

  const handleSaveParticipant = async (p: Participant) => {
    await executeAction('update_participant', { id: p.id, updates: p });
    notifySave(`Seat ${p.seatNumber} details updated!`);
  };

  const handleAdjustParticipantScore = async (
    participantId: string,
    round: 'round1' | 'round2' | 'round3' | 'tieBreaker',
    delta: number
  ) => {
    await executeAction('adjust_score', { participantId, round, delta });
    notifySave(`Score adjusted (${delta > 0 ? '+' : ''}${delta}) for participant!`);
  };

  const handleReleaseSeat = async (seatNumber: number) => {
    await executeAction('release_seat', { seatNumber });
    notifySave(`Seat #${seatNumber} released!`);
  };

  const handleResetCheckIns = async () => {
    if (confirm('Reset all 6 participant check-in statuses to Waiting?')) {
      await executeAction('reset_check_ins');
      notifySave('All check-ins reset to Waiting!');
    }
  };

  // Round 1
  const handleSaveRound1 = async () => {
    await executeAction('update_round1_questions', { questions: round1Questions });
    notifySave('Round 1 direct questions updated!');
  };

  const handleAddRound1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newR1.question.trim() || !newR1.correctAnswer.trim()) {
      notifyError('Please enter question and correct answer.');
      return;
    }
    const created: QuestionRound1 = {
      ...newR1,
      id: nextId('r1'),
    };
    const updated = [...round1Questions, created];
    setRound1Questions(updated);
    await executeAction('update_round1_questions', { questions: updated });
    setShowAddR1(false);
    setNewR1({
      id: '',
      question: '',
      correctAnswer: '',
      assignedSeat: 1,
      explanation: '',
      category: 'Srila Prabhupada & Viplava 2026',
    });
    notifySave('New Round 1 question added and saved!');
  };

  const handleDeleteRound1 = async (id: string) => {
    if (confirm('Delete this Round 1 question?')) {
      const updated = round1Questions.filter((q) => q.id !== id);
      setRound1Questions(updated);
      await executeAction('update_round1_questions', { questions: updated });
      notifySave('Question deleted.');
    }
  };

  // Round 2
  const handleSaveRound2 = async () => {
    await executeAction('update_round2_sets', { sets: round2Sets });
    notifySave('Round 2 Rapid Fire sets updated!');
  };

  const handleAddRound2Submit = async (seatNumber: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!newR2Question.question.trim() || !newR2Question.answer.trim()) {
      notifyError('Please enter both question and answer for Rapid Fire.');
      return;
    }
    const qItem = {
      id: nextId(`r2-s${seatNumber}`),
      question: newR2Question.question.trim(),
      answer: newR2Question.answer.trim(),
    };
    const updatedSets = round2Sets.map((s) => {
      if (s.seatNumber === seatNumber) {
        return { ...s, questions: [...s.questions, qItem] };
      }
      return s;
    });
    setRound2Sets(updatedSets);
    await executeAction('update_round2_sets', { sets: updatedSets });
    setShowAddR2Seat(null);
    setNewR2Question({ question: '', answer: '' });
    notifySave(`Question added to Seat #${seatNumber} Rapid Fire!`);
  };

  const handleDeleteRound2 = async (seatNumber: number, qId: string) => {
    if (confirm('Delete this Rapid Fire question?')) {
      const updatedSets = round2Sets.map((s) => {
        if (s.seatNumber === seatNumber) {
          return { ...s, questions: s.questions.filter((q) => q.id !== qId) };
        }
        return s;
      });
      setRound2Sets(updatedSets);
      await executeAction('update_round2_sets', { sets: updatedSets });
      notifySave('Rapid question removed.');
    }
  };

  // Round 3
  const handleSaveRound3 = async () => {
    await executeAction('update_round3_questions', { questions: round3Questions });
    notifySave('Round 3 Buzzer questions updated!');
  };

  const handleAddRound3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newR3.question.trim() || newR3.options.some((o) => !o.trim())) {
      notifyError('Please enter question and all 4 options.');
      return;
    }
    const created: BuzzerQuestion = {
      ...newR3,
      id: nextId('r3'),
    };
    const updated = [...round3Questions, created];
    setRound3Questions(updated);
    await executeAction('update_round3_questions', { questions: updated });
    setShowAddR3(false);
    setNewR3({
      id: '',
      question: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      explanation: '',
      pointsCorrect: 15,
      pointsWrong: -5,
    });
    notifySave('New Buzzer question added and saved!');
  };

  const handleDeleteRound3 = async (id: string) => {
    if (confirm('Delete this Buzzer question?')) {
      const updated = round3Questions.filter((q) => q.id !== id);
      setRound3Questions(updated);
      await executeAction('update_round3_questions', { questions: updated });
      notifySave('Buzzer question removed.');
    }
  };

  // Tie-Breaker
  const handleSaveTieBreaker = async () => {
    await executeAction('update_tie_breaker_questions', { questions: tieBreakerQuestions });
    notifySave('Tie-Breaker questions updated!');
  };

  const handleAddTieBreakerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTB.question.trim() || newTB.options.some((o) => !o.trim())) {
      notifyError('Please enter question and all 4 options.');
      return;
    }
    const created: TieBreakerQuestion = {
      ...newTB,
      id: nextId('tb'),
    };
    const updated = [...tieBreakerQuestions, created];
    setTieBreakerQuestions(updated);
    await executeAction('update_tie_breaker_questions', { questions: updated });
    setShowAddTB(false);
    setNewTB({
      id: '',
      question: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      explanation: '',
    });
    notifySave('New Tie-Breaker question added and saved!');
  };

  const handleDeleteTieBreaker = async (id: string) => {
    if (confirm('Delete this Tie-Breaker question?')) {
      const updated = tieBreakerQuestions.filter((q) => q.id !== id);
      setTieBreakerQuestions(updated);
      await executeAction('update_tie_breaker_questions', { questions: updated });
      notifySave('Tie-Breaker question removed.');
    }
  };

  // Whole Bank Bulk Editor
  const handleApplyBulkJSON = async () => {
    try {
      const parsed = JSON.parse(bulkJSON);
      if (!parsed.round1Questions || !parsed.round2Sets || !parsed.round3Questions) {
        throw new Error('JSON must include "round1Questions", "round2Sets", and "round3Questions".');
      }
      await executeAction('bulk_update_all_questions', {
        round1Questions: parsed.round1Questions,
        round2Sets: parsed.round2Sets,
        round3Questions: parsed.round3Questions,
        tieBreakerQuestions: parsed.tieBreakerQuestions || [],
      });
      setRound1Questions(parsed.round1Questions);
      setRound2Sets(parsed.round2Sets);
      setRound3Questions(parsed.round3Questions);
      if (parsed.tieBreakerQuestions) setTieBreakerQuestions(parsed.tieBreakerQuestions);
      notifySave('Whole question bank successfully updated & live across all devices!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON format.';
      notifyError(`JSON Error: ${msg}`);
    }
  };

  const handleCopyBulkJSON = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(bulkJSON);
      notifySave('Entire question bank copied to clipboard!');
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'viplava-2026-quiz-config.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    notifySave('Quiz configuration exported to JSON file!');
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.rules) {
          await executeAction('update_rules', { rules: parsed.rules });
          setRules(parsed.rules);
        }
        await executeAction('bulk_update_all_questions', {
          round1Questions: parsed.round1Questions,
          round2Sets: parsed.round2Sets,
          round3Questions: parsed.round3Questions,
          tieBreakerQuestions: parsed.tieBreakerQuestions,
        });
        if (parsed.round1Questions) setRound1Questions(parsed.round1Questions);
        if (parsed.round2Sets) setRound2Sets(parsed.round2Sets);
        if (parsed.round3Questions) setRound3Questions(parsed.round3Questions);
        if (parsed.tieBreakerQuestions) setTieBreakerQuestions(parsed.tieBreakerQuestions);
        notifySave('Quiz configuration successfully imported!');
      } catch {
        notifyError('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetScores = async () => {
    if (confirm('Are you sure you want to reset all game scores to 0?')) {
      await executeAction('reset_quiz');
      notifySave('Scores reset to 0! Game ready to begin.');
    }
  };

  const handleRestoreDefaults = async () => {
    if (confirm('Restore default authentic Srila Prabhupada & Viplava 2026 question bank and rules?')) {
      await executeAction('restore_defaults');
      notifySave('Restored authentic Prabhupada question bank & default rules!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6 animate-fadeIn text-amber-50">
      {/* Title & Toast */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-cinzel text-amber-300">
              Admin &amp; Question Manager
            </h2>
            <p className="text-xs text-amber-200/70">
              Add whole question banks, edit questions inline, customize pre-round rules, and correct score mistakes
            </p>
          </div>
        </div>

        {saveMessage && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-xs font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/90 border border-rose-400 text-rose-300 text-xs font-bold animate-fadeIn">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'round1', label: `Round 1 (${round1Questions.length})`, icon: <BookOpen className="w-4 h-4" /> },
          { id: 'round2', label: 'Round 2 Rapid Sets', icon: <Zap className="w-4 h-4" /> },
          { id: 'round3', label: `Round 3 Buzzer (${round3Questions.length})`, icon: <BookOpen className="w-4 h-4" /> },
          { id: 'tiebreaker', label: `Tie-Breaker (${tieBreakerQuestions.length})`, icon: <BookOpen className="w-4 h-4" /> },
          { id: 'bulk', label: 'Whole Bank Editor (JSON)', icon: <Code2 className="w-4 h-4" /> },
          { id: 'participants', label: '6 Seats & Score Fix', icon: <Users className="w-4 h-4" /> },
          { id: 'rules', label: 'Round Rules', icon: <FileText className="w-4 h-4" /> },
          { id: 'backup', label: 'Backup & Reset', icon: <Shield className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-amber-500 text-black border-yellow-300 shadow-md font-extrabold'
                : 'bg-[#150d24] text-amber-200/70 border-amber-500/20 hover:text-amber-100 hover:bg-[#1f1335]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ---------------- 1. ROUND 1: DIRECT & PASS ---------------- */}
      {activeTab === 'round1' && (
        <div className="p-6 rounded-3xl bg-[#140c24] border-2 border-amber-500/30 space-y-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold font-cinzel text-amber-200">
                Round 1 Questions (Direct &amp; Pass)
              </h3>
              <p className="text-xs text-amber-200/70">
                {round1Questions.length} Questions configured. Direct answer: +10 pts. Pass answer: +5 pts (max 1 pass).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddR1(!showAddR1)}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddR1 ? 'Close Form' : 'Add Direct Question'}</span>
              </button>
              <button
                onClick={handleSaveRound1}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <Save className="w-4 h-4" />
                <span>Save All Changes</span>
              </button>
            </div>
          </div>

          {/* Add Question Form */}
          {showAddR1 && (
            <form onSubmit={handleAddRound1Submit} className="p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/50 space-y-3 animate-fadeIn">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Add New Round 1 Direct Question
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-amber-300 font-semibold uppercase">Question Text</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Which transcendental river flows beside the holy town of Gokul?"
                    value={newR1.question}
                    onChange={(e) => setNewR1({ ...newR1, question: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-lg bg-black/60 border border-amber-500/30 text-xs text-amber-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-amber-300 font-semibold uppercase">Assigned Seat (1-6)</label>
                  <select
                    value={newR1.assignedSeat}
                    onChange={(e) => setNewR1({ ...newR1, assignedSeat: parseInt(e.target.value, 10) })}
                    className="w-full mt-1 p-2.5 rounded-lg bg-black/60 border border-amber-500/30 text-xs text-amber-200"
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>Seat #{num}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-amber-300 font-semibold uppercase">Correct Answer</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Yamuna River (Kalindi)"
                    value={newR1.correctAnswer}
                    onChange={(e) => setNewR1({ ...newR1, correctAnswer: e.target.value })}
                    className="w-full mt-1 p-2 rounded-lg bg-black/60 border border-amber-500/30 text-xs text-emerald-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-amber-300 font-semibold uppercase">Explanation / Purport</label>
                  <input
                    type="text"
                    placeholder="e.g. Yamuna Maharani is the transcendental sister of Yamaraja..."
                    value={newR1.explanation}
                    onChange={(e) => setNewR1({ ...newR1, explanation: e.target.value })}
                    className="w-full mt-1 p-2 rounded-lg bg-black/60 border border-amber-500/30 text-xs text-amber-100"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow"
              >
                Save &amp; Append Question
              </button>
            </form>
          )}

          {/* Question List */}
          <div className="space-y-4">
            {round1Questions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 space-y-3 relative group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Q#{idx + 1}
                    </span>
                    <span>Direct for Seat #{q.assignedSeat}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteRound1(q.id)}
                    className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/40 transition-colors flex items-center gap-1 text-[11px]"
                    title="Delete question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                <div>
                  <label className="text-[10px] text-amber-300/80 font-semibold uppercase">Question Text</label>
                  <textarea
                    rows={2}
                    value={q.question}
                    onChange={(e) => {
                      const updated = [...round1Questions];
                      updated[idx].question = e.target.value;
                      setRound1Questions(updated);
                    }}
                    className="w-full mt-1 p-2.5 rounded-lg bg-black/60 border border-amber-500/30 text-xs text-amber-100 font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="text-[10px] text-amber-300/80 font-semibold uppercase">Correct Answer</label>
                    <input
                      type="text"
                      value={q.correctAnswer}
                      onChange={(e) => {
                        const updated = [...round1Questions];
                        updated[idx].correctAnswer = e.target.value;
                        setRound1Questions(updated);
                      }}
                      className="w-full mt-1 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-amber-300/80 font-semibold uppercase">Explanation / Purport</label>
                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => {
                        const updated = [...round1Questions];
                        updated[idx].explanation = e.target.value;
                        setRound1Questions(updated);
                      }}
                      className="w-full mt-1 p-2 rounded-lg bg-black/60 border border-amber-500/30 text-xs text-amber-100"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- 2. ROUND 2: RAPID FIRE BLITZ ---------------- */}
      {activeTab === 'round2' && (
        <div className="p-6 rounded-3xl bg-[#140c24] border-2 border-amber-500/30 space-y-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold font-cinzel text-amber-200">
                Round 2 Rapid Fire Sets (6 Sets • 10 Questions Each)
              </h3>
              <p className="text-xs text-amber-200/70">
                Each seat has 10 rapid fire questions timed for 60 seconds (+10 pts per correct answer).
              </p>
            </div>
            <button
              onClick={handleSaveRound2}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Save className="w-4 h-4" />
              <span>Save Rapid Fire Sets</span>
            </button>
          </div>

          <div className="space-y-6">
            {round2Sets.map((set) => (
              <div
                key={set.seatNumber}
                className="p-5 rounded-2xl bg-black/40 border border-amber-500/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-amber-300 font-cinzel flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Seat #{set.seatNumber} Rapid Fire Set ({set.questions.length} Questions)</span>
                  </span>
                  <button
                    onClick={() =>
                      setShowAddR2Seat(showAddR2Seat === set.seatNumber ? null : set.seatNumber)
                    }
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question to Seat #{set.seatNumber}</span>
                  </button>
                </div>

                {showAddR2Seat === set.seatNumber && (
                  <form
                    onSubmit={(e) => handleAddRound2Submit(set.seatNumber, e)}
                    className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-2 animate-fadeIn"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="md:col-span-2">
                        <label className="text-[10px] text-amber-300 uppercase font-semibold">Question</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. In which year was ISKCON founded?"
                          value={newR2Question.question}
                          onChange={(e) => setNewR2Question({ ...newR2Question, question: e.target.value })}
                          className="w-full mt-1 p-2 rounded-lg bg-black/60 border border-amber-500/30 text-xs text-amber-100"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-amber-300 uppercase font-semibold">Answer</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 1966"
                          value={newR2Question.answer}
                          onChange={(e) => setNewR2Question({ ...newR2Question, answer: e.target.value })}
                          className="w-full mt-1 p-2 rounded-lg bg-black/60 border border-amber-500/30 text-xs text-emerald-300 font-bold"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-extrabold text-xs"
                    >
                      Add to Set
                    </button>
                  </form>
                )}

                <div className="space-y-2">
                  {set.questions.map((rq, qIdx) => (
                    <div
                      key={rq.id || qIdx}
                      className="p-2.5 rounded-lg bg-black/60 border border-amber-500/20 text-xs grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
                    >
                      <div className="md:col-span-1 text-amber-400 font-bold">
                        Q{qIdx + 1}
                      </div>
                      <div className="md:col-span-7">
                        <input
                          type="text"
                          value={rq.question}
                          onChange={(e) => {
                            const updatedSets = round2Sets.map((s) => {
                              if (s.seatNumber === set.seatNumber) {
                                const newQs = [...s.questions];
                                newQs[qIdx] = { ...newQs[qIdx], question: e.target.value };
                                return { ...s, questions: newQs };
                              }
                              return s;
                            });
                            setRound2Sets(updatedSets);
                          }}
                          className="w-full p-1.5 rounded bg-black/40 border border-amber-500/20 text-xs text-amber-100"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <input
                          type="text"
                          value={rq.answer}
                          onChange={(e) => {
                            const updatedSets = round2Sets.map((s) => {
                              if (s.seatNumber === set.seatNumber) {
                                const newQs = [...s.questions];
                                newQs[qIdx] = { ...newQs[qIdx], answer: e.target.value };
                                return { ...s, questions: newQs };
                              }
                              return s;
                            });
                            setRound2Sets(updatedSets);
                          }}
                          className="w-full p-1.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 font-bold"
                        />
                      </div>
                      <div className="md:col-span-1 flex justify-end">
                        <button
                          onClick={() => handleDeleteRound2(set.seatNumber, rq.id)}
                          className="p-1 text-rose-400 hover:text-rose-300"
                          title="Delete question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- 3. ROUND 3: BUZZER QUESTIONS ---------------- */}
      {activeTab === 'round3' && (
        <div className="p-6 rounded-3xl bg-[#140c24] border-2 border-amber-500/30 space-y-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold font-cinzel text-amber-200">
                Round 3 Buzzer Questions (+15 / -5)
              </h3>
              <p className="text-xs text-amber-200/70">
                {round3Questions.length} Questions loaded for the high-voltage buzzer round. Correct: +15 pts. Wrong: -5 pts.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddR3(!showAddR3)}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddR3 ? 'Close Form' : 'Add Buzzer Question'}</span>
              </button>
              <button
                onClick={handleSaveRound3}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <Save className="w-4 h-4" />
                <span>Save Buzzer Questions</span>
              </button>
            </div>
          </div>

          {showAddR3 && (
            <form onSubmit={handleAddRound3Submit} className="p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/50 space-y-3 animate-fadeIn">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Add New Buzzer Question
              </h4>
              <div>
                <label className="text-[10px] text-amber-300 font-semibold uppercase">Question Text</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Which transcendental scripture was printed first by Srila Prabhupada in 1944?"
                  value={newR3.question}
                  onChange={(e) => setNewR3({ ...newR3, question: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-lg bg-black/60 border border-amber-500/30 text-xs text-amber-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((letter, idx) => (
                  <div key={letter}>
                    <div className="flex items-center justify-between text-[10px] text-amber-300 font-semibold uppercase">
                      <span>Option {letter}</span>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="newR3Correct"
                          checked={newR3.correctOptionIndex === idx}
                          onChange={() => setNewR3({ ...newR3, correctOptionIndex: idx })}
                        />
                        <span className="text-emerald-400 font-bold">Mark Correct</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      required
                      value={newR3.options[idx]}
                      onChange={(e) => {
                        const newOpts = [...newR3.options];
                        newOpts[idx] = e.target.value;
                        setNewR3({ ...newR3, options: newOpts });
                      }}
                      className="w-full mt-1 p-2 rounded-lg bg-black/60 border border-amber-500/30 text-xs text-amber-100"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[10px] text-amber-300 font-semibold uppercase">Explanation / Purport</label>
                <input
                  type="text"
                  placeholder="e.g. Back to Godhead magazine in English single-handedly..."
                  value={newR3.explanation}
                  onChange={(e) => setNewR3({ ...newR3, explanation: e.target.value })}
                  className="w-full mt-1 p-2 rounded-lg bg-black/60 border border-amber-500/30 text-xs text-amber-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow"
              >
                Save &amp; Append Buzzer Question
              </button>
            </form>
          )}

          <div className="space-y-4">
            {round3Questions.map((bq, idx) => (
              <div
                key={bq.id || idx}
                className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 space-y-3"
              >
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase">
                  <span>Buzzer Question #{idx + 1}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400">
                      Correct: #{bq.correctOptionIndex + 1} ({['A', 'B', 'C', 'D'][bq.correctOptionIndex]})
                    </span>
                    <button
                      onClick={() => handleDeleteRound3(bq.id)}
                      className="text-rose-400 hover:text-rose-300 p-1 flex items-center gap-1 text-[11px]"
                      title="Delete question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={bq.question}
                  onChange={(e) => {
                    const updated = [...round3Questions];
                    updated[idx].question = e.target.value;
                    setRound3Questions(updated);
                  }}
                  className="w-full p-2.5 rounded-lg bg-black/60 border border-amber-500/30 text-xs text-amber-100"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {bq.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                        oIdx === bq.correctOptionIndex
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold'
                          : 'bg-black/40 border-amber-500/20 text-amber-200'
                      }`}
                    >
                      <span className="font-bold text-amber-400 w-5">{['A', 'B', 'C', 'D'][oIdx]}:</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...round3Questions];
                          updated[idx].options[oIdx] = e.target.value;
                          setRound3Questions(updated);
                        }}
                        className="flex-1 bg-transparent border-0 text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...round3Questions];
                          updated[idx].correctOptionIndex = oIdx;
                          setRound3Questions(updated);
                        }}
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          oIdx === bq.correctOptionIndex
                            ? 'bg-emerald-500 text-black font-extrabold'
                            : 'bg-black/60 text-amber-400/60 hover:text-amber-300'
                        }`}
                      >
                        Correct
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- 4. TIE-BREAKER (FASTEST-FINGER-FIRST) ---------------- */}
      {activeTab === 'tiebreaker' && (
        <div className="p-6 rounded-3xl bg-[#140c24] border-2 border-amber-500/30 space-y-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold font-cinzel text-amber-200">
                Tie-Breaker: Fastest-Finger-First Questions
              </h3>
              <p className="text-xs text-amber-200/70">
                {tieBreakerQuestions.length} Questions loaded for sudden-death speed battles between tied participants.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddTB(!showAddTB)}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddTB ? 'Close Form' : 'Add Tie-Breaker Question'}</span>
              </button>
              <button
                onClick={handleSaveTieBreaker}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <Save className="w-4 h-4" />
                <span>Save Tie-Breaker Questions</span>
              </button>
            </div>
          </div>

          {showAddTB && (
            <form onSubmit={handleAddTieBreakerSubmit} className="p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/50 space-y-3 animate-fadeIn">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Add New Fastest-Finger-First Question
              </h4>
              <input
                type="text"
                required
                placeholder="Question text..."
                value={newTB.question}
                onChange={(e) => setNewTB({ ...newTB, question: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-black/60 border border-amber-500/30 text-xs text-amber-100"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((letter, idx) => (
                  <div key={letter}>
                    <div className="flex items-center justify-between text-[10px] text-amber-300 font-semibold uppercase">
                      <span>Option {letter}</span>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="newTBCorrect"
                          checked={newTB.correctOptionIndex === idx}
                          onChange={() => setNewTB({ ...newTB, correctOptionIndex: idx })}
                        />
                        <span className="text-emerald-400 font-bold">Mark Correct</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      required
                      value={newTB.options[idx]}
                      onChange={(e) => {
                        const opts = [...newTB.options];
                        opts[idx] = e.target.value;
                        setNewTB({ ...newTB, options: opts });
                      }}
                      className="w-full mt-1 p-2 rounded-lg bg-black/60 border border-amber-500/30 text-xs text-amber-100"
                    />
                  </div>
                ))}
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow"
              >
                Save Tie-Breaker Question
              </button>
            </form>
          )}

          <div className="space-y-4">
            {tieBreakerQuestions.map((tb, idx) => (
              <div
                key={tb.id || idx}
                className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 space-y-3"
              >
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase">
                  <span>Tie-Breaker #{idx + 1}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400">
                      Correct: #{tb.correctOptionIndex + 1} ({['A', 'B', 'C', 'D'][tb.correctOptionIndex]})
                    </span>
                    <button
                      onClick={() => handleDeleteTieBreaker(tb.id)}
                      className="text-rose-400 hover:text-rose-300 p-1 flex items-center gap-1 text-[11px]"
                      title="Delete question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={tb.question}
                  onChange={(e) => {
                    const updated = [...tieBreakerQuestions];
                    updated[idx].question = e.target.value;
                    setTieBreakerQuestions(updated);
                  }}
                  className="w-full p-2.5 rounded-lg bg-black/60 border border-amber-500/30 text-xs text-amber-100"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tb.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                        oIdx === tb.correctOptionIndex
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold'
                          : 'bg-black/40 border-amber-500/20 text-amber-200'
                      }`}
                    >
                      <span className="font-bold text-amber-400 w-5">{['A', 'B', 'C', 'D'][oIdx]}:</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...tieBreakerQuestions];
                          updated[idx].options[oIdx] = e.target.value;
                          setTieBreakerQuestions(updated);
                        }}
                        className="flex-1 bg-transparent border-0 text-xs focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- 5. WHOLE QUESTION BANK BULK JSON EDITOR ---------------- */}
      {activeTab === 'bulk' && (
        <div className="p-6 rounded-3xl bg-[#140c24] border-2 border-amber-500/30 space-y-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold font-cinzel text-amber-200 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-amber-400" />
                <span>Whole Quiz Question Bank Bulk Editor (JSON)</span>
              </h3>
              <p className="text-xs text-amber-200/70">
                View, modify, or paste your entire tournament question bank in one go. Validates syntax before live update.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyBulkJSON}
                className="px-3.5 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <Copy className="w-4 h-4" />
                <span>Copy JSON</span>
              </button>
              <button
                onClick={handleApplyBulkJSON}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>Validate &amp; Apply Whole Bank</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              rows={22}
              value={bulkJSON}
              onChange={(e) => setBulkJSON(e.target.value)}
              className="w-full p-4 rounded-2xl bg-black/80 border-2 border-amber-500/40 font-mono text-xs text-amber-100 leading-relaxed focus:outline-none focus:border-amber-400 shadow-inner"
              spellCheck={false}
            />
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-amber-500/20 text-xs text-amber-200/80 space-y-1">
            <div className="font-bold text-amber-300">💡 Format Schema Guide:</div>
            <div>• <code className="text-amber-400">round1Questions</code>: Array of &#123; id, question, correctAnswer, assignedSeat, explanation, category &#125;</div>
            <div>• <code className="text-amber-400">round2Sets</code>: Array of 6 objects &#123; seatNumber (1-6), questions: [ &#123; id, question, answer &#125; ] &#125;</div>
            <div>• <code className="text-amber-400">round3Questions</code>: Array of &#123; id, question, options: [A,B,C,D], correctOptionIndex (0-3), explanation &#125;</div>
            <div>• <code className="text-amber-400">tieBreakerQuestions</code>: Array of &#123; id, question, options, correctOptionIndex, explanation &#125;</div>
          </div>
        </div>
      )}

      {/* ---------------- 6. 6 SEATS & DIRECT SCORE CORRECTION ---------------- */}
      {activeTab === 'participants' && (
        <div className="p-6 rounded-3xl bg-[#140c24] border-2 border-amber-500/30 space-y-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold font-cinzel text-amber-200">
                6 Contestant Seats Configuration &amp; Score Correction
              </h3>
              <p className="text-xs text-amber-200/70">
                Configure name, spiritual title, and avatar for each seat, or manually remove mistakenly added score points.
              </p>
            </div>
            <button
              onClick={handleResetCheckIns}
              className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Check-Ins</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {participants.map((p, idx) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400 uppercase">Seat #{p.seatNumber}</span>
                    {p.isClaimed ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Claimed: {p.claimedName || p.name}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 text-[10px] font-bold border border-slate-500/30">
                        Waiting to Join...
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {p.isClaimed && (
                      <button
                        onClick={() => handleReleaseSeat(p.seatNumber)}
                        className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 font-bold text-[10px]"
                        title="Release this seat so another contestant can claim it"
                      >
                        Release Seat
                      </button>
                    )}
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-extrabold border border-amber-500/30">
                      Total: {p.totalScore} pts
                    </span>
                    <button
                      onClick={() => handleSaveParticipant(p)}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold text-[11px]"
                    >
                      Save Seat
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="text-[10px] text-amber-300 uppercase font-semibold">Avatar</label>
                    <input
                      type="text"
                      value={p.avatar}
                      onChange={(e) => {
                        const updated = [...participants];
                        updated[idx].avatar = e.target.value;
                        setParticipants(updated);
                      }}
                      className="w-full mt-1 p-2 rounded-lg bg-black/60 border border-amber-500/30 text-center text-lg"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] text-amber-300 uppercase font-semibold">Display Name</label>
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => {
                        const updated = [...participants];
                        updated[idx].name = e.target.value;
                        setParticipants(updated);
                      }}
                      className="w-full mt-1 p-2 rounded-lg bg-black/60 border border-amber-500/30 text-xs text-amber-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-amber-300 uppercase font-semibold">Spiritual Name</label>
                  <input
                    type="text"
                    value={p.spiritualName}
                    onChange={(e) => {
                      const updated = [...participants];
                      updated[idx].spiritualName = e.target.value;
                      setParticipants(updated);
                    }}
                    className="w-full mt-1 p-2 rounded-lg bg-black/60 border border-amber-500/30 text-xs text-amber-100"
                  />
                </div>

                {/* Score Mistake Removal Tool for this seat */}
                <div className="pt-2 border-t border-amber-500/20 space-y-1.5">
                  <div className="text-[10px] text-amber-300/80 font-bold uppercase">
                    Mistake Correction (Quick Deduct):
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => handleAdjustParticipantScore(p.id, 'round1', -10)}
                      className="px-2 py-1 rounded bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[10px] font-bold"
                    >
                      -10 (R1)
                    </button>
                    <button
                      onClick={() => handleAdjustParticipantScore(p.id, 'round1', -5)}
                      className="px-2 py-1 rounded bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[10px] font-bold"
                    >
                      -5 (Pass)
                    </button>
                    <button
                      onClick={() => handleAdjustParticipantScore(p.id, 'round2', -10)}
                      className="px-2 py-1 rounded bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[10px] font-bold"
                    >
                      -10 (R2)
                    </button>
                    <button
                      onClick={() => handleAdjustParticipantScore(p.id, 'round3', -15)}
                      className="px-2 py-1 rounded bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[10px] font-bold"
                    >
                      -15 (R3)
                    </button>
                    <button
                      onClick={() => handleAdjustParticipantScore(p.id, 'round3', +5)}
                      className="px-2 py-1 rounded bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold"
                      title="Undo -5 penalty"
                    >
                      +5 (Undo Penalty)
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- 7. RULES EDITOR ---------------- */}
      {activeTab === 'rules' && (
        <div className="p-6 rounded-3xl bg-[#140c24] border-2 border-amber-500/30 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-cinzel text-amber-200">
                Pre-Round Rules Customization
              </h3>
              <p className="text-xs text-amber-200/70">
                These rules are displayed on the Presenter screen and mobile screens before each round begins.
              </p>
            </div>
            <button
              onClick={handleSaveRules}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Save className="w-4 h-4" />
              <span>Save Rules</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-amber-400 uppercase">Round 1 Rules (Direct &amp; Pass)</label>
              <textarea
                rows={5}
                value={rules.round1}
                onChange={(e) => setRules({ ...rules, round1: e.target.value })}
                className="w-full mt-1.5 p-3 rounded-xl bg-black/50 border border-amber-500/30 text-amber-100 text-xs sm:text-sm font-sans"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-amber-400 uppercase">Round 2 Rules (Rapid Fire Blitz)</label>
              <textarea
                rows={5}
                value={rules.round2}
                onChange={(e) => setRules({ ...rules, round2: e.target.value })}
                className="w-full mt-1.5 p-3 rounded-xl bg-black/50 border border-amber-500/30 text-amber-100 text-xs sm:text-sm font-sans"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-amber-400 uppercase">Round 3 Rules (Buzzer Round)</label>
              <textarea
                rows={5}
                value={rules.round3}
                onChange={(e) => setRules({ ...rules, round3: e.target.value })}
                className="w-full mt-1.5 p-3 rounded-xl bg-black/50 border border-amber-500/30 text-amber-100 text-xs sm:text-sm font-sans"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-amber-400 uppercase">Tie-Breaker Rules (Fastest-Finger-First)</label>
              <textarea
                rows={4}
                value={rules.tieBreaker}
                onChange={(e) => setRules({ ...rules, tieBreaker: e.target.value })}
                className="w-full mt-1.5 p-3 rounded-xl bg-black/50 border border-amber-500/30 text-amber-100 text-xs sm:text-sm font-sans"
              />
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 8. BACKUP & RESTORE ---------------- */}
      {activeTab === 'backup' && (
        <div className="p-6 rounded-3xl bg-[#140c24] border-2 border-amber-500/30 space-y-6 shadow-xl">
          <div>
            <h3 className="text-lg font-bold font-cinzel text-amber-200">
              Quiz State &amp; Question Bank Maintenance
            </h3>
            <p className="text-xs text-amber-200/70">
              Export full settings to JSON for local backup, or reset scores for a new tournament.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export */}
            <div className="p-5 rounded-2xl bg-black/40 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                <Download className="w-5 h-5 text-amber-400" />
                <span>Export Quiz Configuration</span>
              </div>
              <p className="text-xs text-amber-200/70">
                Downloads a single JSON file containing all questions, custom rules, and participant configs.
              </p>
              <button
                onClick={handleExportJSON}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs shadow"
              >
                Export to JSON File
              </button>
            </div>

            {/* Import */}
            <div className="p-5 rounded-2xl bg-black/40 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                <Upload className="w-5 h-5 text-amber-400" />
                <span>Import Quiz Configuration</span>
              </div>
              <p className="text-xs text-amber-200/70">
                Upload a previously exported JSON file to load questions and rules immediately.
              </p>
              <label className="w-full py-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 font-bold text-xs text-center block cursor-pointer">
                Select JSON File
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset Scores */}
            <div className="p-5 rounded-2xl bg-black/40 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                <span>Reset Current Match Scores</span>
              </div>
              <p className="text-xs text-amber-200/70">
                Resets all 6 participant scores to 0 while preserving your questions and rules.
              </p>
              <button
                onClick={handleResetScores}
                className="w-full py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 font-bold text-xs"
              >
                Reset Scores to 0
              </button>
            </div>

            {/* Restore Authentic Bank */}
            <div className="p-5 rounded-2xl bg-black/40 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                <Shield className="w-5 h-5 text-amber-400" />
                <span>Restore Authentic Prabhupada Bank</span>
              </div>
              <p className="text-xs text-amber-200/70">
                Re-seeds the authentic Srila Prabhupada &amp; Viplava 2026 Mathura-Gokul questions and rules.
              </p>
              <button
                onClick={handleRestoreDefaults}
                className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs"
              >
                Restore Authentic Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
