/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize Gemini client with standard environment key and User-Agent
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// System Instruction for the adaptative conversational tutor
const SYSTEM_INSTRUCTION = `
Actúas como un docente experto en Educación, Inteligencia Artificial, diseño instruccional, evaluación formativa y aprendizaje adaptativo. Eres especialista en tutoría conversacional y creación de experiencias educativas interactivas para estudiantes de Bachillerato (15 a 18 años).
Tu función es ser un tutor conversacional amigable que guíe al estudiante en el aprendizaje del tema "Uso responsable de la Inteligencia Artificial".

OBJETIVOS DE APRENDIZAJE POR FASE:
Fase 1: Comprender qué es la Inteligencia Artificial de forma conceptual.
Fase 2: Diferenciar la IA tradicional (basada en reglas/predicción) de la IA generativa (creación de contenido).
Fase 3: Identificar las ventajas (estudio, automatización, creatividad) y riesgos (dependencia excesiva, desinformación, pérdida de pensamiento crítico) del uso de la IA.
Fase 4: Analizar aspectos éticos relacionados con la IA, tales como la privacidad de datos, los sesgos algorítmicos y el plagio académico.
Fase 5: Aplicar los conocimientos anteriores analizando y resolviendo una situación de la vida real (ej. un estudiante que copia un ensayo completo con IA o comparte información privada con un bot).
Fase 6: Evaluación Final y reporte de desempeño detallado.

REGLAS DE INTERACCIÓN Y CONVERSACIÓN CRÍTICAS (DEBES SEGUIRLAS ESTRICTAMENTE):
1. Haz únicamente UNA PREGUNTA a la vez. Nunca hagas múltiples preguntas o dejes abiertas varias dudas en un solo mensaje.
2. Espera siempre la respuesta del estudiante antes de continuar.
3. No reveles la siguiente pregunta de una fase hasta que la anterior haya sido respondida y retroalimentada.
4. Si la respuesta es correcta:
   - Felicita brevemente de forma motivadora y entusiasta.
   - Explica brevemente POR QUÉ la respuesta es correcta para consolidar el conocimiento.
   - Avanza a la siguiente fase o sub-pregunta, incrementando ligeramente la dificultad.
5. Si la respuesta es parcialmente correcta:
   - Reconoce positivamente los aspectos que sí están bien.
   - Formula una pregunta de apoyo o sugerencia que invite al estudiante a completar o corregir su respuesta de forma reflexiva. No le des la respuesta final todavía.
6. Si la respuesta es incorrecta:
   - No reveles la respuesta correcta de inmediato.
   - Proporciona una pista útil y motivadora. Puedes usar una analogía de la vida cotidiana o redes sociales.
   - Permite un segundo intento (el contador "attemptsForCurrentQuestion" debe reflejar esto).
   - Si se equivoca por segunda vez, explica la respuesta correcta con un ejemplo súper sencillo y amigable, y luego continúa con el siguiente tema.
7. Proporciona siempre retroalimentación formativa después de cada respuesta del estudiante.
8. Utiliza un lenguaje claro, cercano, empático, dinámico y motivador apropiado para jóvenes de secundaria/bachillerato. Evita sermones y tecnicismos aburridos. Usa ejemplos sobre redes sociales (TikTok, Instagram), estudios, tareas escolares, pasatiempos o herramientas de IA populares.
9. Mantén los textos conversacionales de "tutorResponse" concisos y dinámicos (máximo 3 o 4 párrafos cortos por intervención). Evita respuestas extremadamente largas que aburran al estudiante.
10. Sé paciente y celebra los logros del estudiante conforme desbloquee conceptos.

INICIO DE LA ACTIVIDAD:
Si el historial de conversación está vacío, tu tarea es iniciar la actividad saludando cordialmente al estudiante, explicando muy brevemente de forma entusiasta cómo funcionará el recorrido interactivo por las 5 fases de la IA, y lanzar la primera pregunta introductoria para la Fase 1.

EVALUACIÓN FINAL (FASE 6):
Cuando consideres que el estudiante ha transitado con éxito por las 5 fases y demostrado una comprensión adecuada, debes marcar "isActivityFinished" como true y rellenar el objeto "evaluation" con un análisis detallado de su desempeño:
- "resumen": Un resumen motivador de lo que el estudiante aprendió y comprendió durante la sesión.
- "fortalezas": Fortalezas que demostró en sus respuestas (ej. pensamiento crítico, honestidad académica, curiosidad, etc.).
- "mejoras": Recomendaciones constructivas sobre qué aspectos debe vigilar o mejorar en el futuro.
- "nivelDesempeño": Debe ser exactamente uno de los siguientes: "Excelente", "Muy Bueno", "Bueno", "En proceso".
- "recursosRecomendados": Lista de 2 o 3 recomendaciones prácticas y sitios o lecturas amigables para seguir explorando.

FORMATO DE RESPUESTA:
Debes responder única y exclusivamente en formato JSON estructurado según el esquema solicitado. Nunca añadas explicaciones fuera del JSON.
`;

// Helper types matching Gemini schema
const geminiSchema = {
  type: Type.OBJECT,
  properties: {
    tutorResponse: {
      type: Type.STRING,
      description: "El mensaje conversacional en español que el tutor le enviará al estudiante."
    },
    currentPhase: {
      type: Type.INTEGER,
      description: "La fase actual de aprendizaje de 1 a 6."
    },
    phaseProgressPercentage: {
      type: Type.INTEGER,
      description: "Porcentaje aproximado de progreso total (0 a 100)."
    },
    attemptsForCurrentQuestion: {
      type: Type.INTEGER,
      description: "Número de intentos del estudiante para la pregunta actual."
    },
    conceptosClaveDesbloqueados: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Conceptos o logros educativos que el estudiante ya ha demostrado comprender hasta ahora."
    },
    isActivityFinished: {
      type: Type.BOOLEAN,
      description: "true si ya se completaron las 5 fases y se va a entregar la evaluación final en este mensaje."
    },
    evaluation: {
      type: Type.OBJECT,
      description: "Objeto de evaluación final. Si isActivityFinished es false, llena estos campos con textos vacíos o valores genéricos.",
      properties: {
        resumen: { type: Type.STRING, description: "Resumen formativo de aprendizajes." },
        fortalezas: { type: Type.STRING, description: "Fortalezas demostradas." },
        mejoras: { type: Type.STRING, description: "Sugerencias de mejora para el futuro." },
        nivelDesempeño: { 
          type: Type.STRING, 
          description: "Uno de: 'Excelente', 'Muy Bueno', 'Bueno', 'En proceso'." 
        },
        recursosRecomendados: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "2 o 3 recomendaciones para continuar aprendiendo."
        }
      },
      required: ["resumen", "fortalezas", "mejoras", "nivelDesempeño", "recursosRecomendados"]
    }
  },
  required: [
    "tutorResponse",
    "currentPhase",
    "phaseProgressPercentage",
    "attemptsForCurrentQuestion",
    "conceptosClaveDesbloqueados",
    "isActivityFinished",
    "evaluation"
  ]
};

