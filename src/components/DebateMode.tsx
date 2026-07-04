import React, { useState } from "react";
import { X, MessageSquare, AlertCircle, CheckCircle2, ArrowRight, BrainCircuit, Copy, Send, Shuffle, Scale, Award, Heart, HelpCircle, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DebateDilemma, DebateCritiqueResult } from "../types";
import confetti from "canvas-confetti";

// Curated list of high-quality ethical dilemmas for Bachillerato
const DILEMMAS: DebateDilemma[] = [
  {
    id: "dilemma-1",
    title: "Derechos de Autor e IA Creativa (Plagio Algorítmico)",
    description: "Un modelo de IA generadora de arte es entrenado con millones de ilustraciones de artistas vivos de todo el mundo sin su consentimiento ni pago de regalías. Una obra generada con este modelo gana el primer lugar en un concurso nacional de arte digital. ¿Debe el premio ser revocado? ¿Es ético usar esta herramienta para fines comerciales si afecta el sustento de creadores reales?",
    category: "Ética de Datos & Copyright",
    difficulty: "Medio"
  },
  {
    id: "dilemma-2",
    title: "Vigilancia por Reconocimiento Facial en Colegios (Seguridad vs. Privacidad)",
    description: "Un colegio de bachillerato instala cámaras con reconocimiento facial con IA para detectar intrusos y controlar la asistencia en tiempo real. Esto reduce los robos en un 80%, pero los estudiantes sienten que su privacidad es violada a diario. Además, el sistema ha cometido errores identificando incorrectamente a alumnos de minorías étnicas como sospechosos. ¿Debería retirarse el sistema o se justifica para la seguridad de todos?",
    category: "Privacidad & Sesgos Algorítmicos",
    difficulty: "Difícil"
  },
  {
    id: "dilemma-3",
    title: "Evaluación Automatizada de Ensayos por IA (Justicia Algorítmica)",
    description: "Una escuela decide usar un modelo de lenguaje para calificar automáticamente los ensayos escritos de los estudiantes para ahorrar tiempo a los profesores. El modelo es súper veloz, pero penaliza a estudiantes con estilos de escritura creativos u opiniones divergentes que no encajan en sus patrones de entrenamiento estándar. ¿Es ético delegar la evaluación formativa a una IA?",
    category: "Educación & Justicia Social",
    difficulty: "Fácil"
  },
  {
    id: "dilemma-4",
    title: "IAs de Compañía y Relaciones Humanas (Afecto Sintético)",
    description: "Aplicaciones de amistad virtual impulsadas por IA permiten a jóvenes crear amigos o parejas virtuales que responden con empatía simulada las 24 horas del día. Muchos estudiantes reportan sentirse menos solos y más comprendidos. Sin embargo, psicólogos advierten que esto atrofia su capacidad real para lidiar con la fricción social y entablar lazos con personas de carne y hueso. ¿Es saludable promover su uso en adolescentes?",
    category: "Psicología & Humanidad",
    difficulty: "Medio"
  },
  {
    id: "dilemma-5",
    title: "Algoritmos de Libertad Condicional (Prejuicios Heredados)",
    description: "Un tribunal de justicia utiliza una IA para predecir la probabilidad de que un convicto vuelva a delinquir y decidir si se le otorga libertad bajo fianza. Dado que la IA fue entrenada con datos históricos donde las minorías étnicas eran arrestadas con mayor frecuencia por la policía, el sistema asigna de forma sistemática un riesgo más alto de reincidencia a personas afrodescendientes que a blancas con los mismos cargos. ¿Se debe seguir utilizando esta herramienta?",
    category: "Sesgos Históricos & Justicia",
    difficulty: "Difícil"
  }
];

interface DebateModeProps {
  isOpen: boolean;
  onClose: () => void;
  onShareWithTutor: (debateSummary: string) => void;
}

