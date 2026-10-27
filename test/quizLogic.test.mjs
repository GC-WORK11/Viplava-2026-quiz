import test from 'node:test';
import assert from 'node:assert/strict';
import { quizStore } from '../lib/quizStore.ts';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Buzz adjudication window is 80ms; wait a bit beyond it for the winner to settle.
const waitForBuzz = () => sleep(150);

test('QuizStore initialization has 6 participants and default state', () => {
  const state = quizStore.getState();
  assert.equal(state.participants.length, 6);
  assert.equal(state.participants[0].totalScore, 0);
  assert.equal(state.phase, 'LOBBY');
});

test('Round 1: Direct correct answer awards +10 points to target seat', () => {
  quizStore.resetQuiz();
  quizStore.setPhase('ROUND_1_ACTIVE');
  quizStore.setRound1Question(0); // assigned to Seat 1 (p1)

  const stateBefore = quizStore.getState();
  assert.equal(stateBefore.round1State.targetSeat, 1);
  assert.equal(stateBefore.round1State.isPassed, false);

  quizStore.markRound1Answer(true);
  const stateAfter = quizStore.getState();
  assert.equal(stateAfter.participants[0].scores.round1, 10);
  assert.equal(stateAfter.participants[0].totalScore, 10);
  assert.equal(stateAfter.round1State.isAnswerRevealed, true);
});

test('Round 1: Pass transfers question to next seat and awards +5 points', () => {
  quizStore.resetQuiz();
  quizStore.setPhase('ROUND_1_ACTIVE');
  quizStore.setRound1Question(0); // assigned to Seat 1

  // Seat 1 passes
  quizStore.passRound1Question();
  const passedState = quizStore.getState();
  assert.equal(passedState.round1State.targetSeat, 2); // Transferred to seat 2
  assert.equal(passedState.round1State.isPassed, true);
  assert.equal(passedState.round1State.passCount, 1);

  // Seat 2 answers correctly
  quizStore.markRound1Answer(true);
  const stateAfter = quizStore.getState();
  assert.equal(stateAfter.participants[0].scores.round1, 0); // Seat 1 got 0
  assert.equal(stateAfter.participants[1].scores.round1, 5); // Seat 2 got +5
  assert.equal(stateAfter.participants[1].totalScore, 5);
});

test('Round 2: Rapid fire tallies +10 points per correct answer', () => {
  quizStore.resetQuiz();
  quizStore.setPhase('ROUND_2_ACTIVE');
  quizStore.setRapidFireSeat(3); // Seat 3 (p3)

  quizStore.recordRapidFireAnswer(true); // Q1 correct
  quizStore.recordRapidFireAnswer(false); // Q2 passed/wrong
  quizStore.recordRapidFireAnswer(true); // Q3 correct

  const state = quizStore.getState();
  assert.equal(state.participants[2].scores.round2, 20); // 2 correct * 10
  assert.equal(state.participants[2].totalScore, 20);
  assert.equal(state.round2State.correctCount, 2);
  assert.equal(state.round2State.passedCount, 1);
});

