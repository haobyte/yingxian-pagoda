// Yingxian Wooden Pagoda 3D Immersive Narrative Director
// 5 Chapters · 15 Storyboard Scenes · 3D Callout Pins · Procedural Chime Synthesizer & English Voiceover

export const CHAPTERS = [
  {
    id: 'prologue',
    num: '0',
    title: 'Prologue',
    subtitle: 'Sakyamuni Pagoda of Fogong Temple · Built 1056 AD (Liao Dynasty)',
    steps: [
      {
        id: 'pro-1',
        name: 'Sacred Timber Sanctuary · A Millennium of Vigil',
        duration: 12,
        cam: { pos: [48, 22, 92], target: [0, 31, 0], fov: 40 },
        camFrom: { pos: [8, 4.5, 122], target: [0, 26, 0] },
        state: { timeIdx: 0, explode: 0, liftAbove: null, cutawayFloor: null, xray: false, year: 2026, mult: 1, statuesOut: false, overlays: {}, autoRotate: true },
        badges: ['Built in 1056 AD', 'Height 67.31 m', 'Zero Iron Nails', '26 Liao Sculptures'],
        summary: 'Built in 1056 AD during the Liao Dynasty in Yingxian, Shanxi, the Sakyamuni Pagoda of Fogong Temple—known worldwide as the Yingxian Wooden Pagoda—has survived nearly a millennium of major earthquakes, gales, and artillery fire without a single iron nail in its timber frame.',
        narration: 'Welcome to the Sakyamuni Pagoda of Fogong Temple in Yingxian, Shanxi. Built in 1056 AD during the Liao Dynasty, this 67.31-meter architectural marvel stands without a single iron nail, surviving nearly a thousand years of earthquakes and storms.',
        pins: [
          { pos: [0, 66.5, 0], title: '12.73 m Iron Spire', sub: 'Ancient lightning protection & wind-stabilizing pinnacle', kind: 'gold' },
          { pos: [0, 32.0, 12.5], title: 'Sakyamuni Pagoda', sub: '6 exterior eaves · 5 bright floors & 4 hidden structural rings', kind: 'gold' },
          { pos: [0, 5.5, 16.5], title: 'Ground Peristyle Veranda', sub: '30.27 m base diameter · Double-tube seismic foundation', kind: 'wood' },
        ],
      },
    ],
  },
  {
    id: 'status',
    num: 'I',
    title: 'World Standing',
    subtitle: 'Guinness World Record · 1:1 Global Towers Comparison & Imperial Plaques',
    steps: [
      {
        id: 'st-1',
        name: 'Guinness World Record · Tallest & Oldest Timber Pagoda',
        duration: 12,
        cam: { pos: [-34, 28, 84], target: [-4, 33, 0], fov: 40 },
        state: { timeIdx: 0, explode: 0, liftAbove: null, cutawayFloor: null, xray: false, year: 2026, mult: 1, statuesOut: false, overlays: { scale: true, towers: false }, autoRotate: false },
        badges: ['Tallest Pure Timber Pagoda', '3,000+ m³ Korean Pine', '1st Batch National Monument', 'Guinness Certified'],
        summary: 'Certified by Guinness World Records as the tallest and oldest standing pure-timber pavilion pagoda on Earth, the tower rises 67.31 meters (66.52 m surveyed today)—equivalent to a modern 22-story building—atop a two-tiered 3.76 m stone Sumeru platform.',
        narration: 'The Yingxian Wooden Pagoda is officially recognized as the tallest and oldest standing pure-timber pagoda in the world. Rising 67.31 meters with a base diameter of 30.27 meters, it was crafted from over three thousand cubic meters of Korean pine.',
        pins: [
          { pos: [-23, 66.5, 0], title: 'Total Height 67.31 m (66.5 m today)', sub: 'Equivalent to a modern 22-story building', kind: 'gold' },
          { pos: [-23, 53.8, 0], title: 'Timber Roof Crown · 53.8 m', sub: '5th-floor pyramidal timber roof supporting the iron spire', kind: 'wood' },
          { pos: [-15.2, 3.8, 0], title: 'Octagonal Stone Platform · 3.76 m', sub: 'Lower square terrace + upper octagonal Sumeru base', kind: 'wood' },
        ],
      },
      {
        id: 'st-2',
        name: 'Three Wonder Towers of the World · 1:1 Scale Comparison',
        duration: 14,
        compact: true,
        cam: { pos: [0, 34, 152], target: [0, 33, 0], fov: 42 },
        state: { timeIdx: 0, explode: 0, liftAbove: null, cutawayFloor: null, xray: false, year: 2026, mult: 1, statuesOut: false, overlays: { scale: true, towers: true }, autoRotate: false },
        badges: ['Yingxian Pagoda (1056)', 'Leaning Tower of Pisa (1173)', 'Eiffel Tower (1889)', 'True 1:1 Scale'],
        summary: 'Honored alongside Italy’s Leaning Tower of Pisa and Paris’s Eiffel Tower as one of the "Three Great Towers of the World": in this true 1:1 scale comparison, the pure-timber Yingxian Pagoda (1056 AD, 67.31 m) predates the stone Leaning Tower of Pisa (1173 AD, 58.36 m) by 117 years and stands nearly 9 meters taller, while predating the iron Eiffel Tower (1889 AD) by 833 years.',
        narration: 'Alongside the Leaning Tower of Pisa and the Eiffel Tower, it is celebrated as one of the Three Wonder Towers of the World. At true one-to-one scale, the timber pagoda predates the stone Tower of Pisa by 117 years and stands nearly nine meters taller.',
        pins: [
          { pos: [0, 67.3, 0], title: 'Yingxian Wooden Pagoda (1056 AD)', sub: 'Pure mortise-and-tenon timber · 67.31 m tall', kind: 'gold' },
          { pos: [-40, 58.4, 2], title: 'Leaning Tower of Pisa (1173 AD)', sub: '8-tier marble campanile · 58.36 m tall · 3.99° tilt', kind: 'gold' },
          { pos: [44, 57.6, 2], title: 'Eiffel Tower · 1st Deck (1889 AD)', sub: 'Puddled iron lattice · 1st observation deck at 57.63 m', kind: 'cyan' },
        ],
      },
      {
        id: 'st-3',
        name: 'Liang Sicheng’s 1933 Survey & Historic Imperial Plaques',
        duration: 12,
        cam: { pos: [2.5, 25, 34], target: [0, 27, 10], fov: 38 },
        state: { timeIdx: 2, explode: 0, liftAbove: null, cutawayFloor: null, xray: false, year: 2026, mult: 1, statuesOut: false, overlays: {}, autoRotate: false },
        badges: ['Liang Sicheng 1933 Survey', 'Emperor Wuzong "Wonder of the World"', 'Emperor Shenzong "Divine Craft"', '50+ Historic Plaques'],
        summary: 'In autumn 1933, architectural historian Liang Sicheng and Mo Zongjiang surveyed the pagoda in person, exclaiming: "Without seeing this pagoda, one cannot fathom the full potential of timber architecture!" Over 50 historic plaques from the Jin, Yuan, Ming, and Qing dynasties hang beneath its eaves.',
        narration: 'In 1933, pioneering architectural historian Liang Sicheng surveyed the pagoda and marveled: without seeing this tower, one cannot know the true potential of timber architecture. Over fifty imperial and historic plaques adorn its eaves.',
        pins: [
          { pos: [0, 47.0, 9.9], title: '5F Plaque: "Divine Craft of Lofty Heights"', sub: 'Calligraphy by Ming Emperor Wanli (Zhu Yijun)', kind: 'gold' },
          { pos: [0, 39.2, 10.5], title: '4F Plaque: "Wonder of the World"', sub: 'Inscribed by Ming Emperor Zhengde (Zhu Houzhao)', kind: 'gold' },
          { pos: [0, 30.6, 11.1], title: '3F Plaque: "Sakyamuni Pagoda"', sub: 'Jin Dynasty (Tianhui era) plaque recording its history', kind: 'gold' },
          { pos: [0, 21.0, 11.4], title: '2F Plaque: "Heavenly Palace Soaring"', sub: 'Layered eaves rising into the clouds', kind: 'wood' },
        ],
      },
    ],
  },
  {
    id: 'structure',
    num: 'II',
    title: 'Architecture',
    subtitle: '5 Bright Floors & 4 Hidden Rings · Double-Tube Core & 54 Dougong Types',
    steps: [
      {
        id: 'str-1',
        name: '6 Eaves Outside, 9 Stories Inside · "5 Bright & 4 Dark" Exploded View',
        duration: 13,
        cam: { pos: [95, 52, 148], target: [0, 56, 0], fov: 40 },
        state: { timeIdx: 0, explode: 0.9, liftAbove: null, cutawayFloor: null, xray: false, year: 2026, mult: 1, statuesOut: false, overlays: {}, autoRotate: false },
        badges: ['5 Exterior Stories & 6 Eaves', '9 Internal Structural Levels', '5 Bright Worship Halls', '4 Hidden Stiffening Rings'],
        summary: 'From the outside, the pagoda appears to have 5 stories and 6 eaves (including the ground peristyle roof). Yet concealed beneath the balcony floor of each upper level (L2–L5) is a hidden structural mezzanine ("dark level"), forming a 9-layer system of 5 flexible bright floors alternating with 4 rigid dark rings.',
        narration: 'Though the pagoda shows five stories and six eaves from the outside, exploding it vertically reveals nine internal levels: five bright worship floors alternating with four hidden structural mezzanines that stiffen the entire tower.',
        pins: [],
      },
      {
        id: 'str-2',
        name: 'Double-Ring Column Cores & 4 Diagonal-Braced Stiffening Rings',
        duration: 13,
        cam: { pos: [26, 26, 35], target: [0, 23, 0], fov: 40 },
        state: { timeIdx: 0, explode: 0, liftAbove: null, cutawayFloor: null, xray: true, year: 2026, mult: 1, statuesOut: false, overlays: { struct: true }, autoRotate: true },
        badges: ['24 Outer + 8 Inner Columns', 'Tube-in-Tube Octagonal Core', 'Dark-Level Scissor Braces', 'Modular Unit M = 368 mm'],
        summary: 'X-ray skeletal view reveals a modern skyscraper-like "tube-in-tube" layout: an outer octagonal ring of 24 perimeter columns and an inner octagonal ring of 8 core columns per story. Inside the 4 hidden dark levels, dense diagonal X-braces form four rigid "bamboo-joint" rings that resist wind and earthquake shear.',
        narration: 'Looking through the walls reveals a tube-in-tube structural system: twenty-four outer perimeter columns and eight inner core columns per floor, bound together by four hidden rings of diagonal scissor braces that resist earthquakes and gales.',
        pins: [
          { pos: [0, 26.8, 10.6], title: 'Hidden-Level Diagonal Braces (4 Rigid Rings)', sub: 'Alternating rigid & flexible stories boost lateral stiffness', kind: 'gold' },
          { pos: [6.2, 21.0, 2.5], title: 'Inner Octagonal Core Ring (8 Columns/Floor)', sub: 'Supports the Buddhist altars and inner floor framing', kind: 'cyan' },
          { pos: [10.8, 21.0, 4.5], title: 'Outer Perimeter Ring (24 Columns/Floor)', sub: 'Tapers inward each story by the Liao module M = 368 mm', kind: 'wood' },
        ],
      },
      {
        id: 'str-3',
        name: '"Museum of Dougong" · 54 Types of Interlocking Bracket Sets',
        duration: 13,
        cam: { pos: [-9.2, 17.8, 21.8], target: [-3.8, 15.4, 10.8], fov: 36 },
        state: { timeIdx: 2, explode: 0, liftAbove: null, cutawayFloor: null, xray: false, year: 2026, mult: 1, statuesOut: false, overlays: {}, autoRotate: false },
        badges: ['54 Dougong Types', '400+ Bracket Clusters', '7-Tier Double-Ang Eave Brackets', 'Friction Seismic Damping'],
        summary: 'With 54 distinct types and over 400 clusters of interlocking dougong brackets, Liang Sicheng called the tower a "Museum of Dougong." Stepping down from 7-tier double-cantilever brackets on Floor 1 to 5-tier brackets on Floor 5—and featuring Liao-style 45° diagonal arms—tens of thousands of mortise-and-tenon joints slide and friction-damp seismic energy.',
        narration: 'With fifty-four distinct types and over four hundred clusters of dougong brackets, the pagoda is hailed as a living Museum of Dougong. Tens of thousands of interlocking mortise-and-tenon joints act as natural seismic shock absorbers.',
        pins: [
          { pos: [-3.6, 13.8, 11.6], title: '1F Eave: 7-Tier Double-Cantilever Dougong', sub: 'Projects 1.85 m; slanted lever-arms (Xia-ang) carry the deep eaves', kind: 'gold' },
          { pos: [-3.6, 17.4, 11.4], title: '2F Balcony: Liao-Style 45° Diagonal Arms', sub: 'Inter-column brackets bloom like wooden lotus flowers', kind: 'gold' },
          { pos: [-3.6, 12.6, 11.0], title: 'Cap Block · Tie Beam · Architrave', sub: 'Distributes thousands of tons of load evenly onto the columns', kind: 'wood' },
        ],
      },
      {
        id: 'str-4',
        name: '12.73 m Iron Spire & Eight Wind-Guyed Chains',
        duration: 11,
        cam: { pos: [17, 60.5, 23], target: [0, 59, 0], fov: 38 },
        state: { timeIdx: 0, explode: 0, liftAbove: null, cutawayFloor: null, xray: false, year: 2026, mult: 1, statuesOut: false, overlays: {}, autoRotate: true },
        badges: ['12.73 m Iron Spire', 'Octagonal Lotus Pedestal', 'Alms Bowl · 5 Rings · Flame Pearl', '8 Iron Guy Chains'],
        summary: 'Crowning the 5th-floor pyramidal roof is a 12.73-meter wrought-iron spire—nearly one-fifth of the pagoda’s total height. Composed of a brick Sumeru base, iron lotus, inverted bowl, five Dharma rings, flaming pearl, and eight iron chains anchored to the corner ridges, it stabilizes the crown against wind and grounds lightning strikes.',
        narration: 'Crowning the roof is a 12.73-meter iron spire anchored to the eight corner ridges by heavy iron chains. It ballasts the top roof against high winds and has protected the timber structure from lightning strikes for nearly a millennium.',
        pins: [
          { pos: [0, 64.2, 0], title: 'Flame Halo · Crescent Moon · Sacred Pearl', sub: 'Forged iron pinnacle reaching 66.52 m elevation', kind: 'gold' },
          { pos: [0, 58.5, 0], title: 'Inverted Iron Bowl & Five Dharma Rings', sub: 'Heavy cast-iron mass ballasting the 5th-floor roof apex', kind: 'cyan' },
          { pos: [6.8, 55.2, 6.8], title: 'Eight Corner Iron Guy Chains', sub: 'Anchored from the spire ring to the 8 corner ridges', kind: 'wood' },
        ],
      },
    ],
  },
  {
    id: 'tilt',
    num: 'III',
    title: 'The Tilt',
    subtitle: 'Facts of Deformation · 1935 Wall Removal & Column #23’s 11.6° Lean',
    steps: [
      {
        id: 'tl-1',
        name: 'Why Is It Leaning? 1926 Shelling & 1935 Mud-Wall Removal',
        duration: 13,
        cam: { pos: [71, 33, 71], target: [0, 36, 0], fov: 40 }, // SE: lean runs across the frame
        state: { timeIdx: 1, explode: 0, liftAbove: null, cutawayFloor: null, xray: false, year: 2026, mult: 1, playTimeline: true, statuesOut: false, overlays: { tilt: true }, autoRotate: false },
        badges: ['Intact 1056–1933', '1926: 200+ Artillery Hits', '~1935: Shear Walls Removed', 'Sharp Drop in Lateral Stiffness'],
        summary: 'Why did the pagoda’s lean accelerate over the past century? In 1926, warlord fighting struck the tower with over 200 artillery shells. Worse still, around 1935, residents removed the thick mud-infill walls on the bright floors and replaced them with open lattice doors, stripping the bright stories of their shear walls under prevailing WSW winds.',
        narration: 'Why did a pagoda that stood straight for eight centuries begin leaning rapidly in the twentieth century? After artillery damage in 1926, the thick mud-infill shear walls on the bright floors were removed around 1935 and replaced with open lattice doors, causing the second floor to lean toward the northeast.',
        pins: [
          { pos: [-8.5, 20.5, 8.5], title: '~1935: Mud-Infill Shear Walls Removed', sub: 'Replaced with open lattice doors, drastically reducing lateral stiffness', kind: 'danger' },
          { pos: [-11.5, 19.0, 11.5], title: 'Prevailing WSW Wind Vector (WSW → NE)', sub: 'Aligns directly with the pagoda’s northeastward lean', kind: 'gold' },
        ],
      },
      {
        id: 'tl-2',
        name: 'Northeast Kink · Plumb Reference vs. Deformed Spine (×10)',
        duration: 13,
        cam: { pos: [-60, 33, -60], target: [0, 34, 0], fov: 40 }, // NW: perpendicular to the NE lean
        state: { timeIdx: 1, explode: 0, liftAbove: null, cutawayFloor: null, xray: false, year: 2026, mult: 10, statuesOut: false, overlays: { tilt: true }, autoRotate: false },
        badges: ['65 cm NE Top Offset', '88 cm Cumulative Subsidence', '×10 Exaggerated Deformation', 'Sharpest Bend at Floor 2'],
        summary: 'Amplifying the surveyed deformation by ×10 against the dashed white plumb line reveals that the pagoda does not tilt like a rigid cylinder. Instead, Floor 1 remains nearly vertical thanks to its 1.2 m earthen wall and outer peristyle, while Floor 2 suffers a severe northeastward kink, displacing the upper tower ~65 cm northeast and 88 cm downward.',
        narration: 'Amplifying the measured deformation ten times reveals a distinct kink rather than a rigid tilt. While the first floor remains vertical inside its thick walls, severe bending concentrates in the second bright floor, shifting the spire about 65 centimeters toward the northeast.',
        pins: [
          { pos: [4.2, 54.0, -4.2], title: '~65 cm Northeast Spire Offset', sub: '88 cm cumulative vertical compression & settlement', kind: 'danger' },
          { pos: [2.2, 20.2, -2.2], title: '2nd Bright Floor: Primary Bending Zone', sub: 'Thousands of tons of upper load induce P-Delta bending here', kind: 'danger' },
          { pos: [0, 8.0, 0], title: '1st Floor: Restrained by Thick Wall & Peristyle', sub: '1.2 m earthen wall + outer veranda prevent lateral drift', kind: 'cyan' },
        ],
      },
      {
        id: 'tl-3',
        name: '2nd-Floor Critical Damage · Column #23 at 11.6° & NW Settlement',
        duration: 13,
        cam: { pos: [6, 23, 20], target: [-8.2, 21.3, 7.2], fov: 36 }, // from the SE so column #23's lean is seen side-on
        state: { timeIdx: 0, explode: 0, liftAbove: null, cutawayFloor: null, xray: false, year: 2026, mult: 5, statuesOut: false, overlays: { tilt: true }, autoRotate: false },
        badges: ['Column #23 Offset 576.4 mm', '11.6° Column Lean Angle', 'NW Corner Sunk 20 cm', '+2–3 mm/year Creep'],
        summary: 'Monitoring by the Chinese Academy of Cultural Heritage shows the worst distortion on the 2nd-floor southwest face: Column #23 (2,805 mm tall) leans northeast by 576.4 mm—an angle of 11.6°, nearly a full column diameter! Meanwhile, the northwest corner column has settled 20 cm, causing a visible dip in the 2nd-floor western eave.',
        narration: 'Zooming into the southwest face of the second floor reveals the most critical structural lesion: Column 23, standing 2.8 meters tall, has tilted 576.4 millimeters toward the northeast at an angle of 11.6 degrees—nearly equal to its own diameter.',
        pins: [
          { pos: [-8.2, 20.0, 7.2], title: '2F Southwest Column #23 (Most Critical)', sub: 'Height 2805 mm · Offset 576.4 mm · Tilt 11.6° (~1 column diameter)', kind: 'danger' },
          { pos: [-10.8, 20.8, -4.5], title: '2F Northwest Corner Sunk 20 cm', sub: 'Causes the visible sag along the western waist eave', kind: 'gold' },
        ],
      },
      {
        id: 'tl-4',
        name: 'Emergency Shoring & A World-Class Conservation Dilemma',
        duration: 11,
        cam: { pos: [54, 29, 66], target: [0, 33, 0], fov: 40 },
        state: { timeIdx: 2, explode: 0, liftAbove: null, cutawayFloor: null, xray: false, year: 2026, mult: 1, statuesOut: false, overlays: { tilt: true }, autoRotate: false },
        badges: ['Collapse Reserve Factor 1.075', 'Diagonal Timber Shoring', 'Full Disassembly vs. Upper Lift', 'Real-Time Sensor Monitoring'],
        summary: 'An isolated column leaning by its own diameter would have toppled long ago; the pagoda stands only through the collective grip of its dougong rings and diagonal shoring added in 1974–1981 and 2013. How to right the 2nd floor without sacrificing original 1056 AD timbers remains one of the world’s hardest heritage engineering challenges.',
        narration: 'The pagoda still stands today thanks to the collective grip of its bracket rings and modern diagonal shoring. How to correct the second-floor lean while preserving its thousand-year-old Liao timbers remains one of the greatest conservation challenges in the world.',
        pins: [
          { pos: [0, 20.2, 11.5], title: 'Modern Diagonal Shoring & Steel Straps', sub: 'Auxiliary struts added in 1974–1981 and 2013', kind: 'gold' },
          { pos: [0, 35.0, 0], title: 'Seismic Vulnerability Alert', sub: 'Collapse reserve factor ~1.075; major earthquakes pose the top risk', kind: 'danger' },
        ],
      },
    ],
  },
  {
    id: 'statues',
    num: 'IV',
    title: 'Sacred Statues',
    subtitle: 'Statues on Every Floor · 5 Stories & 26 Liao Polychrome Sculptures',
    steps: [
      {
        id: 'fl-1',
        name: 'Floor 1 · Colossal Sakyamuni Buddha (10.32 m Tall)',
        duration: 13,
        cam: { pos: [0, 9.6, 20.5], target: [0, 8.5, 0], fov: 40 },
        state: { timeIdx: 0, explode: 0, liftAbove: 1, cutawayFloor: 1, xray: false, year: 2026, mult: 1, statuesOut: false, floorFocus: 1, overlays: {}, autoRotate: false },
        badges: ['Floor 1 · 1 Colossal Buddha', 'Total 10.32 m / Figure 5.54 m', '8 Mighty Vajra Bearers', 'Six Tathagatas Wall Murals'],
        summary: 'The real first-floor Sakyamuni ensemble is 10.32 m tall including its pedestal (figure 5.54 m). This digital asset shows the figure only; the complete lotus pedestal and its bearers have not been reconstructed. Compare with the archival photograph.',
        narration: 'On the first floor sits Sakyamuni Buddha, 10.32 meters tall including the real pedestal. This model shows the figure only. See the archival photograph for the complete pedestal and its bearers.',
        pins: [
          { pos: [0, 7.5, 0], title: 'Sakyamuni Buddha · Figure Model', sub: 'Real ensemble 10.32 m tall · Pedestal not reconstructed', kind: 'gold' },
        ],
      },
      {
        id: 'fl-2',
        name: 'Floor 2 · One Buddha & Four Bodhisattvas (5 Statues)',
        duration: 12,
        cam: { pos: [0, 22.2, 17.5], target: [0, 20.4, 0], fov: 38 },
        state: { timeIdx: 0, explode: 0, liftAbove: 2, cutawayFloor: 2, xray: false, year: 2026, mult: 1, statuesOut: false, floorFocus: 2, overlays: {}, autoRotate: false },
        badges: ['Floor 2 · 5 Statues', 'Square Altar (5.29 m Wide)', 'Manjusri on Lion · Samantabhadra on Elephant', 'Main Buddha 4.05 m'],
        summary: 'Floor 2 embeds a 5.29-meter square altar inside the octagonal hall—embodying the ancient cosmology of "Round Heaven and Square Earth." A 4.05 m Sakyamuni Buddha sits slightly north of center, flanked by two standing attendant Bodhisattvas (2.94 m), with Manjusri riding a blue lion (east) and Samantabhadra riding a six-tusked white elephant (west, 2.63 m).',
        narration: 'The second floor features a square altar supporting five sculptures: a 4.05-meter central Buddha flanked by two standing Bodhisattvas, with Samantabhadra on a six-tusked white elephant to the left and Manjusri on a blue lion to the right.',
        pins: [
          { pos: [0, 22.8, -0.8], title: '2F Main Buddha (4.05 m Tall)', sub: 'Seated north of center · Vitarka (Teaching) Mudra', kind: 'gold' },
          { pos: [1.7, 21.4, 1.2], title: 'Manjusri Bodhisattva on Blue Lion (2.63 m)', sub: 'Seated atop a lotus throne on a roaring lion (East)', kind: 'cyan' },
          { pos: [-1.7, 21.4, 1.2], title: 'Samantabhadra on Six-Tusked Elephant (2.63 m)', sub: 'Seated atop a lotus throne on a white elephant (West)', kind: 'cyan' },
          { pos: [-1.6, 21.8, -1.6], title: 'Standing Attendant Bodhisattvas (2.94 m)', sub: 'Crowned & jeweled attendants at the NW and NE corners', kind: 'wood' },
        ],
      },
      {
        id: 'fl-3',
        name: 'Floor 3 · Four Directional Buddhas of the Vajradhatu (4 Statues)',
        duration: 12,
        cam: { pos: [5.5, 31.5, 16.5], target: [0, 29.4, 0], fov: 38 },
        state: { timeIdx: 0, explode: 0, liftAbove: 3, cutawayFloor: 3, xray: false, year: 2026, mult: 1, statuesOut: false, floorFocus: 3, overlays: {}, autoRotate: false },
        badges: ['Floor 3 · 4 Statues', 'Octagonal Altar (2.756 m Side)', 'E · S · W · N Directional Buddhas', '3D Esoteric Mandala Core'],
        summary: 'Floor 3 houses the pagoda’s only octagonal altar (2.756 m side length), where four 2.73-meter Buddhas sit back-to-back facing the four cardinal directions: Akshobhya (East, Earth-Touching mudra, elephant seat), Ratnasambhava (South, Varada mudra, horse seat), Amitabha (West, Dhyana mudra, peacock seat), and Amoghasiddhi (North, Abhaya mudra, Garuda seat).',
        narration: 'The third floor features an octagonal altar where four 2.73-meter Buddhas sit back-to-back facing East, South, West, and North—transforming the entire pagoda into a three-dimensional Esoteric Buddhist mandala.',
        pins: [
          { pos: [0, 30.7, 1.25], title: 'South · Ratnasambhava Buddha (2.73 m)', sub: 'Varada (Giving) Mudra · Sacred Horse Pedestal', kind: 'gold' },
          { pos: [1.25, 30.7, 0], title: 'East · Akshobhya Buddha (2.73 m)', sub: 'Bhumisparsha (Earth-Touching) Mudra · Elephant Pedestal', kind: 'cyan' },
          { pos: [-1.25, 30.7, 0], title: 'West · Amitabha Buddha (2.73 m)', sub: 'Dhyana (Meditation) Mudra · Peacock Pedestal', kind: 'cyan' },
          { pos: [0, 30.7, -1.25], title: 'North · Amoghasiddhi Buddha (2.73 m)', sub: 'Abhaya (Fearlessness) Mudra · Golden Garuda Pedestal', kind: 'wood' },
        ],
      },
      {
        id: 'fl-4',
        name: 'Floor 4 · Avatamsaka Assembly of Seven (7 Statues)',
        duration: 12,
        cam: { pos: [0, 40.0, 16.8], target: [0, 38.2, 0.4], fov: 38 },
        state: { timeIdx: 0, explode: 0, liftAbove: 4, cutawayFloor: 4, xray: false, year: 2026, mult: 1, statuesOut: false, floorFocus: 4, overlays: {}, autoRotate: false },
        badges: ['Floor 4 · 7 Statues', 'Square Altar (5.646 m Wide)', 'Buddha · Disciples · Bodhisattvas · Grooms', 'Half-Lotus Liao Masterpieces'],
        summary: 'Floor 4’s 5.646 m square altar stages a vivid Avatamsaka Assembly of seven statues: a 4.27 m gilded central Buddha flanked by the elder disciple Mahakasyapa and youthful Ananda (2.13 m); in front, Manjusri on a lion (2.81 m) and Samantabhadra on an elephant (2.84 m) sit in relaxed half-lotus (Lalitasana) poses, led at the front corners by a Lion Groom and Elephant Groom (1.08 m).',
        narration: 'The fourth floor presents a lively seven-figure Avatamsaka assembly: a 4.27-meter Buddha attended by his disciples Mahakasyapa and Ananda, with Manjusri and Samantabhadra in graceful half-lotus postures and two expressive grooms leading their mounts.',
        pins: [
          { pos: [0, 40.8, -0.7], title: '4F Main Buddha (4.27 m Tall)', sub: 'Gilded face · Vitarka Mudra in serene majesty', kind: 'gold' },
          { pos: [-1.9, 38.8, -0.6], title: 'Mahakasyapa (Elder) & Ananda (Youth)', sub: '2.13 m tall · Lifelike Liao portrait sculptures of the two disciples', kind: 'wood' },
          { pos: [1.9, 39.4, 1.3], title: 'Manjusri on Lion & Samantabhadra on Elephant (2.84 m)', sub: 'Relaxed half-lotus posture with dynamic Liao sculptural grace', kind: 'cyan' },
          { pos: [2.7, 37.8, 2.3], title: 'Lion Groom & Elephant Groom (1.08 m)', sub: 'Standing at the front altar corners, guiding the sacred mounts', kind: 'wood' },
        ],
      },
      {
        id: 'fl-5',
        name: 'Floor 5 · Vairocana & Eight Great Bodhisattvas Mandala (9 Statues)',
        duration: 13,
        cam: { pos: [0, 48.6, 16.2], target: [0, 46.2, 0], fov: 40 },
        state: { timeIdx: 0, explode: 0, liftAbove: 5, cutawayFloor: 5, xray: false, year: 2026, mult: 1, statuesOut: false, floorFocus: 5, overlays: {}, autoRotate: false },
        badges: ['Floor 5 · 9 Statues', 'Largest Square Altar (7.11 m)', 'Vairocana Wisdom-Fist Mudra', 'Eight Great Bodhisattvas Mandala'],
        summary: 'At the summit on Floor 5, a 7.11-meter square altar embodies the pagoda’s supreme theological climax: the Mandala of the Eight Great Bodhisattvas Sutra. In the center sits Dharmakaya Buddha Vairocana (3.41 m) forming the esoteric Wisdom-Fist (Bodhyangi) mudra, encircled clockwise from the west by eight 2.0-meter Bodhisattvas—from Avalokitesvara to monk-robed Ksitigarbha, including a five-chignon Manjusri in the southeast.',
        narration: 'At the summit on the fifth floor stands the pagoda’s spiritual climax: Dharmakaya Buddha Vairocana forming the supreme Wisdom-Fist mudra, encircled clockwise by the Eight Great Bodhisattvas in a sacred three-dimensional mandala.',
        pins: [
          { pos: [0, 47.9, 0], title: 'Vairocana Buddha (Dharmakaya · 3.41 m)', sub: 'Hands in esoteric Wisdom-Fist (Bodhyangi) Mudra at the center', kind: 'gold' },
          { pos: [-2.6, 46.5, 0], title: 'West · Avalokitesvara & NW · Maitreya', sub: 'Clockwise circumambulation starting west of Vairocana', kind: 'cyan' },
          { pos: [1.84, 46.5, 1.84], title: 'SE · Five-Chignon Manjusri (2.0 m)', sub: 'Five hair-knots reflecting Mount Wutai Manjusri devotion', kind: 'cyan' },
          { pos: [-1.84, 46.5, 1.84], title: 'SW · Ksitigarbha as Buddhist Monk (2.0 m)', sub: 'Shaven-headed monk form completing the clockwise mandala ring', kind: 'wood' },
        ],
      },
      {
        id: 'fl-6',
        name: 'Grand Finale · All 26 Sacred Statues Ascend in Spiral Orbit',
        duration: 16,
        cam: { pos: [74, 34, 106], target: [0, 34, 0], fov: 40 },
        state: { timeIdx: 3, explode: 0, liftAbove: null, cutawayFloor: null, xray: false, year: 2026, mult: 1, statuesOut: true, floorFocus: null, overlays: {}, autoRotate: true },
        badges: ['All 26 Statues in Orbit', 'Twilight Sacred Glow', 'Click Any Statue to Inspect', 'Heaven & Earth · Tower & Icon'],
        summary: 'As twilight falls and warm lanterns illuminate the pagoda, all 26 Liao-dynasty sculptures from Floors 1 through 5 glide outward from the tower core into a luminous spiral orbit. Hover or click on any floating statue in the 3D scene to fly in for a close-up inspection of its mudra, mount, and polychrome craftsmanship.',
        narration: 'As twilight descends and warm light fills the pagoda, all twenty-six Liao Dynasty Buddhas and Bodhisattvas ascend into a luminous spiral around the ancient timber tower. Click any statue in the scene to inspect its mudra and craftsmanship up close.',
        pins: [
          { pos: [0, 66.5, 0], title: 'Millennium Timber Pagoda · 26 Sacred Icons', sub: 'Click any floating statue in the 3D scene for a close-up view', kind: 'gold' },
        ],
      },
    ],
  },
];

