export type Skill = 'listening' | 'reading' | 'writing' | 'speaking';

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'text' | 'boolean';
  options?: string[];
  correctAnswer?: string; // Hidden from user during test
}

export interface TestContext {
  id: string;
  skill: Skill;
  introText?: string; // For Reading passages or Listening transcripts
  questions: Question[];
  tasks?: { title: string; prompt: string; minWords?: number }[]; // For Writing
  parts?: { title: string; questions: string[] }[]; // For Speaking
}

export interface UserResponse {
  questionId?: string;
  answer: string | Blob; // Text or Audio Blob
  taskId?: number;
  partId?: number;
}

export interface CriterionScore {
  name: string;
  score: number; // 0-9
  feedback: string;
  improvement: string;
}

export interface TestResult {
  overallBand: number;
  skill: Skill;
  criteria: CriterionScore[];
  generalFeedback: string;
  improvementPlan: string[];
}

export interface AppState {
  view: 'home' | 'setup' | 'test' | 'results' | 'history' | 'resources' | 'vocabulary' | 'essaySamples';
  selectedSkill: Skill | null;
  questionCount: number;
  currentTest: TestContext | null;
  userResponses: UserResponse[];
  result: TestResult | null;
  isLoading: boolean;
  loadingMessage: string;
}