// 应县木塔（佛宫寺释迦塔）参数规格 —— 所有长度单位：米
//
// 数据来源（详见 docs/research.md）：
//   [X] 肖旻《应县木塔的尺度设计逻辑（下）》建筑史学刊 2026(1)：表15 平面构成、表18/19 竖向构成、表21 高度
//       模数 M = 0.368 m（足材）。“面阔”= 八边形边长，“半径”= 边心距（≈1.2×边长）
//   [W] 王南等《天地圆方 塔像合一》：首层外槽面阔 9.561 m（实测平均）
//   [L] 梁思成 1933 立面图（照片 IMG_9506/9507，标定 ≈75.7 px/m）：副阶柱高、檐口出挑、台基分层
//   [P] 现场照片：材质、门窗、栏杆、牌匾
// 标注 "est" 的为依据立面图/照片的估算值。

const M = 0.368;

// 八边形：边长 s → 边心距 a = s / (2·tan22.5°) ≈ 1.2071·s
export const apothemFromSide = (s) => s / (2 * Math.tan(Math.PI / 8));

export const spec = {
  M,

  platform: {
    height: 3.76, // [X] 表21 台基 376 cm
    lower: { shape: 'square', halfWidth: 20.5, height: 1.8 }, // est [L]
    upper: { shape: 'octagon', apothem: 17.2, height: 1.96 }, // est [L]
    // 南侧月台与踏道（照片 9518/9524）
    terrace: { depth: 7.5, halfWidth: 9.5 }, // est [P]
    stairs: { width: 9.0 }, // est [P] 照片 9519 西侧踏道约 9–10 m 宽
  },

  // 副阶（首层外围廊）
  peristyle: {
    side: 34 * M, // [X] 12.51 m
    apothem: 40.8 * M, // [X] 15.01 m → 对边 30.03 m（≈ 公开的“底层直径 30.27 m”）
    bays: [0.31, 0.38, 0.31], // 心间稍宽 est [L]
    columnHeight: 4.1, // est [L] 3.8–4.2
    columnDiameter: 0.55, // est
    bracket: { height: 1.45, projection: 1.1 }, // 五铺作 est
    eave: { overhang: 2.3, cornerExtra: 0.55, cornerLift: 0.45 }, // est [L] 角部檐尖距中心 ≈17.8 m
    roofTopHeight: 7.8, // 副阶屋面与塔身相交高度（台基面起算）est [L]
  },

  // 五个明层。colTop：本层檐柱柱头高度（台基面起算）
  // 层间竖向构成 [X] 表18（三层）/表19（五层）：
  //   普拍枋0.17 + 栌斗0.37 + 檐下铺作 → 柱脚枋0.44 → 暗层柱 → 普拍枋0.17 + 栌斗0.37 + 平坐铺作 → 平坐地面 → 露明柱
  floors: [
    {
      level: 1,
      side: 26 * M, // [X] 9.568（[W] 实测 9.561）
      innerSide: 14.33 * M,
      colTop: 8.81, // [X] 一层檐柱 881 cm
      bracket: { height: 2.18, projection: 1.85, type: '七铺作' }, // 双杪双下昂；高度按 [X] 表18 使二层层高闭合
      eave: { overhang: 3.6, cornerExtra: 0.5, cornerLift: 0.45 }, // est [L] 角部檐尖 ≈15.7 m；照片 9519 比对吻合
    },
    {
      level: 2,
      side: 25 * M,
      innerSide: 14.17 * M,
      storey: 8.83, // [X] 二层高度 883 cm（一层柱头 → 二层柱头）
      darkColumn: 1.65,
      balconyBracket: 1.17 + 0.37 + 0.17,
      exposedColumn: 2.84,
      bracket: { height: 2.18, projection: 1.7, type: '六铺作' },
      eave: { overhang: 3.3, cornerExtra: 0.45, cornerLift: 0.4 }, // 照片 9519 比对后收小
      balconyOut: 1.35, // 平坐外沿超出柱缝 est [L]
    },
    {
      level: 3,
      side: 24 * M,
      innerSide: 14.0 * M,
      storey: 8.82, // [X]
      darkColumn: 1.65, // [X] 表18
      balconyBracket: 1.17 + 0.37 + 0.17,
      exposedColumn: 2.84, // [X] 表18 露明柱 284
      bracket: { height: 2.18, projection: 1.6, type: '六铺作' },
      eave: { overhang: 2.9, cornerExtra: 0.45, cornerLift: 0.4 },
      balconyOut: 1.3,
    },
    {
      level: 4,
      side: 23 * M,
      innerSide: 13.83 * M,
      storey: 8.84, // [X]
      darkColumn: 1.65,
      balconyBracket: 1.17 + 0.37 + 0.17,
      exposedColumn: 2.84,
      bracket: { height: 1.82, projection: 1.45, type: '五铺作' },
      eave: { overhang: 2.6, cornerExtra: 0.45, cornerLift: 0.4 },
      balconyOut: 1.3,
    },
    {
      level: 5,
      side: 21.6 * M, // [X] 新测修正
      innerSide: 12.92 * M,
      storey: 7.73, // [X] 五层高度 773 cm
      darkColumn: 1.35, // [X] 表19
      balconyBracket: 0.85 + 0.37 + 0.17,
      exposedColumn: 2.73, // [X] 表19
      bracket: { height: 1.66, projection: 1.45, type: '五铺作' }, // [X] 五层铺作 4.5M
      eave: { overhang: 2.6, cornerExtra: 0.45, cornerLift: 0.4 }, // est [L]；照片 9519 比对后收小
      balconyOut: 1.6,
    },
  ],

  // 下层檐下铺作顶 → 上层平坐铺作底：柱脚枋 0.44 + 暗层柱
  plinthBeam: 0.44,

  // 腰檐屋面与暗层外墙相交位置：檐下铺作顶以上的高度 est [L]
  waistRoofRise: 1.1,

  // 顶层屋架 [X] 表17：橑檐枋→脊槫 水平 10.30 m，举高 5.24 m
  topRoof: { run: 10.3, rise: 5.34 },

  // 塔刹 [X] 表21：博脊/刹座 1.17 + 仰莲 1.65 + 刹身 9.91 = 12.73
  spire: {
    base: 1.17,
    lotus: 1.65,
    shaft: 9.91,
    chains: 8, // 八条铁链拉向屋面八角 [P]
  },

  // 校核：台基 3.76 + 一层 8.81 + 8.83 + 8.82 + 8.84 + 7.73 + 顶层铺作屋架 7.0 + 塔刹 12.73 ≈ 66.5 m
  // 公开数据：67.31（传统）/ 65.84（2011 实测）
};

// 派生：每层柱头高度、边心距、平坐高度
export function deriveLevels(s = spec) {
  const out = [];
  let colTop = s.floors[0].colTop;
  s.floors.forEach((f, i) => {
    const apothem = apothemFromSide(f.side);
    if (i === 0) {
      out.push({ ...f, apothem, base: 0, colTop, floorY: 0 });
      return;
    }
    const prev = out[i - 1];
    const prevTop = prev.colTop;
    const bracketTop = prevTop + prev.bracket.height;
    const darkBase = bracketTop + s.plinthBeam;
    const balconyBase = darkBase + f.darkColumn;
    const floorY = balconyBase + f.balconyBracket;
    colTop = prevTop + f.storey;
    out.push({ ...f, apothem, darkBase, balconyBase, floorY, colTop });
  });
  return out;
}
