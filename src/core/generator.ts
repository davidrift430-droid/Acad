// Program generator for hypertrophy mesocycles.
// - Split chosen by days available so each muscle is trained ~2x/week (Schoenfeld 2016 frequency meta-analysis).
// - Exercise pools ordered to favour long-muscle-length (stretch) loading when equipment allows.
// - Volume starts near the low end of MAV; RIR targets fall across the mesocycle, then a deload week.
import type { Equipment, Exercise, Joint, MuscleId, Prescription, Profile, Program, ProgramDay } from './types';
import { GROUP_OF, LANDMARKS, VOLUME_GROUPS, restFor, type VolumeGroup } from './training';

export type Slot =
  | 'chest_press' | 'chest_fly' | 'vpull' | 'row' | 'lat_iso' | 'ohp' | 'lateral' | 'rear'
  | 'biceps' | 'triceps_oh' | 'triceps_pd' | 'squat' | 'lunge' | 'quad_iso' | 'hinge'
  | 'ham_curl' | 'glute' | 'calves' | 'abs' | 'traps';

export const POOLS: Record<Slot, string[]> = {
  chest_press: ['Incline_Dumbbell_Press', 'Dumbbell_Bench_Press', 'Barbell_Bench_Press_-_Medium_Grip', 'Barbell_Incline_Bench_Press_-_Medium_Grip', 'Smith_Machine_Incline_Bench_Press', 'Leverage_Incline_Chest_Press', 'Leverage_Chest_Press', 'Dips_-_Chest_Version', 'Pushups', 'Incline_Push-Up'],
  chest_fly: ['Incline_Cable_Flye', 'Dumbbell_Flyes', 'Incline_Dumbbell_Flyes', 'Cable_Crossover', 'Butterfly', 'Low_Cable_Crossover'],
  vpull: ['Full_Range-Of-Motion_Lat_Pulldown', 'Wide-Grip_Lat_Pulldown', 'One_Arm_Lat_Pulldown', 'Pullups', 'Chin-Up', 'Close-Grip_Front_Lat_Pulldown'],
  row: ['Seated_Cable_Rows', 'Dumbbell_Incline_Row', 'Lying_T-Bar_Row', 'One-Arm_Dumbbell_Row', 'T-Bar_Row_with_Handle', 'Bent_Over_Barbell_Row', 'Bent_Over_Two-Dumbbell_Row', 'Leverage_High_Row', 'Inverted_Row'],
  lat_iso: ['Straight-Arm_Pulldown', 'Bent-Arm_Dumbbell_Pullover', 'Straight-Arm_Dumbbell_Pullover'],
  ohp: ['Seated_Dumbbell_Press', 'Machine_Shoulder_Military_Press', 'Dumbbell_Shoulder_Press', 'Standing_Military_Press', 'Seated_Cable_Shoulder_Press'],
  lateral: ['Cable_Seated_Lateral_Raise', 'Side_Lateral_Raise'],
  rear: ['Reverse_Machine_Flyes', 'Face_Pull', 'Reverse_Flyes'],
  biceps: ['Incline_Dumbbell_Curl', 'Preacher_Curl', 'Cable_Preacher_Curl', 'EZ-Bar_Curl', 'Barbell_Curl', 'Hammer_Curls', 'Dumbbell_Alternate_Bicep_Curl', 'Standing_Biceps_Cable_Curl'],
  triceps_oh: ['Cable_Rope_Overhead_Triceps_Extension', 'Kneeling_Cable_Triceps_Extension', 'Seated_Triceps_Press', 'Standing_Dumbbell_Triceps_Extension', 'EZ-Bar_Skullcrusher'],
  triceps_pd: ['Triceps_Pushdown_-_Rope_Attachment', 'Triceps_Pushdown', 'Close-Grip_Barbell_Bench_Press', 'Bench_Dips'],
  squat: ['Hack_Squat', 'Barbell_Squat', 'Leg_Press', 'Front_Barbell_Squat', 'Smith_Machine_Squat', 'Goblet_Squat', 'Bodyweight_Squat'],
  lunge: ['Split_Squat_with_Dumbbells', 'Dumbbell_Lunges', 'Dumbbell_Rear_Lunge', 'Barbell_Lunge', 'Dumbbell_Step_Ups'],
  quad_iso: ['Leg_Extensions', 'Leg_Press', 'Goblet_Squat'],
  hinge: ['Romanian_Deadlift', 'Stiff-Legged_Dumbbell_Deadlift', 'Stiff-Legged_Barbell_Deadlift', 'Romanian_Deadlift_from_Deficit', 'Good_Morning', 'One-Arm_Kettlebell_Swings', 'Single_Leg_Glute_Bridge'],
  ham_curl: ['Seated_Leg_Curl', 'Lying_Leg_Curls', 'Standing_Leg_Curl', 'Glute_Ham_Raise', 'Stiff-Legged_Dumbbell_Deadlift'],
  glute: ['Barbell_Hip_Thrust', 'Barbell_Glute_Bridge', 'Single_Leg_Glute_Bridge', 'Butt_Lift_Bridge'],
  calves: ['Standing_Calf_Raises', 'Calf_Press_On_The_Leg_Press_Machine', 'Donkey_Calf_Raises', 'Seated_Calf_Raise', 'Dumbbell_Seated_One-Leg_Calf_Raise', 'Smith_Machine_Calf_Raise'],
  abs: ['Cable_Crunch', 'Ab_Roller', 'Hanging_Leg_Raise', 'Reverse_Crunch', 'Dead_Bug', 'Crunches', 'Plank'],
  traps: ['Dumbbell_Shrug', 'Leverage_Shrug'],
};

