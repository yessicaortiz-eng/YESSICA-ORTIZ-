import { jsPDF } from "jspdf";
import { ChatMessage, Evaluation, UserProfile } from "../types";

interface ExportPdfOptions {
  user: UserProfile | null;
  messages: ChatMessage[];
  unlockedConcepts: string[];
  evaluation: Evaluation | null;
  currentPhase: number;
  xp: number;
}

export function exportSessionToPdf({
  user,
  messages,
  unlockedConcepts,
  evaluation,
  currentPhase,
  xp
}: ExportPdfOptions) {
  // Create PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2); // 170mm
  let y = 20;

  // Helper: check space and add page if necessary
  const checkSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawPageFooter();
    }
  };

  // Helper: Draw footer with page number
  const drawPageFooter = () => {
    const pageCount = doc.internal.pages.length - 1;
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(138, 138, 127); // #8A8A7F
    doc.text(
      `EduIA - Reporte de Sesión de Tutoría • Página ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  };

  // 1. HEADER BRANDING
  doc.setFillColor(90, 90, 64); // Primary dark natural color #5A5A40
  doc.rect(margin, y, contentWidth, 24, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.text("EDUIA - TUTORÍA DE IA RESPONSABLE", margin + 6, y + 9);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Reporte Académico de Aprendizaje Adaptativo para Bachillerato", margin + 6, y + 16);
  
  y += 32;

  // 2. STUDENT & SESSION INFO
  checkSpace(40);
  doc.setFillColor(245, 245, 240); // Soft grey-green background #F5F5F0
  doc.rect(margin, y, contentWidth, 32, "F");
  doc.setDrawColor(220, 220, 210); // #DCDCD2
  doc.rect(margin, y, contentWidth, 32, "S");

  doc.setTextColor(26, 26, 26);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.text("INFORMACIÓN DEL ESTUDIANTE Y DE LA SESIÓN", margin + 6, y + 7);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  
  const studentName = user ? user.name : "Estudiante Invitado";
  const studentEmail = user ? user.email : "No registrado";
  const institution = user ? user.institution : "Educación Media";
  const grade = user ? user.grade : "No especificado";
  const dateStr = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  doc.text(`Estudiante: ${studentName}`, margin + 6, y + 14);
  doc.text(`Institución: ${institution}`, margin + 6, y + 19);
  doc.text(`Grado: ${grade}`, margin + 6, y + 24);
  
  doc.text(`Fecha de Reporte: ${dateStr}`, margin + 90, y + 14);
  doc.text(`Progreso de Sesión: Fase ${currentPhase} de 6`, margin + 90, y + 19);
  doc.text(`Nivel de Experiencia: ${xp} XP`, margin + 90, y + 24);

  y += 38;

  // 3. UNLOCKED CONCEPTS (BADGES)
  if (unlockedConcepts.length > 0) {
    checkSpace(25);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(26, 26, 26);
    doc.text("CONCEPTOS CLAVE DESBLOQUEADOS (LOGROS)", margin, y);
    y += 4;
    
    doc.setDrawColor(90, 90, 64);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);

    const conceptsStr = unlockedConcepts.map(c => `• ${c}`).join("    ");
    const conceptLines = doc.splitTextToSize(conceptsStr, contentWidth);
    
    checkSpace(conceptLines.length * 5);
    doc.text(conceptLines, margin, y);
    y += (conceptLines.length * 5) + 6;
  }

  // 4. EVALUATION SECTION
  if (evaluation) {
    checkSpace(50);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(26, 26, 26);
    doc.text("EVALUACIÓN DE DESEMPEÑO DOCENTE", margin, y);
    y += 4;
    
    doc.setDrawColor(90, 90, 64);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    // Badge for Nivel de Desempeño
    checkSpace(12);
    doc.setFillColor(232, 232, 225); // #E8E8E1
    doc.rect(margin, y, contentWidth, 10, "F");
    
    doc.setTextColor(26, 26, 26);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Nivel de Desempeño Logrado: ${evaluation.nivelDesempeño.toUpperCase()}`, margin + 5, y + 6.5);
    y += 15;

    // Resumen
    if (evaluation.resumen) {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(26, 26, 26);
      doc.text("Resumen de Evaluación:", margin, y);
      y += 4.5;
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const linesResumen = doc.splitTextToSize(evaluation.resumen, contentWidth);
      checkSpace(linesResumen.length * 5);
      doc.text(linesResumen, margin, y);
      y += (linesResumen.length * 5) + 6;
    }

    // Fortalezas
    if (evaluation.fortalezas) {
      checkSpace(15);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(26, 26, 26);
      doc.text("Fortalezas Demostradas:", margin, y);
      y += 4.5;
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const linesFortalezas = doc.splitTextToSize(evaluation.fortalezas, contentWidth);
      checkSpace(linesFortalezas.length * 5);
      doc.text(linesFortalezas, margin, y);
      y += (linesFortalezas.length * 5) + 6;
    }

    // Áreas de Mejora
    if (evaluation.mejoras) {
      checkSpace(15);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(26, 26, 26);
      doc.text("Sugerencias de Mejora:", margin, y);
      y += 4.5;
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const linesMejoras = doc.splitTextToSize(evaluation.mejoras, contentWidth);
      checkSpace(linesMejoras.length * 5);
      doc.text(linesMejoras, margin, y);
      y += (linesMejoras.length * 5) + 6;
    }

    // Recursos Recomendados
    if (evaluation.recursosRecomendados && evaluation.recursosRecomendados.length > 0) {
      checkSpace(15);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(26, 26, 26);
      doc.text("Recursos Académicos Recomendados:", margin, y);
      y += 4.5;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      evaluation.recursosRecomendados.forEach((rec) => {
        const linesRec = doc.splitTextToSize(`• ${rec}`, contentWidth);
        checkSpace(linesRec.length * 5);
        doc.text(linesRec, margin, y);
        y += (linesRec.length * 5);
      });
      y += 6;
    }
  }

  // 5. CHAT TRANSCRIPT SECTION
  checkSpace(25);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(26, 26, 26);
  doc.text("TRANSCRIPCIÓN COMPLETA DE LA CONVERSACIÓN", margin, y);
  y += 4;
  
  doc.setDrawColor(90, 90, 64);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Filter out system messages
  const chatHistory = messages.filter(m => m.role !== "system");

  chatHistory.forEach((msg) => {
    const isUser = msg.role === "user";
    const senderTitle = isUser ? `Estudiante (${studentName})` : "Tutor de IA";
    
    checkSpace(20);

    // Format sender heading
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(isUser ? 90 : 40, isUser ? 90 : 80, isUser ? 64 : 120);
    doc.text(senderTitle, margin, y);
    
    // Format timestamp
    const msgDate = new Date(msg.timestamp);
    const timeStr = msgDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(138, 138, 127);
    doc.text(timeStr, margin + 140, y);
    y += 4.5;

    // Clean up text from raw Markdown symbols if simple format is desired (or let wrap handle)
    const cleanedText = msg.text
      .replace(/\*\*/g, "") // remove bold markdown
      .replace(/\*/g, "") // remove italic markdown
      .replace(/###/g, "") // remove header markdown
      .trim();

    // Body text
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(45, 45, 42); // #2D2D2A

    const textLines = doc.splitTextToSize(cleanedText, contentWidth - 4);
    
    // Draw box around message or line indentation
    doc.setDrawColor(isUser ? 220 : 200, isUser ? 220 : 200, isUser ? 210 : 200);
    doc.setFillColor(isUser ? 250 : 255, isUser ? 250 : 255, isUser ? 245 : 255);
    
    const blockHeight = (textLines.length * 4.5) + 4;
    checkSpace(blockHeight);
    
    // Draw left accent border line
    doc.setFillColor(isUser ? 140 : 90, isUser ? 140 : 90, isUser ? 120 : 64);
    doc.rect(margin, y, 1.5, blockHeight - 2, "F");

    doc.setFontSize(8.5);
    doc.text(textLines, margin + 4, y + 3);
    
    y += blockHeight + 3;
  });

  // Finally draw footer on current and preceding pages
  drawPageFooter();

  // Save PDF document
  doc.save(`eduia_reporte_sesion_${studentName.toLowerCase().replace(/\s+/g, "_")}.pdf`);
}
