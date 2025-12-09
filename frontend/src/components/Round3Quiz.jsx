import React, { useState, useEffect } from 'react';
import { initializeRound3, getRound3State, submitAnswer } from '../services/api';
import '../styles/round3.css';

export default function Round3Quiz({ sessionId, username }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    initializeGame();
  }, [sessionId]);

  const initializeGame = async () => {
    try {
      setLoading(true);
      const response = await initializeRound3(sessionId);
      setState(response.state);
      setMessage(response.message);
      setLoading(false);
    } catch (error) {
      setMessage('Error initializing Round 3: ' + error.message);
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async (passageIndex, questionIndex, answer) => {
    try {
      const result = await submitAnswer(sessionId, passageIndex, questionIndex, answer);
      
      // Refresh state
      const updatedState = await getRound3State(sessionId);
      setState(updatedState);
      
      if (updatedState.completed) {
        setMessage(`Round 3 Complete! Final Score: ${updatedState.score}`);
      } else {
        setMessage(result.message + ` (${result.correct ? '+5' : '-2'} points)`);
      }
    } catch (error) {
      setMessage('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const getAnswerLabel = (index) => {
    return String.fromCharCode(65 + index); // A, B, C, D
  };

  if (loading) {
    return <div className="round3-container"><div className="loading">Loading Round 3...</div></div>;
  }

  if (!state) {
    return <div className="round3-container"><div className="error">Failed to load Round 3</div></div>;
  }

  const currentPassage = state.passages[currentPassageIndex];

  return (
    <div className="round3-container">
      <div className="round3-header">
        <h1>Round 3: Comprehension Quiz</h1>
        <div className="header-info">
          <span className="username">Player: {username}</span>
          <span className="score">Score: {state.score}</span>
          {state.completed && <span className="completed-badge">COMPLETED</span>}
        </div>
      </div>

      {state.completed && (
        <div className="message success">
          Congratulations! You have completed Round 3.
        </div>
      )}

      <div className="objective-panel">
        <h3>Objective</h3>
        <p>Read the passages carefully and answer the multiple-choice questions. Each correct answer awards +5 points, while incorrect answers deduct -2 points. <strong>Once you select an answer, it is final and cannot be changed.</strong></p>
      </div>

      {message && (
        <div className={`message ${message.includes('Correct') || message.includes('Complete') ? 'success' : message.includes('Incorrect') || message.includes('Error') ? 'error' : 'info'}`}>
          {message}
        </div>
      )}

      {/* Passage Navigation */}
      <div className="passage-navigation">
        {state.passages.map((passage, idx) => (
          <button
            key={idx}
            className={`passage-tab ${currentPassageIndex === idx ? 'active' : ''}`}
            onClick={() => setCurrentPassageIndex(idx)}
          >
            Passage {idx + 1}: {passage.title}
          </button>
        ))}
      </div>

      {/* Passage Content */}
      <div className="passage-panel">
        <h2>{currentPassage.title}</h2>
        <div className="passage-content">
          {currentPassage.content}
        </div>
      </div>

      {/* Questions */}
      <div className="questions-section">
        <h3>Questions</h3>
        {currentPassage.questions.map((question, qIdx) => (
          <div key={qIdx} className={`question-card ${question.userAnswer ? 'answered' : ''}`}>
            <div className="question-header">
              <span className="question-number">Question {qIdx + 1}</span>
              {question.userAnswer && (
                <span className={`answer-badge ${question.isCorrect ? 'correct' : 'incorrect'}`}>
                  {question.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              )}
            </div>
            <div className="question-text">{question.questionText}</div>
            <div className="options">
              {question.options.map((option, oIdx) => {
                const optionLabel = getAnswerLabel(oIdx);
                const isSelected = question.userAnswer === optionLabel;
                const isCorrect = question.correctAnswer === optionLabel;
                const showCorrect = question.userAnswer && isCorrect;
                
                return (
                  <button
                    key={oIdx}
                    className={`option ${isSelected ? 'selected' : ''} ${showCorrect ? 'correct-answer' : ''}`}
                    onClick={() => !question.userAnswer && handleAnswerSubmit(currentPassageIndex, qIdx, optionLabel)}
                    disabled={question.userAnswer !== null || state.completed}
                  >
                    <span className="option-label">{optionLabel}.</span>
                    <span className="option-text">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