// Procedural Temple Ambience & Wind-Bell Chime Synthesizer + English Voiceover (Web Audio API & Web Speech API)
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.voiceEnabled = false; // Explicitly OFF by default
    this.droneGain = null;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const g = this.ctx.createGain();
    g.gain.value = 0.0001;
    g.connect(this.ctx.destination);
    this.droneGain = g;
    for (const freq of [110, 164.81, 220, 329.63]) {
      const osc = this.ctx.createOscillator();
      const og = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      og.gain.value = freq > 200 ? 0.08 : 0.18;
      osc.connect(og);
      og.connect(g);
      osc.start();
    }
  }

  toggleAudio(force) {
    this.init();
    this.enabled = force ?? !this.enabled;
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    if (this.droneGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.droneGain.gain.cancelScheduledValues(now);
      this.droneGain.gain.setTargetAtTime(this.enabled ? 0.055 : 0.0001, now, 0.6);
    }
    if (this.enabled) this.chime(528);
    return this.enabled;
  }

  // Bronze wind-bell / temple chime
  chime(baseFreq = 587.33) {
    if (!this.enabled || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const now = this.ctx.currentTime;
    const ratios = [1, 1.5, 2.41, 3.12];
    ratios.forEach((r, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * r, now);
      const peak = (0.045 / (i + 1)) * (i === 0 ? 1.2 : 0.7);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4 - i * 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 2.5);
    });
  }

  speak(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (!this.voiceEnabled || !text) return;
    const u = new SpeechSynthesisUtterance(text);
    const zh = document.documentElement.lang === 'zh-CN';
    u.lang = zh ? 'zh-CN' : 'en-US';
    u.rate = 0.98;
    u.pitch = 0.98;
    const voices = window.speechSynthesis.getVoices?.() || [];
    const pref = zh ? /Ting-Ting|Tingting|Natural|Enhanced|Google 普通话/i : /Samantha|Daniel|Natural|Enhanced|Google US English/i;
    const voice =
      voices.find((v) => v.lang && v.lang.startsWith(zh ? 'zh' : 'en') && pref.test(v.name)) ||
      voices.find((v) => v.lang && v.lang.startsWith(zh ? 'zh' : 'en'));
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  }

  toggleVoice(force) {
    this.voiceEnabled = force ?? !this.voiceEnabled;
    if (!this.voiceEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    return this.voiceEnabled;
  }
}
