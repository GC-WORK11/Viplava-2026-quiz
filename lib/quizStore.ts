import { QuizState, QuizPhase, Participant, QuestionRound1, RapidFireSet, BuzzerQuestion, TieBreakerQuestion, QuizRules } from './types';
import { INITIAL_QUIZ_STATE } from './defaultData';

// Global singleton state in Node server environment
declare global {
  var __GLOBAL_QUIZ_STATE__: QuizState | undefined;
  var __QUIZ_LISTENERS__: Set<(state: QuizState) => void> | undefined;
}

if (!global.__GLOBAL_QUIZ_STATE__) {
  global.__GLOBAL_QUIZ_STATE__ = JSON.parse(JSON.stringify(INITIAL_QUIZ_STATE));
}

if (!global.__QUIZ_LISTENERS__) {
  global.__QUIZ_LISTENERS__ = new Set();
}

function broadcastChange() {
  if (global.__GLOBAL_QUIZ_STATE__) {
    global.__GLOBAL_QUIZ_STATE__.version += 1;
    global.__GLOBAL_QUIZ_STATE__.updatedAt = Date.now();
    const cloned = JSON.parse(JSON.stringify(global.__GLOBAL_QUIZ_STATE__));
    global.__QUIZ_LISTENERS__?.forEach((cb) => {
      try {
        cb(cloned);
      } catch (e) {
        console.error('Error broadcasting to listener', e);
      }
    });
  }
}