test('Round 3: Buzzer option selection before reveal and auto-evaluation on reveal', async () => {
  quizStore.resetQuiz();
  quizStore.setPhase('ROUND_3_ACTIVE');
  quizStore.setRound3Question(0);
  quizStore.unlockBuzzer();

  // Participant 2 buzzes in — adjudicated ~80ms later
  const buzzRes = quizStore.pressBuzzer('p2');
  assert.equal(buzzRes.success, true);
  assert.equal(buzzRes.pending, true);
  await waitForBuzz();
  assert.equal(quizStore.getState().buzzerState.buzzedParticipantId, 'p2');

  // Question 0 correct option is 1 ('Bhagavata Purana (Srimad-Bhagavatam)')
  const currentQ = quizStore.getState().round3Questions[0];
  const correctIdx = currentQ.correctOptionIndex;

  // Participant 2 selects an option on mobile BEFORE host reveals
  quizStore.selectBuzzerOption('p2', correctIdx);
  let state = quizStore.getState();
  assert.equal(state.buzzerState.selectedOptionIndex, correctIdx);
  assert.equal(state.round3State.isAnswerRevealed, false); // Still unrevealed!

  // Host clicks Reveal Answer
  quizStore.revealRound3Answer();
  state = quizStore.getState();
  assert.equal(state.round3State.isAnswerRevealed, true);
  // Auto-evaluated +15 points for participant 2
  assert.equal(state.participants[1].scores.round3, 15);
  assert.equal(state.participants[1].totalScore, 15);

  // Now test wrong selection with Q1
  quizStore.setRound3Question(1);
  quizStore.unlockBuzzer();
  quizStore.pressBuzzer('p5');
  await waitForBuzz();
  assert.equal(quizStore.getState().buzzerState.buzzedParticipantId, 'p5');

  // p5 selects wrong option (e.g. option 3 when answer is 1)
  const wrongIdx = (quizStore.getState().round3Questions[1].correctOptionIndex + 1) % 4;
  quizStore.selectBuzzerOption('p5', wrongIdx);

  assert.equal(quizStore.getState().round3State.isAnswerRevealed, false);
  // Host reveals
  quizStore.revealRound3Answer();
  state = quizStore.getState();
  assert.equal(state.round3State.isAnswerRevealed, true);
  // -5 penalty applied
  assert.equal(state.participants[4].scores.round3, -5);
  assert.equal(state.participants[4].totalScore, -5);
});

// Wait until the scheduled buzzer-open instant is comfortably in the past,
// so simulated clientTs tap-times (relative to openAt) are legitimately old.
const waitUntilBuzzerOpen = async () => {
  const openAt = quizStore.getState().buzzerState.openAtServerTs;
  await sleep(Math.max(0, openAt - Date.now()) + 50);
  return openAt;
};

test('Round 3 fairness: earlier synced timestamp wins over earlier packet arrival', async () => {
  quizStore.resetQuiz();
  quizStore.setPhase('ROUND_3_ACTIVE');
  quizStore.setRound3Question(0);
  quizStore.unlockBuzzer();
  const openAt = await waitUntilBuzzerOpen();

  // p3's packet ARRIVES first but its synced tap was at openAt+40;
  // p4's packet arrives second but its synced tap was at openAt+12 —
  // i.e. p4 physically tapped first. p4 must win.
  // This is the core anti-latency-bias guarantee.
  quizStore.pressBuzzer('p3', openAt + 40);
  quizStore.pressBuzzer('p4', openAt + 12);
  await waitForBuzz();

  const state = quizStore.getState();
  assert.equal(state.buzzerState.buzzedParticipantId, 'p4');
});

test('Round 3 fairness: near-simultaneous buzzes flag a contested photo-finish', async () => {
  quizStore.resetQuiz();
  quizStore.setPhase('ROUND_3_ACTIVE');
  quizStore.setRound3Question(0);
  quizStore.unlockBuzzer();
  const openAt = await waitUntilBuzzerOpen();

  quizStore.pressBuzzer('p1', openAt + 10);
  quizStore.pressBuzzer('p6', openAt + 18); // 8ms behind -> contested
  await waitForBuzz();

  const state = quizStore.getState();
  assert.equal(state.buzzerState.buzzedParticipantId, 'p1');
  assert.equal(state.buzzerState.contested.runnerUpParticipantId, 'p6');
  assert.equal(state.buzzerState.contested.marginMs, 8);
});

test('Round 3 fairness: taps before the scheduled open cannot win early', async () => {
  quizStore.resetQuiz();
  quizStore.setPhase('ROUND_3_ACTIVE');
  quizStore.setRound3Question(0);
  quizStore.unlockBuzzer();
  const openAt = await waitUntilBuzzerOpen();

  // p2 claims a tap timestamped BEFORE the buzzer opened — clamped to openAt.
  quizStore.pressBuzzer('p2', openAt - 500);
  await sleep(5);
  quizStore.pressBuzzer('p5', openAt + 5); // legit tap just after open
  await waitForBuzz();

  const state = quizStore.getState();
  // p2's effective time is clamped to openAt and flagged early for the host;
  // pre-open taps can't beat the gate but aren't dropped either.
  assert.equal(state.buzzerState.buzzedParticipantId, 'p2');
  assert.equal(state.buzzerState.buzzedAt, openAt);
  assert.equal(state.buzzerState.buzzHistory[0].early, true);
});
