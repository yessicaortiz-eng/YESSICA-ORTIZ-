import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain, Timer, Volume2, VolumeX } from "lucide-react";

type TimerMode = "work" | "shortBreak" | "longBreak";

export function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>("work");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const modeConfigs = {
    work: {
      label: "Estudio Concentrado",
      duration: 25 * 60,
      icon: <Brain className="w-4 h-4 text-[#5A5A40]" />,
      bgColor: "bg-[#F5F5F0]",
      accentColor: "#5A5A40",
      phrase: "Concéntrate en las preguntas de tu Tutor de IA"
    },
    shortBreak: {
      label: "Descanso Corto",
      duration: 5 * 60,
      icon: <Coffee className="w-4 h-4 text-[#7A6A53]" />,
      bgColor: "bg-[#FAF5EE]",
      accentColor: "#7A6A53",
      phrase: "Estira las piernas y asimila los conceptos"
    },
    longBreak: {
      label: "Descanso Largo",
      duration: 15 * 60,
      icon: <Coffee className="w-4 h-4 text-[#4A5D6E]" />,
      bgColor: "bg-[#EDF4F9]",
      accentColor: "#4A5D6E",
      phrase: "Excelente trabajo. ¡Ve por un vaso de agua!"
    }
  };

  const currentConfig = modeConfigs[mode];

  // Initialize timer seconds whenever mode changes or is reset
  useEffect(() => {
    setSecondsLeft(currentConfig.duration);
    setIsActive(false);
  }, [mode]);

  // Handle timer ticks
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Timer finished
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  const handleTimerComplete = () => {
    setIsActive(false);
    
    // Play a gentle beep sound if enabled
    if (soundEnabled) {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(523.25, context.currentTime); // C5 note
        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.6);
      } catch (e) {
        console.warn("No se pudo reproducir el sonido del temporizador", e);
      }
    }

    if (mode === "work") {
      setCompletedSessions((prev) => prev + 1);
      // Auto switch to short break or long break
      const isLongBreakTime = (completedSessions + 1) % 4 === 0;
      setMode(isLongBreakTime ? "longBreak" : "shortBreak");
    } else {
      setMode("work");
    }
  };

  const toggleStart = () => {
    setIsActive(!isActive);
  };

  // Listen to global/custom events for toggling Pomodoro
  useEffect(() => {
    const handleToggleEvent = () => {
      setIsActive(prev => !prev);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        setIsActive(prev => !prev);
      }
    };

    window.addEventListener("toggle-pomodoro", handleToggleEvent);
    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      window.removeEventListener("toggle-pomodoro", handleToggleEvent);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleReset = () => {
    setIsActive(false);
    setSecondsLeft(currentConfig.duration);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate SVG Circle Stroke Offset for visual ring
  const totalDuration = currentConfig.duration;
  const percentage = totalDuration > 0 ? (secondsLeft / totalDuration) * 100 : 0;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white border border-[#DCDCD2] rounded-2xl p-5 shadow-sm" id="pomodoro-timer-card">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-[#1A1A1A] text-xs tracking-wider uppercase flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-[#5A5A40]" />
          Temporizador Pomodoro
        </h4>
        <div className="flex items-center gap-2">
          {/* Audio toggle button */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1 hover:bg-[#E8E8E1] rounded-full text-[#8A8A7F] hover:text-[#5A5A40] transition-colors cursor-pointer"
            title={soundEnabled ? "Silenciar sonido" : "Activar sonido de alerta"}
            id="pomodoro-sound-toggle"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          
          {/* Completed cycles badge */}
          {completedSessions > 0 && (
            <span className="text-[9px] font-bold text-[#5A5A40] bg-[#E8E8E1] px-2 py-0.5 rounded-full" id="pomodoro-completed-badge">
              Ciclos: {completedSessions}
            </span>
          )}
        </div>
      </div>

      {/* Mode Switches */}
      <div className="grid grid-cols-3 gap-1 bg-[#F5F5F0] p-1 rounded-xl mb-4" id="pomodoro-mode-switchers">
        <button
          type="button"
          onClick={() => setMode("work")}
          className={`py-1.5 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
            mode === "work"
              ? "bg-white text-[#1A1A1A] shadow-3xs"
              : "text-[#8A8A7F] hover:text-[#2D2D2A]"
          }`}
          id="mode-switch-work"
        >
          Estudio
        </button>
        <button
          type="button"
          onClick={() => setMode("shortBreak")}
          className={`py-1.5 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
            mode === "shortBreak"
              ? "bg-white text-[#1A1A1A] shadow-3xs"
              : "text-[#8A8A7F] hover:text-[#2D2D2A]"
          }`}
          id="mode-switch-short"
        >
          Descanso
        </button>
        <button
          type="button"
          onClick={() => setMode("longBreak")}
          className={`py-1.5 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
            mode === "longBreak"
              ? "bg-white text-[#1A1A1A] shadow-3xs"
              : "text-[#8A8A7F] hover:text-[#2D2D2A]"
          }`}
          id="mode-switch-long"
        >
          Largo
        </button>
      </div>

      {/* Main Clock Face and Progress Visualizer */}
      <div className={`rounded-xl p-4 flex items-center gap-4 border border-[#E8E8E1] ${currentConfig.bgColor}`} id="pomodoro-clock-face">
        {/* SVG Progress Circle Ring */}
        <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-[#DCDCD2]"
              strokeWidth="4"
              fill="transparent"
            />
            {/* Animated progress circle */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke={currentConfig.accentColor}
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
          {/* Mini mode indicator icon inside circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            {currentConfig.icon}
          </div>
        </div>

        {/* Timer numeric read-out and controller action buttons */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <div className="text-2xl font-mono font-bold tracking-tight text-[#1A1A1A] tabular-nums" id="pomodoro-countdown-number">
            {formatTime(secondsLeft)}
          </div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#8A8A7F] truncate mb-2">
            {currentConfig.label}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleStart}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer text-white shadow-3xs transition-all ${
                isActive ? "bg-red-600 hover:bg-red-700" : "bg-[#5A5A40] hover:bg-[#4A4A33]"
              }`}
              id="pomodoro-toggle-btn"
            >
              {isActive ? (
                <>
                  <Pause className="w-3 h-3 fill-current" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" /> Iniciar
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 bg-white hover:bg-[#E8E8E1] border border-[#DCDCD2] text-[#8A8A7F] hover:text-[#2D2D2A] rounded-full transition-colors cursor-pointer"
              title="Reiniciar temporizador"
              id="pomodoro-reset-btn"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Motivational / Helpful Advice */}
      <div className="mt-3 text-[11px] italic text-[#6B6B5E] text-center" id="pomodoro-motivational-advice">
        "{currentConfig.phrase}"
      </div>
    </div>
  );
}
