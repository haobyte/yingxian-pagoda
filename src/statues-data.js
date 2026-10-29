// Statues Across All 5 Floors of Yingxian Wooden Pagoda (26 Sculptures Total)
// Primary source: Wang Nan, Wang Zhuonan, Zheng Hongyu — "Round Heaven & Square Earth, Pagoda & Icons as One"

const AZ = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
const at = (az, r) => [Math.sin((az * Math.PI) / 180) * r, -Math.cos((az * Math.PI) / 180) * r];

export const FLOORS = [
  {
    level: 1,
    title: 'Floor 1 · Colossal Sakyamuni Buddha',
    altar: 0,
    note: 'Central chamber colossal icon · Total height 10.32 m, figure 5.54 m, base width 8.48 m · Six Tathagatas wall murals',
    statues: [
      // Keep the existing GLB scale (10.32 - 3.42); omit the old pedestal and its vertical offset.
      // height describes the real ensemble; assetHeight is the approximate display size of this partial asset.
      { name: 'Sakyamuni Buddha', glb: 'f1-shakyamuni', kind: 'buddha', mudra: 'fearless', height: 10.32, assetHeight: 6.9, body: 5.54, pos: [0, 0], face: 180, gilt: true, note: 'Figure only · Pedestal omitted · Abhaya Mudra' },
    ],
  },
  {
    level: 2,
    title: 'Floor 2 · One Buddha & Four Bodhisattvas',
    altar: 0.368,
    altarCap: 0.04, // Top half of the 0.08 m cap in brightInnerStructure.
    note: 'Square altar 5.29 m wide · Main Buddha seated slightly north of center',
    statues: [
      { name: 'Sakyamuni Buddha (Main)', glb: 'f2-central', kind: 'buddha', mudra: 'teach', height: 4.05, pos: [0, -0.8], face: 180 },
      { name: 'Attendant Bodhisattva (NW)', glb: 'f2-attendant-yellow', kind: 'standBodhi', height: 2.94, pos: at(AZ.NW, 2.3), face: 180 },
      { name: 'Attendant Bodhisattva (NE)', glb: 'f2-attendant-blue', kind: 'standBodhi', height: 2.94, pos: at(AZ.NE, 2.3), face: 180 },
      { name: 'Manjusri Bodhisattva', glb: 'f2-manjushri-lion', kind: 'bodhi', mudra: 'teach', mount: 'lion', height: 2.63, pos: [1.7, 1.2], face: 180, note: 'Riding a blue lion (East)' },
      { name: 'Samantabhadra Bodhisattva', kind: 'bodhi', mudra: 'lap', mount: 'elephant', glb: 'f2-samantabhadra-elephant', height: 2.63, pos: [-1.7, 1.2], face: 180, note: 'Riding a six-tusked white elephant (West)' },
    ],
  },
  {
    level: 3,
    title: 'Floor 3 · Four Directional Buddhas',
    altar: 0.567,
    note: 'Octagonal altar (2.756 m side) · Four Buddhas seated back-to-back facing E, S, W, N',
    statues: [
      { name: 'East · Akshobhya Buddha', glb: 'f3-akshobhya', kind: 'buddha', mudra: 'earth', height: 2.73, pos: at(AZ.E, 1.4), face: AZ.E, seat: 'Elephant', note: 'Earth-Touching Mudra · Elephant Throne' },
      { name: 'South · Ratnasambhava Buddha', glb: 'f3-ratnasambhava', kind: 'buddha', mudra: 'giving', height: 2.73, pos: at(AZ.S, 1.4), face: AZ.S, seat: 'Horse', note: 'Varada (Giving) Mudra · Horse Throne' },
      { name: 'West · Amitabha Buddha', glb: 'f3-amitabha', kind: 'buddha', mudra: 'lap', height: 2.73, pos: at(AZ.W, 1.4), face: AZ.W, seat: 'Peacock', note: 'Dhyana (Meditation) Mudra · Peacock Throne' },
      { name: 'North · Amoghasiddhi Buddha', glb: 'f3-amoghasiddhi', kind: 'buddha', mudra: 'fearless', height: 2.73, pos: at(AZ.N, 1.4), face: AZ.N, seat: 'Garuda', note: 'Abhaya (Fearlessness) Mudra · Garuda Throne' },
    ],
  },
  {
    level: 4,
    title: 'Floor 4 · Avatamsaka Assembly of Seven',
    altar: 0.436,
    altarCap: 0.04,
    note: 'Square altar 5.646 m wide · Central Buddha with 2 disciples, 2 Bodhisattvas & 2 grooms',
    statues: [
      { name: 'Central Buddha (Vairocana/Sakyamuni)', glb: 'f4-central', kind: 'buddha', mudra: 'teach', height: 4.27, pos: [0, -0.7], face: 180, gilt: true },
      { name: 'Mahakasyapa (Elder Disciple)', glb: 'f4-kasyapa', kind: 'disciple', height: 2.13, pos: [-1.9, -0.6], face: 180, old: true },
      { name: 'Ananda (Young Disciple)', glb: 'f4-ananda', kind: 'disciple', height: 2.13, pos: [1.9, -0.6], face: 180 },
      // Preserve the figure's previous scale: 2.81 * (1 - 0.08 - 0.34 * 0.92). No replacement lion is added.
      { name: 'Manjusri on Blue Lion', glb: 'f4-manjushri', kind: 'bodhi', mudra: 'teach', mount: 'lion', height: 2.81, assetHeight: 1.706232, pos: [1.9, 1.3], face: 180, halfLotus: true, note: 'Relaxed half-lotus posture · Lion mount omitted' },
      // Match the partial Manjusri asset scale; the absent elephant is not included in display height.
      { name: 'Samantabhadra on White Elephant', glb: 'f4-samantabhadra', kind: 'bodhi', mudra: 'lap', mount: 'elephant', height: 2.84, assetHeight: 1.724448, pos: [-1.9, 1.3], face: 180, halfLotus: true, note: 'Relaxed half-lotus posture · Elephant mount omitted' },
      // Display placement: keep the complete 3D feet/base within the square altar's edge.
      { name: 'Lion Groom', glb: 'f4-lion-groom', kind: 'groom', height: 1.08, pos: [2.32, 2.3], face: 200, note: 'Guiding the blue lion at SE corner' },
      { name: 'Elephant Groom', glb: 'f4-elephant-groom', kind: 'groom', height: 1.08, pos: [-2.32, 2.3], face: 160, note: 'Guiding the white elephant at SW corner' },
    ],
  },
  {
    level: 5,
    title: 'Floor 5 · Vairocana & Eight Great Bodhisattvas Mandala',
    altar: 0.556,
    altarCap: 0.04,
    note: 'Square altar 7.11 m wide · Clockwise circumambulation starting from West (Avalokitesvara → Ksitigarbha)',
    statues: [
      { name: 'Vairocana Buddha (Dharmakaya)', glb: 'f5-vairocana', kind: 'buddha', mudra: 'zhiquan', height: 3.41, pos: [0, 0], face: 180, note: 'Esoteric Wisdom-Fist (Bodhyangi) Mudra' },
      { name: 'West · Avalokitesvara Bodhisattva', glb: 'f5-avalokiteshvara', kind: 'bodhi', mudra: 'teach', height: 2.0, pos: at(AZ.W, 2.6), face: AZ.W },
      { name: 'NW · Maitreya Bodhisattva', glb: 'f5-maitreya', kind: 'bodhi', mudra: 'lap', height: 2.0, pos: at(AZ.NW, 2.6), face: AZ.NW },
      { name: 'North · Akasagarbha Bodhisattva', glb: 'f5-akashagarbha', kind: 'bodhi', mudra: 'fearless', height: 2.0, pos: at(AZ.N, 2.6), face: AZ.N },
      { name: 'NE · Samantabhadra Bodhisattva', glb: 'f5-samantabhadra', kind: 'bodhi', mudra: 'teach', height: 2.0, pos: at(AZ.NE, 2.6), face: AZ.NE },
      { name: 'East · Vajrapani Bodhisattva', glb: 'f5-vajrapani', kind: 'bodhi', mudra: 'fearless', height: 2.0, pos: at(AZ.E, 2.6), face: AZ.E },
      { name: 'SE · Five-Chignon Manjusri', glb: 'f5-manjushri', kind: 'bodhi', mudra: 'teach', height: 2.0, pos: at(AZ.SE, 2.6), face: AZ.SE, fiveKnots: true, note: 'Five hair-knots reflecting Mount Wutai devotion' },
      { name: 'South · Sarvanivarana-Viskambhin', glb: 'f5-sarvanivarana', kind: 'bodhi', mudra: 'lap', height: 2.0, pos: at(AZ.S, 2.6), face: AZ.S },
      { name: 'SW · Ksitigarbha Bodhisattva (Monk)', glb: 'f5-kshitigarbha', kind: 'bodhi', mudra: 'lap', height: 2.0, pos: at(AZ.SW, 2.6), face: AZ.SW, monk: true, note: 'Shaven-headed Buddhist monk form' },
    ],
  },
];
