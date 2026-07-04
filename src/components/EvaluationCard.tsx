/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ChatMessage, Evaluation } from "../types";
import { jsPDF } from "jspdf";
import { Award, BookOpen, CheckCircle, Flame, Star, Sparkles, RefreshCw, Trophy, ArrowUpRight, Download } from "lucide-react";
import { motion } from "motion/react";

interface EvaluationCardProps {
  evaluation: Evaluation;
  onRestart: () => void;
  messages: ChatMessage[];
  unlockedConcepts: string[];
}

export function EvaluationCard({ evaluation, onRestart, messages, unlockedConcepts }: EvaluationCardProps) {
  const { resumen, fortalezas, mejoras, nivelDesempeño, recursosRecomendados } = evaluation;

  // Choose the right color palette for performance levels
  const getLevelStyles = (level: string) => {
    switch (level) {
      case "Excelente":
        return {
          bg: "bg-[#F0F5EB] border-[#DCDCD2]",
          badge: "bg-[#5A5A40] text-white",
          text: "text-[#3E5C2E]",
          iconColor: "text-[#5A5A40]",
          stars: 5,
        };
      case "Muy Bueno":
        return {
          bg: "bg-[#F5F5F0] border-[#DCDCD2]",
          badge: "bg-[#5A5A40] text-white",
          text: "text-[#2D2D2A]",
          iconColor: "text-[#5A5A40]",
          stars: 4,
        };
      case "Bueno":
        return {
          bg: "bg-[#F5F5F0] border-[#DCDCD2]",
          badge: "bg-[#5A5A40] text-white",
          text: "text-[#2D2D2A]",
          iconColor: "text-[#5A5A40]",
          stars: 3,
        };
      default:
        return {
          bg: "bg-[#F5F5F0] border-[#DCDCD2]",
          badge: "bg-[#8A8A7F] text-white",
          text: "text-[#2D2D2A]",
          iconColor: "text-[#8A8A7F]",
          stars: 2,
        };
    }
  };

  const styles = getLevelStyles(nivelDesempeño);

  const downloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      let y = 25;

      const drawHeader = () => {
        // Background decorative bar
        doc.setFillColor(90, 90, 64); // #5A5A40
        doc.rect(20, y, 170, 8, "F");
        y += 14;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(26, 26, 26);
        doc.text("REPORTE DE APRENDIZAJE", 20, y);
        y += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(107, 107, 94); // #6B6B5E
        doc.text("Tutoria de Inteligencia Artificial Responsable - EduIA", 20, y);
        y += 8;

        // Divider line
        doc.setDrawColor(220, 220, 210); // #DCDCD2
        doc.setLineWidth(0.5);
        doc.line(20, y, 190, y);
        y += 8;
      };

      drawHeader();

      // Metadata section (date, performance, concepts)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 64);
      doc.text("INFORMACION DE LA SESION", 20, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(45, 45, 42);
      
      const currentDate = new Date().toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      doc.text(`Fecha: ${currentDate}`, 25, y);
      y += 4.5;
      doc.text(`Nivel de Desempeno: ${nivelDesempeño.toUpperCase()}`, 25, y);
      y += 4.5;
      doc.text(`Conceptos Desbloqueados: ${unlockedConcepts.length}`, 25, y);
      y += 8;

      // Helper to add titled sections
      const addSectionHeader = (title: string) => {
        if (y > 240) {
          doc.addPage();
          y = 25;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(90, 90, 64); // Accent
        doc.text(title, 20, y);
        y += 5;

        // Underline accent line
        doc.setDrawColor(90, 90, 64);
        doc.setLineWidth(0.3);
        doc.line(20, y - 1, 60, y - 1);
        y += 3;
      };

      const addParagraph = (text: string, fontSize = 9.5, isBold = false, color = [45, 45, 42]) => {
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        
        const lines = doc.splitTextToSize(text, 170);
        for (const line of lines) {
          if (y > 275) {
            doc.addPage();
            y = 25;
          }
          doc.text(line, 20, y);
          y += fontSize * 0.45 + 1.8;
        }
        y += 2.5;
      };

      // 1. Resumen
      addSectionHeader("1. RESUMEN DE APRENDIZAJE");
      addParagraph(resumen);
      y += 2;

      // 2. Fortalezas y Mejoras
      addSectionHeader("2. VALORACION PEDAGOGICA");
      addParagraph("Tus Fortalezas:", 10, true, [62, 92, 46]);
      addParagraph(fortalezas, 9.5, false, [45, 45, 42]);
      y += 1.5;
      addParagraph("Consejos de Mejora:", 10, true, [90, 90, 64]);
      addParagraph(mejoras, 9.5, false, [45, 45, 42]);
      y += 2;

      // 3. Conceptos Aprendidos
      if (unlockedConcepts.length > 0) {
        addSectionHeader("3. CONCEPTOS CLAVE DESBLOQUEADOS");
        for (const concept of unlockedConcepts) {
          addParagraph(`* ${concept}`, 9.5, true, [26, 26, 26]);
        }
        y += 2;
      }

      // 4. Diálogo de la Conversación
      const cleanMessages = messages.filter(msg => msg.text && msg.text.trim() !== "");
      if (cleanMessages.length > 0) {
        addSectionHeader("4. HISTORIAL DE LA CONVERSACION");
        
        for (const msg of cleanMessages) {
          if (y > 250) {
            doc.addPage();
            y = 25;
          }

          const isTutor = msg.role === "model" || msg.role === "system";
          const senderLabel = isTutor ? "Tutor de IA" : "Estudiante";
          const senderColor = isTutor ? [90, 90, 64] : [45, 55, 72]; // olive vs dark slate/blue

          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(senderColor[0], senderColor[1], senderColor[2]);
          doc.text(`[${senderLabel}]`, 20, y);
          y += 4;

          // Clean markdown bold or italic indicators
          const cleanText = msg.text
            .replace(/\*\*([^*]+)\*\*/g, "$1") // remove markdown bold
            .replace(/\*([^*]+)\*/g, "$1") // remove italic
            .trim();

          addParagraph(cleanText, 9, false, [60, 60, 60]);
          y += 2.5;
        }
      }

      // Add footer page numbers to all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Elegant top running header on page > 1
        if (i > 1) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(7.5);
          doc.setTextColor(138, 138, 127);
          doc.text("Reporte de Aprendizaje - Tutoria de IA Responsable", 20, 15);
          doc.setDrawColor(235, 235, 230);
          doc.setLineWidth(0.2);
          doc.line(20, 17, 190, 17);
        }

        // Bottom running footer
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(138, 138, 127); // #8A8A7F
        doc.text(`Pagina ${i} de ${pageCount}`, 20, 287);
        doc.text("Generado por EduIA - Tutoria de IA Responsable para Bachillerato", 100, 287);
      }

      // Save PDF
      doc.save(`Reporte_TutorIA_Responsable_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (pdfError) {
      console.error("Error al generar el PDF de resumen:", pdfError);
      alert("No se pudo generar el PDF de forma automatica. Puedes imprimir la pantalla usando Ctrl+P.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white rounded-3xl border border-[#DCDCD2] shadow-sm overflow-hidden max-w-2xl mx-auto"
      id="evaluation-card-root"
    >
      {/* Header Banner */}
      <div className={`p-8 text-center border-b border-[#DCDCD2] relative overflow-hidden ${styles.bg}`} id="evaluation-header">
        {/* Background Sparkles / Decorative Circles */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-white/20 rounded-full blur-xl -translate-x-10 -translate-y-10" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl translate-x-10 translate-y-10" />

        <motion.div 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white border border-[#DCDCD2] shadow-xs mb-4 text-[#5A5A40]"
          id="trophy-badge"
        >
          <Trophy className="w-7 h-7" />
        </motion.div>

        <h2 className="text-2xl font-serif font-bold text-[#1A1A1A] tracking-tight" id="evaluation-title">
          ¡Actividad Completada! 🎉
        </h2>
        <p className="text-sm text-[#6B6B5E] mt-1 max-w-md mx-auto" id="evaluation-subtitle">
          Has completado todas las fases de aprendizaje interactivo sobre el uso responsable de la IA.
        </p>

        {/* Performance Level */}
        <div className="mt-5 inline-flex flex-col items-center" id="performance-level-wrapper">
          <span className="text-[10px] font-mono text-[#8A8A7F] uppercase tracking-widest font-bold mb-1">
            Nivel de Desempeño
          </span>
          <div className="flex items-center gap-2">
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-xs ${styles.badge}`} id="performance-level-badge">
              {nivelDesempeño}
            </span>
          </div>
          {/* Star ratings */}
          <div className="flex gap-1 mt-2" id="star-rating">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star 
                key={i} 
                className={`w-4 h-4 ${i < styles.stars ? "text-amber-500 fill-amber-500" : "text-[#DCDCD2]"}`} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Body / Sections */}
      <div className="p-8 space-y-6" id="evaluation-body">
        
        {/* Summary */}
        <div className="bg-[#FAFAFA] rounded-2xl p-5 border border-[#DCDCD2]" id="eval-summary-section">
          <h3 className="text-sm font-bold text-[#1A1A1A] tracking-tight flex items-center gap-2 mb-2 font-serif" id="summary-heading">
            <Sparkles className="w-4 h-4 text-[#5A5A40]" />
            Resumen de tus Aprendizajes
          </h3>
          <p className="text-sm text-[#6B6B5E] leading-relaxed" id="summary-content">
            {resumen}
          </p>
        </div>

        {/* Strengths & Improvements split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="eval-details-grid">
          
          {/* Strengths */}
          <div className="bg-[#F0F5EB] border border-[#DCDCD2] rounded-2xl p-5" id="eval-strengths-section">
            <h3 className="text-sm font-bold text-[#3E5C2E] tracking-tight flex items-center gap-2 mb-2" id="strengths-heading">
              <CheckCircle className="w-4 h-4 text-[#3E5C2E]" />
              Tus Fortalezas
            </h3>
            <p className="text-xs text-[#3E5C2E] leading-relaxed" id="strengths-content">
              {fortalezas}
            </p>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-[#F5F5F0] border border-[#DCDCD2] rounded-2xl p-5" id="eval-improvements-section">
            <h3 className="text-sm font-bold text-[#2D2D2A] tracking-tight flex items-center gap-2 mb-2 font-serif italic" id="improvements-heading">
              <Flame className="w-4 h-4 text-[#5A5A40]" />
              Consejos de Mejora
            </h3>
            <p className="text-xs text-[#6B6B5E] leading-relaxed" id="improvements-content">
              {mejoras}
            </p>
          </div>

        </div>

        {/* Recommended Resources */}
        {recursosRecomendados && recursosRecomendados.length > 0 && (
          <div id="eval-resources-section">
            <h3 className="text-sm font-bold text-[#1A1A1A] tracking-tight flex items-center gap-2 mb-3" id="resources-heading">
              <BookOpen className="w-4 h-4 text-[#5A5A40]" />
              Recursos Recomendados para Seguir Aprendiendo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="resources-grid">
              {recursosRecomendados.map((recurso, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#DCDCD2] shadow-2xs hover:border-[#5A5A40] transition-colors duration-200 text-left"
                  id={`resource-item-${i}`}
                >
                  <span className="text-xs font-semibold text-[#2D2D2A] truncate pr-2" id={`resource-text-${i}`}>
                    {recurso}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-[#8A8A7F] flex-shrink-0" id={`resource-arrow-${i}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4" id="restart-button-wrapper">
          <button
            onClick={downloadPDF}
            className="inline-flex items-center gap-2.5 bg-white hover:bg-[#F5F5F0] border border-[#5A5A40] text-[#5A5A40] text-xs font-bold uppercase tracking-widest rounded-full px-6 py-3 transition-all duration-200 cursor-pointer shadow-3xs"
            id="download-pdf-btn"
          >
            <Download className="w-4 h-4" />
            Descargar Resumen PDF
          </button>

          <button
            onClick={onRestart}
            className="inline-flex items-center gap-2.5 bg-[#5A5A40] hover:bg-[#4A4A35] text-white text-xs font-bold uppercase tracking-widest rounded-full px-6 py-3 transition-all duration-200 cursor-pointer shadow-sm"
            id="restart-activity-btn"
          >
            <RefreshCw className="w-4 h-4" />
            Iniciar Nueva Tutoría
          </button>
        </div>

      </div>
    </motion.div>
  );
}