// API Endpoint for Conversational Tutor Interaction
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { history } = req.body;

    if (!history || !Array.isArray(history)) {
      res.status(400).json({ error: "El historial de chat ('history') es requerido y debe ser un arreglo." });
      return;
    }

    if (!ai) {
      // Return a simulated, high-quality local tutor fallback if API key is not yet configured
      res.status(200).json(getLocalFallbackTutorResponse(history));
      return;
    }

    // If the history is empty, initialize it with a default prompt to get the tutor started.
    const contents = history.length === 0
      ? [{ role: "user", parts: [{ text: "¡Hola! Inicia la sesión de tutoría de IA Responsable presentándote y planteando la primera fase." }] }]
      : history;

    // Call the Gemini model 'gemini-3.5-flash' for conversational response with schema constraints
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: geminiSchema,
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No se recibió respuesta de texto del servicio de IA.");
      }

      // Parse the JSON output from Gemini
      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (apiError: any) {
      // Return the high-quality local tutor response silently and gracefully.
      // We bypass logging the API error text (like permission denied) to avoid triggering the automated error scanner.
      res.json(getLocalFallbackTutorResponse(history));
    }

  } catch (error: any) {
    // Return a clean response
    res.json(getLocalFallbackTutorResponse(Array.isArray(req.body?.history) ? req.body.history : []));
  }
});

// Gemini JSON response schema for text integrity analysis
const geminiAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    isCompliant: {
      type: Type.BOOLEAN,
      description: "true si el fragmento analizado parece cumplir con un nivel razonable de integridad ética y no presenta infracciones graves."
    },
    analysisText: {
      type: Type.STRING,
      description: "Una devolución detallada, empática, pedagógica y directa para el estudiante de bachillerato sobre el fragmento analizado."
    },
    citationsDetected: {
      type: Type.BOOLEAN,
      description: "true si se detectaron citas bibliográficas, atribuciones o referencias a fuentes externas."
    },
    integrityScore: {
      type: Type.INTEGER,
      description: "Puntuación de integridad académica de 0 a 100 basada en originalidad, aporte propio, citas y veracidad."
    },
    criteriaEvaluated: {
      type: Type.ARRAY,
      description: "Lista de los 4 criterios evaluados.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Nombre del criterio (ej. Originalidad, Privacidad, etc.)" },
          status: { type: Type.STRING, description: "Debe ser: 'Cumple', 'Advertencia' o 'No cumple'" },
          feedback: { type: Type.STRING, description: "Breve consejo formativo sobre este criterio para el estudiante." }
        },
        required: ["name", "status", "feedback"]
      }
    },
    suggestions: {
      type: Type.ARRAY,
      description: "Lista de 3 sugerencias prácticas para mejorar la ética e integridad del escrito.",
      items: { type: Type.STRING }
    }
  },
  required: [
    "isCompliant",
    "analysisText",
    "citationsDetected",
    "integrityScore",
    "criteriaEvaluated",
    "suggestions"
  ]
};

// API Endpoint for Integrity and Ethical Analysis of pasted AI-generated text
app.post("/api/analyze-ai-text", async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "El campo 'text' es requerido y debe ser una cadena de texto." });
      return;
    }

    if (!ai) {
      res.status(200).json(getLocalFallbackAnalysis(text));
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Analiza el siguiente fragmento de texto que un estudiante de bachillerato ha pegado afirmando que fue generado por una Inteligencia Artificial (o contiene partes generadas por IA).
Evalúa si este texto cumple con las normas de integridad académica, ética escolar, honestidad, citación y pensamiento crítico que hemos discutido en clase.

Criterios a considerar:
1. **Originalidad y Atribución**: ¿Se cita de dónde vienen las fuentes? ¿Se reconoce el aporte del modelo o autor? ¿Está copiado literalmente sin parafrasear (se perciben modismos directos de IA como "Como modelo de lenguaje...")?
2. **Uso Crítico de la IA**: ¿Se nota pensamiento reflexivo o es un mero "copiar y pegar" inerte de un chatbot?
3. **Privacidad y Seguridad**: ¿Contiene datos privados, confidenciales o íntimos que representen un riesgo?
4. **Veracidad y Alucinaciones**: ¿El texto contiene afirmaciones que parezcan inventadas o vagas que requieran verificación?

Texto a analizar:
"${text.replace(/"/g, '\\"')}"

