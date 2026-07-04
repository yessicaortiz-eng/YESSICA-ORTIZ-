/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { PHASES } from "../types";
import { CheckCircle, Circle, BookOpen, AlertTriangle, HelpCircle, Eye, RefreshCw } from "lucide-react";

interface ProgressTimelineProps {
  currentPhase: number;
  progressPercentage: number;
}

export function ProgressTimeline({ currentPhase, progressPercentage }: ProgressTimelineProps) {
  // Helper to choose the right icon for each phase index
  const getPhaseIcon = (id: number, active: boolean, completed: boolean) => {
    const colorClass = completed 
      ? "text-[#5A5A40]" 
      : active 
        ? "text-[#5A5A40] animate-pulse" 
        : "text-[#8A8A7F]";

    switch (id) {
      case 1:
        return <HelpCircle className={`w-5 h-5 ${colorClass}`} id={`icon-phase-${id}`} />;
      case 2:
        return <RefreshCw className={`w-5 h-5 ${colorClass}`} id={`icon-phase-${id}`} />;
      case 3:
        return <AlertTriangle className={`w-5 h-5 ${colorClass}`} id={`icon-phase-${id}`} />;
      case 4:
        return <Eye className={`w-5 h-5 ${colorClass}`} id={`icon-phase-${id}`} />;
      case 5:
        return <BookOpen className={`w-5 h-5 ${colorClass}`} id={`icon-phase-${id}`} />;
      default:
        return <Circle className={`w-5 h-5 ${colorClass}`} id={`icon-phase-${id}`} />;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#DCDCD2]" id="progress-timeline-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-[#1A1A1A] text-sm tracking-tight flex items-center gap-2" id="timeline-title">
          <BookOpen className="w-4 h-4 text-[#5A5A40]" />
          Ruta de Aprendizaje
        </h3>
        <span className="text-xs font-mono text-[#5A5A40] bg-[#E8E8E1] px-2.5 py-1 rounded-full font-bold" id="progress-badge">
          {progressPercentage}% completado
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#E8E8E1] h-2 rounded-full overflow-hidden mb-6" id="progress-bar-container">
        <div 
          className="bg-[#5A5A40] h-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
          id="progress-bar-fill"
        />
      </div>

      {/* Phase List */}
      <div className="space-y-4" id="timeline-phases-list">
        {PHASES.map((phase) => {
          // If the activity is finished, all phases are completed
          const isCompleted = currentPhase > phase.id;
          const isActive = currentPhase === phase.id;

          return (
            <div 
              key={phase.id}
              className={`flex items-start gap-3 p-2.5 rounded-xl transition-all duration-300 ${
                isActive 
                  ? "bg-[#E8E8E1]/40 border border-[#DCDCD2] shadow-2xs" 
                  : "border border-transparent"
              }`}
              id={`phase-row-${phase.id}`}
            >
              <div className="mt-0.5 flex-shrink-0" id={`phase-icon-wrapper-${phase.id}`}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-[#5A5A40]" id={`check-phase-${phase.id}`} />
                ) : (
                  getPhaseIcon(phase.id, isActive, isCompleted)
                )}
              </div>
              <div className="flex-1 min-w-0" id={`phase-info-${phase.id}`}>
                <div className="flex items-center gap-1.5">
                  <p className={`text-xs font-mono ${isActive ? "text-[#5A5A40] font-bold" : "text-[#8A8A7F]"}`}>
                    Fase {phase.id}
                  </p>
                  {isActive && (
                    <span className="inline-block w-2 h-2 rounded-full bg-[#5A5A40] animate-ping" id={`ping-phase-${phase.id}`} />
                  )}
                </div>
                <h4 className={`text-sm font-semibold truncate ${isActive ? "text-[#1A1A1A]" : isCompleted ? "text-[#2D2D2A]" : "text-[#8A8A7F]"}`}>
                  {phase.name}
                </h4>
                <p className={`text-xs truncate ${isActive ? "text-[#5A5A40]" : "text-[#8A8A7F]"}`}>
                  {phase.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