const EQUIP: Record<Equipment, Set<string>> = {
  gym: new Set(['barbell', 'dumbbell', 'cable', 'machine', 'body only', 'kettlebells', 'e-z curl bar', 'other', 'bands']),
  home: new Set(['dumbbell', 'body only', 'kettlebells', 'bands']),
};

export const JOINT_EXCLUDE: Record<Joint, string[]> = {
  knee: ['Leg_Extensions', 'Dumbbell_Lunges', 'Barbell_Lunge', 'Split_Squat_with_Dumbbells', 'Hack_Squat', 'Front_Barbell_Squat', 'Barbell_Squat', 'Freehand_Jump_Squat', 'Dumbbell_Step_Ups'],
  lowerBack: ['Barbell_Deadlift', 'Romanian_Deadlift', 'Romanian_Deadlift_from_Deficit', 'Stiff-Legged_Barbell_Deadlift', 'Stiff-Legged_Dumbbell_Deadlift', 'Good_Morning', 'Bent_Over_Barbell_Row', 'Reverse_Grip_Bent-Over_Rows', 'T-Bar_Row_with_Handle', 'Standing_Military_Press', 'Barbell_Squat', 'Bent_Over_Two-Dumbbell_Row', 'Sumo_Deadlift', 'Rack_Pulls'],
  shoulder: ['Dips_-_Chest_Version', 'Bench_Dips', 'Standing_Military_Press', 'Upright_Cable_Row', 'Barbell_Bench_Press_-_Medium_Grip', 'Pullups'],
  elbow: ['EZ-Bar_Skullcrusher', 'Close-Grip_Barbell_Bench_Press', 'Barbell_Curl', 'Preacher_Curl'],
};

type DayKind = 'fullA' | 'fullB' | 'fullC' | 'upperA' | 'upperB' | 'lowerA' | 'lowerB' | 'push' | 'pull' | 'legs';

const DAYS: Record<DayKind, Slot[]> = {
  fullA: ['squat', 'chest_press', 'vpull', 'ham_curl', 'lateral', 'biceps', 'triceps_oh', 'calves'],
  fullB: ['hinge', 'ohp', 'row', 'lunge', 'chest_fly', 'triceps_pd', 'abs', 'biceps'],
  fullC: ['squat', 'chest_press', 'vpull', 'glute', 'rear', 'biceps', 'triceps_oh', 'calves'],
  upperA: ['chest_press', 'vpull', 'chest_fly', 'row', 'lateral', 'triceps_oh', 'biceps', 'rear'],
  upperB: ['row', 'chest_press', 'lat_iso', 'ohp', 'lateral', 'biceps', 'triceps_pd', 'traps'],
  lowerA: ['squat', 'ham_curl', 'lunge', 'quad_iso', 'calves', 'abs', 'glute'],
  lowerB: ['hinge', 'squat', 'ham_curl', 'glute', 'calves', 'abs', 'quad_iso'],
  push: ['chest_press', 'ohp', 'chest_press', 'chest_fly', 'lateral', 'triceps_oh', 'triceps_pd', 'lateral'],
  pull: ['vpull', 'row', 'lat_iso', 'rear', 'biceps', 'biceps', 'traps', 'abs'],
  legs: ['squat', 'hinge', 'lunge', 'ham_curl', 'quad_iso', 'calves', 'abs', 'glute'],
};

const SPLITS: Record<number, { key: string; days: DayKind[] }> = {
  2: { key: 'full', days: ['fullA', 'fullB'] },
  3: { key: 'full', days: ['fullA', 'fullB', 'fullC'] },
  4: { key: 'ul', days: ['upperA', 'lowerA', 'upperB', 'lowerB'] },
  5: { key: 'ulppl', days: ['upperA', 'lowerA', 'push', 'pull', 'legs'] },
  6: { key: 'ppl', days: ['push', 'pull', 'legs', 'push', 'pull', 'legs'] },
};

