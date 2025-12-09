const express = require('express');
const router = express.Router();
const Round3State = require('../models/Round3State');

// Round 3 Problem Data - Passages and MCQs
const PROBLEM_DATA = {
  passages: [
    {
      title: "Concurrency",
      content: "Concurrency refers to a system's ability to handle multiple tasks during overlapping periods of time. It does not require the tasks to run at the exact same moment. Instead, the processor switches between them quickly, which creates the impression that they are progressing together. A common example appears when using a smartphone. You can download a file, listen to music, and type a message at the same time. The phone's processor shifts its attention among these activities so that none of them feels paused.\n\nIn computer systems, concurrency is managed by a scheduler that decides which task receives CPU time and for how long. This approach is useful for maintaining responsiveness, especially when long running operations occur in the background. However, concurrency introduces challenges when multiple tasks work with shared data. For example, if two tasks try to update the same bank account balance without coordination, unpredictable results can appear. This situation is known as a race condition. To handle such conflicts, systems rely on rules or mechanisms that control access to shared data.",
      questions: [
        {
          questionText: "What does concurrency primarily describe?",
          options: [
            "Running tasks only on separate physical processors",
            "The ability of tasks to make progress during overlapping periods of time",
            "Tasks that always run one after another without switching",
            "A system where tasks never interact with shared data"
          ],
          correctAnswer: "B"
        },
        {
          questionText: "A race condition occurs when:",
          options: [
            "The scheduler removes a task from the system",
            "Tasks wait for each other while holding different resources",
            "Two tasks update shared information without proper coordination",
            "A task completes earlier than expected"
          ],
          correctAnswer: "C"
        },
        {
          questionText: "Why does the scheduler have an important role in a concurrent environment?",
          options: [
            "It determines which task progresses at which moment, affecting overall responsiveness",
            "It stops tasks from sharing memory, preventing conflicts",
            "It guarantees that all tasks run in parallel",
            "It enforces a strict execution order that tasks must follow"
          ],
          correctAnswer: "A"
        },
        {
          questionText: "Concurrency does not guarantee true parallel execution because:",
          options: [
            "Memory can only hold one task at a time",
            "Shared data cannot be accessed by more than one task",
            "Concurrency requires every task to run forever",
            "The CPU may switch between tasks instead of running them simultaneously"
          ],
          correctAnswer: "D"
        },
        {
          questionText: "Which statement correctly describes a practical difference between concurrency and parallelism?",
          options: [
            "Concurrency requires more processors, while parallelism does not",
            "Concurrency can occur on a single processor, while parallelism requires multiple units executing at the same time",
            "Concurrency always eliminates race conditions, while parallelism does not",
            "Parallelism relies entirely on scheduling, while concurrency does not"
          ],
          correctAnswer: "B"
        }
      ]
    },
    {
      title: "Threading",
      content: "A thread is the smallest unit of execution that the operating system can schedule independently. A program may contain one thread or several threads working together. Multiple threads inside the same program share memory and resources. This shared environment allows threads to communicate quickly, but it also increases the risk of interference. A familiar example is a web browser. One thread may load a webpage while another handles scrolling, and another processes user input. If these tasks were forced into a strict sequence, the browser would feel slow and unresponsive.\n\nWhen several threads use the same data, careful coordination is required. Without it, two threads might attempt to access a resource at the same time, which can lead to problems such as deadlocks. In a deadlock, two threads wait forever because each one needs something the other is holding. To prevent issues like this, programmers use synchronization tools such as mutexes or semaphores. These tools ensure that only one thread enters a critical section at a time, which protects shared data from corruption.",
      questions: [
        {
          questionText: "Which description captures the key property that distinguishes a thread from a full process?",
          options: [
            "A thread owns its own separate memory space and executes independently",
            "A thread is the smallest executable unit that shares memory with others inside the same program",
            "A thread cannot run unless all other threads are paused",
            "A thread is used only for tasks that require user interaction"
          ],
          correctAnswer: "B"
        },
        {
          questionText: "Why can threads communicate efficiently?",
          options: [
            "They share the same memory space",
            "They always run on different machines",
            "They pause whenever another thread runs",
            "They avoid using shared resources"
          ],
          correctAnswer: "A"
        },
        {
          questionText: "A deadlock occurs when:",
          options: [
            "A thread finishes its task successfully",
            "Two threads wait indefinitely for resources held by each other",
            "A thread runs faster than expected",
            "The system runs too many threads at once"
          ],
          correctAnswer: "B"
        },
        {
          questionText: "Synchronization mechanisms such as mutexes are used to:",
          options: [
            "Allow many threads to write to shared data simultaneously",
            "Control access to critical sections of code",
            "Remove delays in thread execution",
            "Combine multiple threads into one"
          ],
          correctAnswer: "B"
        },
        {
          questionText: "Why are synchronization mechanisms such as mutexes necessary in multithreaded programs?",
          options: [
            "They ensure that each thread receives equal CPU time",
            "They convert all operations into parallel ones automatically",
            "They protect sections of code where shared data could be corrupted by overlapping access",
            "They allow multiple threads to update the same data at the same instant"
          ],
          correctAnswer: "C"
        }
      ]
    }
  ]
};

