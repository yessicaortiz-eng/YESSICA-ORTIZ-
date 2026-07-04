/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: string;
  // Metadata for progressive UI rendering
  phase?: number;
  unlockedConcepts?: string[];
  attempts?: number;
}

export interface Evaluation {
  resumen: string;
  fortalezas: string;
  mejoras: string;
  nivelDesempeño: 'Excelente' | 'Muy Bueno' | 'Bueno' | 'En proceso';
  recursosRecomendados: string[];
}

export interface SavedSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  currentPhase: number;
  progressPercentage: number;
  attempts: number;
  unlockedConcepts: string[];
  isActivityFinished: boolean;
  evaluation: Evaluation | null;
}

export interface TutorState {
  tutorResponse: string;
  currentPhase: number; // 1: ¿Qué es la IA?, 2: IA Tradicional vs Generativa, 3: Ventajas y Riesgos, 4: Aspectos Éticos, 5: Aplicación Real, 6: Evaluación Final
  phaseProgressPercentage: number;
  attemptsForCurrentQuestion: number;
  conceptosClaveDesbloqueados: string[];
  isActivityFinished: boolean;
  evaluation: Evaluation | null;
}

export interface GeminiContentPart {
  text: string;
}

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiContentPart[];
}

export const PHASES = [
  { id: 1, name: 'Definición de la IA', desc: 'Qué es la Inteligencia Artificial' },
  { id: 2, name: 'IA Tradicional vs Generativa', desc: 'Diferencias clave' },
  { id: 3, name: 'Ventajas y Riesgos', desc: 'Beneficios y peligros' },
  { id: 4, name: 'Aspectos Éticos', desc: 'Sesgos, privacidad y plagio' },
  { id: 5, name: 'Aplicación Práctica', desc: 'Situaciones de la vida real' },
  { id: 6, name: 'Evaluación y Reporte', desc: 'Resultados finales' }
];

export interface UserProfile {
  name: string;
  email: string;
  grade: string;
  institution: string;
  avatarColor: string;
}

export interface TextAnalysisCriterion {
  name: string;
  status: 'Cumple' | 'Advertencia' | 'No cumple' | string;
  feedback: string;
}

export interface TextAnalysisResult {
  isCompliant: boolean;
  analysisText: string;
  citationsDetected: boolean;
  integrityScore: number;
  criteriaEvaluated: TextAnalysisCriterion[];
  suggestions: string[];
}