export const quizStore = {
  getState: (): QuizState => {
    return JSON.parse(JSON.stringify(global.__GLOBAL_QUIZ_STATE__!));
  },

  subscribe: (cb: (state: QuizState) => void) => {
    global.__QUIZ_LISTENERS__?.add(cb);
    return () => {
      global.__QUIZ_LISTENERS__?.delete(cb);
    };
  },

  setPhase: (phase: QuizPhase) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.phase = phase;

    // Reset timer according to phase defaults
    if (phase === 'ROUND_1_ACTIVE') {
      state.timer.initialSeconds = 30;
      state.timer.secondsLeft = 30;
      state.timer.isRunning = false;
    } else if (phase === 'ROUND_2_ACTIVE') {
      state.timer.initialSeconds = 60;
      state.timer.secondsLeft = 60;
      state.timer.isRunning = false;
    } else if (phase === 'ROUND_3_ACTIVE') {
      state.timer.initialSeconds = 30;
      state.timer.secondsLeft = 30;
      state.timer.isRunning = false;
      state.buzzerState.isUnlocked = false;
      state.buzzerState.buzzedParticipantId = null;
      state.buzzerState.status = 'IDLE';
    }

    broadcastChange();
    return quizStore.getState();
  },

  setTimer: (secondsLeft: number, isRunning: boolean) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.timer.secondsLeft = secondsLeft;
    state.timer.isRunning = isRunning;
    state.timer.lastUpdated = Date.now();
    broadcastChange();
    return quizStore.getState();
  },

  // ---------------- ROUND 1: DIRECT & PASS ----------------
  setRound1Question: (questionIndex: number) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    const q = state.round1Questions[questionIndex];
    const initialSeat = q ? q.assignedSeat : 1;

    state.round1State = {
      currentQuestionIndex: questionIndex,
      targetSeat: initialSeat,
      isPassed: false,
      passCount: 0,
      isAnswerRevealed: false,
      selectedOptionIndex: null,
      status: 'DIRECT',
    };
    state.timer.secondsLeft = 30;
    state.timer.initialSeconds = 30;
    state.timer.isRunning = false;

    broadcastChange();
    return quizStore.getState();
  },

  selectRound1Option: (optionIndex: number) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.round1State.selectedOptionIndex = optionIndex;
    broadcastChange();
    return quizStore.getState();
  },

  passRound1Question: () => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    if (state.round1State.passCount >= 1) {
      // Max 1 pass allowed
      return quizStore.getState();
    }

    const currentSeat = state.round1State.targetSeat;
    const nextSeat = (currentSeat % 6) + 1; // 1->2, 2->3, 3->4, 4->5, 5->6, 6->1

    state.round1State.targetSeat = nextSeat;
    state.round1State.isPassed = true;
    state.round1State.passCount = 1;
    state.round1State.status = 'PASSED';
    state.timer.secondsLeft = 15; // 15 seconds for pass
    state.timer.initialSeconds = 15;
    state.timer.isRunning = true;

    broadcastChange();
    return quizStore.getState();
  },

  markRound1Answer: (isCorrect: boolean) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    const currentSeat = state.round1State.targetSeat;
    const participant = state.participants.find((p) => p.seatNumber === currentSeat);

    if (isCorrect && participant) {
      const points = state.round1State.isPassed ? 5 : 10;
      participant.scores.round1 += points;
      participant.totalScore += points;
      state.round1State.isAnswerRevealed = true;
      state.round1State.status = 'REVEALED';
      state.timer.isRunning = false;

      state.lastScoreChange = {
        participantId: participant.id,
        round: 'round1',
        delta: points,
        description: state.round1State.isPassed ? `Round 1 Pass Correct (+${points})` : `Round 1 Direct Correct (+${points})`,
        timestamp: Date.now(),
      };
    } else if (!isCorrect) {
      // If direct missed and hasn't passed yet, prompt host to pass or reveal
      if (state.round1State.passCount >= 1) {
        state.round1State.isAnswerRevealed = true;
        state.round1State.status = 'REVEALED';
        state.timer.isRunning = false;
      }
    }

    broadcastChange();
    return quizStore.getState();
  },

  revealRound1Answer: () => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.round1State.isAnswerRevealed = true;
    state.round1State.status = 'REVEALED';
    state.timer.isRunning = false;
    broadcastChange();
    return quizStore.getState();
  },

  // ---------------- ROUND 2: RAPID FIRE ----------------
  setRapidFireSeat: (seatNumber: number) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.round2State = {
      currentSeat: seatNumber,
      currentQuestionIndex: 0,
      correctCount: 0,
      passedCount: 0,
      answers: [],
      isCompleted: false,
    };
    state.timer.secondsLeft = 60;
    state.timer.initialSeconds = 60;
    state.timer.isRunning = false;

    broadcastChange();
    return quizStore.getState();
  },

  recordRapidFireAnswer: (isCorrect: boolean) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    const participant = state.participants.find((p) => p.seatNumber === state.round2State.currentSeat);

    if (isCorrect && participant) {
      participant.scores.round2 += 10;
      participant.totalScore += 10;
      state.round2State.correctCount += 1;

      state.lastScoreChange = {
        participantId: participant.id,
        round: 'round2',
        delta: 10,
        description: `Rapid Fire Q${state.round2State.currentQuestionIndex + 1} Correct (+10)`,
        timestamp: Date.now(),
      };
    } else {
      state.round2State.passedCount += 1;
    }

    state.round2State.answers.push({
      questionIndex: state.round2State.currentQuestionIndex,
      isCorrect,
    });

    if (state.round2State.currentQuestionIndex < 9) {
      state.round2State.currentQuestionIndex += 1;
    } else {
      state.round2State.isCompleted = true;
      state.timer.isRunning = false;
    }

    broadcastChange();
    return quizStore.getState();
  },

  // ---------------- ROUND 3: BUZZER ROUND ----------------
  setRound3Question: (questionIndex: number) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.round3State.currentQuestionIndex = questionIndex;
    state.round3State.isAnswerRevealed = false;

    state.buzzerState = {
      isUnlocked: false,
      buzzedParticipantId: null,
      buzzedAt: null,
      buzzHistory: [],
      status: 'IDLE',
      selectedOptionIndex: null,
      selectedAt: null,
    };
    state.timer.secondsLeft = 30;
    state.timer.initialSeconds = 30;
    state.timer.isRunning = false;

    broadcastChange();
    return quizStore.getState();
  },

  unlockBuzzer: () => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.buzzerState.isUnlocked = true;
    state.buzzerState.buzzedParticipantId = null;
    state.buzzerState.buzzedAt = null;
    state.buzzerState.selectedOptionIndex = null;
    state.buzzerState.selectedAt = null;
    state.buzzerState.status = 'UNLOCKED';
    state.timer.isRunning = true;

    broadcastChange();
    return quizStore.getState();
  },

  lockBuzzer: () => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.buzzerState.isUnlocked = false;
    if (state.buzzerState.status === 'UNLOCKED') {
      state.buzzerState.status = 'IDLE';
    }
    broadcastChange();
    return quizStore.getState();
  },

  selectBuzzerOption: (participantId: string, optionIndex: number) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.buzzerState.selectedOptionIndex = optionIndex;
    state.buzzerState.selectedAt = Date.now();
    if (!state.buzzerState.buzzedParticipantId) {
      state.buzzerState.buzzedParticipantId = participantId;
      state.buzzerState.status = 'BUZZED';
    }
    broadcastChange();
    return quizStore.getState();
  },

  pressBuzzer: (participantId: string) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    const now = Date.now();

    if (state.isPaused) {
      return { success: false, reason: 'Round is currently paused by the Host' };
    }

    if (!state.buzzerState.isUnlocked) {
      return {
        success: false,
        reason: state.buzzerState.buzzedParticipantId ? 'Another participant buzzed in first' : 'Buzzer is currently locked',
        buzzedBy: state.buzzerState.buzzedParticipantId,
      };
    }

    // Atomic first lock
    if (state.buzzerState.buzzedParticipantId === null) {
      state.buzzerState.buzzedParticipantId = participantId;
      state.buzzerState.buzzedAt = now;
      state.buzzerState.isUnlocked = false; // Lock out others
      state.buzzerState.status = 'BUZZED';
      state.buzzerState.selectedOptionIndex = null;
      state.buzzerState.selectedAt = null;
      state.buzzerState.buzzHistory.push({ participantId, timestamp: now });
      state.timer.isRunning = false;

      broadcastChange();
      return { success: true, buzzedFirst: true, buzzedAt: now };
    }

    // Already buzzed by someone else, record in history
    state.buzzerState.buzzHistory.push({ participantId, timestamp: now });
    return {
      success: false,
      reason: 'Another participant buzzed in first',
      buzzedBy: state.buzzerState.buzzedParticipantId,
      timeDifferenceMs: now - (state.buzzerState.buzzedAt || now),
    };
  },

  markBuzzerAnswer: (isCorrect: boolean) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    const buzzedId = state.buzzerState.buzzedParticipantId;
    if (!buzzedId) return quizStore.getState();

    const participant = state.participants.find((p) => p.id === buzzedId);
    if (participant) {
      if (isCorrect) {
        participant.scores.round3 += 15;
        participant.totalScore += 15;
        state.round3State.isAnswerRevealed = true;
        state.buzzerState.status = 'ANSWERED';

        state.lastScoreChange = {
          participantId: participant.id,
          round: 'round3',
          delta: 15,
          description: `Buzzer Round Correct (+15)`,
          timestamp: Date.now(),
        };
      } else {
        participant.scores.round3 -= 5; // -5 negative marking
        participant.totalScore -= 5;
        state.buzzerState.status = 'IDLE';

        state.lastScoreChange = {
          participantId: participant.id,
          round: 'round3',
          delta: -5,
          description: `Buzzer Round Penalty (-5)`,
          timestamp: Date.now(),
        };
      }
    }

    broadcastChange();
    return quizStore.getState();
  },

  revealRound3Answer: () => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.round3State.isAnswerRevealed = true;
    state.buzzerState.isUnlocked = false;
    state.timer.isRunning = false;

    // Auto-evaluate if option was selected and not already evaluated
    const buzzedId = state.buzzerState.buzzedParticipantId;
    const selectedIdx = state.buzzerState.selectedOptionIndex;
    const currentQ = state.round3Questions[state.round3State.currentQuestionIndex];

    if (buzzedId && selectedIdx !== null && currentQ && state.buzzerState.status !== 'ANSWERED') {
      const isCorrect = selectedIdx === currentQ.correctOptionIndex;
      const participant = state.participants.find((p) => p.id === buzzedId);
      if (participant) {
        if (isCorrect) {
          participant.scores.round3 += 15;
          participant.totalScore += 15;
          state.buzzerState.status = 'ANSWERED';
          state.lastScoreChange = {
            participantId: participant.id,
            round: 'round3',
            delta: 15,
            description: `Buzzer Round Correct (+15)`,
            timestamp: Date.now(),
          };
        } else {
          participant.scores.round3 -= 5;
          participant.totalScore -= 5;
          state.buzzerState.status = 'IDLE';
          state.lastScoreChange = {
            participantId: participant.id,
            round: 'round3',
            delta: -5,
            description: `Buzzer Round Penalty (-5)`,
            timestamp: Date.now(),
          };
        }
      }
    }

    broadcastChange();
    return quizStore.getState();
  },

  // ---------------- TIE BREAKER: FASTEST FINGER FIRST ----------------
  initTieBreaker: (tiedParticipantIds: string[]) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.tieBreakerState = {
      currentQuestionIndex: 0,
      tiedParticipantIds,
      submissions: {},
      isCompleted: false,
      winnerParticipantId: null,
    };
    state.timer.secondsLeft = 20;
    state.timer.initialSeconds = 20;
    state.timer.isRunning = true;

    broadcastChange();
    return quizStore.getState();
  },

  submitTieBreakerAnswer: (participantId: string, optionIndex: number, timeTakenMs: number) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    const question = state.tieBreakerQuestions[state.tieBreakerState.currentQuestionIndex];
    if (!question) return quizStore.getState();

    const isCorrect = optionIndex === question.correctOptionIndex;

    state.tieBreakerState.submissions[participantId] = {
      participantId,
      selectedOptionIndex: optionIndex,
      timeTakenMs,
      isCorrect,
      submittedAt: Date.now(),
    };

    // Check if all tied participants have submitted or calculate winner
    const tiedCount = state.tieBreakerState.tiedParticipantIds.length;
    const submittedCount = Object.keys(state.tieBreakerState.submissions).length;

    if (submittedCount >= tiedCount) {
      // Find fastest correct
      const correctSubmissions = Object.values(state.tieBreakerState.submissions)
        .filter((s) => s.isCorrect)
        .sort((a, b) => a.timeTakenMs - b.timeTakenMs);

      if (correctSubmissions.length > 0) {
        const winner = correctSubmissions[0];
        state.tieBreakerState.winnerParticipantId = winner.participantId;
        state.tieBreakerState.isCompleted = true;

        const winnerParticipant = state.participants.find((p) => p.id === winner.participantId);
        if (winnerParticipant) {
          winnerParticipant.scores.tieBreaker += 10;
          winnerParticipant.totalScore += 10;
        }
      }
    }

    broadcastChange();
    return quizStore.getState();
  },

  // ---------------- GENERAL CONFIGURATION & ADMIN ----------------
  updateParticipant: (id: string, updates: Partial<Participant>) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    const p = state.participants.find((item) => item.id === id);
    if (p) {
      Object.assign(p, updates);
      p.totalScore = p.scores.round1 + p.scores.round2 + p.scores.round3 + p.scores.tieBreaker;
    }
    broadcastChange();
    return quizStore.getState();
  },

  claimSeat: (seatNumber: number, customName: string) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    const p = state.participants.find((item) => item.seatNumber === seatNumber);
    if (p) {
      const trimmed = customName.trim();
      p.isClaimed = true;
      p.claimedName = trimmed || p.spiritualName;
      p.name = trimmed || p.name;
      p.spiritualName = trimmed || p.spiritualName;
      p.connected = true;
      p.lastActive = Date.now();
    }
    broadcastChange();
    return quizStore.getState();
  },

  releaseSeat: (seatNumber: number) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    const p = state.participants.find((item) => item.seatNumber === seatNumber);
    if (p) {
      p.isClaimed = false;
      p.connected = false;
    }
    broadcastChange();
    return quizStore.getState();
  },

  togglePauseRound: (isPaused: boolean, message?: string) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.isPaused = isPaused;
    if (message) state.pausedMessage = message;

    if (isPaused) {
      state.timer.isRunning = false;
      if (state.buzzerState.isUnlocked) {
        state.buzzerState.isUnlocked = false;
      }
    } else {
      if (state.timer.secondsLeft > 0) {
        state.timer.isRunning = true;
      }
      if (state.phase === 'ROUND_3_ACTIVE' && !state.round3State.isAnswerRevealed && !state.buzzerState.buzzedParticipantId) {
        state.buzzerState.isUnlocked = true;
      }
    }

    broadcastChange();
    return quizStore.getState();
  },

  undoLastScoreChange: () => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    if (state.lastScoreChange) {
      const { participantId, round, delta } = state.lastScoreChange;
      const p = state.participants.find((item) => item.id === participantId);
      if (p) {
        p.scores[round] -= delta;
        p.totalScore = p.scores.round1 + p.scores.round2 + p.scores.round3 + p.scores.tieBreaker;
      }
      state.lastScoreChange = null;
    }
    broadcastChange();
    return quizStore.getState();
  },

  adjustScoreManually: (participantId: string, round: 'round1' | 'round2' | 'round3' | 'tieBreaker', delta: number) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    const p = state.participants.find((item) => item.id === participantId);
    if (p) {
      p.scores[round] += delta;
      p.totalScore = p.scores.round1 + p.scores.round2 + p.scores.round3 + p.scores.tieBreaker;
      state.lastScoreChange = {
        participantId,
        round,
        delta,
        description: `Manual Adjustment (${delta > 0 ? '+' : ''}${delta})`,
        timestamp: Date.now(),
      };
    }
    broadcastChange();
    return quizStore.getState();
  },

  // Question CRUD methods
  addRound1Question: (q: QuestionRound1) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.round1Questions.push(q);
    broadcastChange();
    return quizStore.getState();
  },

  deleteRound1Question: (id: string) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.round1Questions = state.round1Questions.filter((q) => q.id !== id);
    if (state.round1State.currentQuestionIndex >= state.round1Questions.length) {
      state.round1State.currentQuestionIndex = Math.max(0, state.round1Questions.length - 1);
    }
    broadcastChange();
    return quizStore.getState();
  },

  addRound2Question: (seatNumber: number, q: { id: string; question: string; answer: string }) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    const set = state.round2Sets.find((s) => s.seatNumber === seatNumber);
    if (set) {
      set.questions.push(q);
    } else {
      state.round2Sets.push({ seatNumber, questions: [q] });
    }
    broadcastChange();
    return quizStore.getState();
  },

  deleteRound2Question: (seatNumber: number, id: string) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    const set = state.round2Sets.find((s) => s.seatNumber === seatNumber);
    if (set) {
      set.questions = set.questions.filter((q) => q.id !== id);
    }
    broadcastChange();
    return quizStore.getState();
  },

  addRound3Question: (q: BuzzerQuestion) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.round3Questions.push(q);
    broadcastChange();
    return quizStore.getState();
  },

  deleteRound3Question: (id: string) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.round3Questions = state.round3Questions.filter((q) => q.id !== id);
    if (state.round3State.currentQuestionIndex >= state.round3Questions.length) {
      state.round3State.currentQuestionIndex = Math.max(0, state.round3Questions.length - 1);
    }
    broadcastChange();
    return quizStore.getState();
  },

  addTieBreakerQuestion: (q: TieBreakerQuestion) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.tieBreakerQuestions.push(q);
    broadcastChange();
    return quizStore.getState();
  },

  deleteTieBreakerQuestion: (id: string) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.tieBreakerQuestions = state.tieBreakerQuestions.filter((q) => q.id !== id);
    broadcastChange();
    return quizStore.getState();
  },

  updateRules: (rules: QuizRules) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.rules = { ...rules };
    broadcastChange();
    return quizStore.getState();
  },

  updateRound1Questions: (questions: QuestionRound1[]) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.round1Questions = questions;
    broadcastChange();
    return quizStore.getState();
  },

  updateRound2Sets: (sets: RapidFireSet[]) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.round2Sets = sets;
    broadcastChange();
    return quizStore.getState();
  },

  updateRound3Questions: (questions: BuzzerQuestion[]) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.round3Questions = questions;
    broadcastChange();
    return quizStore.getState();
  },

  updateTieBreakerQuestions: (questions: TieBreakerQuestion[]) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    state.tieBreakerQuestions = questions;
    broadcastChange();
    return quizStore.getState();
  },

  bulkUpdateAllQuestions: (payload: {
    round1Questions?: QuestionRound1[];
    round2Sets?: RapidFireSet[];
    round3Questions?: BuzzerQuestion[];
    tieBreakerQuestions?: TieBreakerQuestion[];
  }) => {
    const state = global.__GLOBAL_QUIZ_STATE__!;
    if (payload.round1Questions && Array.isArray(payload.round1Questions)) {
      state.round1Questions = payload.round1Questions;
    }
    if (payload.round2Sets && Array.isArray(payload.round2Sets)) {
      state.round2Sets = payload.round2Sets;
    }
    if (payload.round3Questions && Array.isArray(payload.round3Questions)) {
      state.round3Questions = payload.round3Questions;
    }
    if (payload.tieBreakerQuestions && Array.isArray(payload.tieBreakerQuestions)) {
      state.tieBreakerQuestions = payload.tieBreakerQuestions;
    }
    broadcastChange();
    return quizStore.getState();
  },

  resetQuiz: () => {
    const currentQuestions = {
      r1: global.__GLOBAL_QUIZ_STATE__?.round1Questions,
      r2: global.__GLOBAL_QUIZ_STATE__?.round2Sets,
      r3: global.__GLOBAL_QUIZ_STATE__?.round3Questions,
      tb: global.__GLOBAL_QUIZ_STATE__?.tieBreakerQuestions,
      rules: global.__GLOBAL_QUIZ_STATE__?.rules,
      participants: global.__GLOBAL_QUIZ_STATE__?.participants.map((p) => ({
        ...p,
        totalScore: 0,
        scores: { round1: 0, round2: 0, round3: 0, tieBreaker: 0 },
      })),
    };

    const newState: QuizState = JSON.parse(JSON.stringify(INITIAL_QUIZ_STATE));
    if (currentQuestions.r1) newState.round1Questions = currentQuestions.r1;
    if (currentQuestions.r2) newState.round2Sets = currentQuestions.r2;
    if (currentQuestions.r3) newState.round3Questions = currentQuestions.r3;
    if (currentQuestions.tb) newState.tieBreakerQuestions = currentQuestions.tb;
    if (currentQuestions.rules) newState.rules = currentQuestions.rules;
    if (currentQuestions.participants) newState.participants = currentQuestions.participants;

    global.__GLOBAL_QUIZ_STATE__ = newState;
    broadcastChange();
    return quizStore.getState();
  },

  restoreDefaults: () => {
    global.__GLOBAL_QUIZ_STATE__ = JSON.parse(JSON.stringify(INITIAL_QUIZ_STATE));
    broadcastChange();
    return quizStore.getState();
  },
};
