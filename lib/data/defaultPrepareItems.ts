import type { PrepareItem, PrepareCategory } from "@/lib/hooks/useSupabasePrepare";

const MEMBER_IDS = ["bryan", "changyao", "mango", "jackson"];

function makeRows(
  category: PrepareCategory,
  texts: string[],
  tripId: string,
): PrepareItem[] {
  const now = new Date().toISOString();
  const rows: PrepareItem[] = [];
  texts.forEach((text, ti) => {
    MEMBER_IDS.forEach((memberId, mi) => {
      const slug = text.replace(/[^\w]/g, "").toLowerCase().slice(0, 18);
      rows.push({
        id:         `ptpl-${category}-${ti}-${mi}-${slug}`,
        trip_id:    tripId,
        category,
        text,
        done:       false,
        assignees:  [memberId],
        created_by: "template",
        created_at: now,
        updated_at: now,
      });
    });
  });
  return rows;
}

export function getDefaultPrepareItems(tripId: string): PrepareItem[] {
  return [
    ...makeRows("todo", [
      // 证件 Documents
      "🛂 申请 K-ETA 电子旅行许可",
      "📗 护照 Passport 有效期检查（6个月以上）",
      // 金融 Finance
      "💴 换韩元现钱 KRW",
      "🛡️ 买 Travel Insurance 旅游保险",
      // 通讯 Connectivity
      "📡 开通 Data Roaming 数据漫游",
      "📱 下载 Naver Map 导航 App",
      "🚕 下载 Kakao T 打车 App（首选！）",
      // 机场 Airport
      "✈️ 机场 Check-in 打印 Boarding Pass",
    ], tripId),

    ...makeRows("packing", [
      // 电子 Electronics
      "🔋 Powerbank 充电宝",
      "🔌 转插头（韩国 C 型 两圆脚）",
      // 日常 Daily
      "🌂 雨衣 / 折叠伞",
      "🧴 洗漱用品",
      "💊 常备药物",
      "👕 换洗衣物（5天份）",
      "👟 舒适走路鞋",
      "💳 信用卡 / 备用现金",
    ], tripId),
  ];
}
