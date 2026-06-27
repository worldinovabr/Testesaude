// Tipos para o banco de dados local (IndexedDB)

export interface TestResult {
  id: string;
  type: 'vision' | 'hearing' | 'cognition' | 'coordination';
  category: string; // ex: 'acuidade', 'daltonismo', 'frequencia'
  value: number | string;
  score?: number; // 0-100
  timestamp: number; // Date.now()
  notes?: string;
}

export interface VisionTest extends TestResult {
  type: 'vision';
  category: 'acuidade' | 'daltonismo' | 'astigmatismo' | 'contraste' | 'proximidade';
  value: string; // ex: "20/20", "normal", "20/25"
}

export interface HearingTest extends TestResult {
  type: 'hearing';
  category: 'frequencia' | 'equilibrio' | 'palavras' | 'ruido';
  value: number | string; // ex: 15000 (Hz), "esquerdo", "10 palavras"
}

export interface CognitionTest extends TestResult {
  type: 'cognition';
  category: 'reacao' | 'memoria' | 'atencao' | 'sequencia';
  value: number | string; // ex: 250 (ms), "8/10", "correto"
  score: number; // 0-100
}

export interface CoordinationTest extends TestResult {
  type: 'coordination';
  category: 'precisao' | 'trajetoria' | 'velocidade';
  value: number | string; // ex: 95 (%), "8/10", "250ms"
  score: number; // 0-100
}

export interface Reminder {
  id: string;
  testType: 'vision' | 'hearing' | 'cognition' | 'coordination' | 'all';
  frequency: 'monthly' | 'quarterly' | 'biannual' | 'annual';
  nextDueDate: number; // timestamp
  enabled: boolean;
  createdAt: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  soundEnabled: boolean;
  language: 'pt-BR' | 'en-US';
  disclaimerAccepted: boolean;
}

export type AnyTestResult = VisionTest | HearingTest | CognitionTest | CoordinationTest;
