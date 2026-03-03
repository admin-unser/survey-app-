export type UserRole = "admin" | "field_worker";

export type CaseStatus =
  | "pending"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "reported";

export type PhotoCategory =
  | "room"
  | "existing_ac"
  | "electrical_panel"
  | "outdoor_location"
  | "piping_route"
  | "wall"
  | "other";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface SurveyCase {
  id: string;
  case_number: string;
  client_name: string;
  client_contact_name?: string | null;
  client_phone: string | null;
  client_email: string | null;
  address: string;
  work_type?: string | null;
  latitude: number | null;
  longitude: number | null;
  scheduled_date: string | null;
  scheduled_time_start: string | null;
  scheduled_time_end: string | null;
  assigned_to: string | null;
  status: CaseStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  // Joined fields
  assigned_profile?: Profile;
}

export interface RoomInfo {
  room_name: string;
  floor_area: number | null;
  floor_number: number | null;
  ceiling_height: number | null;
}

export interface ExistingAcInfo {
  has_existing: boolean;
  manufacturer: string;
  model_number: string;
  year_installed: string;
  condition: string;
  removal_required: boolean;
}

export interface ElectricalInfo {
  power_type: string;
  breaker_capacity: string;
  dedicated_circuit: boolean;
  outlet_location: string;
  electrical_work_needed: boolean;
}

export interface PipingInfo {
  piping_route: string;
  piping_length: string;
  reuse_existing: boolean;
  insulation_condition: string;
}

export interface DrainInfo {
  drain_route: string;
  slope_confirmed: boolean;
  drain_type: string;
}

export interface OutdoorUnitInfo {
  location: string;
  stand_required: boolean;
  stand_type: string;
  access_route: string;
  space_sufficient: boolean;
}

export interface WallInfo {
  wall_material: string;
  sleeve_exists: boolean;
  drilling_possible: boolean;
  wall_thickness: string;
}

export interface AdditionalWork {
  cosmetic_cover: boolean;
  electrical_work: boolean;
  drain_pump: boolean;
  crane_required: boolean;
  scaffold_required: boolean;
  other: string;
}

export interface SurveyForm {
  id: string;
  case_id: string;
  room_info: RoomInfo;
  existing_ac: ExistingAcInfo;
  electrical_info: ElectricalInfo;
  piping_info: PipingInfo;
  drain_info: DrainInfo;
  outdoor_unit: OutdoorUnitInfo;
  wall_info: WallInfo;
  additional_work: AdditionalWork;
  comments: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SurveyPhoto {
  id: string;
  form_id: string;
  storage_path: string;
  thumbnail_path: string | null;
  category: PhotoCategory;
  caption: string;
  sort_order: number;
  created_at: string;
  public_url?: string;
}

export interface Report {
  id: string;
  case_id: string;
  pdf_storage_path: string;
  version: number;
  generated_by: string;
  generated_at: string;
  public_url?: string;
}

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  pending: "未対応",
  scheduled: "予定済み",
  in_progress: "調査中",
  completed: "調査完了",
  reported: "報告済み",
};

export const CASE_STATUS_COLORS: Record<CaseStatus, string> = {
  pending: "bg-gray-100 text-gray-800",
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  reported: "bg-purple-100 text-purple-800",
};

export const PHOTO_CATEGORY_LABELS: Record<PhotoCategory, string> = {
  room: "室内全体",
  existing_ac: "既存エアコン",
  electrical_panel: "分電盤",
  outdoor_location: "室外機設置場所",
  piping_route: "配管ルート",
  wall: "壁面・スリーブ",
  other: "その他",
};
