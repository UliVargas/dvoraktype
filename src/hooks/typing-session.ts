import { type CharState, type TypingStats } from "../data/types";

// ============================================================================
// Núcleo del motor de escritura (sin dependencias de Qwik)
// ============================================================================
//
// Métricas:
// - El cronómetro arranca con la primera pulsación (startTime) y elapsedTime
//   es el tiempo desde ese momento.
// - WPM = (caracteres correctos / 5) / minutos transcurridos, redondeado.
//   Una "palabra" son 5 caracteres, la convención estándar de mecanografía.
// - Precisión = caracteres correctos / pulsaciones totales × 100, redondeada.
//   Cada carácter erróneo cuenta como pulsación y no avanza el cursor: hay que
//   teclear el carácter correcto para continuar (no hay retroceso).
// - Errores = número de pulsaciones incorrectas.
//
// Texto objetivo y entrada se normalizan a NFC, así "a" + U+0301 (NFD)
// coincide con "á".
// ============================================================================

export interface TypingSession {
  targetChars: string[];
  currentIndex: number;
  startTime: number;
  isFinished: boolean;
  correctChars: number;
  errorChars: number;
  totalKeystrokes: number;
  charStates: CharState[];
}

const toChars = (text: string) => Array.from(text.normalize("NFC"));

export function createTypingSession(targetText: string): TypingSession {
  const targetChars = toChars(targetText);
  return {
    targetChars,
    currentIndex: 0,
    startTime: 0,
    isFinished: false,
    correctChars: 0,
    errorChars: 0,
    totalKeystrokes: 0,
    charStates: Array<CharState>(targetChars.length).fill("pending"),
  };
}

/**
 * Applies typed text to the session, character by character and in order.
 * Mutates the session in place so a reactive store only updates what changed.
 */
export function typeText(session: TypingSession, text: string, now: number) {
  for (const typedChar of toChars(text)) {
    if (session.isFinished) return;

    if (session.startTime === 0) session.startTime = now;
    session.totalKeystrokes++;

    const index = session.currentIndex;
    if (typedChar === session.targetChars[index]) {
      session.charStates[index] = "correct";
      session.correctChars++;
      session.currentIndex++;
      if (session.currentIndex >= session.targetChars.length) {
        session.isFinished = true;
      }
    } else {
      session.charStates[index] = "error";
      session.errorChars++;
    }
  }
}

export function computeStats(session: TypingSession, now: number): TypingStats {
  const elapsedTime = session.startTime === 0 ? 0 : now - session.startTime;
  const elapsedMinutes = elapsedTime / 60000;
  return {
    wpm:
      elapsedMinutes > 0
        ? Math.max(0, Math.round(session.correctChars / 5 / elapsedMinutes))
        : 0,
    accuracy:
      session.totalKeystrokes > 0
        ? Math.round((session.correctChars / session.totalKeystrokes) * 100)
        : 100,
    correctChars: session.correctChars,
    errorChars: session.errorChars,
    totalChars: session.targetChars.length,
    totalKeystrokes: session.totalKeystrokes,
    elapsedTime,
  };
}
