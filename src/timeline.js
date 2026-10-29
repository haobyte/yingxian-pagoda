// Tilt Timeline: Indexed by the NE offset of Column #23 on the 2nd-floor SW face (column height 2805 mm)
// kind: measured / record / est
export const COLUMN_H = 2.805; // m
export const EVENTS = [
  { year: 1056, mm: 0, kind: 'record', text: 'Completed in the 2nd year of Qingning, Liao Dynasty (1056 AD)' },
  { year: 1926, mm: 0, kind: 'record', text: 'Warlord artillery shelling (>200 shells hit; 2nd & 3rd floor frames damaged)' },
  { year: 1933, mm: 0, kind: 'record', text: 'Liang Sicheng & Mo Zongjiang survey: "Current condition is still sound"' },
  { year: 1935, mm: 0, kind: 'record', text: 'Mud-infill shear walls on bright floors removed & replaced with open lattice doors' },
  { year: 1950, mm: 300, kind: 'est', text: 'Mo Zongjiang notes: Tower leaning NE, 2nd-floor columns tilting most severely (est.)' },
  { year: 1976, mm: 430, kind: 'est', text: 'Tangshan Earthquake: 2nd-floor top lean jumps suddenly by +1.4 cm' },
  { year: 2004, mm: 500, kind: 'measured', text: 'Shanxi Cultural Heritage Bureau: SW column leans 50 cm NE; overall tower leans 65 cm NE' },
  { year: 2015, mm: 560, kind: 'measured', text: 'CACH Survey: Column #23 capital offset exceeds 56 cm' },
  { year: 2020, mm: 576.4, kind: 'measured', text: 'Measured 576.4 mm offset (Column height 2805 mm, ~11.6° lean angle)' },
];

export function columnOffsetMM(year, rate = 2) {
  if (year <= 1935) return 0;
  if (year >= 2020) return 576.4 + rate * (year - 2020);
  const pts = [
    [1935, 0], [1950, 300], [1976, 416], [1976.01, 430], [2004, 500], [2015, 560], [2020, 576.4],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    const [y0, v0] = pts[i];
    const [y1, v1] = pts[i + 1];
    if (year <= y1) {
      const u = (year - y0) / (y1 - y0);
      const e = i === 0 ? 1 - (1 - u) * (1 - u) : u;
      return v0 + (v1 - v0) * e;
    }
  }
  return 576.4;
}

export const angleDeg = (mm) => (Math.atan(mm / 1000 / COLUMN_H) * 180) / Math.PI;
export const deformScale = (year, rate) => columnOffsetMM(year, rate) / 576.4;
