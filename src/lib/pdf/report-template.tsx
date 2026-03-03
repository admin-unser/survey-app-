import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import type {
  SurveyCase,
  SurveyForm,
  SurveyPhoto,
} from "@/types/database";
import { PHOTO_CATEGORY_LABELS, PhotoCategory } from "@/types/database";

Font.register({
  family: "NotoSansJP",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.1/files/noto-sans-jp-japanese-400-normal.woff",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.1/files/noto-sans-jp-japanese-700-normal.woff",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    fontSize: 9,
    padding: 40,
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#111827",
  },
  headerInfo: {
    textAlign: "right",
  },
  headerInfoText: {
    fontSize: 8,
    color: "#666",
    marginBottom: 2,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#2563eb",
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#dbeafe",
  },
  table: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableLabel: {
    width: "35%",
    padding: 6,
    backgroundColor: "#f8fafc",
    fontWeight: 700,
    fontSize: 8,
  },
  tableValue: {
    width: "65%",
    padding: 6,
    fontSize: 8,
  },
  twoColRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  twoColLabel: {
    width: "17.5%",
    padding: 6,
    backgroundColor: "#f8fafc",
    fontWeight: 700,
    fontSize: 8,
  },
  twoColValue: {
    width: "32.5%",
    padding: 6,
    fontSize: 8,
  },
  commentBox: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 10,
    borderRadius: 4,
    minHeight: 60,
    fontSize: 9,
    lineHeight: 1.6,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
    fontSize: 8,
  },
  checkBox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: "#9ca3af",
    marginRight: 6,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 2,
  },
  checked: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  checkMark: {
    color: "#fff",
    fontSize: 7,
    fontWeight: 700,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  photoItem: {
    width: "48%",
    marginBottom: 8,
  },
  photoImage: {
    width: "100%",
    height: 150,
    objectFit: "cover",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  photoCaption: {
    fontSize: 7,
    color: "#666",
    marginTop: 3,
  },
  photoCategoryTitle: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 6,
    marginTop: 4,
    color: "#374151",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    fontSize: 7,
    color: "#9ca3af",
  },
  signatureSection: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 30,
  },
  signatureBox: {
    width: 140,
    alignItems: "center",
  },
  signatureLine: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    marginBottom: 4,
    height: 30,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#666",
  },
});

interface ReportProps {
  surveyCase: SurveyCase;
  surveyForm: SurveyForm;
  photos: SurveyPhoto[];
  generatedDate: string;
}

function TableRow({
  label,
  value,
}: {
  label: string;
  value: string | undefined | null;
}) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.tableLabel}>{label}</Text>
      <Text style={styles.tableValue}>{value || "-"}</Text>
    </View>
  );
}

function TwoColRow({
  label1,
  value1,
  label2,
  value2,
}: {
  label1: string;
  value1: string;
  label2: string;
  value2: string;
}) {
  return (
    <View style={styles.twoColRow}>
      <Text style={styles.twoColLabel}>{label1}</Text>
      <Text style={styles.twoColValue}>{value1 || "-"}</Text>
      <Text style={styles.twoColLabel}>{label2}</Text>
      <Text style={styles.twoColValue}>{value2 || "-"}</Text>
    </View>
  );
}

function CheckItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <View style={styles.checkItem}>
      <View style={[styles.checkBox, checked ? styles.checked : {}]}>
        {checked && <Text style={styles.checkMark}>✓</Text>}
      </View>
      <Text>{label}</Text>
    </View>
  );
}