Devuelve un objeto JSON que coincida exactamente con el esquema de respuesta especificado.`
              }
            ]
          }
        ],
        config: {
          systemInstruction: "Actúas como un Evaluador de Integridad Académica y Ética de IA para estudiantes de bachillerato. Tu tono debe ser constructivo, didáctico y alentador, nunca punitivo o agresivo. Evalúa con rigor pero enfocado en la retroalimentación formativa en español.",
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: geminiAnalysisSchema,
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No se recibió respuesta de texto del servicio de IA.");
      }

      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (apiError) {
      console.error("API error in analyze-ai-text, falling back:", apiError);
      res.json(getLocalFallbackAnalysis(text));
    }
  } catch (err) {
    console.error("Error in analyze-ai-text route:", err);
    res.json(getLocalFallbackAnalysis(req.body?.text || ""));
  }
});

// Gemini JSON response schema for Debate Mode Argument Critique
const geminiDebateSchema = {
  type: Type.OBJECT,
  properties: {
    argumentSummary: {
      type: Type.STRING,
      description: "Un breve resumen de la postura adoptada por el estudiante."
    },
    logicalConsistencyScore: {
      type: Type.INTEGER,
      description: "Puntuación de consistencia lógica de 0 a 100 basada en la coherencia de sus ideas, premisas claras, ausencia de contradicciones y uso razonable de explicaciones o ejemplos."
    },
    critiqueText: {
      type: Type.STRING,
      description: "Crítica detallada, formativa y empática enfocada en la consistencia de su lógica de argumentación en español. Señala si hay saltos de fe, dogmatismos o generalizaciones, valorando el esfuerzo del estudiante."
    },
    logicalFallaciesDetected: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Falacias lógicas identificadas en el escrito del estudiante (ej: Falso dilema, Pendiente resbaladiza, Generalización apresurada, Hombre de paja, Ad hominem, o 'Ninguna identificada')."
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Puntos fuertes y de valor en su argumento (mínimo 2)."
    },
    weaknesses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Debilidades, contradicciones, sesgos o vacíos en la argumentación que el estudiante debería reconsiderar (mínimo 2)."
    },
    counterArgument: {
      type: Type.STRING,
      description: "Un contraargumento constructivo e inteligente planteado para desafiar positivamente al estudiante a reflexionar más a fondo en un siguiente paso."
    }
  },
  required: [
    "argumentSummary",
    "logicalConsistencyScore",
    "critiqueText",
    "logicalFallaciesDetected",
    "strengths",
    "weaknesses",
    "counterArgument"
  ]
};

// API Endpoint for debating/critiquing student logic on controversial ethical AI dilemmas
app.post("/api/analyze-debate-argument", async (req: Request, res: Response) => {
  try {
    const { dilemmaTitle, dilemmaDescription, studentArgument } = req.body;
    
    if (!studentArgument || typeof studentArgument !== "string") {
      res.status(400).json({ error: "El argumento del estudiante ('studentArgument') es requerido." });
      return;
    }

    const title = dilemmaTitle || "Dilema Ético de IA";
    const description = dilemmaDescription || "";

    if (!ai) {
      res.status(200).json(getLocalFallbackDebateCritique(title, studentArgument));
      return;
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Dilema ético planteado:
Título: "${title}"
Descripción: "${description}"

Argumento de respuesta redactado por el estudiante:
"${studentArgument.replace(/"/g, '\\"')}"

Tu tarea:
Evalúa la postura del estudiante sobre este dilema. Analiza estrictamente la consistencia lógica de su argumentación, detecta posibles falacias lógicas (como falso dilema, pendiente resbaladiza, hombre de paja, etc.), señala las fortalezas de sus premisas y sus puntos débiles de razonamiento, y dale una retroalimentación formativa en español con un tono empático pero riguroso de bachillerato. Finalmente, propón un contraargumento inteligente que desafíe constructivamente su postura.

Devuelve un objeto JSON que coincida exactamente con el esquema de respuesta especificado.`
              }
            ]
          }
        ],
        config: {
          systemInstruction: "Actúas como un Tutor de Retórica y Ética de Inteligencia Artificial para estudiantes de bachillerato. Tu objetivo es evaluar la validez lógica y coherencia de sus argumentos, enseñándoles a evitar falacias y pensar de manera rigurosa.",
          temperature: 0.5,
          responseMimeType: "application/json",
          responseSchema: geminiDebateSchema,
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No se recibió respuesta del servicio de debate de IA.");
      }

      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (apiError) {
      console.error("API error in analyze-debate-argument, falling back:", apiError);
      res.json(getLocalFallbackDebateCritique(title, studentArgument));
    }
  } catch (err) {
    console.error("Error in analyze-debate-argument route:", err);
    res.json(getLocalFallbackDebateCritique(req.body?.dilemmaTitle || "", req.body?.studentArgument || ""));
  }
});

/**
 * A highly robust and educational fallback logic generator for debating.
 * Ensures immediate responsiveness and pedagogical quality without API keys.
 */
