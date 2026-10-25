import test from 'node:test';
import assert from 'node:assert/strict';
import { quizStore } from '../lib/quizStore.ts';

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

test('Round 3: Buzzer option selection before reveal and auto-evaluation on reveal', () => {
  quizStore.resetQuiz();
  quizStore.setPhase('ROUND_3_ACTIVE');
  quizStore.setRound3Question(0);
  quizStore.unlockBuzzer();

  // Participant 2 buzzes in
  const buzzRes = quizStore.pressBuzzer('p2');
  assert.equal(buzzRes.success, true);
  assert.equal(buzzRes.buzzedFirst, true);

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
