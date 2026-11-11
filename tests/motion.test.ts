import { describe, expect, it } from 'vitest';
import raw from '../src/data/exercises.json';
import type { Exercise } from '../src/core/types';
import { PATTERN_KEYS, patternFor } from '../src/ui/Motion';

const EXS = raw as unknown as Exercise[];
const by = (id: string) => patternFor(EXS.find((e) => e.id === id)!);

describe('motion patterns', () => {
  it('maps every exercise to an existing animation', () => {
    for (const ex of EXS) expect(PATTERN_KEYS).toContain(patternFor(ex));
  });
  it('maps key exercises correctly', () => {
    expect(by('Barbell_Squat')).toBe('squat');
    expect(by('Romanian_Deadlift')).toBe('rdl');
    expect(by('Barbell_Bench_Press_-_Medium_Grip')).toBe('bench');
    expect(by('Incline_Dumbbell_Press')).toBe('incline_press');
    expect(by('Wide-Grip_Lat_Pulldown')).toBe('pulldown');
    expect(by('Pullups')).toBe('pullup');
    expect(by('Ab_Crunch_Machine')).not.toBe('pullup');
    expect(by('Barbell_Walking_Lunge')).toBe('lunge');
    expect(by('Seated_Cable_Rows')).toBe('row_cable');
    expect(by('Incline_Dumbbell_Curl')).toBe('incline_curl');
    expect(by('Cable_Rope_Overhead_Triceps_Extension')).toBe('overhead_ext');
    expect(by('Side_Lateral_Raise')).toBe('lateral');
    expect(by('Seated_Leg_Curl')).toBe('leg_curl_seated');
    expect(by('Standing_Calf_Raises')).toBe('calf_standing');
    expect(by('Barbell_Hip_Thrust')).toBe('hip_thrust');
    expect(by('Reverse_Flyes')).toBe('rear_fly');
  });
});
