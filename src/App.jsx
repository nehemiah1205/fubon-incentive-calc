import React, { useState, useMemo } from "react";
import { Plus, Trash2, TrendingUp, Award, Users, Calculator } from "lucide-react";

// ============================================================
// 設計語彙（Design Tokens）
// 深松石綠 × 石板藍，紙感淺底，襯線標題呼應品牌識別
// ============================================================
const C = {
  ink: "#16302E",        // 標題／強調文字（深松石墨綠）
  body: "#41585A",       // 內文文字
  muted: "#84999B",      // 輔助說明文字
  paper: "#F6F8F3",      // 頁面底色（起）
  paper2: "#EEF3EF",     // 頁面底色（迄）
  surface: "#FFFFFF",    // 卡片底色
  surfaceTint: "#F4F8F5",// 增員子卡片底色（微綠）
  line: "#DEE7E1",       // 一般邊框
  lineSoft: "#EAF0EC",   // 表格細線
  accent: "#1F6F5C",     // 主強調色（深松石綠）
  accent2: "#4A7C9E",    // 次強調色（石板藍）
  accentTint: "#E7F1EC", // 強調底色（極淺綠）
  warn: "#B4694A",       // 刪除／警示（陶土紅棕，低飽和）
};

const serif = "'Noto Serif TC', 'Microsoft JhengHei', serif";
const sans = "'Noto Sans TC', 'Microsoft JhengHei', system-ui, sans-serif";

// ---------- 獎金級距表 ----------
const CA_TABLE = [
  { min: 720000, bonus: 27000 },
  { min: 600000, bonus: 22500 },
  { min: 480000, bonus: 18000 },
  { min: 360000, bonus: 13500 },
  { min: 240000, bonus: 9000 },
  { min: 120000, bonus: 4500 },
  { min: 0, bonus: 0 },
];

const SUP_TABLE = [
  { min: 1320000, bonus: 51000 },
  { min: 1100000, bonus: 42500 },
  { min: 880000, bonus: 34000 },
  { min: 660000, bonus: 25500 },
  { min: 440000, bonus: 17000 },
  { min: 220000, bonus: 8500 },
  { min: 0, bonus: 0 },
];

// 調整後有效定著積分表：列＝報聘季別(1-4)，欄＝達成4.5萬季別(1-4)
const DEDICATION_MATRIX = [
  [5, 6, 7, 8],
  [null, 5, 6, 7],
  [null, null, 5, 6],
  [null, null, null, 5],
];

const POINT_BANDS = [
  { min: 30, rate: 1.0, label: "30分（含）以上" },
  { min: 24, rate: 0.8, label: "24~29分" },
  { min: 18, rate: 0.6, label: "18~23分" },
  { min: 12, rate: 0.4, label: "12~17分" },
  { min: 6, rate: 0.2, label: "6~11分" },
  { min: 0, rate: 0, label: "未達6分" },
];

const fmt = (n) =>
  Math.round(n).toLocaleString("zh-TW", { maximumFractionDigits: 0 });

function getBonus(amount, table) {
  const tier = table.find((t) => amount >= t.min);
  return tier ? tier.bonus : 0;
}

function getRateBand(points) {
  return POINT_BANDS.find((b) => points >= b.min);
}

let uid = 1;
const newRecruit = () => ({
  id: uid++,
  name: `增員 ${uid - 1}`,
  reportQ: 1,
  fyc: [0, 0, 0, 0],
  quarterEmployed: [true, true, true, true],
  yearEndEmployed: true,
  falconEligible: true,
});

// 獵鷹計畫：4~12月報聘（即第2、3、4季）適用
const isFalconQuarter = (reportQ) => reportQ >= 2;

