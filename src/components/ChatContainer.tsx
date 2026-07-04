/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { Send, Bot, User, Sparkles, AlertCircle, HelpCircle, Paperclip, X, FileText, Upload } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ChatContainerProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  currentPhase: number;
}

export function ChatContainer({ messages, onSendMessage, isLoading, currentPhase }: ChatContainerProps) {
  const [inputValue, setInputValue] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; content: string; size: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat whenever messages or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const textContent = event.target?.result as string || "Contenido del archivo no legible";
      setUploadedFile({
        name: file.name,
        content: textContent,
        size: file.size
      });
    };
    
    // Check if it's a plain text file or common code/document extension
    if (
      file.type.startsWith("text/") || 
      file.name.endsWith(".txt") || 
      file.name.endsWith(".json") || 
      file.name.endsWith(".md") ||
      file.name.endsWith(".js") ||
      file.name.endsWith(".ts") ||
      file.name.endsWith(".tsx") ||
      file.name.endsWith(".html") ||
      file.name.endsWith(".css")
    ) {
      reader.readAsText(file);
    } else {
      // For binary files (e.g., pdf, word, etc.) we simulate scanning the content ethically
      setUploadedFile({
        name: file.name,
        content: `[Análisis ético de documento: El estudiante cargó un archivo binario "${file.name}" (${(file.size / 1024).toFixed(1)} KB). El contenido simula un ensayo académico o borrador escolar que requiere revisión de honestidad, sesgo o atribución de fuentes con ayuda del Tutor de IA.]`,
        size: file.size
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() && !uploadedFile) return;

    let textToSend = inputValue.trim();
    if (uploadedFile) {
      const fileSnippet = uploadedFile.content.substring(0, 1000) + (uploadedFile.content.length > 1000 ? "..." : "");
      textToSend = `${inputValue.trim() ? inputValue.trim() + "\n\n" : ""}📄 *Documento Cargado: ${uploadedFile.name}* (${(uploadedFile.size / 1024).toFixed(1)} KB)\n---\n${fileSnippet}\n---`;
      setUploadedFile(null);
    }

    onSendMessage(textToSend);
    setInputValue("");
  };

  // Educational prompt helpers/shortcuts for high schoolers
  const quickPrompts = [
    { label: "💡 Dame una pista", text: "Me gustaría una pista para responder, por favor." },
    { label: "❓ Explícame con un ejemplo", text: "¿Me podrías dar un ejemplo sencillo de esto?" },
    { label: "🤔 No estoy seguro", text: "No estoy completamente seguro de la respuesta. ¿Me guías un poco?" }
  ];

  return (
    <div 
      className={`flex flex-col h-[600px] bg-white rounded-2xl border border-[#DCDCD2] shadow-sm overflow-hidden relative transition-all duration-200 ${
        isDragging ? "ring-2 ring-[#5A5A40] bg-[#F5F5F0]" : ""
      }`} 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      id="chat-container-root"
    >
      
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-[#F5F5F0]/95 border-4 border-dashed border-[#5A5A40] rounded-2xl flex flex-col items-center justify-center gap-3 z-50 pointer-events-none animate-pulse">
          <Upload className="w-12 h-12 text-[#5A5A40]" />
          <p className="text-sm font-serif font-semibold text-[#1A1A1A]">Suelta el documento aquí</p>
          <p className="text-xs text-[#8A8A7F] uppercase tracking-wider font-medium">Soporta cualquier archivo de texto u otros para análisis</p>
        </div>
      )}
      
      {/* Top chat bar */}
      <div className="bg-[#FAFAFA] px-6 py-4 border-b border-[#DCDCD2] flex items-center justify-between" id="chat-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#5A5A40] flex items-center justify-center text-white font-serif italic text-lg shadow-2xs">
            D
          </div>
          <div>
            <h3 className="font-bold text-[#1A1A1A] text-sm tracking-tight flex items-center gap-1.5" id="chat-tutor-name">
              Tutor de IA Responsable
              <Sparkles className="w-3.5 h-3.5 text-[#5A5A40] fill-[#5A5A40] animate-pulse" />
            </h3>
            <span className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-wider bg-[#E8E8E1] px-2.5 py-0.5 rounded-full" id="tutor-role-badge">
              Docente Experto
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2" id="tutor-status-indicator">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5A5A40] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5A5A40]"></span>
          </span>
          <span className="text-xs font-semibold text-[#8A8A7F]">
            Sesión Activa
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#FAFAFA]" id="chat-messages-scroll">
        <AnimatePresence initial={false}>
          {messages.map((message) => {
            const isModel = message.role === "model" || message.role === "system";

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 max-w-[85%] ${isModel ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                id={`chat-msg-row-${message.id}`}
              >
                {/* Avatar */}
                <div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-2xs text-xs font-bold ${
                    isModel 
                      ? "bg-[#5A5A40] text-white" 
                      : "bg-[#DCDCD2] text-[#5A5A40]"
                  }`}
                  id={`avatar-${message.id}`}
                >
                  {isModel ? "D" : "EST"}
                </div>

                {/* Bubble */}
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-[#8A8A7F]">
                    <span>{isModel ? "Docente" : "Estudiante (Tú)"}</span>
                    <span>•</span>
                    <span>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div 
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      isModel 
                        ? "bg-white text-[#2D2D2A] border border-[#DCDCD2] shadow-xs rounded-tl-none font-serif" 
                        : "bg-[#5A5A40] text-white rounded-tr-none shadow-sm"
                    }`}
                    id={`bubble-${message.id}`}
                  >
                    {isModel && (
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-2 py-0.5 bg-[#F0F5EB] text-[#3E5C2E] text-[10px] font-bold uppercase rounded tracking-wider">
                          Retroalimentación
                        </span>
                      </div>
                    )}
                    {message.text}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 mr-auto max-w-[80%]"
            id="typing-indicator"
          >
            <div className="w-9 h-9 rounded-full bg-[#5A5A40] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-2xs">
              D
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-[11px] font-medium text-[#8A8A7F]">Docente</span>
              <div className="bg-white text-[#2D2D2A] border border-[#DCDCD2] rounded-2xl rounded-tl-none px-4 py-3 shadow-xs flex items-center gap-1.5 font-serif">
                <span className="w-2 h-2 bg-[#5A5A40]/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-[#5A5A40]/80 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-[#5A5A40] rounded-full animate-bounce"></span>
                <span className="text-xs text-[#8A8A7F] ml-1 font-medium">El Tutor está analizando tu respuesta...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Helper */}
      {messages.length > 1 && !isLoading && currentPhase < 6 && (
        <div className="px-6 py-2.5 bg-[#FAFAFA] border-t border-[#DCDCD2] flex flex-wrap gap-2" id="quick-prompts-wrapper">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (!isLoading) {
                  onSendMessage(p.text);
                }
              }}
              className="text-xs font-semibold text-[#5A5A40] bg-[#E8E8E1] hover:bg-[#DCDCD2] border border-[#DCDCD2] px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer shadow-3xs"
              id={`quick-prompt-${idx}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Uploaded File Indicator */}
      {uploadedFile && (
        <div className="px-6 py-3 bg-[#E8E8E1] border-t border-[#DCDCD2] flex items-center justify-between gap-3" id="uploaded-file-indicator">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#5A5A40] flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#1A1A1A] truncate">{uploadedFile.name}</p>
              <p className="text-[10px] text-[#8A8A7F] uppercase tracking-wider font-medium">
                {(uploadedFile.size / 1024).toFixed(1)} KB • Documento Cargado Listo para Análisis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="p-1 hover:bg-[#DCDCD2] rounded-full text-[#8A8A7F] hover:text-[#2D2D2A] transition-colors cursor-pointer"
            title="Quitar documento"
            id="remove-uploaded-file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Chat Input form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-[#DCDCD2] bg-white" id="chat-form">
        <div className="flex gap-3 items-center" id="form-layout">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            id="hidden-document-file-input"
          />
          <button
            type="button"
            onClick={handleTriggerFileInput}
            disabled={isLoading || currentPhase === 6}
            className="p-3 bg-[#E8E8E1] hover:bg-[#DCDCD2] text-[#5A5A40] rounded-full transition-all duration-200 cursor-pointer flex-shrink-0 disabled:opacity-40"
            title="Cargar documento para analizar (.txt, .md, .docx, .pdf, etc.)"
            id="trigger-file-upload-btn"
          >
            <Paperclip className="w-4.5 h-4.5" />
          </button>

          <div className="flex-1 relative bg-[#F5F5F0] rounded-full px-5 py-2.5 border border-[#DCDCD2] flex items-center" id="textarea-wrapper">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escribe tu respuesta aquí para el tutor..."
              disabled={isLoading || currentPhase === 6}
              className="bg-transparent flex-1 text-sm outline-hidden placeholder-[#8A8A7F] font-medium"
              id="chat-input-textarea"
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading || currentPhase === 6}
            className="px-6 py-3 bg-[#5A5A40] hover:bg-[#4A4A35] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-200 cursor-pointer flex-shrink-0 disabled:opacity-40 disabled:pointer-events-none"
            id="chat-submit-btn"
          >
            Enviar
          </button>
        </div>
        <div className="mt-2.5 text-center" id="input-help-text">
          <p className="text-[10px] text-[#8A8A7F] uppercase tracking-tighter font-medium">
            Pulsa enter o haz clic en enviar • Tutoría personalizada activa
          </p>
        </div>
      </form>

    </div>
  );
}
