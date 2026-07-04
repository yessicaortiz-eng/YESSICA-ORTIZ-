import React, { useState } from "react";
import { X, User, BookOpen, GraduationCap, Mail, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { UserProfile } from "../types";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (profile: UserProfile) => void;
}

const AVATAR_COLORS = [
  { class: "bg-[#5A5A40]", label: "Oliva" },
  { class: "bg-[#4B6F44]", label: "Bosque" },
  { class: "bg-indigo-600", label: "Indigo" },
  { class: "bg-emerald-600", label: "Esmeralda" },
  { class: "bg-rose-600", label: "Rosa" },
  { class: "bg-amber-600", label: "Ámbar" }
];

export function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [grade, setGrade] = useState("2do de Bachillerato");
  const [institution, setInstitution] = useState("");
  const [selectedColor, setSelectedColor] = useState("bg-[#5A5A40]");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Por favor, ingresa tu nombre.");
      return;
    }
    if (!institution.trim()) {
      setError("Por favor, ingresa tu institución educativa.");
      return;
    }

    const profile: UserProfile = {
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, "")}@ejemplo.com`,
      grade,
      institution: institution.trim(),
      avatarColor: selectedColor
    };

    onLogin(profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-[#DCDCD2]"
      >
        {/* Header decoration banner */}
        <div className="bg-[#5A5A40] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            id="close-login-btn"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold tracking-tight">Estudiante EduIA</h2>
              <p className="text-xs text-white/80">Regístrate para personalizar tu tutoría de Inteligencia Artificial.</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl p-3 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              {error}
            </div>
          )}

          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#5A5A40] uppercase tracking-wider">
              Nombre Completo *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A7F]" />
              <input
                type="text"
                placeholder="Ingresa tu nombre y apellido"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F0] border border-[#DCDCD2] rounded-xl text-sm focus:outline-none focus:border-[#5A5A40] transition-colors"
                id="login-input-name"
                required
              />
            </div>
          </div>

          {/* Institution Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#5A5A40] uppercase tracking-wider">
              Institución Educativa *
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A7F]" />
              <input
                type="text"
                placeholder="Ej. Colegio Nacional, Unidad Educativa, etc."
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F0] border border-[#DCDCD2] rounded-xl text-sm focus:outline-none focus:border-[#5A5A40] transition-colors"
                id="login-input-institution"
                required
              />
            </div>
          </div>

          {/* Grid fields for Grade and Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#5A5A40] uppercase tracking-wider">
                Año / Grado
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#F5F5F0] border border-[#DCDCD2] rounded-xl text-sm focus:outline-none focus:border-[#5A5A40] transition-colors cursor-pointer"
                id="login-input-grade"
              >
                <option value="1ro de Bachillerato">1ro de Bachillerato</option>
                <option value="2do de Bachillerato">2do de Bachillerato</option>
                <option value="3ro de Bachillerato">3ro de Bachillerato</option>
                <option value="Educación Superior">Educación Superior</option>
                <option value="Otro">Otro año</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#5A5A40] uppercase tracking-wider">
                Email (Opcional)
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A7F]" />
                <input
                  type="email"
                  placeholder="usuario@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F0] border border-[#DCDCD2] rounded-xl text-sm focus:outline-none focus:border-[#5A5A40] transition-colors"
                  id="login-input-email"
                />
              </div>
            </div>
          </div>

          {/* Avatar Color Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#5A5A40] uppercase tracking-wider">
              Elegir Color de Perfil
            </label>
            <div className="flex gap-3 flex-wrap">
              {AVATAR_COLORS.map((col) => (
                <button
                  key={col.class}
                  type="button"
                  onClick={() => setSelectedColor(col.class)}
                  className={`w-8 h-8 rounded-full ${col.class} border-2 relative cursor-pointer transition-transform hover:scale-110 flex items-center justify-center ${
                    selectedColor === col.class ? "border-[#2D2D2A] scale-105" : "border-transparent"
                  }`}
                  title={col.label}
                >
                  {selectedColor === col.class && (
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-[#5A5A40] hover:bg-[#4A4A33] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center gap-2"
              id="submit-login-form-btn"
            >
              <ShieldCheck className="w-4 h-4" />
              Guardar Perfil y Comenzar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