export function ReportDocument({
  surveyCase,
  surveyForm,
  photos,
  generatedDate,
}: ReportProps) {
  const room = surveyForm.room_info;
  const ac = surveyForm.existing_ac;
  const elec = surveyForm.electrical_info;
  const piping = surveyForm.piping_info;
  const drain = surveyForm.drain_info;
  const outdoor = surveyForm.outdoor_unit;
  const wall = surveyForm.wall_info;
  const additional = surveyForm.additional_work;

  const categorizedPhotos = Object.entries(PHOTO_CATEGORY_LABELS)
    .map(([cat, label]) => ({
      category: cat as PhotoCategory,
      label,
      photos: photos.filter((p) => p.category === cat),
    }))
    .filter((g) => g.photos.length > 0);

  return (
    <Document>
      {/* Page 1: Survey Details */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>エアコン工事 現場調査報告書</Text>
            <Text style={{ fontSize: 8, color: "#4b5563", marginTop: 2 }}>
              BroB 空調工事 / Field Survey Report
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerInfoText}>
              案件番号: {surveyCase.case_number}
            </Text>
            <Text style={styles.headerInfoText}>
              調査日:{" "}
              {surveyCase.scheduled_date || "-"}
            </Text>
            <Text style={styles.headerInfoText}>
              報告日: {generatedDate}
            </Text>
          </View>
        </View>

        {/* Client & Site Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>お客様・現場情報</Text>
          <View style={styles.table}>
            <TableRow label="お客様名" value={surveyCase.client_name} />
            <TwoColRow
              label1="ご連絡先"
              value1={surveyCase.client_phone || "-"}
              label2="メール"
              value2={surveyCase.client_email || "-"}
            />
            <TableRow label="現場住所" value={surveyCase.address} />
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>調査サマリー</Text>
          <View style={styles.commentBox}>
            <Text>
              {surveyCase.notes && surveyCase.notes.trim().length > 0
                ? surveyCase.notes
                : surveyForm.comments && surveyForm.comments.trim().length > 0
                ? surveyForm.comments
                : "本件に関するサマリーは作業報告書本文をご参照ください。"}
            </Text>
          </View>
        </View>

        {/* Room Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>設置場所情報</Text>
          <View style={styles.table}>
            <TableRow label="部屋名" value={room.room_name} />
            <TwoColRow
              label1="床面積"
              value1={room.floor_area ? `${room.floor_area}畳` : "-"}
              label2="階数"
              value2={room.floor_number ? `${room.floor_number}階` : "-"}
            />
            <TableRow
              label="天井高"
              value={room.ceiling_height ? `${room.ceiling_height}m` : "-"}
            />
          </View>
        </View>

        {/* Existing AC */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>既存エアコン</Text>
          <View style={styles.table}>
            <TableRow
              label="既存エアコン"
              value={ac.has_existing ? "あり" : "なし"}
            />
            {ac.has_existing && (
              <>
                <TwoColRow
                  label1="メーカー"
                  value1={ac.manufacturer}
                  label2="型番"
                  value2={ac.model_number}
                />
                <TwoColRow
                  label1="設置年"
                  value1={ac.year_installed}
                  label2="状態"
                  value2={ac.condition}
                />
                <TableRow
                  label="撤去要否"
                  value={ac.removal_required ? "要" : "不要"}
                />
              </>
            )}
          </View>
        </View>

        {/* Electrical */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>電気系統</Text>
          <View style={styles.table}>
            <TwoColRow
              label1="電源種別"
              value1={elec.power_type}
              label2="ブレーカー"
              value2={elec.breaker_capacity}
            />
            <TwoColRow
              label1="専用回路"
              value1={elec.dedicated_circuit ? "あり" : "なし"}
              label2="コンセント"
              value2={elec.outlet_location}
            />
            <TableRow
              label="電気工事"
              value={elec.electrical_work_needed ? "必要" : "不要"}
            />
          </View>
        </View>

        {/* Piping & Drain */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>配管・ドレン</Text>
          <View style={styles.table}>
            <TwoColRow
              label1="配管ルート"
              value1={piping.piping_route}
              label2="配管長"
              value2={piping.piping_length}
            />
            <TwoColRow
              label1="既設再利用"
              value1={piping.reuse_existing ? "可能" : "不可"}
              label2="保温材"
              value2={piping.insulation_condition}
            />
            <TwoColRow
              label1="排水経路"
              value1={drain.drain_route}
              label2="ドレン種類"
              value2={drain.drain_type}
            />
            <TableRow
              label="勾配確認"
              value={drain.slope_confirmed ? "確認済み" : "未確認"}
            />
          </View>
        </View>

        {/* Outdoor Unit */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>室外機</Text>
          <View style={styles.table}>
            <TwoColRow
              label1="設置場所"
              value1={outdoor.location}
              label2="架台"
              value2={
                outdoor.stand_required
                  ? `要 (${outdoor.stand_type})`
                  : "不要"
              }
            />
            <TwoColRow
              label1="搬入経路"
              value1={outdoor.access_route}
              label2="スペース"
              value2={outdoor.space_sufficient ? "十分" : "要確認"}
            />
          </View>
        </View>

        {/* Wall */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>壁面・スリーブ</Text>
          <View style={styles.table}>
            <TwoColRow
              label1="壁材質"
              value1={wall.wall_material}
              label2="壁厚"
              value2={wall.wall_thickness}
            />
            <TwoColRow
              label1="スリーブ"
              value1={wall.sleeve_exists ? "あり" : "なし"}
              label2="穴あけ"
              value2={wall.drilling_possible ? "可能" : "不可"}
            />
          </View>
        </View>

        {/* Additional Work */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>追加工事</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
            <CheckItem label="化粧カバー" checked={additional.cosmetic_cover} />
            <CheckItem label="電源工事" checked={additional.electrical_work} />
            <CheckItem
              label="ドレンポンプ"
              checked={additional.drain_pump}
            />
            <CheckItem label="クレーン" checked={additional.crane_required} />
            <CheckItem label="足場設置" checked={additional.scaffold_required} />
          </View>
          {additional.other && (
            <Text style={{ marginTop: 4, fontSize: 8 }}>
              その他: {additional.other}
            </Text>
          )}
        </View>

        {/* Comments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>現場所見・特記事項</Text>
          <View style={styles.commentBox}>
            <Text>{surveyForm.comments || "コメントなし"}</Text>
          </View>
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>調査担当者</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>確認者</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>現調報告 - 現場調査管理システム</Text>
          <Text>Page 1</Text>
        </View>
      </Page>

      {/* Page 2+: Photos */}
      {categorizedPhotos.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>調査写真・現場状況</Text>
            <View style={styles.headerInfo}>
              <Text style={styles.headerInfoText}>
                案件番号: {surveyCase.case_number}
              </Text>
              <Text style={styles.headerInfoText}>
                写真枚数: {photos.length}枚
              </Text>
            </View>
          </View>

          {categorizedPhotos.map((group) => (
            <View key={group.category} style={styles.section}>
              <Text style={styles.photoCategoryTitle}>
                {group.label} ({group.photos.length}枚)
              </Text>
              <View style={styles.photoGrid}>
                {group.photos.map((photo) => (
                  <View key={photo.id} style={styles.photoItem}>
                    {photo.public_url && (
                      <Image src={photo.public_url} style={styles.photoImage} />
                    )}
                    {photo.caption && (
                      <Text style={styles.photoCaption}>{photo.caption}</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.footer}>
            <Text>現調報告 - 現場調査管理システム</Text>
            <Text>Page 2</Text>
          </View>
        </Page>
      )}
    </Document>
  );
}