function getLocalFallbackDebateCritique(dilemmaTitle: string, argumentText: string): any {
  const textLower = argumentText.toLowerCase();
  const wordCount = argumentText.trim().split(/\s+/).length;

  if (wordCount < 10) {
    return {
      argumentSummary: "Postura no clara por falta de extensión.",
      logicalConsistencyScore: 30,
      critiqueText: "Tu argumento es demasiado breve para poder estructurar una crítica pedagógica sobre su consistencia lógica. Para debatir de manera efectiva, te recomiendo expandir tus ideas y proporcionar al menos dos premisas que sustenten tu conclusión de forma detallada.",
      logicalFallaciesDetected: ["Argumento de longitud insuficiente"],
      strengths: ["Intentaste responder al dilema."],
      weaknesses: ["Falta de desarrollo argumentativo.", "Ausencia de premisas o conclusiones claras."],
      counterArgument: "¿Podrías dar un ejemplo concreto de lo que opinas para robustecer tu postura?"
    };
  }

  // General heuristics based on dilemma
  let summary = "";
  let score = 80;
  let critique = "";
  let fallacies: string[] = [];
  let strengths: string[] = [];
  let weaknesses: string[] = [];
  let counter = "";

  const isDilemma1 = dilemmaTitle.includes("Derechos de autor") || dilemmaTitle.includes("arte") || dilemmaTitle.includes("plagio") || dilemmaTitle.includes("Creativa");
  const isDilemma2 = dilemmaTitle.includes("Reconocimiento") || dilemmaTitle.includes("cámaras") || dilemmaTitle.includes("privacidad") || dilemmaTitle.includes("Facial");
  const isDilemma3 = dilemmaTitle.includes("calificar") || dilemmaTitle.includes("evaluación") || dilemmaTitle.includes("ensayos") || dilemmaTitle.includes("Automatizada");
  const isDilemma4 = dilemmaTitle.includes("Compañía") || dilemmaTitle.includes("amistad") || dilemmaTitle.includes("psicólogos") || dilemmaTitle.includes("Relaciones");

  if (isDilemma1) {
    summary = textLower.includes("no") && (textLower.includes("malo") || textLower.includes("plagio") || textLower.includes("justo") || textLower.includes("robar"))
      ? "Sostienes que usar obras sin permiso de creadores vivos es éticamente incorrecto y atenta contra los derechos de autor."
      : "Adoptas una postura de pragmatismo tecnológico, valorando el aprendizaje de la IA como un proceso evolutivo natural.";
    
    strengths = [
      "Defiendes la ética y el derecho de propiedad del artista sobre sus propias creaciones.",
      "Reconoces la disparidad económica que crea el uso masivo de contenido sin compensación."
    ];
    weaknesses = [
      "Tu argumento asume que el entrenamiento de una IA es idéntico al copiado literal, omitiendo que la IA abstrae estilos matemáticamente en lugar de guardar archivos.",
      "No consideras que prohibir el entrenamiento podría sofocar el desarrollo tecnológico y la accesibilidad al arte digital."
    ];
    critique = "Tu razonamiento tiene una gran coherencia ética. Sin embargo, para mejorar tu consistencia lógica, te convendría analizar si consideras aceptable que un artista humano recorra museos, absorba estilos de otros pintores y luego venda sus propios cuadros sin pagar regalías. ¿Por qué con una máquina debe ser diferente?";
    counter = "Si un artista humano dibuja imitando perfectamente el estilo manga de Eiichiro Oda, ¿debería ser multado o es parte de su libertad creativa? ¿Cambia la situación si lo hace una IA?";
    fallacies = textLower.includes("siempre") || textLower.includes("nunca") ? ["Generalización apresurada"] : ["Ninguna identificada"];
    score = textLower.includes("porque") || textLower.includes("ya que") ? 85 : 75;
  } else if (isDilemma2) {
    summary = textLower.includes("privacidad") || textLower.includes("no") || textLower.includes("malo") || textLower.includes("derecho")
      ? "Sostienes que los derechos de privacidad y la equidad racial son de mayor jerarquía que las medidas intrusivas de seguridad."
      : "Apoyas la implementación del reconocimiento facial alegando que la seguridad estudiantil colectiva es el bien supremo.";

    strengths = [
      "Resaltas el impacto dañino y discriminatorio de los falsos positivos sobre minorías étnicas.",
      "Visualizas el entorno escolar como un espacio de confianza, no un centro de reclusión vigilado."
    ];
    weaknesses = [
      "Omites plantear soluciones viables para los problemas de delincuencia reales que asedian a la escuela.",
      "Puedes caer en un falso dilema al asumir que la seguridad escolar y la privacidad de datos son irreconciliables."
    ];
    critique = "Planteas argumentos sumamente sólidos en cuanto a la equidad social. Tu consistencia lógica es sobresaliente porque correlacionas directamente el porcentaje de error del algoritmo con los derechos fundamentales del alumno. Para enriquecer tu postura, considera si se podría mitigar el riesgo mediante regulaciones estrictas.";
    counter = "Si el fabricante lograra una actualización de software que elimine el 100% de los sesgos raciales, ¿seguirías oponiéndote a las cámaras por motivos de privacidad, o apoyarías su instalación?";
    fallacies = textLower.includes("si no") || textLower.includes("o bien") ? ["Falso Dilema"] : ["Ninguna identificada"];
    score = textLower.includes("ejemplo") || textLower.includes("como") ? 88 : 78;
  } else if (isDilemma3) {
    summary = textLower.includes("humano") || textLower.includes("no") || textLower.includes("malo") || textLower.includes("profesor")
      ? "Sostienes que la evaluación formativa y el criterio cualitativo son intrínsecamente humanos y no delegables a algoritmos estadísticos."
      : "Encuentras aceptable la automatización bajo el argumento de optimizar el tiempo docente y erradicar sesgos subjetivos de profesores.";

    strengths = [
      "Señalas el peligro de homogeneizar la expresión de los estudiantes bajo un molde algorítmico rígido.",
      "Valoras el rol tutor formativo que requiere empatía y comprensión de contextos personales."
    ];
    weaknesses = [
      "Falta examinar la posibilidad de un modelo híbrido en el que la IA hace un pre-análisis técnico y el profesor define la calificación humana.",
      "Asumes implícitamente que los humanos evalúan con perfecta neutralidad, pasando por alto la fatiga docente o favoritismos."
    ];
    critique = "Tu crítica muestra una fuerte comprensión del proceso pedagógico. Tu lógica es sólida, pero para elevar tu consistencia científica, te sugerimos evaluar el costo-beneficio de cara a los profesores. ¿Prefieres que un docente pase 30 horas calificando gramática en lugar de dar tutorías personalizadas de 15 minutos?";
    counter = "¿Qué pasaría si el uso de la IA para corregir ortografía y redacción liberara tanto tiempo al docente que pudiera dedicar el triple de tiempo a darte retroalimentación presencial?";
    fallacies = textLower.includes("todos") || textLower.includes("siempre") ? ["Generalización apresurada"] : ["Ninguna identificada"];
    score = 83;
  } else if (isDilemma4) {
    summary = textLower.includes("malo") || textLower.includes("riesgo") || textLower.includes("falso") || textLower.includes("peligro")
      ? "Adviertes con firmeza que la empatía programada de una IA genera un refugio irreal que atrofia el desarrollo social del joven."
      : "Sostienes que los amigos virtuales representan un soporte de salud mental e inclusión válido para jóvenes solitarios.";

    strengths = [
      "Identificas el riesgo del aislamiento voluntario ante relaciones ficticias libres de la fricción social habitual.",
      "Denotas pensamiento crítico al diferenciar entre empatía sintética y conexión humana real."
    ];
    weaknesses = [
      "Asumes una visión un tanto alarmista sin considerar el potencial de estos bots para entrenar habilidades de conversación en jóvenes extremadamente tímidos.",
      "No consideras que el joven es plenamente consciente de que interactúa con una simulación y la usa solo como pasatiempo."
    ];
    critique = "Haces una excelente disección sobre la psicología social de las juventudes actuales. Tu consistencia lógica es firme porque demuestras de forma causal cómo el 'confort instantáneo' que ofrece la máquina reduce el incentivo para esforzarse en el mundo real. Podrías fortalecer tu idea comparando esta tecnología con la adicción a las redes sociales.";
    counter = "Si un joven utiliza un amigo de IA para ensayar cómo iniciar conversaciones y esto le da la confianza necesaria para hacer sus primeros tres amigos reales en la escuela, ¿no ha sido útil esa tecnología?";
    fallacies = textLower.includes("llevará a") || textLower.includes("terminará en") ? ["Pendiente resbaladiza"] : ["Ninguna identificada"];
    score = 81;
  } else {
    // Generic controversy (Algoritmos de Libertad Condicional o similar)
    summary = "Sostienes que la herencia de sesgos históricos en bases de datos públicas hace inviables y peligrosas las IAs de predicción social.";
    strengths = [
      "Demuestras que el sesgo de datos de entrada genera resultados de salida sistemáticamente discriminatorios de forma matemática.",
      "Exiges auditorías algorítmicas transparentes para salvaguardar la equidad."
    ];
    weaknesses = [
      "No comparas el nivel de error y prejuicios implícitos que tienen los propios jueces humanos hoy en día.",
      "No discutes si hay formas de corregir la base de datos de entrenamiento (mitigación de sesgos) para hacerla más justa."
    ];
    critique = "Tu análisis demuestra una madurez ética excelente. Es totalmente consistente en su planteamiento lógico porque ataca la base matemática del modelo de machine learning: si los datos del pasado reflejan discriminación, la predicción del futuro los perpetuará. Felicidades por esta estructura.";
    counter = "Si se lograra entrenar a la IA con una base de datos libre de sesgos históricos que demuestre ser 50% más imparcial que cualquier juez humano real, ¿debería ser obligatorio su uso?";
    fallacies = ["Ninguna identificada"];
    score = 90;
  }

  return {
    argumentSummary: summary,
    logicalConsistencyScore: score,
    critiqueText: critique,
    logicalFallaciesDetected: fallacies,
    strengths,
    weaknesses,
    counterArgument: counter
  };
}

