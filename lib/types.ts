export type QuizPhase =
  | 'LOBBY'
  | 'ROUND_1_RULES'
  | 'ROUND_1_ACTIVE'
  | 'ROUND_1_LEADERBOARD'
  | 'ROUND_2_RULES'
  | 'ROUND_2_ACTIVE'
  | 'ROUND_2_LEADERBOARD'
  | 'ROUND_3_RULES'
  | 'ROUND_3_ACTIVE'
  | 'ROUND_3_LEADERBOARD'
  | 'TIE_BREAKER_RULES'
  | 'TIE_BREAKER_ACTIVE'
  | 'FINAL_PODIUM';

export interface Participant {
  id: string; // 'p1' to 'p6'
  seatNumber: number; // 1 to 6
  name: string;
  spiritualName: string;
  avatar: string; // e.g. '🦚', '🪷', '🐚', '🚩', '🕉️', '📜'
  totalScore: number;
  scores: {
    round1: number;
    round2: number;
    round3: number;
    tieBreaker: number;
  };
  connected?: boolean;
  isClaimed?: boolean;
  claimedName?: string;
  lastActive?: number;
}

export interface QuestionRound1 {
  id: string;
  question: string;
  options?: string[]; // optional MCQ options
  correctAnswer: string;
  explanation: string;
  assignedSeat: number; // seat 1 to 6 who gets direct question
  category: string;
}

export interface RapidQuestion {
  id: string;
  question: string;
  answer: string;
}

export interface RapidFireSet {
  seatNumber: number;
  questions: RapidQuestion[]; // 10 questions
}

export interface BuzzerQuestion {
  id: string;
  question: string;
  options: string[]; // 4 options
  correctOptionIndex: number;
  explanation: string;
  pointsCorrect: number; // 15
  pointsWrong: number; // -5
}

export interface TieBreakerQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface BuzzRecord {
  participantId: string;
  timestamp: number; // effective buzz time in SERVER time (clock-synced client tap, clamped) — used for fair ranking
  recvTs?: number; // when the buzz packet actually reached the server
  rttMs?: number; // client-reported round-trip estimate
  early?: boolean; // tap claimed before the scheduled open — clamped to openAt, flagged for the host
}

export interface BuzzerState {
  isUnlocked: boolean;
  buzzedParticipantId: string | null;
  buzzedAt: number | null; // effective (fair) timestamp of the winning buzz, in server time
  buzzHistory: BuzzRecord[];
  status: 'IDLE' | 'UNLOCKED' | 'BUZZED' | 'ANSWERED';
  selectedOptionIndex: number | null; // Selected option (0 to 3) before reveal
  selectedAt: number | null;
  openAtServerTs?: number | null; // scheduled buzzer-open instant in server time — all phones reveal GO together
  adjudicationEndsAt?: number | null; // brief window collecting near-simultaneous buzzes before a winner is picked
  contested?: { runnerUpParticipantId: string; marginMs: number } | null; // photo-finish flag for the host
}

export interface TieBreakerSubmission {
  participantId: string;
  selectedOptionIndex: number;
  timeTakenMs: number;
  isCorrect: boolean;
  submittedAt: number;
}

export interface Round1ActiveState {
  currentQuestionIndex: number;
  targetSeat: number; // Current seat answering (original or passed)
  isPassed: boolean;
  passCount: number; // 0 = original, 1 = passed once (max 1 pass)
  isAnswerRevealed: boolean;
  selectedOptionIndex: number | null; // Selected option (0 to 3) if question has options
  status: 'WAITING' | 'DIRECT' | 'PASSED' | 'REVEALED' | 'WRONG';
}

export interface Round2ActiveState {
  currentSeat: number; // seat 1 to 6
  currentQuestionIndex: number; // 0 to 9
  correctCount: number;
  passedCount: number;
  answers: { questionIndex: number; isCorrect: boolean }[];
  isCompleted: boolean;
}

export interface Round3ActiveState {
  currentQuestionIndex: number;
  isAnswerRevealed: boolean;
}

export interface TieBreakerActiveState {
  currentQuestionIndex: number;
  tiedParticipantIds: string[];
  submissions: Record<string, TieBreakerSubmission>;
  isCompleted: boolean;
  winnerParticipantId: string | null;
  openedAtServerTs?: number | null; // when the tie-breaker question officially opened, in server time
}

export interface QuizRules {
  round1: string;
  round2: string;
  round3: string;
  tieBreaker: string;
}

export interface QuizState {
  title: string;
  theme: string;
  location: string;
  year: string;
  phase: QuizPhase;
  timer: {
    secondsLeft: number;
    initialSeconds: number;
    isRunning: boolean;
    lastUpdated: number;
  };
  participants: Participant[];
  rules: QuizRules;
  round1Questions: QuestionRound1[];
  round2Sets: RapidFireSet[];
  round3Questions: BuzzerQuestion[];
  tieBreakerQuestions: TieBreakerQuestion[];
  
  // Active game states
  round1State: Round1ActiveState;
  round2State: Round2ActiveState;
  round3State: Round3ActiveState;
  tieBreakerState: TieBreakerActiveState;
  buzzerState: BuzzerState;

  // Pause & Resume state
  isPaused: boolean;
  pausedMessage: string;

  // Score audit for mistake correction / undo
  lastScoreChange: {
    participantId: string;
    round: 'round1' | 'round2' | 'round3' | 'tieBreaker';
    delta: number;
    description: string;
    timestamp: number;
  } | null;

  // Host URL and Network IP for QR Code scanning
  customHostUrl?: string;
  detectedNetworkIp?: string;
  serverPort?: string; // actual port the server listens on, so QRs encode the right port

  version: number;
  updatedAt: number;
}
