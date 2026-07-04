/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ChatMessage, Evaluation, PHASES, SavedSession, UserProfile } from "./types";
import { ProgressTimeline } from "./components/ProgressTimeline";
import { StudentXpCard } from "./components/StudentXpCard";
import { ConceptBadges } from "./components/ConceptBadges";
import { EvaluationCard } from "./components/EvaluationCard";
import { ChatContainer } from "./components/ChatContainer";
import { PomodoroTimer } from "./components/PomodoroTimer";
import { SessionHistory } from "./components/SessionHistory";
import { LoginModal } from "./components/LoginModal";
import { Bot, Sparkles, RefreshCw, AlertCircle, HelpCircle, ShieldAlert, BookOpen, LogIn, LogOut, User, Check, X as CloseIcon, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";

export default function App() {
  // Chat state parameters
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentPhase, setCurrentPhase] = useState<number>(1);
  const [progressPercentage, setProgressPercentage] = useState<number>(10);
  const [attempts, setAttempts] = useState<number>(0);
  const [unlockedConcepts, setUnlockedConcepts] = useState<string[]>([]);
  const [isActivityFinished, setIsActivityFinished] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  // Student global XP state
  const [xp, setXp] = useState<number>(() => {
    const saved = localStorage.getItem("eduia_student_xp");
    return saved ? parseInt(saved, 10) : 0;
  });

  // Keep XP updated in localStorage
  useEffect(() => {
    localStorage.setItem("eduia_student_xp", xp.toString());
  }, [xp]);

  // Dark/Light Theme state
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("eduia_tutor_theme");
    return (saved === "dark" || saved === "light") ? (saved as "light" | "dark") : "light";
  });

  // User Profile and Authentication State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Apply Theme effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("eduia_tutor_theme", theme);
  }, [theme]);

  // Session History State parameters
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Network and status state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Helper to load a selected session
  const loadSession = (session: SavedSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setCurrentPhase(session.currentPhase);
    setProgressPercentage(session.progressPercentage);
    setAttempts(session.attempts);
    setUnlockedConcepts(session.unlockedConcepts);
    setIsActivityFinished(session.isActivityFinished);
    setEvaluation(session.evaluation);
  };

  // Helper to delete a session from storage
  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem("eduia_tutor_sessions", JSON.stringify(updated));
    if (currentSessionId === id) {
      if (updated.length > 0) {
        loadSession(updated[0]);
      } else {
        startActivity();
      }
    }
  };

  const handleUserLogin = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem("eduia_tutor_user", JSON.stringify(profile));
  };

  const handleUserLogout = () => {
    setUser(null);
    localStorage.removeItem("eduia_tutor_user");
  };

  // Fetch the initial tutor greeting on mount, or load existing history
  useEffect(() => {
    // Load saved student/user profile if exists
    const savedUser = localStorage.getItem("eduia_tutor_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error("No se pudo cargar el perfil del estudiante:", err);
      }
    }

    const saved = localStorage.getItem("eduia_tutor_sessions");
    if (saved) {
      try {
        const parsed: SavedSession[] = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          // Find the most recently updated session
          const mostRecent = parsed.reduce((latest, curr) => {
            return new Date(curr.updatedAt) > new Date(latest.updatedAt) ? curr : latest;
          }, parsed[0]);
          loadSession(mostRecent);
          return;
        }
      } catch (err) {
        console.error("No se pudo parsear el historial de sesiones:", err);
      }
    }
    // No saved session found: start a fresh one
    startActivity();
  }, []);

  // Global keyboard shortcuts: Ctrl+N (New Session), Ctrl+T (Toggle Pomodoro)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Ctrl+N: Nueva Sesión
      if (e.ctrlKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        startActivity(true);
      }
      // Ctrl+T: Toggle Pomodoro Timer
      if (e.ctrlKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("toggle-pomodoro"));
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [sessions, currentSessionId]);

  const startActivity = async (forceNewId?: string | boolean) => {
    setIsLoading(true);
    setApiError(null);

    const sessionId = typeof forceNewId === "string" ? forceNewId : `session-${Date.now()}`;
    setCurrentSessionId(sessionId);

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
      
      const initialMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "model",
        text: data.tutorResponse,
        timestamp: new Date().toISOString(),
        phase: data.currentPhase || 1,
        unlockedConcepts: data.conceptosClaveDesbloqueados || []
      };

      const initialMsgs = [initialMsg];
      setMessages(initialMsgs);
      setCurrentPhase(data.currentPhase || 1);
      setProgressPercentage(data.phaseProgressPercentage || 10);
      setAttempts(data.attemptsForCurrentQuestion || 0);
      const initialUnlocked = data.conceptosClaveDesbloqueados || [];
      setUnlockedConcepts(initialUnlocked);

      // Create new session or update existing
      const newSession: SavedSession = {
        id: sessionId,
        title: `Sesión: ${new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })} - ${PHASES[(data.currentPhase || 1) - 1]?.name || 'Inicio'}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: initialMsgs,
        currentPhase: data.currentPhase || 1,
        progressPercentage: data.phaseProgressPercentage || 10,
        attempts: data.attemptsForCurrentQuestion || 0,
        unlockedConcepts: initialUnlocked,
        isActivityFinished: false,
        evaluation: null
      };

      setSessions(prev => {
        const filtered = prev.filter(s => s.id !== sessionId);
        const updated = [newSession, ...filtered];
        localStorage.setItem("eduia_tutor_sessions", JSON.stringify(updated));
        return updated;
      });

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
      const newPhase = data.currentPhase || currentPhase;
      const finished = !!data.isActivityFinished;

      // Update state with tutor's feedback
      let tutorText = data.tutorResponse || "";
      const hasCorrectKeyword = /correcto|excelente|muy bien|exacto|perfecto|así es|felicitaciones/i.test(tutorText);
      const isCorrect = hasCorrectKeyword || (newPhase > currentPhase) || finished;

      if (isCorrect) {
        const positiveElements = ["✅", "🌟", "🎉", "¡Excelente!", "🎯", "✨"];
        const shuffled = [...positiveElements].sort(() => 0.5 - Math.random());
        const selectedCount = 3 + Math.floor(Math.random() * 2); // 3 or 4 elements
        const selected = shuffled.slice(0, selectedCount).join(" ");
        if (Math.random() > 0.5) {
          tutorText = `${selected} ${tutorText}`;
        } else {
          tutorText = `${tutorText} ${selected}`;
        }
      }

      const modelMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "model",
        text: tutorText,
        timestamp: new Date().toISOString(),
        phase: newPhase,
        unlockedConcepts: data.conceptosClaveDesbloqueados
      };

      setMessages(prev => [...prev, modelMessage]);

      // Celebration Trigger: student advanced to the next phase or fully completed the session
      if ((newPhase > currentPhase) || finished) {
        if (finished) {
          // Gorgeous full-scale celebratory fireworks confetti for session completion!
          const duration = 3.5 * 1000;
          const end = Date.now() + duration;

          const frame = () => {
            confetti({
              particleCount: 6,
              angle: 60,
              spread: 60,
              origin: { x: 0, y: 0.75 }
            });
            confetti({
              particleCount: 6,
              angle: 120,
              spread: 60,
              origin: { x: 1, y: 0.75 }
            });

            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          };
          frame();
        } else {
          // Standard joyful celebratory confetti burst for advancing in a phase
          confetti({
            particleCount: 80,
            spread: 65,
            origin: { y: 0.7 }
          });
        }
      }

      // Calculate and award XP points for progress
      let xpEarned = 0;
      if (newPhase > currentPhase) {
        xpEarned += 150; // Earn 150 XP per phase completed
      }
      if (finished && !isActivityFinished) {
        xpEarned += 300; // Earn 300 XP for full activity completion
      }
      
      const prevUnlockedCount = unlockedConcepts.length;
      const nextUnlockedCount = data.conceptosClaveDesbloqueados ? data.conceptosClaveDesbloqueados.length : prevUnlockedCount;
      if (nextUnlockedCount > prevUnlockedCount) {
        xpEarned += (nextUnlockedCount - prevUnlockedCount) * 50; // Earn 50 XP per concept badge unlocked
      }

      if (xpEarned > 0) {
        setXp(prev => prev + xpEarned);
      }

      setCurrentPhase(newPhase);
      setProgressPercentage(data.phaseProgressPercentage || progressPercentage);
      setAttempts(data.attemptsForCurrentQuestion || 0);
      
      let finalConcepts = unlockedConcepts;
      if (data.conceptosClaveDesbloqueados) {
        setUnlockedConcepts(data.conceptosClaveDesbloqueados);
        finalConcepts = data.conceptosClaveDesbloqueados;
      }

      let finalEvaluation = evaluation;
      if (finished) {
        setIsActivityFinished(true);
        if (data.evaluation) {
          setEvaluation(data.evaluation);
          finalEvaluation = data.evaluation;
        }
      }

      // Save/update session in state & localStorage
      if (currentSessionId) {
        setSessions(prev => {
          const updated = prev.map(s => {
            if (s.id === currentSessionId) {
              const firstUserMsg = updatedMessages.find(m => m.role === 'user');
              const phaseName = PHASES[newPhase - 1]?.name || 'Evaluación';
              const title = firstUserMsg 
                ? `Sesión: ${firstUserMsg.text.slice(0, 25)}${firstUserMsg.text.length > 25 ? "..." : ""} (${phaseName})`
                : s.title;

              return {
                ...s,
                title,
                updatedAt: new Date().toISOString(),
                messages: [...updatedMessages, modelMessage],
                currentPhase: newPhase,
                progressPercentage: data.phaseProgressPercentage || progressPercentage,
                attempts: data.attemptsForCurrentQuestion || 0,
                unlockedConcepts: finalConcepts,
                isActivityFinished: finished,
                evaluation: finished ? finalEvaluation : s.evaluation
              };
            }
            return s;
          });
          localStorage.setItem("eduia_tutor_sessions", JSON.stringify(updated));
          return updated;
        });
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
              onClick={() => setTheme(prev => prev === "light" ? "dark" : "light")}
              className="p-2 bg-[#E8E8E1] hover:bg-[#DCDCD2] border border-[#DCDCD2] text-[#2D2D2A] rounded-full transition-colors duration-200 cursor-pointer shadow-3xs flex items-center justify-center"
              title={theme === "light" ? "Activar Modo Oscuro (Poca Luz)" : "Activar Modo Claro"}
              id="theme-toggle-btn"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-[#5A5A40]" />
              ) : (
                <Sun className="w-4 h-4 text-[#5A5A40]" />
              )}
            </button>

            <button
              onClick={() => startActivity(true)}
              className="inline-flex items-center gap-2 bg-[#E8E8E1] hover:bg-[#DCDCD2] border border-[#DCDCD2] text-[#2D2D2A] font-semibold text-xs px-4 py-2 rounded-full transition-colors duration-200 cursor-pointer shadow-3xs"
              id="restart-header-btn"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#5A5A40]" />
              Nueva Sesión
            </button>

            {user ? (
              <div className="flex items-center gap-2.5 bg-[#F5F5F0] border border-[#DCDCD2] pl-2.5 pr-3 py-1.5 rounded-full shadow-3xs hover:border-[#5A5A40] transition-colors" id="header-user-profile">
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs cursor-pointer ${user.avatarColor}`}
                  title="Editar Perfil de Estudiante"
                  id="user-profile-avatar-btn"
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-[#1A1A1A] leading-tight truncate max-w-[120px]">{user.name}</p>
                  <p className="text-[9px] text-[#8A8A7F] uppercase tracking-wider leading-none truncate max-w-[120px]">{user.institution}</p>
                </div>
                <div className="w-px h-4 bg-[#DCDCD2] hidden md:block"></div>
                <button
                  onClick={() => {
                    if (confirm("¿Estás seguro de que deseas cerrar sesión? Tus datos de perfil se eliminarán de este navegador.")) {
                      handleUserLogout();
                    }
                  }}
                  className="p-1 text-[#8A8A7F] hover:text-red-600 rounded-full hover:bg-[#E8E8E1] transition-all duration-200 cursor-pointer"
                  title="Cerrar Sesión"
                  id="header-logout-btn"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="inline-flex items-center gap-2 bg-[#5A5A40] hover:bg-[#4A4A33] border border-[#5A5A40] text-white font-bold text-xs px-4 py-2 rounded-full transition-all duration-200 cursor-pointer shadow-sm"
                id="login-header-btn"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Iniciar Sesión</span>
              </button>
            )}
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
                messages={messages}
                unlockedConcepts={unlockedConcepts}
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
                
                {/* Level and Experience Indicator */}
                <StudentXpCard 
                  xp={xp} 
                  onClaimBonus={(amount) => setXp(prev => prev + amount)} 
                />

                {/* Progress Indicators */}
                <ProgressTimeline 
                  currentPhase={currentPhase} 
                  progressPercentage={progressPercentage} 
                />

                {/* Achievement Badge Board */}
                <ConceptBadges 
                  unlockedConcepts={unlockedConcepts} 
                />

                {/* Session History Board */}
                <SessionHistory
                  sessions={sessions}
                  currentSessionId={currentSessionId}
                  onSelectSession={loadSession}
                  onDeleteSession={deleteSession}
                  onStartNewSession={() => startActivity(true)}
                />

                {/* Pomodoro Timer Study Widget */}
                <PomodoroTimer />

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

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleUserLogin}
      />

    </div>
  );
}
