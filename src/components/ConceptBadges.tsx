/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Award, Lock, Sparkles } from "lucide-react";

interface ConceptBadgesProps {
  unlockedConcepts: string[];
}

// Predefined set of concepts matching the 5 phases to show what can be unlocked
const ALL_POTENTIAL_CONCEPTS = [
  { name: "Definición de IA", desc: "Comprender qué es un sistema inteligente", phase: 1 },
  { name: "IA en Redes Sociales", desc: "Identificar algoritmos de recomendación", phase: 1 },
  { name: "IA Tradicional", desc: "Análisis predictivo basado en reglas", phase: 2 },
  { name: "IA Generativa", desc: "Modelos creativos (textos, imágenes, etc.)", phase: 2 },
  { name: "Ventajas de la IA", desc: "Ahorro de tiempo y fomento de ideas", phase: 3 },
  { name: "Riesgos en el Aprendizaje", desc: "Dependencia excesiva y pérdida de criterio", phase: 3 },
  { name: "Alucinaciones de IA", desc: "Detectar respuestas verosímiles pero falsas", phase: 3 },
  { name: "Privacidad de Datos", desc: "Proteger información personal en chats", phase: 4 },
  { name: "Derechos de Autor", desc: "Aspectos éticos del entrenamiento de modelos", phase: 4 },
  { name: "Plagio Académico", desc: "Uso deshonesto de generación de ensayos", phase: 4 },
  { name: "Responsabilidad Digital", desc: "Aplicar IA con honestidad y seguridad", phase: 5 },
  { name: "Pensamiento Crítico", desc: "Cuestionar y verificar fuentes externas", phase: 5 }
];

export function ConceptBadges({ unlockedConcepts }: ConceptBadgesProps) {
  // Check if a concept is unlocked (partial matching to support Gemini's descriptive keys)
  const isUnlocked = (conceptName: string) => {
    return unlockedConcepts.some(unlocked => 
      unlocked.toLowerCase().includes(conceptName.toLowerCase()) || 
      conceptName.toLowerCase().includes(unlocked.toLowerCase())
    );
  };

  const unlockedCount = ALL_POTENTIAL_CONCEPTS.filter(c => isUnlocked(c.name)).length;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#DCDCD2]" id="concept-badges-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-[#1A1A1A] text-sm tracking-tight flex items-center gap-2" id="badges-title">
          <Award className="w-4 h-4 text-[#5A5A40]" />
          Conceptos Desbloqueados
        </h3>
        <span className="text-xs font-mono text-[#5A5A40] bg-[#E8E8E1] px-2.5 py-1 rounded-full font-bold" id="unlocked-counter">
          {unlockedCount} / {ALL_POTENTIAL_CONCEPTS.length}
        </span>
      </div>

      <p className="text-xs text-[#8A8A7F] mb-4" id="badges-intro">
        Conforme converses con tu tutor de IA, responderás preguntas y desbloquearás estas insignias educativas:
      </p>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 gap-2 max-h-[280px] overflow-y-auto pr-1" id="badges-grid">
        {ALL_POTENTIAL_CONCEPTS.map((concept) => {
          const unlocked = isUnlocked(concept.name) || unlockedConcepts.length > 5; // Enable all if fully advanced

          return (
            <div 
              key={concept.name}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 ${
                unlocked 
                  ? "bg-[#F0F5EB] border border-[#DCDCD2]" 
                  : "bg-gray-50/40 border border-[#E8E8E1]/60 opacity-60"
              }`}
              id={`concept-${concept.name.replace(/\s+/g, '-').toLowerCase()}`}
            >
              <div 
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  unlocked 
                    ? "bg-[#5A5A40] text-white animate-pulse" 
                    : "bg-[#E8E8E1] text-[#8A8A7F]"
                }`}
                id={`badge-icon-${concept.name.replace(/\s+/g, '-').toLowerCase()}`}
              >
                {unlocked ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="flex-1 min-w-0" id={`badge-text-${concept.name.replace(/\s+/g, '-').toLowerCase()}`}>
                <h4 className={`text-xs font-semibold ${unlocked ? "text-[#3E5C2E]" : "text-[#8A8A7F]"}`}>
                  {concept.name}
                </h4>
                <p className="text-[11px] text-[#8A8A7F] truncate">
                  {concept.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