// Initialize Round 3
router.post('/initialize', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Check if already initialized
    let state = await Round3State.findOne({ sessionId });

    if (state && !state.completed) {
      return res.json({
        message: 'Round 3 in progress',
        state: {
          passages: state.passages,
          score: state.score,
          completed: state.completed
        }
      });
    }

    // Initialize new round
    const passages = PROBLEM_DATA.passages.map(p => ({
      title: p.title,
      content: p.content,
      questions: p.questions.map(q => ({
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        userAnswer: null,
        isCorrect: false
      }))
    }));

    state = new Round3State({
      sessionId,
      passages,
      score: 0,
      completed: false
    });

    await state.save();

    res.json({
      message: 'Round 3 initialized successfully',
      state: {
        passages: state.passages,
        score: state.score,
        completed: state.completed
      }
    });
  } catch (error) {
    console.error('Initialize error:', error);
    res.status(500).json({ error: 'Failed to initialize Round 3' });
  }
});

// Get current state
router.get('/state/:sessionId', async (req, res) => {
  try {
    const state = await Round3State.findOne({ sessionId: req.params.sessionId });

    if (!state) {
      return res.status(404).json({ error: 'Round 3 not initialized' });
    }

    res.json({
      passages: state.passages,
      score: state.score,
      completed: state.completed
    });
  } catch (error) {
    console.error('Get state error:', error);
    res.status(500).json({ error: 'Failed to get state' });
  }
});

// Submit answer for a question
router.post('/submit-answer', async (req, res) => {
  try {
    const { sessionId, passageIndex, questionIndex, answer } = req.body;

    if (!sessionId || passageIndex === undefined || questionIndex === undefined || !answer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const state = await Round3State.findOne({ sessionId });

    if (!state) {
      return res.status(404).json({ error: 'Round 3 not initialized' });
    }

    if (state.completed) {
      return res.status(400).json({ error: 'Round 3 already completed' });
    }

    const question = state.passages[passageIndex].questions[questionIndex];

    // Check if already answered
    if (question.userAnswer) {
      return res.status(400).json({ error: 'Question already answered' });
    }

    // Validate answer
    const isCorrect = answer === question.correctAnswer;
    question.userAnswer = answer;
    question.isCorrect = isCorrect;

    // Update score
    if (isCorrect) {
      state.score += 5; // +5 for correct answer
    } else {
      state.score -= 2; // -2 for wrong answer
    }

    // Check if all questions answered
    const allAnswered = state.passages.every(p =>
      p.questions.every(q => q.userAnswer !== null)
    );

    if (allAnswered) {
      state.completed = true;
      state.completedAt = new Date();
    }

    await state.save();

    res.json({
      correct: isCorrect,
      score: state.score,
      completed: state.completed,
      message: isCorrect ? 'Correct answer!' : 'Incorrect answer'
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

module.exports = router;
