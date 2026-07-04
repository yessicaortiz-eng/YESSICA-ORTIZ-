/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ChatMessage, Evaluation, PHASES } from "./types";
import { ProgressTimeline } from "./components/ProgressTimeline";
import { ConceptBadges } from "./components/ConceptBadges";
import { EvaluationCard } from "./components/EvaluationCard";
import { ChatContainer } from "./components/ChatContainer";
import { Bot, Sparkles, RefreshCw, AlertCircle, HelpCircle, ShieldAlert, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Chat state parameters
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentPhase, setCurrentPhase] = useState<number>(1);
  const [progressPercentage, setProgressPercentage] = useState<number>(10);
  const [attempts, setAttempts] = useState<number>(0);
  const [unlockedConcepts, setUnlockedConcepts] = useState<string[]>([]);
  const [isActivityFinished, setIsActivityFinished] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  // Network and status state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch the initial tutor greeting on mount
  useEffect(() => {
    startActivity();
  }, []);

  const startActivity = async () => {
    setIsLoading(true);
    setApiError(null);
    setMessages([]);
    setCurrentPhase(1);
    setProgressPercentage(10);
    setAttempts(0);
    setUnlockedConcepts([]);
    setIsActivityFinished(false);
    setEvaluation(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: [] })
      });

      if (!response.ok) {
        throw new Error(`Error de red: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Load response from server
      setMessages([
        {
          id: `msg-${Date.now()}`,
          role: "model",
          text: data.tutorResponse,
          timestamp: new Date().toISOString(),
          phase: data.currentPhase,
          unlockedConcepts: data.conceptosClaveDesbloqueados
        }
      ]);
      setCurrentPhase(data.currentPhase || 1);
      setProgressPercentage(data.phaseProgressPercentage || 10);
      setAttempts(data.attemptsForCurrentQuestion || 0);
      if (data.conceptosClaveDesbloqueados) {
        setUnlockedConcepts(data.conceptosClaveDesbloqueados);
      }
    } catch (err: any) {
      console.error("No se pudo iniciar la tutoría:", err);
      setApiError(
        "No se pudo conectar con el servidor del Tutor de IA. Por favor, asegúrate de que el backend esté listo o vuelve a intentarlo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    // Create the message object for the user
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: userText,
      timestamp: new Date().toISOString(),
      phase: currentPhase
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setApiError(null);

    // Prepare history payload for Gemini (needs strict {role, parts: [{text}]} format)
    const geminiHistory = updatedMessages.map(msg => ({
      role: msg.role === "user" ? "user" as const : "model" as const,
      parts: [{ text: msg.text }]
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: geminiHistory })
      });

      if (!response.ok) {
        throw new Error(`Error al enviar mensaje: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Update state with tutor's feedback
      const modelMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "model",
        text: data.tutorResponse,
        timestamp: new Date().toISOString(),
        phase: data.currentPhase,
        unlockedConcepts: data.conceptosClaveDesbloqueados
      };

      setMessages(prev => [...prev, modelMessage]);
      setCurrentPhase(data.currentPhase || currentPhase);
      setProgressPercentage(data.phaseProgressPercentage || progressPercentage);
      setAttempts(data.attemptsForCurrentQuestion || 0);
      
      if (data.conceptosClaveDesbloqueados) {
        setUnlockedConcepts(data.conceptosClaveDesbloqueados);
      }

      if (data.isActivityFinished) {
        setIsActivityFinished(true);
        if (data.evaluation) {
          setEvaluation(data.evaluation);
        }
      }
    } catch (err: any) {
      console.error("Error al procesar el chat:", err);
      setApiError(
        "Ocurrió un error al enviar tu respuesta. Por favor, vuelve a intentar en unos momentos."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col font-sans text-[#2D2D2A]" id="app-root">
      
      {/* Top Main Navigation Header */}
      <header className="bg-white border-b border-[#DCDCD2] py-4 px-6 md:px-12 sticky top-0 z-40" id="main-header">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#5A5A40] flex items-center justify-center text-white font-serif italic text-xl shadow-xs">
              A
            </div>
            <div>
              <h1 className="text-xl font-serif font-semibold text-[#1A1A1A] tracking-tight flex items-center gap-2" id="brand-title">
                Tutoría de IA Responsable
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A40] bg-[#E8E8E1] px-2.5 py-0.5 rounded-full font-sans">
                  Bachillerato
                </span>
              </h1>
              <p className="text-xs text-[#8A8A7F] uppercase tracking-widest font-medium">
                Sesión de Aprendizaje Adaptativo • EduIA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3" id="header-actions">
            <button
              onClick={startActivity}
              className="inline-flex items-center gap-2 bg-[#E8E8E1] hover:bg-[#DCDCD2] border border-[#DCDCD2] text-[#2D2D2A] font-semibold text-xs px-4 py-2 rounded-full transition-colors duration-200 cursor-pointer shadow-3xs"
              id="restart-header-btn"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#5A5A40]" />
              Reiniciar Sesión
            </button>
          </div>

        </div>
      </header>

      {/* Main Educational Application Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8" id="main-content-area">
        
        {/* Error Alert Bar */}
        {apiError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-900 rounded-2xl p-4 flex items-start gap-3 shadow-3xs" id="api-error-alert">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <span className="font-bold">Error de conexión:</span> {apiError}
              <button 
                onClick={startActivity}
                className="block mt-2 font-bold text-xs text-red-700 hover:underline"
              >
                Volver a intentar iniciar actividad
              </button>
            </div>
          </div>
        )}

        {/* Informative Tip Box */}
        <div className="mb-6 bg-white border border-[#DCDCD2] rounded-2xl p-5 text-xs text-[#2D2D2A] flex items-start gap-3 shadow-sm" id="info-tip-box">
          <Sparkles className="w-4 h-4 text-[#5A5A40] mt-0.5 flex-shrink-0 animate-pulse" />
          <p className="font-serif italic text-sm text-[#6B6B5E] leading-relaxed">
            <strong>Consejo de Docente:</strong> "La IA no reemplaza tu juicio; es una herramienta para potenciarlo. Úsala con curiosidad pero siempre manteniendo tu pensamiento crítico y honestidad académica durante esta sesión."
          </p>
        </div>

        {/* Content view depending on state */}
        <AnimatePresence mode="wait">
          {isActivityFinished && evaluation ? (
            <motion.div
              key="evaluation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="py-4"
              id="evaluation-view-container"
            >
              <EvaluationCard 
                evaluation={evaluation} 
                onRestart={startActivity} 
              />
            </motion.div>
          ) : (
            <motion.div 
              key="active-tutor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              id="active-tutor-grid"
            >
              {/* Left Column: Metrics & Timeline Dashboard */}
              <div className="lg:col-span-4 space-y-6 flex flex-col" id="dashboard-column">
                
                {/* Progress Indicators */}
                <ProgressTimeline 
                  currentPhase={currentPhase} 
                  progressPercentage={progressPercentage} 
                />

                {/* Achievement Badge Board */}
                <ConceptBadges 
                  unlockedConcepts={unlockedConcepts} 
                />

                {/* Short guidelines */}
                <div className="bg-white border border-[#DCDCD2] rounded-2xl p-5 shadow-sm" id="guidelines-card">
                  <h4 className="font-bold text-[#1A1A1A] text-xs tracking-wider uppercase mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#5A5A40]" />
                    Guía de Práctica Responsable
                  </h4>
                  <ul className="space-y-2 text-xs text-[#6B6B5E]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#5A5A40] font-bold">•</span>
                      <span>Responde de forma honesta, usando tu propio criterio.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#5A5A40] font-bold">•</span>
                      <span>Si tienes una duda sobre un término, escribe: "¿Me lo explicas?".</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#5A5A40] font-bold">•</span>
                      <span>No compartas contraseñas ni datos sensibles en los chats.</span>
                    </li>
                  </ul>
                </div>

              </div>

              {/* Middle/Right Column: Live Chat Thread */}
              <div className="lg:col-span-8 flex flex-col" id="chat-column">
                <ChatContainer 
                  messages={messages} 
                  onSendMessage={handleSendMessage} 
                  isLoading={isLoading} 
                  currentPhase={currentPhase}
                />
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#DCDCD2] py-6 text-center text-xs text-[#8A8A7F] mt-12" id="main-footer">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 EduIA. Tutoría de Inteligencia Artificial Responsable • Diseñado con tonos naturales y tipografía orgánica.</p>
        </div>
      </footer>

    </div>
  );
}
