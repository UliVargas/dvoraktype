// ============================================================================
// Tipos e interfaces del tutor de mecanografía Dvorak en español
// ============================================================================

// ===================================================================
// Variantes de distribución de teclado
// ===================================================================
// - 'es-dvorak-xkb': Dvorak español (Linux XKB)
// - 'us-dvorak-intl': Dvorak estadounidense (Internacional)
// ===================================================================
export type LayoutVariant = "es-dvorak-xkb" | "us-dvorak-intl";

export type ExerciseType = "letters" | "words" | "sentences";

export interface Exercise {
  readonly id: string;
  readonly type: ExerciseType;
  readonly content: string;
}

export type Language = "es" | "en";

export interface Lesson {
  readonly id: string;
  readonly language: Language;
  readonly title: string;
  readonly description: string;
  readonly keys: readonly string[];
  readonly exercises: readonly Exercise[];
  readonly requiredWpm: number;
  readonly requiredAccuracy: number;
}

export interface TypingStats {
  wpm: number;
  accuracy: number;
  correctChars: number;
  errorChars: number;
  totalChars: number;
  totalKeystrokes: number;
  elapsedTime: number;
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  bestWpm: number;
  bestAccuracy: number;
  attempts: number;
}

export type FingerName =
  | "left-pinky"
  | "left-ring"
  | "left-middle"
  | "left-index"
  | "right-index"
  | "right-middle"
  | "right-ring"
  | "right-pinky"
  | "thumb"
  | "none";

export type KeyRow = "number" | "top" | "home" | "bottom" | "space";

export interface KeyDef {
  readonly key: string;
  readonly shiftKey?: string;
  readonly finger: FingerName;
  readonly row: KeyRow;
  readonly position: number;
  readonly widthMultiplier: number;
  readonly code: string;
}

export interface KeyboardLayout {
  readonly name: string;
  readonly variant: LayoutVariant;
  readonly rows: {
    readonly number: readonly KeyDef[];
    readonly top: readonly KeyDef[];
    readonly home: readonly KeyDef[];
    readonly bottom: readonly KeyDef[];
    readonly space: readonly KeyDef[];
  };
}

export type CharState = "pending" | "correct" | "error";