const EMPHASIS_SLOT: Partial<Record<MuscleId, Slot>> = {
  chest: 'chest_fly', lats: 'lat_iso', 'middle back': 'row', shoulders: 'lateral', biceps: 'biceps', triceps: 'triceps_oh',
  quadriceps: 'quad_iso', hamstrings: 'ham_curl', glutes: 'glute', calves: 'calves', abdominals: 'abs', traps: 'traps',
};
const EMPHASIS_DAYS: Record<string, DayKind[]> = {
  chest_fly: ['fullA', 'fullC', 'upperA', 'upperB', 'push'], lat_iso: ['fullA', 'fullB', 'upperA', 'pull'], row: ['fullA', 'fullC', 'upperA', 'pull'],
  lateral: ['fullB', 'fullC', 'upperA', 'upperB', 'push'], biceps: ['fullB', 'upperA', 'upperB', 'pull'], triceps_oh: ['fullB', 'upperB', 'push'],
  quad_iso: ['fullA', 'fullC', 'lowerA', 'lowerB', 'legs'], ham_curl: ['fullB', 'fullC', 'lowerA', 'lowerB', 'legs'], glute: ['fullA', 'fullB', 'lowerA', 'lowerB', 'legs'],
  calves: ['fullB', 'lowerA', 'lowerB', 'legs'], abs: ['fullA', 'lowerA', 'lowerB', 'legs'], traps: ['upperA', 'pull'],
};

const COUNT: Record<number, number> = { 45: 5, 60: 6, 75: 7, 90: 8 };

export type GenInput = Pick<Profile, 'daysPerWeek' | 'sessionMin' | 'equipment' | 'level' | 'joints' | 'emphasis'>;

export function repRange(ex: Exercise, slot: Slot): [number, number] {
  if (slot === 'calves' || slot === 'lateral' || slot === 'abs' || slot === 'rear') return [12, 20];
  if (ex.mech === 'c' && ex.cns === 3) return [6, 10];
  if (ex.mech === 'c') return [8, 12];
  return [10, 15];
}

export function generateProgram(input: GenInput, exById: Record<string, Exercise | undefined>, uid: () => string, now = Date.now()): Program {
  const days = Math.min(6, Math.max(2, input.daysPerWeek));
  const split = SPLITS[days]!;
  const allowed = EQUIP[input.equipment];
  const excluded = new Set(input.joints.flatMap((j) => JOINT_EXCLUDE[j]));
  const usage = new Map<string, number>();
  const max = COUNT[input.sessionMin] ?? 6;

  const candidates = (slot: Slot, used: Set<string>) => POOLS[slot].filter((id) => {
    const ex = exById[id];
    return ex && allowed.has(ex.eq) && !excluded.has(id) && !used.has(id);
  });

  const programDays: ProgramDay[] = split.days.map((kind, i) => {
    const slots = [...DAYS[kind]];
    let limit = max;
    input.emphasis.forEach((m) => {
      const s = EMPHASIS_SLOT[m];
      if (s && EMPHASIS_DAYS[s]?.includes(kind)) { slots.splice(Math.min(3, slots.length), 0, s); limit += 1; }
    });
    const used = new Set<string>();
    const items: Prescription[] = [];
    for (const slot of slots) {
      if (items.length >= limit) break;
      const list = candidates(slot, used);
      if (!list.length) continue;
      // Favour pool order (stretch-biased) but rotate between repeated days for variety.
      const id = [...list].sort((a, b) => (usage.get(a) ?? 0) - (usage.get(b) ?? 0) || list.indexOf(a) - list.indexOf(b))[0]!;
      const ex = exById[id]!;
      used.add(id);
      usage.set(id, (usage.get(id) ?? 0) + 1);
      const [repMin, repMax] = repRange(ex, slot);
      const sets = input.level === 3 && ex.star ? 4 : 3;
      items.push({ exId: id, sets, repMin, repMax, restSec: restFor(ex) });
    }
    const letter = String.fromCharCode(65 + i);
    return { id: uid(), name: letter, focus: `day.${kind.replace(/[ABC]$/, '')}`, items };
  });

  return {
    id: uid(),
    name: `split.${split.key}`,
    createdAt: now,
    generated: true,
    days: programDays,
    mesoWeeks: 5,
    mesoStart: now,
    rationale: [`gen.split.${split.key}`, 'gen.stretch', 'gen.rir', 'gen.progression', 'gen.deload', ...(input.joints.length ? ['gen.joints'] : [])],
  };
}

/** Projected weekly fractional hard sets per muscle group if the program is completed as written. */
export function projectedVolume(program: Program, exById: Record<string, Exercise | undefined>): Record<VolumeGroup, number> {
  const out = Object.fromEntries(VOLUME_GROUPS.map((g) => [g, 0])) as Record<VolumeGroup, number>;
  for (const d of program.days) for (const it of d.items) {
    const ex = exById[it.exId];
    if (!ex) continue;
    const credit = new Map<VolumeGroup, number>();
    ex.pm.forEach((m) => { const g = GROUP_OF[m]; if (g) credit.set(g, 1); });
    ex.sm.forEach((m) => { const g = GROUP_OF[m]; if (g && !credit.has(g)) credit.set(g, 0.5); });
    credit.forEach((w, g) => { out[g] += it.sets * w; });
  }
  return out;
}

export { LANDMARKS };
