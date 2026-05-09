export interface Question {
  question_text: string;
  question_type: 'mcq' | 'written';
  options: string[];
  correct_answer: string;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  duration_minutes: number;
  questions: Question[];
  is_completed: boolean;
  score: number;
  user_answers?: Record<number, string>;
}

export interface QuizSubmission {
  score: number;
  user_answers: Record<number, string>;
}

// السطر ده اللي كان ناقص عشان الـ QuestionCard والـ Quizzes يشوفوه
export type QuizMode = 'list' | 'taking' | 'review';

export interface QuizGenerateRequest {
  topic: string;
  num_questions: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface PinStatus {
  has_pin: boolean;
}