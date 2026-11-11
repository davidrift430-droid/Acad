// Domain types for Black Iron. All weights are stored in kilograms; the UI converts for lb users.

export type MuscleId =
  | 'chest' | 'lats' | 'middle back' | 'lower back' | 'traps' | 'shoulders'
  | 'biceps' | 'triceps' | 'forearms' | 'quadriceps' | 'hamstrings' | 'glutes'
  | 'calves' | 'abdominals' | 'adductors' | 'abductors' | 'neck';

/** Resistance profile: D descending (hardest lengthened), A ascending (hardest shortened), B bell, F flat. */
export type TensionProfile = 'D' | 'A' | 'B' | 'F';
/** Point of peak torque: Lengthened, Mid-range, Shortened. */
export type PeakTorque = 'L' | 'M' | 'S';
/** Systemic (CNS) fatigue cost. */
export type CnsCost = 1 | 2 | 3;
export type Lang = 'pt' | 'en' | 'es';

export interface Exercise {
  id: string;
  n: string; // English name
  npt?: string;
  nes?: string;
  cat: string;
  eq: string;
  lv: 1 | 2 | 3;
  mech: 'c' | 'i' | null;
  force: string | null;
  pm: MuscleId[];
  sm: MuscleId[];
  ins: string[];
  pt?: { st: string[]; t: string[]; e: string[] };
  profile: TensionProfile;
  peak: PeakTorque;
  cns: CnsCost;
  star: 0 | 1;
  est: 0 | 1; // 1 = metadata estimated by heuristics, 0 = curated
}

/** Reps in reserve. 4 means "4 or more" (warm-up / junk volume). */
export type Rir = 0 | 1 | 2 | 3 | 4;

export interface SetLog {
  kg: number | null;
  reps: number | null;
  rir: Rir | null;
  done: boolean;
  durationSec?: number;
  at?: number;
}

export interface Prescription {
  exId: string;
  sets: number;
  repMin: number;
  repMax: number;
  restSec: number;
}

export interface ProgramDay {
  id: string;
  name: string;
  focus?: string;
  items: Prescription[];
}

export interface Program {
  id: string;
  name: string;
  createdAt: number;
  generated: boolean;
  days: ProgramDay[];
  /** Mesocycle length in weeks (last week is a deload). */
  mesoWeeks: number;
  mesoStart: number;
  rationale?: string[];
}

export interface SessionItem {
  exId: string;
  repMin: number;
  repMax: number;
  restSec: number;
  rirTarget: number;
  sets: SetLog[];
}

export interface Session {
  id: string;
  programId: string | null;
  dayId: string | null;
  name: string;
  week: number;
  deload: boolean;
  startedAt: number;
  endedAt?: number;
  items: SessionItem[];
}

export interface WeighIn {
  date: string; // YYYY-MM-DD
  kg: number;
}

export type Sex = 'm' | 'f';
export type Goal = 'bulk' | 'maintain' | 'cut';
export type Equipment = 'gym' | 'home';
export type Joint = 'knee' | 'lowerBack' | 'shoulder' | 'elbow';

export interface Profile {
  name: string;
  sex: Sex;
  age: number;
  heightCm: number;
  level: 1 | 2 | 3;
  daysPerWeek: number;
  sessionMin: number;
  equipment: Equipment;
  goal: Goal;
  joints: Joint[];
  emphasis: MuscleId[];
  activity: number; // TDEE multiplier
  createdAt: number;
}

export interface Settings {
  lang: Lang;
  theme: 'dark' | 'light' | 'system';
  unit: 'kg' | 'lb';
  sound: boolean;
  haptics: boolean;
}

export interface Food {
  id: string;
  pt: string;
  en: string;
  es: string;
  cat: 'protein' | 'carb' | 'fat' | 'fruit' | 'veg' | 'dairy';
  kcal: number; // per 100 g
  p: number;
  c: number;
  f: number;
  unit?: { g: number; pt: string; en: string; es: string };
}

export interface Macros {
  kcal: number;
  p: number;
  c: number;
  f: number;
}

export interface MealItem {
  foodId: string;
  g: number;
}

export interface Meal {
  id: string;
  name: string;
  items: MealItem[];
}

export interface DietPlan {
  target: Macros;
  meals: Meal[];
  updatedAt: number;
}

export type Pose = 'front' | 'side' | 'back';

export interface PhotoMeta {
  id: string;
  date: string;
  pose: Pose;
  kg?: number;
  note?: string;
}
