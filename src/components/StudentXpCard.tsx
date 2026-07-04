import React, { useState } from "react";
import { Award, Sparkles, BrainCircuit, Zap, Trophy, ShieldCheck, Flame } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";

interface StudentXpCardProps {
  xp: number;
  onClaimBonus?: (amount: number) => void;
}

export function StudentXpCard({ xp, onClaimBonus }: StudentXpCardProps) {
  const [bonusClaimed, setBonusClaimed] = useState(() => {
    return localStorage.getItem("eduia_claimed_xp_bonus") === "true";
  });
  const [showBonusSparkle, setShowBonusSparkle] = useState(false);

  // Experience level calculations
  const XP_PER_LEVEL = 500;
  const currentLevel = Math.floor(xp / XP_PER_LEVEL) + 1;
  const currentXpInLevel = xp % XP_PER_LEVEL;
  const progressPercentage = Math.round((currentXpInLevel / XP_PER_LEVEL) * 100);

  // SVG Circular progress bar specs
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  const handleClaimBonus = () => {
    if (bonusClaimed) return;
    
    const bonusAmount = 100;
    if (onClaimBonus) {
      onClaimBonus(bonusAmount);
    }
    setBonusClaimed(true);
    localStorage.setItem("eduia_claimed_xp_bonus", "true");
    
    // Trigger confetti
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 }
    });

    setShowBonusSparkle(true);
    setTimeout(() => setShowBonusSparkle(false), 2500);
  };

  // Rank / Title based on level
  const getRankTitle = (lvl: number) => {
    if (lvl >= 8) return "Filósofo de IA 🌌";
    if (lvl >= 5) return "Pensador Crítico 🧠";
    if (lvl >= 3) return "Explorador de Ética 🧭";
    return "Iniciado de IA 💡";
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#DCDCD2]" id="student-xp-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-[#1A1A1A] text-sm tracking-tight flex items-center gap-2" id="xp-title">
          <Award className="w-4 h-4 text-[#5A5A40]" />
          Progreso y Nivel
        </h3>
        <span className="text-[10px] font-bold text-[#5A5A40] bg-[#E8E8E1] px-2.5 py-1 rounded-full uppercase tracking-wider" id="xp-rank-badge">
          {getRankTitle(currentLevel)}
        </span>
      </div>

      <div className="flex items-center gap-5">
        {/* Circular Progress Bar */}
        <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center" id="circular-progress-wrapper">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background track circle */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              className="stroke-[#E8E8E1] fill-transparent"
              strokeWidth="6"
            />
            {/* Foreground animated progress circle */}
            <motion.circle
              cx="48"
              cy="48"
              r={radius}
              className="stroke-[#5A5A40] fill-transparent"
              strokeWidth="6"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: strokeDashoffset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Inner content: Level display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-serif font-black text-[#1A1A1A] leading-none">
              {currentLevel}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-[#8A8A7F] font-bold mt-0.5 leading-none">
              Nivel
            </span>
          </div>
        </div>

        {/* Info detail */}
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-[#8A8A7F] font-medium">Experiencia Total</span>
            <span className="text-sm font-bold text-[#1A1A1A]">{xp} XP</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-[#8A8A7F] font-medium">Siguiente nivel</span>
            <span className="text-xs font-mono text-[#5A5A40] font-bold">
              {currentXpInLevel} / {XP_PER_LEVEL} XP
            </span>
          </div>

          {/* Simple percentage display */}
          <div className="text-[10px] text-[#8A8A7F] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5A5A40]"></span>
            <span>Estás al {progressPercentage}% para el Nivel {currentLevel + 1}</span>
          </div>

          {/* Small motivational quote/perk based on level */}
          <p className="text-[11px] text-[#6B6B5E] italic leading-snug">
            {currentLevel === 1 
              ? "¡Completa tu primera fase de tutoría para subir al nivel 2!"
              : `¡Buen ritmo! Continúa debatiendo y desbloqueando conceptos para subir al nivel ${currentLevel + 1}.`
            }
          </p>
        </div>
      </div>

      {/* Bonus claim and achievements section */}
      <div className="mt-5 pt-4 border-t border-[#DCDCD2] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#2D2D2A] flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            Bono de Reflexión Diaria
          </span>
          <button
            onClick={handleClaimBonus}
            disabled={bonusClaimed}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              bonusClaimed
                ? "bg-gray-100 text-gray-400 border border-transparent cursor-not-allowed"
                : "bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200 shadow-3xs"
            }`}
            id="claim-xp-bonus-btn"
          >
            {bonusClaimed ? "✓ Reclamado" : "+100 XP Bono"}
          </button>
        </div>

        <AnimatePresence>
          {showBonusSparkle && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-800 font-bold flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>¡Bono de Reflexión reclamado! +100 XP de sabiduría otorgados.</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
