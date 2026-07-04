import React from "react";
import { SavedSession, PHASES } from "../types";
import { MessageSquare, Trash2, Calendar, BookOpen, Plus, CheckCircle2, Circle } from "lucide-react";
import { motion } from "motion/react";

interface SessionHistoryProps {
  sessions: SavedSession[];
  currentSessionId: string | null;
  onSelectSession: (session: SavedSession) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onStartNewSession: () => void;
}

export function SessionHistory({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onStartNewSession
}: SessionHistoryProps) {
  return (
    <div className="bg-white border border-[#DCDCD2] rounded-2xl p-5 shadow-sm" id="session-history-card">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-[#1A1A1A] text-xs tracking-wider uppercase flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-[#5A5A40]" />
          Historial de Sesiones
        </h4>
        <button
          type="button"
          onClick={onStartNewSession}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#5A5A40] hover:bg-[#4A4A33] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
          title="Iniciar una nueva sesión de estudio"
          id="btn-new-session"
        >
          <Plus className="w-3 h-3" />
          Nueva
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-[#DCDCD2] rounded-xl px-4" id="empty-history-view">
          <MessageSquare className="w-6 h-6 text-[#8A8A7F] mx-auto mb-2 opacity-60" />
          <p className="text-xs text-[#8A8A7F] leading-normal font-serif italic">
            No tienes sesiones guardadas en este navegador todavía.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar" id="session-list-container">
          {sessions.map((session) => {
            const isActive = session.id === currentSessionId;
            const messageCount = session.messages.filter(m => m.role !== "system").length;
            const dateStr = new Date(session.updatedAt).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit"
            });
            const currentPhaseName = PHASES[session.currentPhase - 1]?.name || "Evaluación";

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => onSelectSession(session)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                  isActive
                    ? "bg-[#F5F5F0] border-[#5A5A40] shadow-3xs"
                    : "bg-white hover:bg-[#FAF5EE] border-[#E8E8E1]"
                }`}
                id={`session-item-${session.id}`}
              >
                {/* Status Indicator Icon */}
                <div className="mt-0.5 flex-shrink-0">
                  {session.isActivityFinished ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" title="Sesión Completada" />
                  ) : (
                    <Circle className="w-4 h-4 text-[#8A8A7F] fill-current opacity-30" title="En Progreso" />
                  )}
                </div>

                {/* Session Details */}
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold truncate ${isActive ? "text-[#1A1A1A]" : "text-[#2D2D2A]"}`}>
                    {session.title}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#8A8A7F] flex-wrap">
                    <span className="flex items-center gap-0.5 font-medium">
                      <Calendar className="w-2.5 h-2.5" />
                      {dateStr}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <MessageSquare className="w-2.5 h-2.5" />
                      {messageCount} msgs
                    </span>
                    <span className="bg-[#E8E8E1] text-[#5A5A40] px-1.5 py-0.2 rounded text-[9px] font-bold">
                      Fase {session.currentPhase}
                    </span>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => onDeleteSession(session.id, e)}
                  className="p-1 text-[#8A8A7F] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1 cursor-pointer self-center"
                  title="Eliminar sesión de este dispositivo"
                  id={`delete-session-btn-${session.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