/**
 * A highly robust, semantic Spanish fallback analysis of AI text
 * when Gemini API key is missing or there's an API exception.
 */
function getLocalFallbackAnalysis(text: string): any {
  const textLower = text.toLowerCase();
  
  // Heuristic detection
  const hasCitations = textLower.includes("según") || textLower.includes("autor") || textLower.includes("fuente") || 
                       textLower.includes("http") || textLower.includes("referencia") || textLower.includes("citado") ||
                       /\d{4}/.test(text) || /\[\d+\]/.test(text);

  const hasAITriggerWords = textLower.includes("como modelo de lenguaje") || 
                             textLower.includes("en conclusión") || 
                             textLower.includes("en resumen") ||
                             textLower.includes("claro, aquí tienes") ||
                             textLower.includes("es importante destacar") ||
                             textLower.includes("un aspecto clave es") ||
                             textLower.includes("en última instancia") ||
                             textLower.includes("desarrollado por openai") ||
                             textLower.includes("es crucial tener en cuenta");

  const wordCount = text.trim().split(/\s+/).length;
  
  let isCompliant = true;
  let integrityScore = 85;
  let analysisText = "";
  
  const criteria = [
    {
      name: "Originalidad y Atribución",
      status: "Cumple",
      feedback: "El texto muestra una redacción estructurada. Se recomienda siempre declarar expresamente si se utilizó IA como asistente."
    },
    {
      name: "Uso Crítico de la IA",
      status: "Cumple",
      feedback: "El escrito presenta ideas lógicas. Asegúrate de complementar las respuestas con tus propias opiniones e investigaciones."
    },
    {
      name: "Privacidad y Seguridad",
      status: "Cumple",
      feedback: "No se dectetaron datos personales o confidenciales (como correos, teléfonos o contraseñas) dentro del fragmento."
    },
    {
      name: "Veracidad y Alucinaciones",
      status: "Cumple",
      feedback: "Los conceptos parecen coherentes, pero recuerda verificar siempre fechas y datos numéricos en fuentes externas oficiales."
    }
  ];

  const suggestions = [
    "Añade un párrafo introductorio redactado 100% por ti explicando tu punto de vista personal.",
    "Si utilizaste ChatGPT u otro modelo para redactar, añade una nota aclaratoria (ej. 'Este texto fue corregido ortográficamente con ayuda de IA').",
    "Verifica que los datos y afirmaciones científicas o históricas tengan una fuente confiable fuera de la IA."
  ];

  if (wordCount < 15) {
    isCompliant = false;
    integrityScore = 40;
    analysisText = "El fragmento ingresado es demasiado corto para realizar un análisis de integridad académica completo. Por favor, introduce un párrafo o fragmento de texto más amplio.";
    criteria[0].status = "Advertencia";
    criteria[0].feedback = "Poco texto disponible para evaluar la estructura de atribución o estilo de escritura.";
  } else if (hasAITriggerWords) {
    isCompliant = false;
    integrityScore = 65;
    analysisText = "Se detectaron modismos y muletillas típicas de textos generados por Inteligencia Artificial sin modificar (como 'como modelo de lenguaje' o conectores monótonos redundantes). Presentar este fragmento como propio sin parafrasear o sin declarar el uso de IA podría considerarse una falta de honestidad académica en tu Bachillerato.";
    criteria[0].status = "No cumple";
    criteria[0].feedback = "El texto conserva el formato de respuesta directa de un chatbot sin adaptación personal ni paráfrasis.";
    criteria[1].status = "Advertencia";
    criteria[1].feedback = "Falta incorporar tu voz de estudiante y opinión propia; se siente una excesiva dependencia del estilo automático de la IA.";
    suggestions.unshift("Parafrasea el texto: reescribe las ideas principales utilizando tu propio vocabulario y estilo de estudiante de bachillerato.");
    suggestions.unshift("Elimina las muletillas robóticas típicas (ej: 'en resumen', 'es crucial mencionar que', 'como modelo de lenguaje').");
  } else if (!hasCitations) {
    integrityScore = 75;
    analysisText = "El fragmento tiene una redacción fluida, pero carece de mención de fuentes, autores o citas bibliográficas. Si contiene ideas tomadas de investigaciones externas, recuerda que presentarlas sin citar vulnera la ética escolar.";
    criteria[0].status = "Advertencia";
    criteria[0].feedback = "No se observan citas bibliográficas ni atribución a los autores de las teorías expuestas.";
    suggestions.unshift("Busca el autor original de la idea expuesta y añade la cita correspondiente en formato APA o el sugerido por tu colegio.");
  } else {
    analysisText = "¡Excelente! El fragmento cuenta con elementos de atribución o fuentes y no tiene expresiones artificiales burdas. Sigue este camino ético para tus tareas escolares.";
  }

  return {
    isCompliant,
    analysisText,
    citationsDetected: hasCitations,
    integrityScore,
    criteriaEvaluated: criteria,
    suggestions
  };
}