export function DebateMode({ isOpen, onClose, onShareWithTutor }: DebateModeProps) {
  const [selectedDilemma, setSelectedDilemma] = useState<DebateDilemma | null>(null);
  const [studentArgument, setStudentArgument] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [critique, setCritique] = useState<DebateCritiqueResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSelectRandom = () => {
    setError("");
    const randomIndex = Math.floor(Math.random() * DILEMMAS.length);
    setSelectedDilemma(DILEMMAS[randomIndex]);
    setStudentArgument("");
    setCritique(null);
  };

  const handleSelectDilemma = (dilemma: DebateDilemma) => {
    setError("");
    setSelectedDilemma(dilemma);
    setStudentArgument("");
    setCritique(null);
  };

  const handleBackToList = () => {
    setSelectedDilemma(null);
    setStudentArgument("");
    setCritique(null);
    setError("");
  };

  const handleAnalyzeArgument = async () => {
    setError("");
    const argumentText = studentArgument.trim();
    if (argumentText.split(/\s+/).length < 10) {
      setError("Tu respuesta es demasiado corta. Escribe al menos 10 palabras con premisas lógicas para poder analizar tu argumentación.");
      return;
    }

    setIsLoading(true);
    setCritique(null);

    try {
      const response = await fetch("/api/analyze-debate-argument", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dilemmaTitle: selectedDilemma?.title,
          dilemmaDescription: selectedDilemma?.description,
          studentArgument: argumentText
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo conectar con el servidor para la crítica de debate.");
      }

      const data: DebateCritiqueResult = await response.json();
      setCritique(data);
      if (data.logicalConsistencyScore >= 80) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al procesar el debate. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyDebate = () => {
    if (!selectedDilemma || !critique) return;
    const textToCopy = 
      `⚔️ DEBATE ÉTICO DE IA - CRÍTICA DE CONSISTENCIA LÓGICA\n\n` +
      `📌 DILEMA: ${selectedDilemma.title}\n` +
      `💬 MI ARGUMENTO:\n"${studentArgument}"\n\n` +
      `🔍 CRÍTICA DE LA IA:\n` +
      `• Coherencia Lógica: ${critique.logicalConsistencyScore}/100\n` +
      `• Postura Resumida: ${critique.argumentSummary}\n` +
      `• Crítica: ${critique.critiqueText}\n` +
      `• Falacias Detectadas: ${critique.logicalFallaciesDetected.join(", ")}\n` +
      `• Fortalezas:\n${critique.strengths.map(s => `  - ${s}`).join("\n")}\n` +
      `• Puntos a reconsiderar:\n${critique.weaknesses.map(w => `  - ${w}`).join("\n")}\n` +
      `• Contraargumento desafiante:\n${critique.counterArgument}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWithTutor = () => {
    if (!selectedDilemma || !critique) return;

    const summary = 
      `⚔️ *¡Tutor! He participado en el Modo Debate* ⚔️\n\n` +
      `• *Dilema:* ${selectedDilemma.title}\n` +
      `• *Mi postura argumentada:* "${studentArgument}"\n\n` +
      `• *Puntaje de consistencia:* ${critique.logicalConsistencyScore}/100\n` +
      `• *Crítica de la IA:* ${critique.critiqueText}\n` +
      `• *Falacias detectadas:* ${critique.logicalFallaciesDetected.join(", ") || "Ninguna"}\n\n` +
      `*Pregunta Desafiante:* ${critique.counterArgument}\n\n` +
      `Tutor, ¿qué opinas sobre esta crítica de consistencia lógica y el contraargumento planteado?`;

    onShareWithTutor(summary);
    onClose();
  };

  // Helper colors based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-red-600 bg-red-50 border-red-100";
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-[#DCDCD2] flex flex-col max-h-[90vh]"
      >
        {/* Banner header for debate */}
        <div className="bg-[#5A5A40] p-5 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <BrainCircuit className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-md font-serif font-bold tracking-tight">Modo Debate Ético</h2>
              <p className="text-[11px] text-white/80">Desafía tu pensamiento argumentando dilemas reales de IA y recibe una crítica de lógica.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            id="close-debate-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              {error}
            </div>
          )}

          {/* SCREEN 1: Choose Dilemma */}
          {!selectedDilemma && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/50 border border-amber-200/50 rounded-xl p-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">¡Bienvenido al Campo de Retórica!</h4>
                  <p className="text-xs text-[#8A8A7F] leading-relaxed">
                    Escoge uno de los dilemas éticos más calientes de la Inteligencia Artificial del siglo XXI. Escribe tu postura y descubre si tu argumentación tiene consistencia lógica o cae en falacias.
                  </p>
                </div>
                <button
                  onClick={handleSelectRandom}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5A5A40] hover:bg-[#4A4A33] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-3xs"
                  id="random-dilemma-btn"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  Al azar
                </button>
              </div>

              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-[#5A5A40] uppercase tracking-wider">
                  Selecciona una controversia para debatir:
                </label>
                <div className="space-y-3">
                  {DILEMMAS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => handleSelectDilemma(d)}
                      className="w-full text-left p-4 bg-[#F5F5F0]/60 hover:bg-[#F5F5F0] border border-[#DCDCD2] hover:border-[#5A5A40] rounded-xl transition-all duration-200 flex flex-col gap-2 group cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2 w-full">
                        <span className="text-xs font-bold text-[#1A1A1A] group-hover:text-[#5A5A40] font-serif leading-snug">
                          {d.title}
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#DCDCD2] uppercase tracking-wide">
                          {d.difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-[#8A8A7F] line-clamp-2 leading-relaxed">
                        {d.description}
                      </p>
                      <span className="text-[10px] text-[#5A5A40] font-bold uppercase tracking-wider mt-1">
                        Categoría: {d.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 2: Write Argument */}
          {selectedDilemma && !critique && (
            <div className="space-y-4">
              <div className="bg-[#F5F5F0] border border-[#DCDCD2] rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-[#5A5A40] text-white uppercase tracking-wider">
                    {selectedDilemma.category}
                  </span>
                  <button
                    onClick={handleBackToList}
                    className="text-xs font-bold text-[#5A5A40] hover:underline"
                  >
                    Volver a la lista
                  </button>
                </div>
                <h3 className="font-serif font-bold text-sm text-[#1A1A1A] leading-snug">
                  {selectedDilemma.title}
                </h3>
                <p className="text-xs text-[#2D2D2A] leading-relaxed italic">
                  "{selectedDilemma.description}"
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-[#5A5A40] uppercase tracking-wider">
                    Tu Postura Argumentada (Mínimo 10 palabras)
                  </label>
                  <span className="text-[10px] text-[#8A8A7F] font-mono">
                    Palabras: {studentArgument.trim() === "" ? 0 : studentArgument.trim().split(/\s+/).length}
                  </span>
                </div>
                <textarea
                  placeholder="Escribe tu punto de vista de forma lógica. Intenta dar razones, premisas claras o ejemplos cotidianos..."
                  value={studentArgument}
                  onChange={(e) => setStudentArgument(e.target.value)}
                  className="w-full h-40 px-4 py-3 bg-[#F5F5F0]/30 border border-[#DCDCD2] rounded-xl text-sm focus:outline-none focus:border-[#5A5A40] transition-colors resize-none font-medium leading-relaxed"
                  id="debate-argument-textarea"
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  Cambiar Dilema
                </button>

                <button
                  type="button"
                  onClick={handleAnalyzeArgument}
                  disabled={isLoading || studentArgument.trim() === ""}
                  className="px-5 py-2.5 bg-[#5A5A40] hover:bg-[#4A4A33] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  id="submit-debate-btn"
                >
                  {isLoading ? (
                    <>
                      <Shuffle className="w-4 h-4 animate-spin" />
                      <span>Analizando Lógica...</span>
                    </>
                  ) : (
                    <>
                      <span>Criticar Argumento</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 3: Critique Dashboard */}
          {selectedDilemma && critique && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5 text-left"
            >
              {critique.logicalConsistencyScore >= 80 ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-1 animate-pulse">
                  <div className="text-xl">🌟 ¡EXCELENTE TRABAJO! 🌟 🏆👏💯🧠✨</div>
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Tu argumentación demuestra un nivel de rigor y consistencia lógica impecable.</div>
                </div>
              ) : critique.logicalConsistencyScore >= 70 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center space-y-1">
                  <div className="text-lg">✨ ¡Muy Buena Argumentación! ✨ 👍📚🎓</div>
                  <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Has expuesto ideas interesantes con buen fundamento lógico. ¡Sigue así!</div>
                </div>
              ) : null}

              {/* Score and Overview */}
              <div className="flex flex-col sm:flex-row items-center gap-5 bg-gray-50 border border-[#DCDCD2] p-5 rounded-xl">
                <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center font-bold flex-shrink-0 ${getScoreColor(critique.logicalConsistencyScore)}`}>
                  <span className="text-2xl tracking-tighter leading-none">{critique.logicalConsistencyScore}</span>
                  <span className="text-[8px] uppercase tracking-widest text-[#8A8A7F] leading-none mt-1">Lógica</span>
                </div>
                <div className="space-y-1.5 flex-1 text-center sm:text-left">
                  <h4 className="font-serif font-bold text-sm text-[#1A1A1A]">Crítica de Consistencia Lógica</h4>
                  <p className="text-xs text-[#2D2D2A] leading-relaxed font-serif italic">
                    "{critique.critiqueText}"
                  </p>
                </div>
              </div>

              {/* Argument Summary & Fallacies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white border border-[#DCDCD2] rounded-xl p-4 space-y-2">
                  <h5 className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-wider">Tu Postura Identificada</h5>
                  <p className="text-xs text-[#2D2D2A] leading-relaxed">
                    {critique.argumentSummary}
                  </p>
                </div>

                <div className="bg-white border border-[#DCDCD2] rounded-xl p-4 space-y-2">
                  <h5 className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    Falacias Lógicas Detectadas
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {critique.logicalFallaciesDetected.map((f, i) => (
                      <span
                        key={i}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                          f.toLowerCase().includes("ninguna")
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-red-50 text-red-800 border-red-200"
                        }`}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strengths and Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50/20 border border-emerald-200/60 rounded-xl p-4 space-y-2.5">
                  <h5 className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Aciertos de tu Razonamiento
                  </h5>
                  <ul className="space-y-1.5 text-xs text-[#2D2D2A] leading-relaxed">
                    {critique.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50/20 border border-amber-200/60 rounded-xl p-4 space-y-2.5">
                  <h5 className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Vacíos o Sesgos a Revisar
                  </h5>
                  <ul className="space-y-1.5 text-xs text-[#2D2D2A] leading-relaxed">
                    {critique.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Counterargument card */}
              <div className="bg-[#F5F5F0] border border-[#DCDCD2] rounded-xl p-4.5 space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-[#5A5A40]" />
                  <h5 className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-wider">El Siguiente Paso: Contraargumento</h5>
                </div>
                <p className="text-xs text-[#2D2D2A] leading-relaxed font-serif italic">
                  "{critique.counterArgument}"
                </p>
                <p className="text-[10px] text-[#8A8A7F]">
                  Usa esta pregunta desafiante para profundizar tu punto de vista con el tutor.
                </p>
              </div>

              {/* Control Buttons */}
              <div className="pt-3 border-t border-[#DCDCD2] flex flex-col sm:flex-row gap-3 justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    setCritique(null);
                    setStudentArgument("");
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-[#F5F5F0] hover:bg-[#E8E8E1] text-[#5A5A40] text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  Escribir otra postura
                </button>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCopyDebate}
                    className="flex-1 sm:flex-none px-4 py-2 bg-gray-50 border border-[#DCDCD2] text-gray-700 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    title="Copiar debate y crítica en portapapeles"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? "¡Copiado!" : "Copiar Debate"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareWithTutor}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-[#5A5A40] hover:bg-[#4A4A33] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    title="Enviar resultados al chat de la tutoría"
                    id="share-debate-btn"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Debatir con Tutor</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
