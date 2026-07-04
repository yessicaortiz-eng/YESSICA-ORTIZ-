import React, { useState } from "react";
import { X, ShieldCheck, AlertTriangle, CheckCircle, Lightbulb, Copy, Cpu, Send, RefreshCw, FileSearch, Scale } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TextAnalysisResult } from "../types";

interface TextIntegrityAnalyzerProps {
  isOpen: boolean;
  onClose: () => void;
  onShareWithTutor: (analysisSummary: string) => void;
}

export function TextIntegrityAnalyzer({ isOpen, onClose, onShareWithTutor }: TextIntegrityAnalyzerProps) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TextAnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    setError("");
    const textToAnalyze = inputText.trim();
    if (!textToAnalyze) {
      setError("Por favor, ingresa o pega un fragmento de texto para analizar.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/analyze-ai-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToAnalyze }),
      });

      if (!response.ok) {
        throw new Error("No se pudo completar el análisis del texto.");
      }

      const data: TextAnalysisResult = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySuggestions = () => {
    if (!result) return;
    const textToCopy = `Sugerencias del Analizador de Integridad:\n` + 
      result.suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n");
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!result) return;
    
    const summary = `📄 *Resultado de mi Análisis de Integridad de IA* 🔍\n\n` +
      `• *Puntaje:* ${result.integrityScore}/100\n` +
      `• *Estado:* ${result.isCompliant ? "Cumple Criterios Básicos" : "Requiere Ajustes Importantes"}\n` +
      `• *Citas Detectadas:* ${result.citationsDetected ? "Sí" : "No"}\n\n` +
      `*Análisis:* ${result.analysisText}\n\n` +
      `*Criterios:* \n` + 
      result.criteriaEvaluated.map(c => ` - ${c.name}: [${c.status}] ${c.feedback}`).join("\n") + `\n\n` +
      `Tutor, ¿me podrías dar más detalles o consejos sobre cómo mejorar mi texto basándote en este análisis?`;
      
    onShareWithTutor(summary);
    onClose();
  };

  // Helper colors for status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Cumple":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "Advertencia":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "No cumple":
        return "bg-red-50 text-red-800 border-red-200";
      default:
        return "bg-gray-50 text-gray-800 border-gray-200";
    }
  };

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
        {/* Header decoration banner */}
        <div className="bg-[#5A5A40] p-5 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-md font-serif font-bold tracking-tight">Analizador de Integridad Académica</h2>
              <p className="text-[11px] text-white/80">Verifica la ética, atribución y veracidad de tus textos generados por IA.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            id="close-analyzer-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              {error}
            </div>
          )}

          {/* Form / Paste section */}
          {!result && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#5A5A40] uppercase tracking-wider">
                  Fragmento de Texto Generado por IA
                </label>
                <textarea
                  placeholder="Pega aquí el texto que te entregó ChatGPT, Gemini u otra herramienta y que deseas evaluar..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full h-48 px-4 py-3 bg-[#F5F5F0] border border-[#DCDCD2] rounded-xl text-sm focus:outline-none focus:border-[#5A5A40] transition-colors resize-none font-medium leading-relaxed"
                  id="analyzer-textarea"
                />
              </div>

              <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-3.5 flex gap-3">
                <ShieldCheck className="w-5 h-5 text-[#5A5A40] flex-shrink-0" />
                <div className="space-y-1 text-left">
                  <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">¿Qué evalúa esta herramienta?</h4>
                  <p className="text-xs text-[#8A8A7F] leading-relaxed">
                    Nuestra IA evaluará el fragmento bajo los pilares éticos de <strong>Atribución (citas)</strong>, <strong>Pensamiento Crítico (estilo robótico o muletillas)</strong>, <strong>Privacidad de Datos</strong> y la probabilidad de <strong>Alucinaciones</strong>. Te daremos sugerencias de mejora formativa.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isLoading || !inputText.trim()}
                  className="px-5 py-2.5 bg-[#5A5A40] hover:bg-[#4A4A33] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  id="submit-analysis-btn"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analizando...</span>
                    </>
                  ) : (
                    <>
                      <FileSearch className="w-4 h-4" />
                      <span>Analizar Texto</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Results section */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 text-left"
            >
              {/* Overarching score and badge */}
              <div className="flex flex-col sm:flex-row items-center gap-5 bg-gray-50 border border-[#DCDCD2] p-5 rounded-xl">
                <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center font-bold flex-shrink-0 ${getScoreColor(result.integrityScore)}`}>
                  <span className="text-2xl tracking-tighter leading-none">{result.integrityScore}</span>
                  <span className="text-[10px] uppercase tracking-widest text-[#8A8A7F] leading-none mt-1">Score</span>
                </div>
                <div className="space-y-1.5 flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap gap-2 items-center justify-center sm:justify-start">
                    <h3 className="font-serif font-bold text-md text-[#1A1A1A]">Puntaje de Integridad Académica</h3>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      result.isCompliant 
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}>
                      {result.isCompliant ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          <span>Listo para entregar</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>Requiere revisión</span>
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-[#2D2D2A] leading-relaxed font-serif italic">
                    "{result.analysisText}"
                  </p>
                </div>
              </div>

              {/* Specific Criteria Grid */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider">Criterios Evaluados</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.criteriaEvaluated.map((c, idx) => (
                    <div key={idx} className="bg-white border border-[#DCDCD2] rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="text-xs font-bold text-[#1A1A1A] leading-tight">{c.name}</h5>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${getStatusBadge(c.status)}`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#8A8A7F] leading-relaxed flex-1">
                        {c.feedback}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggestions list */}
              <div className="bg-[#F5F5F0]/60 border border-[#DCDCD2] rounded-xl p-4.5 space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-600 fill-amber-100" />
                  <h4 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider">¿Cómo hacerlo 100% responsable y honesto?</h4>
                </div>
                <ul className="space-y-2 text-xs text-[#2D2D2A] leading-relaxed">
                  {result.suggestions.map((s, idx) => (
                    <li key={idx} className="flex gap-2.5">
                      <span className="font-bold text-[#5A5A40] text-sm leading-none">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom control buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-between items-center border-t border-[#DCDCD2]">
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setInputText("");
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-[#F5F5F0] hover:bg-[#E8E8E1] text-[#5A5A40] text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Analizar otro texto
                </button>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCopySuggestions}
                    className="flex-1 sm:flex-none px-4 py-2 bg-gray-50 border border-[#DCDCD2] text-gray-700 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    title="Copiar recomendaciones en tu portapapeles"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? "¡Copiado!" : "Copiar Guía"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-[#5A5A40] hover:bg-[#4A4A33] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    title="Enviar resultados al tutor para discutirlo"
                    id="share-analysis-btn"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Conversar con Tutor</span>
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