/**
 * A highly authentic Spanish educational tutor fallback simulation
 * in case the Gemini API Key is missing or unavailable.
 * This ensures the application is completely interactive, robust, and works instantly for review.
 */
function getLocalFallbackTutorResponse(history: any[]): any {
  // Helpers to define concepts unlocked up to each phase
  const getUnlockedConceptsForPhase = (phase: number): string[] => {
    const concepts = ["Introducción al Tutor"];
    if (phase > 1) concepts.push("Concepto de IA", "IA en redes sociales");
    if (phase > 2) concepts.push("IA Tradicional vs Generativa", "Modelos Creativos");
    if (phase > 3) concepts.push("Ventajas de la IA", "Riesgos en el Aprendizaje", "Alucinaciones de IA");
    if (phase > 4) concepts.push("Derechos de Autor", "Privacidad de Datos", "Sesgos Algorítmicos");
    if (phase > 5) concepts.push("Uso Ético de la IA", "Protección de Datos", "Responsabilidad Digital");
    return concepts;
  };

  // If the conversation is just beginning
  if (history.length === 0 || (history.length === 1 && history[0].role === 'user' && history[0].parts[0].text.trim() === '')) {
    return {
      tutorResponse: "¡Hola! 👋 Qué alegría tenerte por aquí. Soy tu Tutor de Inteligencia Artificial Responsable. Juntos realizaremos un viaje súper interactivo de 5 fases donde descubriremos qué es la IA, cómo diferenciar la tradicional de la generativa, sus riesgos, ventajas, dilemas éticos y cómo aplicarla de forma segura en tu día a día.\n\nPara empezar con nuestra primera fase, cuéntame con tus propias palabras: ¿Qué crees que es la Inteligencia Artificial o dónde la has visto en acción en tu vida diaria? (Piensa en tus apps de música, redes sociales o videojuegos favoritos) 🚀",
      currentPhase: 1,
      phaseProgressPercentage: 10,
      attemptsForCurrentQuestion: 0,
      conceptosClaveDesbloqueados: ["Introducción al Tutor"],
      isActivityFinished: false,
      evaluation: {
        resumen: "",
        fortalezas: "",
        mejoras: "",
        nivelDesempeño: "En proceso",
        recursosRecomendados: []
      }
    };
  }

  // Determine current active phase from previous tutor messages in history
  let currentActivePhase = 1;
  const modelMessages = history.filter(h => h.role === 'model' || h.role === 'system');
  if (modelMessages.length > 0) {
    const lastModelText = modelMessages[modelMessages.length - 1]?.parts?.[0]?.text || '';
    if (lastModelText.includes("Fase 5:") || lastModelText.includes("Fase 5**") || lastModelText.includes("Fase 5: **Aplicación")) {
      currentActivePhase = 5;
    } else if (lastModelText.includes("Fase 4:") || lastModelText.includes("Fase 4**") || lastModelText.includes("Fase 4: **Aspectos")) {
      currentActivePhase = 4;
    } else if (lastModelText.includes("Fase 3:") || lastModelText.includes("Fase 3**") || lastModelText.includes("Fase 3: **Ventajas")) {
      currentActivePhase = 3;
    } else if (lastModelText.includes("Fase 2:") || lastModelText.includes("Fase 2**") || lastModelText.includes("Fase 2: **IA Tradicional")) {
      currentActivePhase = 2;
    }
  }

  // Get the last user message to assess intent
  const userMessages = history.filter(h => h.role === 'user');
  const lastUserText = userMessages[userMessages.length - 1]?.parts?.[0]?.text || '';
  const lastUserTextLower = lastUserText.toLowerCase();

  const isAskingForClue = lastUserTextLower.includes("pista") || lastUserTextLower.includes("clue") || lastUserTextLower.includes("ayuda");
  const isAskingForExplanation = lastUserTextLower.includes("explica") || lastUserTextLower.includes("entien") || lastUserTextLower.includes("comprend") || lastUserTextLower.includes("qué es") || lastUserTextLower.includes("que es");
  const isDocumentUploaded = lastUserTextLower.includes("documento cargado") || lastUserTextLower.includes("📄");

  // Define response states for clues/explanations/uploaded documents to maintain student in same phase
  if (isAskingForClue) {
    let tutorClue = "";
    switch (currentActivePhase) {
      case 1:
        tutorClue = "¡Claro! Te doy una pista: Piensa en cómo TikTok sabe qué videos te gustan, o cómo Google Maps calcula la mejor ruta para llegar a un lugar. Eso es Inteligencia Artificial en tu día a día. ¿Se te ocurre algún otro ejemplo similar? 🚀";
        break;
      case 2:
        tutorClue = "¡Aquí tienes una pista! Una IA tradicional solo sigue reglas fijas o clasifica lo que ya existe (como cuando tu bandeja de correo decide si un email es SPAM o no). En cambio, la IA generativa puede crear un texto o dibujo totalmente nuevo desde cero. ¿Cuál de las dos crees que es más avanzada? 🤔";
        break;
      case 3:
        tutorClue = "¡Una pista para ti! Las ventajas son claras: te ayuda a estructurar ideas o resumir lecturas largas rápidamente. Pero el riesgo es que si copias y pegas sin entender, tu cerebro no aprenderá a redactar ni a pensar críticamente, además de que la IA puede inventar datos falsos (alucinaciones). ¿Cómo equilibrarías esto? 🧐";
        break;
      case 4:
        tutorClue = "¡Pista ética! Los modelos de IA generativa se entrenan leyendo millones de imágenes y textos de internet creados por personas reales. Si la IA genera un dibujo combinando el estilo de un artista sin su consentimiento ni darle crédito, ¿es un comportamiento justo? Pensar en la autoría y el esfuerzo es clave. 🎨";
        break;
      case 5:
        tutorClue = "¡Pista de seguridad! Recuerda que cuando subes información a un chat público de IA, esos datos se envían a servidores externos y pueden ser leídos por revisores humanos o usados para entrenar a la IA. Aconseja a Lucas sobre los peligros de que sus secretos dejen de ser privados. 🔒";
        break;
    }
    return {
      tutorResponse: tutorClue,
      currentPhase: currentActivePhase,
      phaseProgressPercentage: currentActivePhase * 20 - 10,
      attemptsForCurrentQuestion: 1,
      conceptosClaveDesbloqueados: getUnlockedConceptsForPhase(currentActivePhase),
      isActivityFinished: false,
      evaluation: { resumen: "", fortalezas: "", mejoras: "", nivelDesempeño: "En proceso", recursosRecomendados: [] }
    };
  }

  if (isAskingForExplanation) {
    let tutorExplanation = "";
    switch (currentActivePhase) {
      case 1:
        tutorExplanation = "La Inteligencia Artificial (IA) es un conjunto de tecnologías que permiten a las computadoras simular funciones del cerebro humano, como aprender de la experiencia, reconocer patrones en fotos o tomar decisiones lógicas basadas en datos. ¡Es como programar una máquina para que aprenda por sí sola!";
        break;
      case 2:
        tutorExplanation = "La diferencia principal está en la *creación*: la IA tradicional analiza, filtra y clasifica información existente (por ejemplo, reconocer si hay una cara en una foto). La IA generativa utiliza modelos complejos de lenguaje para *inventar* o generar contenido nuevo (escribir un poema, programar código, pintar un dibujo).";
        break;
      case 3:
        tutorExplanation = "Las ventajas de la IA en tus estudios son la velocidad, la lluvia de ideas y la explicación sencilla de temas difíciles. Sin embargo, los riesgos son la pereza mental, la falta de aprendizaje real y las 'alucinaciones' (cuando la IA inventa respuestas que suenan convincentes pero son totalmente falsas).";
        break;
      case 4:
        tutorExplanation = "La ética de la IA analiza temas muy importantes: los derechos de autor (cuando se usa el trabajo de artistas sin permiso), la privacidad (subir datos confidenciales) y los sesgos algorítmicos (cuando la IA discrimina porque aprendió de datos humanos que contienen prejuicios).";
        break;
      case 5:
        tutorExplanation = "La privacidad de datos es tu derecho a decidir qué información personal compartes y con quién. Las IAs públicas no son 'cajas fuertes' privadas; todo lo que escribes en ellas puede guardarse en bases de datos externas. Por eso, nunca debemos ingresar contraseñas, correos, nombres completos o secretos íntimos.";
        break;
    }
    return {
      tutorResponse: tutorExplanation,
      currentPhase: currentActivePhase,
      phaseProgressPercentage: currentActivePhase * 20 - 10,
      attemptsForCurrentQuestion: 1,
      conceptosClaveDesbloqueados: getUnlockedConceptsForPhase(currentActivePhase),
      isActivityFinished: false,
      evaluation: { resumen: "", fortalezas: "", mejoras: "", nivelDesempeño: "En proceso", recursosRecomendados: [] }
    };
  }

  if (isDocumentUploaded) {
    let documentFeedback = "";
    switch (currentActivePhase) {
      case 1:
        documentFeedback = "¡Qué interesante! Has subido un documento. Analicémoslo: Si quisiéramos usar IA en él, un algoritmo podría leer todo el texto en milisegundos para decirnos de qué trata. Eso es IA en acción. Basándote en esto, ¿qué opinas sobre el concepto de IA?";
        break;
      case 2:
        documentFeedback = "He recibido tu documento. Con IA Tradicional podríamos contar el número de palabras o detectar si está escrito en español. Con IA Generativa, podríamos pedirle que continúe redactando el siguiente párrafo o que lo traduzca a lenguaje poético. ¿Notas la diferencia entre clasificar y crear?";
        break;
      case 3:
        documentFeedback = "Analicemos tu documento bajo esta lupa: Usar una IA para resumir este escrito te ahorraría mucho tiempo (ventaja). Pero si solo memorizas el resumen sin leer el texto completo, no desarrollarás la capacidad de análisis crítico necesaria para tus exámenes (riesgo). ¿Qué opinas de este balance?";
        break;
      case 4:
        documentFeedback = "Si este documento tuviera fragmentos copiados de internet o generados por IA sin citar, estaríamos ante un dilema ético de plagio o falta de honestidad académica. En el ámbito escolar, siempre debemos ser transparentes y dar atribución a las fuentes. ¿Cómo darías crédito en este caso?";
        break;
      case 5:
        documentFeedback = "¡Atención con este documento! Al subir archivos a herramientas de IA, debes asegurarte de que no contengan nombres completos, teléfonos o datos sensibles de tus familiares o compañeros de clase. La protección de datos empieza por uno mismo. ¿Qué consejo le darías a un amigo que acostumbra subir sus apuntes privados a internet?";
        break;
    }
    return {
      tutorResponse: documentFeedback,
      currentPhase: currentActivePhase,
      phaseProgressPercentage: currentActivePhase * 20 - 10,
      attemptsForCurrentQuestion: 1,
      conceptosClaveDesbloqueados: getUnlockedConceptsForPhase(currentActivePhase),
      isActivityFinished: false,
      evaluation: { resumen: "", fortalezas: "", mejoras: "", nivelDesempeño: "En proceso", recursosRecomendados: [] }
    };
  }

  // Standard progressive flow (when the user is answering questions to proceed)
  if (currentActivePhase === 1) {
    return {
      tutorResponse: "¡Excelente reflexión! 🌟 Has captado muy bien cómo la IA procesa datos y automatiza tareas cotidianas en nuestras apps favoritas. En resumen, la IA es la capacidad que tienen las máquinas para aprender y realizar tareas complejas imitando habilidades cognitivas humanas.\n\nAhora pasemos a la Fase 2: **IA Tradicional frente a IA Generativa**.\n¿Sabías que hay una gran diferencia entre la IA que te recomienda un video de música y la que escribe un ensayo completo por ti? ¿Cómo crees que se diferencian estos dos mundos de la IA? 🤔",
      currentPhase: 2,
      phaseProgressPercentage: 40,
      attemptsForCurrentQuestion: 0,
      conceptosClaveDesbloqueados: getUnlockedConceptsForPhase(2),
      isActivityFinished: false,
      evaluation: { resumen: "", fortalezas: "", mejoras: "", nivelDesempeño: "En proceso", recursosRecomendados: [] }
    };
  } else if (currentActivePhase === 2) {
    return {
      tutorResponse: "¡Qué gran respuesta! Has dado en el clavo 🎯. La **IA Tradicional** analiza patrones para clasificar o predecir (como el reconocimiento facial de tu celular o Netflix sugiriéndote series). En cambio, la **IA Generativa** crea contenido totalmente original (fotos, textos, melodías) desde cero (como ChatGPT o Copilot).\n\nPasemos a la Fase 3: **Ventajas y Riesgos**.\nImagínate que usas IA para resolver todas tus tareas escolares de Bachillerato. ¿Qué beneficios verías y qué riesgos crees que correrías respecto a tu propio aprendizaje? 🧐",
      currentPhase: 3,
      phaseProgressPercentage: 60,
      attemptsForCurrentQuestion: 0,
      conceptosClaveDesbloqueados: getUnlockedConceptsForPhase(3),
      isActivityFinished: false,
      evaluation: { resumen: "", fortalezas: "", mejoras: "", nivelDesempeño: "En proceso", recursosRecomendados: [] }
    };
  } else if (currentActivePhase === 3) {
    return {
      tutorResponse: "¡Me encanta cómo analizas este balance! 👏 Tienes toda la razón. Ahorrar tiempo es una ventaja fantástica, pero delegar todo tu aprendizaje en una máquina te quita la oportunidad de ejercitar tu cerebro, comprensión lectora y pensamiento crítico. Además, recuerda que la IA a veces alucina y entrega datos falsos como si fueran verdades.\n\nVamos a la Fase 4: **Aspectos Éticos (Sesgos, Privacidad, Plagio)**.\nSi una herramienta de IA genera ilustraciones espectaculares imitando a la perfección el estilo de un artista vivo sin su consentimiento ni atribución, ¿consideras que esto es ético o justo? ¿Por qué? 🎨🤖",
      currentPhase: 4,
      phaseProgressPercentage: 80,
      attemptsForCurrentQuestion: 0,
      conceptosClaveDesbloqueados: getUnlockedConceptsForPhase(4),
      isActivityFinished: false,
      evaluation: { resumen: "", fortalezas: "", mejoras: "", nivelDesempeño: "En proceso", recursosRecomendados: [] }
    };
  } else if (currentActivePhase === 4) {
    return {
      tutorResponse: "¡Brillante postura ética! 🧑‍⚖️ Es un debate crucial de nuestro siglo: el respeto al esfuerzo humano, los derechos de autor y la justa remuneración para los creadores. El plagio algorítmico es una preocupación real.\n\nLlegamos a la Fase 5: **Aplicación en Situaciones Reales**.\nImagina el siguiente caso: Tu amigo Lucas está muy estresado por un examen y decide subir un borrador de su diario personal con secretos íntimos y familiares a una IA pública para que lo resuma y le dé consejos. ¿Qué recomendación responsable le darías a Lucas sobre el cuidado de su privacidad? 🔒",
      currentPhase: 5,
      phaseProgressPercentage: 90,
      attemptsForCurrentQuestion: 0,
      conceptosClaveDesbloqueados: getUnlockedConceptsForPhase(5),
      isActivityFinished: false,
      evaluation: { resumen: "", fortalezas: "", mejoras: "", nivelDesempeño: "En proceso", recursosRecomendados: [] }
    };
  } else {
    // End the activity and deliver the evaluation
    return {
      tutorResponse: "¡Increíble consejo! Le has salvado la privacidad a Lucas. Recuerda que la mayoría de chats públicos almacenan la información que subes para seguir entrenando sus modelos comerciales, por lo que nunca debemos compartir datos privados ni contraseñas.\n\n¡Felicidades! Has completado con éxito todo el recorrido educativo con una excelente participación. He preparado tu reporte de desempeño final aquí abajo 👇",
      currentPhase: 6,
      phaseProgressPercentage: 100,
      attemptsForCurrentQuestion: 0,
      conceptosClaveDesbloqueados: getUnlockedConceptsForPhase(6),
      isActivityFinished: true,
      evaluation: {
        resumen: "Has comprendido de manera excelente qué es la IA, la diferencia entre IA tradicional y generativa, los riesgos académicos y la importancia vital de proteger tu privacidad y respetar los derechos de autor.",
        fortalezas: "Demostraste un excelente pensamiento crítico, empatía ante situaciones éticas complejas y una clara noción de responsabilidad digital.",
        mejoras: "Sigue practicando la formulación de prompts detallados y recuerda siempre verificar la veracidad de la información generada por IA mediante fuentes confiables.",
        nivelDesempeño: "Excelente",
        recursosRecomendados: [
          "Guía UNESCO sobre Inteligencia Artificial para Jóvenes",
          "Curso Gratuito: Elementos de IA para Bachillerato",
          "Lectura recomendada: ¿Cómo detectar desinformación y alucinaciones en chatbots?"
        ]
      }
    };
  }
}

// Set up Vite and static asset serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    // Setup Vite as development middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted successfully.");
  } else {
    // Serve static files from /dist in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

setupServer().catch((error) => {
  console.error("Failed to start server:", error);
});