export default function App() {
  const [role, setRole] = useState("ca"); // ca | sup
  const [ownFyc, setOwnFyc] = useState([0, 0, 0, 0]);
  const [recruits, setRecruits] = useState([newRecruit()]);

  const table = role === "ca" ? CA_TABLE : SUP_TABLE;

  const updateOwnFyc = (qIdx, val) => {
    const next = [...ownFyc];
    next[qIdx] = Number(val) || 0;
    setOwnFyc(next);
  };

  const addRecruit = () => setRecruits((r) => [...r, newRecruit()]);
  const removeRecruit = (id) =>
    setRecruits((r) => r.filter((x) => x.id !== id));
  const updateRecruit = (id, patch) =>
    setRecruits((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const updateRecruitFyc = (id, qIdx, val) =>
    setRecruits((r) =>
      r.map((x) => {
        if (x.id !== id) return x;
        const fyc = [...x.fyc];
        fyc[qIdx] = Number(val) || 0;
        return { ...x, fyc };
      })
    );
  const toggleQuarterEmployed = (id, qIdx) =>
    setRecruits((r) =>
      r.map((x) => {
        if (x.id !== id) return x;
        const qe = [...x.quarterEmployed];
        qe[qIdx] = !qe[qIdx];
        return { ...x, quarterEmployed: qe };
      })
    );

  const result = useMemo(() => {
    // ---- 各季 個人季專案FYC業績 與 季超級個人獎金 ----
    const quarterly = [0, 1, 2, 3].map((qIdx) => {
      const recruitBonusFyc = recruits.reduce((sum, r) => {
        if (r.reportQ - 1 > qIdx) return sum; // 尚未報聘
        return sum + (r.fyc[qIdx] || 0) * 0.5;
      }, 0);
      const projectFyc = ownFyc[qIdx] + recruitBonusFyc;
      const bonus = getBonus(projectFyc, table);
      return { qIdx, recruitBonusFyc, projectFyc, bonus };
    });

    const homerun = quarterly.every((q) => q.bonus > 0) ? 15000 : 0;
    const baseTotal =
      quarterly.reduce((s, q) => s + q.bonus, 0) + homerun;

    // ---- 增員積分（基本 + 有效定著）----
    let totalBasicPts = 0;
    let totalDedicationPts = 0;
    const recruitDetail = recruits.map((r) => {
      const reportIdx = r.reportQ - 1;
      // 基本積分：報聘季起每季 FYC>=30000 且當季在職 計1分
      let basicPts = 0;
      for (let q = reportIdx; q < 4; q++) {
        if ((r.fyc[q] || 0) >= 30000 && r.quarterEmployed[q]) basicPts += 1;
      }
      // 有效定著積分：報聘季起，最晚一個達成 4.5萬 的季別，對應新表
      let achieveIdx = -1;
      for (let q = 3; q >= reportIdx; q--) {
        if ((r.fyc[q] || 0) >= 45000) {
          achieveIdx = q;
          break;
        }
      }
      let dedicationPts = 0;
      if (achieveIdx >= 0 && r.yearEndEmployed) {
        const v = DEDICATION_MATRIX[reportIdx]?.[achieveIdx];
        dedicationPts = v || 0;
      }
      totalBasicPts += basicPts;
      totalDedicationPts += dedicationPts;
      return { ...r, basicPts, dedicationPts, achieveIdx };
    });

    const totalPoints = totalBasicPts + totalDedicationPts;
    const band = getRateBand(totalPoints);
    const annualRecruitBonus = baseTotal * band.rate;

    // ---- 第三、四季增員績效獎金 ----
    let q34Bonus = 0;
    const q34Detail = [];
    recruits.forEach((r) => {
      if (r.reportQ !== 3 && r.reportQ !== 4) return;
      [2, 3].forEach((qIdx) => {
        if (qIdx < r.reportQ - 1) return;
        const fyc = r.fyc[qIdx] || 0;
        let b = 0;
        let rate = 0;
        if (fyc >= 45000) {
          rate = 0.2;
          b = Math.min(fyc * 0.2, 30000);
        } else if (fyc >= 30000) {
          rate = 0.1;
          b = fyc * 0.1;
        }
        if (b > 0) {
          q34Bonus += b;
          q34Detail.push({ name: r.name, q: qIdx + 1, fyc, b, rate });
        }
      });
    });

    // ---- 獵鷹計畫獎金（4~12月新聘，每人10,000元，需6個月差勤率達70%）----
    let falconBonus = 0;
    const falconDetail = [];
    recruits.forEach((r) => {
      if (!isFalconQuarter(r.reportQ)) return;
      if (!r.falconEligible) return;
      falconBonus += 10000;
      falconDetail.push({ name: r.name, reportQ: r.reportQ });
    });

    const finalTotal = baseTotal + annualRecruitBonus + q34Bonus + falconBonus;

    return {
      quarterly,
      homerun,
      baseTotal,
      recruitDetail,
      totalBasicPts,
      totalDedicationPts,
      totalPoints,
      band,
      annualRecruitBonus,
      q34Bonus,
      q34Detail,
      falconBonus,
      falconDetail,
      finalTotal,
    };
  }, [ownFyc, recruits, table]);

  return (
    <div
      style={{
        background: `linear-gradient(160deg, ${C.paper} 0%, ${C.paper2} 100%)`,
        minHeight: "100%",
        color: C.body,
        fontFamily: sans,
        padding: "28px 16px 48px",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 32,
            paddingBottom: 22,
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "#111111",
              fontFamily: sans,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 1.5,
              marginBottom: 8,
            }}
          >
            <Calculator size={18} />
            115年超級獎勵專案辦法（8/13修訂版）
          </div>
          <h1
            style={{
              fontFamily: serif,
              fontSize: 16,
              fontWeight: 600,
              margin: 0,
              color: C.accent2,
              letterSpacing: 1,
            }}
          >
            個人業績暨增員獎金試算系統
          </h1>
        </div>

        {/* 職級選擇 */}
        <Card title="① 選擇職級" icon={<Users size={16} />}>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { key: "ca", label: "業務同仁 / RSA / HRA（CA組獎金表）" },
              { key: "sup", label: "行銷主管 / 業務主管 / 通訊處主管（主管組獎金表）" },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setRole(opt.key)}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border:
                    role === opt.key
                      ? `1.5px solid ${C.accent}`
                      : `1px solid ${C.line}`,
                  background: role === opt.key ? C.accentTint : "transparent",
                  color: role === opt.key ? C.ink : C.muted,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: role === opt.key ? 600 : 400,
                  transition: "all 0.15s ease",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Card>

        {/* 本人各季業績 */}
        <Card title="② 本人各季核實 FYC 業績" icon={<TrendingUp size={16} />}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {[0, 1, 2, 3].map((i) => (
              <QField
                key={i}
                label={`第${i + 1}季`}
                value={ownFyc[i]}
                onChange={(v) => updateOwnFyc(i, v)}
              />
            ))}
          </div>
        </Card>

        {/* 增員名單 */}
        <Card title="③ 增員名單（被增員者）" icon={<Users size={16} />}>
          {recruits.map((r) => (
            <div
              key={r.id}
              style={{
                border: `1px solid ${C.line}`,
                borderRadius: 10,
                padding: 14,
                marginBottom: 12,
                background: C.surfaceTint,
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                <input
                  value={r.name}
                  onChange={(e) => updateRecruit(r.id, { name: e.target.value })}
                  style={inputStyle({ flex: 1, fontWeight: 600 })}
                />
                <label style={{ fontSize: 12, color: C.muted }}>報聘季別</label>
                <select
                  value={r.reportQ}
                  onChange={(e) =>
                    updateRecruit(r.id, { reportQ: Number(e.target.value) })
                  }
                  style={inputStyle({ width: 90 })}
                >
                  {[1, 2, 3, 4].map((q) => (
                    <option key={q} value={q}>
                      第{q}季
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeRecruit(r.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: C.warn,
                    cursor: "pointer",
                    padding: 6,
                  }}
                  title="刪除"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                {[0, 1, 2, 3].map((qIdx) => {
                  const disabled = qIdx < r.reportQ - 1;
                  return (
                    <div key={qIdx}>
                      <QField
                        label={`第${qIdx + 1}季核實FYC`}
                        value={r.fyc[qIdx]}
                        disabled={disabled}
                        onChange={(v) => updateRecruitFyc(r.id, qIdx, v)}
                      />
                      {!disabled && (
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 11,
                            color: C.muted,
                            marginTop: 4,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={r.quarterEmployed[qIdx]}
                            onChange={() => toggleQuarterEmployed(r.id, qIdx)}
                          />
                          當季末在職
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: C.accent,
                  marginTop: 10,
                }}
              >
                <input
                  type="checkbox"
                  checked={r.yearEndEmployed}
                  onChange={(e) =>
                    updateRecruit(r.id, { yearEndEmployed: e.target.checked })
                  }
                />
                年度末獎勵核算時仍持續在職（第11、12工作月報聘者需在職滿3個月）
              </label>

              {isFalconQuarter(r.reportQ) ? (
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: C.accent2,
                    marginTop: 6,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={r.falconEligible}
                    onChange={(e) =>
                      updateRecruit(r.id, { falconEligible: e.target.checked })
                    }
                  />
                  符合獵鷹計畫資格：報聘後6個月內差勤率達70%（可獲得10,000元）
                </label>
              ) : (
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                  獵鷹計畫僅適用4~12月報聘（第2~4季），此新人不適用
                </div>
              )}
            </div>
          ))}
          <button onClick={addRecruit} style={addBtnStyle}>
            <Plus size={15} /> 新增增員名單
          </button>
        </Card>

        {/* ---- 結果 ---- */}
        <Card title="④ 試算結果" icon={<Award size={16} />} accent>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Badge>超級獎金</Badge>
            <SectionLabel style={{ marginBottom: 0 }}>季超級個人獎金</SectionLabel>
          </div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <Th>季別</Th>
                <Th>本人FYC</Th>
                <Th>增員加碼FYC(×50%)</Th>
                <Th>個人季專案FYC</Th>
                <Th>季超級個人獎金</Th>
              </tr>
            </thead>
            <tbody>
              {result.quarterly.map((q) => (
                <tr key={q.qIdx}>
                  <Td>第{q.qIdx + 1}季</Td>
                  <Td>{fmt(ownFyc[q.qIdx])}</Td>
                  <Td>{fmt(q.recruitBonusFyc)}</Td>
                  <Td>{fmt(q.projectFyc)}</Td>
                  <Td strong accent={q.bonus > 0}>
                    {fmt(q.bonus)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>

          <ResultRow
            label="超級全壘打獎金（四季皆達標）"
            value={result.homerun}
            note={result.homerun ? "已達成 15,000 元" : "尚未四季全數達標"}
          />
          <ResultRow label="季獎金＋全壘打獎金 合計（戰功總額）" value={result.baseTotal} strong />

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18, marginBottom: 10 }}>
            <Badge>增員加碼</Badge>
            <SectionLabel style={{ marginBottom: 0 }}>年度增員加碼獎金</SectionLabel>
          </div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <Th>增員</Th>
                <Th>報聘季</Th>
                <Th>基本積分</Th>
                <Th>有效定著積分</Th>
              </tr>
            </thead>
            <tbody>
              {result.recruitDetail.map((r) => (
                <tr key={r.id}>
                  <Td>{r.name}</Td>
                  <Td>第{r.reportQ}季</Td>
                  <Td>{r.basicPts}</Td>
                  <Td>{r.dedicationPts}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          <ResultRow label="增員積分合計" value={result.totalPoints} isPoints />
          <ResultRow
            label={`對應級距：${result.band.label}（個人獎金 × ${(1 + result.band.rate).toFixed(1)}）`}
            value={result.annualRecruitBonus}
            strong
          />

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18, marginBottom: 10 }}>
            <Badge>績效獎金</Badge>
            <SectionLabel style={{ marginBottom: 0 }}>第三、四季增員績效獎金</SectionLabel>
          </div>
          {result.q34Detail.length > 0 ? (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <Th>增員</Th>
                  <Th>季別</Th>
                  <Th>當季核實FYC</Th>
                  <Th>適用比例</Th>
                  <Th>績效獎金</Th>
                </tr>
              </thead>
              <tbody>
                {result.q34Detail.map((d, i) => (
                  <tr key={i}>
                    <Td>{d.name}</Td>
                    <Td>第{d.q}季</Td>
                    <Td>{fmt(d.fyc)}</Td>
                    <Td accent strong>
                      {d.rate * 100}%
                    </Td>
                    <Td accent strong>
                      {fmt(d.b)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ fontSize: 12, color: C.muted, padding: "6px 0" }}>
              無符合資格之第三、四季報聘增員（需 115 年 7~12 工作月報聘且當季核實FYC達 30,000）
            </div>
          )}
          <ResultRow label="第三、四季增員績效獎金合計" value={result.q34Bonus} strong />

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18, marginBottom: 10 }}>
            <Badge>獵鷹獎金</Badge>
            <SectionLabel style={{ marginBottom: 0 }}>獵鷹計畫獎金</SectionLabel>
          </div>
          {result.falconDetail.length > 0 ? (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <Th>增員</Th>
                  <Th>報聘季</Th>
                  <Th>獎金</Th>
                </tr>
              </thead>
              <tbody>
                {result.falconDetail.map((d, i) => (
                  <tr key={i}>
                    <Td>{d.name}</Td>
                    <Td>第{d.reportQ}季</Td>
                    <Td accent strong>
                      {fmt(10000)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ fontSize: 12, color: C.muted, padding: "6px 0" }}>
              無符合資格之獵鷹計畫新人（需 4~12 月報聘且6個月內差勤率達70%）
            </div>
          )}
          <ResultRow label="獵鷹計畫獎金合計" value={result.falconBonus} strong />
        </Card>

        {/* ---- 獎金加總明細（總表） ---- */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.line}`,
            borderRadius: 14,
            padding: "24px 26px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <h2
              style={{
                fontFamily: serif,
                fontSize: 17,
                fontWeight: 600,
                color: C.ink,
                margin: 0,
                letterSpacing: 0.5,
              }}
            >
              獎金加總明細
            </h2>
            <span style={{ fontSize: 11, color: C.muted, letterSpacing: 1 }}>
              SUMMARY
            </span>
          </div>

          <div>
            <LedgerRow label="季超級個人獎金＋全壘打獎金" value={result.baseTotal} />
            <LedgerRow label="年度增員加碼獎金" value={result.annualRecruitBonus} />
            <LedgerRow label="第三、四季增員績效獎金" value={result.q34Bonus} />
            <LedgerRow label="獵鷹計畫獎金" value={result.falconBonus} last />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginTop: 16,
              paddingTop: 16,
              borderTop: `2px solid ${C.ink}`,
            }}
          >
            <span
              style={{
                fontFamily: serif,
                fontSize: 16,
                fontWeight: 600,
                color: C.ink,
              }}
            >
              預估年度總獎金
            </span>
            <span
              style={{
                fontFamily: serif,
                fontSize: 30,
                fontWeight: 700,
                color: C.accent,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              NT$ {fmt(result.finalTotal)}
            </span>
          </div>
        </div>

        <p style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 16, lineHeight: 1.7 }}>
          ※ 本試算僅供內部參考，實際核發金額與資格認定以業務公告函（115富壽業企發字第108號）及正式核算結果為準。
        </p>
      </div>
    </div>
  );
}

function Card({ title, icon, children, accent }) {
  return (
    <div
      style={{
        background: accent ? C.accentTint : C.surface,
        border: accent ? `1px solid ${C.accent}` : `1px solid ${C.line}`,
        borderRadius: 14,
        padding: 18,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: C.accent,
          fontFamily: serif,
          fontSize: 15,
          fontWeight: 600,
          marginBottom: 14,
        }}
      >
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function QField({ label, value, onChange, disabled }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{label}</div>
      <input
        type="number"
        min={0}
        value={value === 0 ? "" : value}
        placeholder="0"
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle({
          width: "100%",
          opacity: disabled ? 0.4 : 1,
        })}
      />
    </div>
  );
}

function Badge({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 999,
        background: C.accent,
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1,
      }}
    >
      {children}
    </span>
  );
}

function SectionLabel({ children, style }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: C.ink,
        borderLeft: `3px solid ${C.accent}`,
        paddingLeft: 8,
        marginBottom: 10,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function ResultRow({ label, value, strong, note, isPoints }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 4px",
        borderBottom: `1px solid ${C.lineSoft}`,
        fontSize: strong ? 14 : 13,
        color: strong ? C.ink : C.body,
        fontWeight: strong ? 700 : 400,
      }}
    >
      <span>
        {label}
        {note && (
          <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>
            {note}
          </span>
        )}
      </span>
      <span style={{ color: strong ? C.accent : C.body, fontVariantNumeric: "tabular-nums" }}>
        {isPoints ? value : `NT$ ${fmt(value)}`}
      </span>
    </div>
  );
}

function LedgerRow({ label, value, last }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: last ? "none" : `1px solid ${C.lineSoft}`,
        fontSize: 13.5,
      }}
    >
      <span style={{ color: C.body }}>{label}</span>
      <span
        style={{
          color: C.ink,
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        NT$ {fmt(value)}
      </span>
    </div>
  );
}

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 12.5,
  marginBottom: 8,
};
const Th = ({ children }) => (
  <th
    style={{
      textAlign: "left",
      padding: "6px 8px",
      color: C.muted,
      fontWeight: 500,
      borderBottom: `1px solid ${C.line}`,
    }}
  >
    {children}
  </th>
);
const Td = ({ children, strong, accent }) => (
  <td
    style={{
      padding: "6px 8px",
      color: accent ? C.accent : strong ? C.ink : C.body,
      fontWeight: strong ? 700 : 400,
      borderBottom: `1px solid ${C.lineSoft}`,
      fontVariantNumeric: "tabular-nums",
    }}
  >
    {children}
  </td>
);

function inputStyle(extra) {
  return {
    background: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: 6,
    color: C.ink,
    padding: "7px 9px",
    fontSize: 13,
    outline: "none",
    fontFamily: sans,
    ...extra,
  };
}

const addBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  justifyContent: "center",
  width: "100%",
  padding: "9px",
  borderRadius: 8,
  border: `1px dashed ${C.accent}`,
  background: "transparent",
  color: C.accent,
  fontSize: 13,
  cursor: "pointer",
};
