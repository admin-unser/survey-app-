"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { StepIndicator, SURVEY_STEPS } from "@/components/survey/survey-steps";
import { PhotoUpload } from "@/components/survey/photo-upload";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import type {
  SurveyCase,
  SurveyForm,
  SurveyPhoto,
  RoomInfo,
  ExistingAcInfo,
  ElectricalInfo,
  PipingInfo,
  DrainInfo,
  OutdoorUnitInfo,
  WallInfo,
  AdditionalWork,
} from "@/types/database";

const DEFAULT_ROOM: RoomInfo = {
  room_name: "",
  floor_area: null,
  floor_number: null,
  ceiling_height: null,
};

const DEFAULT_EXISTING_AC: ExistingAcInfo = {
  has_existing: false,
  manufacturer: "",
  model_number: "",
  year_installed: "",
  condition: "",
  removal_required: false,
};

const DEFAULT_ELECTRICAL: ElectricalInfo = {
  power_type: "単相100V",
  breaker_capacity: "",
  dedicated_circuit: false,
  outlet_location: "",
  electrical_work_needed: false,
};

const DEFAULT_PIPING: PipingInfo = {
  piping_route: "",
  piping_length: "",
  reuse_existing: false,
  insulation_condition: "",
};

const DEFAULT_DRAIN: DrainInfo = {
  drain_route: "",
  slope_confirmed: false,
  drain_type: "",
};

const DEFAULT_OUTDOOR: OutdoorUnitInfo = {
  location: "",
  stand_required: false,
  stand_type: "",
  access_route: "",
  space_sufficient: true,
};

const DEFAULT_WALL: WallInfo = {
  wall_material: "",
  sleeve_exists: false,
  drilling_possible: true,
  wall_thickness: "",
};

const DEFAULT_ADDITIONAL: AdditionalWork = {
  cosmetic_cover: false,
  electrical_work: false,
  drain_pump: false,
  crane_required: false,
  scaffold_required: false,
  other: "",
};

export default function SurveyPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [surveyCase, setSurveyCase] = useState<SurveyCase | null>(null);
  const [formId, setFormId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set()
  );

  const [roomInfo, setRoomInfo] = useState<RoomInfo>(DEFAULT_ROOM);
  const [existingAc, setExistingAc] =
    useState<ExistingAcInfo>(DEFAULT_EXISTING_AC);
  const [electricalInfo, setElectricalInfo] =
    useState<ElectricalInfo>(DEFAULT_ELECTRICAL);
  const [pipingInfo, setPipingInfo] = useState<PipingInfo>(DEFAULT_PIPING);
  const [drainInfo, setDrainInfo] = useState<DrainInfo>(DEFAULT_DRAIN);
  const [outdoorUnit, setOutdoorUnit] =
    useState<OutdoorUnitInfo>(DEFAULT_OUTDOOR);
  const [wallInfo, setWallInfo] = useState<WallInfo>(DEFAULT_WALL);
  const [additionalWork, setAdditionalWork] =
    useState<AdditionalWork>(DEFAULT_ADDITIONAL);
  const [comments, setComments] = useState("");
  const [photos, setPhotos] = useState<SurveyPhoto[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      const { data: caseData } = await supabase
        .from("survey_cases")
        .select("*")
        .eq("id", caseId)
        .single();

      if (caseData) setSurveyCase(caseData as SurveyCase);

      let { data: formData } = await supabase
        .from("survey_forms")
        .select("*")
        .eq("case_id", caseId)
        .single();

      if (!formData) {
        const { data: newForm } = await supabase
          .from("survey_forms")
          .insert({ case_id: caseId })
          .select()
          .single();
        formData = newForm;
      }

      if (formData) {
        const form = formData as SurveyForm;
        setFormId(form.id);
        if (form.room_info && Object.keys(form.room_info).length)
          setRoomInfo({ ...DEFAULT_ROOM, ...form.room_info });
        if (form.existing_ac && Object.keys(form.existing_ac).length)
          setExistingAc({ ...DEFAULT_EXISTING_AC, ...form.existing_ac });
        if (form.electrical_info && Object.keys(form.electrical_info).length)
          setElectricalInfo({
            ...DEFAULT_ELECTRICAL,
            ...form.electrical_info,
          });
        if (form.piping_info && Object.keys(form.piping_info).length)
          setPipingInfo({ ...DEFAULT_PIPING, ...form.piping_info });
        if (form.drain_info && Object.keys(form.drain_info).length)
          setDrainInfo({ ...DEFAULT_DRAIN, ...form.drain_info });
        if (form.outdoor_unit && Object.keys(form.outdoor_unit).length)
          setOutdoorUnit({ ...DEFAULT_OUTDOOR, ...form.outdoor_unit });
        if (form.wall_info && Object.keys(form.wall_info).length)
          setWallInfo({ ...DEFAULT_WALL, ...form.wall_info });
        if (form.additional_work && Object.keys(form.additional_work).length)
          setAdditionalWork({
            ...DEFAULT_ADDITIONAL,
            ...form.additional_work,
          });
        if (form.comments) setComments(form.comments);

        const { data: photosData } = await supabase
          .from("survey_photos")
          .select("*")
          .eq("form_id", form.id)
          .order("sort_order");

        if (photosData) {
          const photosWithUrls = photosData.map((p: { storage_path: string; [key: string]: unknown }) => ({
            ...p,
            public_url: supabase.storage
              .from("survey-photos")
              .getPublicUrl(p.storage_path).data.publicUrl,
          })) as SurveyPhoto[];
          setPhotos(photosWithUrls);
        }
      }

      setIsLoading(false);
    };
    fetchData();
  }, [caseId]);

  const saveForm = useCallback(async () => {
    if (!formId) return;
    setIsSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("survey_forms")
      .update({
        room_info: roomInfo,
        existing_ac: existingAc,
        electrical_info: electricalInfo,
        piping_info: pipingInfo,
        drain_info: drainInfo,
        outdoor_unit: outdoorUnit,
        wall_info: wallInfo,
        additional_work: additionalWork,
        comments,
      })
      .eq("id", formId);

    setIsSaving(false);
    if (error) {
      toast.error("保存に失敗しました");
    } else {
      toast.success("保存しました");
    }
  }, [
    formId,
    roomInfo,
    existingAc,
    electricalInfo,
    pipingInfo,
    drainInfo,
    outdoorUnit,
    wallInfo,
    additionalWork,
    comments,
  ]);

  const handleSubmit = async () => {
    if (!formId) return;
    setIsSubmitting(true);

    const supabase = createClient();

    const [formResult, caseResult] = await Promise.all([
      supabase
        .from("survey_forms")
        .update({
          room_info: roomInfo,
          existing_ac: existingAc,
          electrical_info: electricalInfo,
          piping_info: pipingInfo,
          drain_info: drainInfo,
          outdoor_unit: outdoorUnit,
          wall_info: wallInfo,
          additional_work: additionalWork,
          comments,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", formId),
      supabase
        .from("survey_cases")
        .update({ status: "completed" })
        .eq("id", caseId),
    ]);

    setIsSubmitting(false);

    if (formResult.error) {
      toast.error("送信に失敗しました", {
        description: formResult.error.message,
      });
      return;
    }
    if (caseResult.error) {
      toast.error("ステータス更新に失敗しました", {
        description: caseResult.error.message,
      });
      return;
    }

    toast.success("調査フォームを送信しました");
    router.push(`/cases/${caseId}`);
  };

  const goNext = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setCurrentStep((prev) => Math.min(prev + 1, SURVEY_STEPS.length));
  };

  const goPrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/cases/${caseId}`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">
            調査フォーム
          </h1>
          <p className="text-sm text-muted-foreground">
            {surveyCase?.case_number} - {surveyCase?.client_name}
          </p>
        </div>
      </div>

      <StepIndicator
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={setCurrentStep}
      />

      <div className="min-h-[400px]">
        {/* Step 1: Room Info */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>部屋情報</CardTitle>
              <CardDescription>エアコンを設置する部屋の基本情報</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>部屋名 / 設置場所</Label>
                <Input
                  value={roomInfo.room_name}
                  onChange={(e) =>
                    setRoomInfo({ ...roomInfo, room_name: e.target.value })
                  }
                  placeholder="例: リビング、寝室、事務所"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>床面積 (畳)</Label>
                  <Input
                    type="number"
                    value={roomInfo.floor_area ?? ""}
                    onChange={(e) =>
                      setRoomInfo({
                        ...roomInfo,
                        floor_area: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="例: 12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>階数</Label>
                  <Input
                    type="number"
                    value={roomInfo.floor_number ?? ""}
                    onChange={(e) =>
                      setRoomInfo({
                        ...roomInfo,
                        floor_number: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="例: 2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>天井高 (m)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={roomInfo.ceiling_height ?? ""}
                    onChange={(e) =>
                      setRoomInfo({
                        ...roomInfo,
                        ceiling_height: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    placeholder="例: 2.4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Existing AC */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>既存エアコン情報</CardTitle>
              <CardDescription>現在設置されているエアコンの情報</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={existingAc.has_existing}
                  onCheckedChange={(checked) =>
                    setExistingAc({ ...existingAc, has_existing: checked })
                  }
                />
                <Label>既存エアコンあり</Label>
              </div>
              {existingAc.has_existing && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>メーカー</Label>
                      <Select
                        value={existingAc.manufacturer}
                        onValueChange={(v) =>
                          setExistingAc({ ...existingAc, manufacturer: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "ダイキン",
                            "パナソニック",
                            "三菱電機",
                            "日立",
                            "東芝",
                            "富士通ゼネラル",
                            "シャープ",
                            "コロナ",
                            "その他",
                          ].map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>型番</Label>
                      <Input
                        value={existingAc.model_number}
                        onChange={(e) =>
                          setExistingAc({
                            ...existingAc,
                            model_number: e.target.value,
                          })
                        }
                        placeholder="例: RAS-X40L2"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>設置年</Label>
                      <Input
                        value={existingAc.year_installed}
                        onChange={(e) =>
                          setExistingAc({
                            ...existingAc,
                            year_installed: e.target.value,
                          })
                        }
                        placeholder="例: 2015"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>状態</Label>
                      <Select
                        value={existingAc.condition}
                        onValueChange={(v) =>
                          setExistingAc({ ...existingAc, condition: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="良好">良好</SelectItem>
                          <SelectItem value="普通">普通</SelectItem>
                          <SelectItem value="不良">不良</SelectItem>
                          <SelectItem value="故障">故障</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={existingAc.removal_required}
                      onCheckedChange={(checked) =>
                        setExistingAc({
                          ...existingAc,
                          removal_required: checked,
                        })
                      }
                    />
                    <Label>撤去が必要</Label>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Electrical */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>電気系統</CardTitle>
              <CardDescription>電源とブレーカーの情報</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>電源種別</Label>
                <RadioGroup
                  value={electricalInfo.power_type}
                  onValueChange={(v) =>
                    setElectricalInfo({ ...electricalInfo, power_type: v })
                  }
                  className="flex gap-4"
                >
                  {["単相100V", "単相200V"].map((v) => (
                    <div key={v} className="flex items-center gap-2">
                      <RadioGroupItem value={v} id={`power-${v}`} />
                      <Label htmlFor={`power-${v}`}>{v}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ブレーカー容量</Label>
                  <Input
                    value={electricalInfo.breaker_capacity}
                    onChange={(e) =>
                      setElectricalInfo({
                        ...electricalInfo,
                        breaker_capacity: e.target.value,
                      })
                    }
                    placeholder="例: 30A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>コンセント位置</Label>
                  <Input
                    value={electricalInfo.outlet_location}
                    onChange={(e) =>
                      setElectricalInfo({
                        ...electricalInfo,
                        outlet_location: e.target.value,
                      })
                    }
                    placeholder="例: 室内機上部右側"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={electricalInfo.dedicated_circuit}
                  onCheckedChange={(checked) =>
                    setElectricalInfo({
                      ...electricalInfo,
                      dedicated_circuit: checked,
                    })
                  }
                />
                <Label>専用回路あり</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={electricalInfo.electrical_work_needed}
                  onCheckedChange={(checked) =>
                    setElectricalInfo({
                      ...electricalInfo,
                      electrical_work_needed: checked,
                    })
                  }
                />
                <Label>電気工事が必要</Label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Piping & Drain */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>配管・ドレン</CardTitle>
              <CardDescription>配管ルートと排水経路の情報</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-sm">配管情報</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>配管ルート</Label>
                    <Select
                      value={pipingInfo.piping_route}
                      onValueChange={(v) =>
                        setPipingInfo({ ...pipingInfo, piping_route: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="壁貫通・直出し">壁貫通・直出し</SelectItem>
                        <SelectItem value="壁貫通・立ち下げ">壁貫通・立ち下げ</SelectItem>
                        <SelectItem value="天井裏経由">天井裏経由</SelectItem>
                        <SelectItem value="床下経由">床下経由</SelectItem>
                        <SelectItem value="その他">その他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>配管長 (推定)</Label>
                    <Input
                      value={pipingInfo.piping_length}
                      onChange={(e) =>
                        setPipingInfo({
                          ...pipingInfo,
                          piping_length: e.target.value,
                        })
                      }
                      placeholder="例: 約4m"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={pipingInfo.reuse_existing}
                    onCheckedChange={(checked) =>
                      setPipingInfo({ ...pipingInfo, reuse_existing: checked })
                    }
                  />
                  <Label>既設配管の再利用可能</Label>
                </div>
                <div className="space-y-2">
                  <Label>保温材の状態</Label>
                  <Input
                    value={pipingInfo.insulation_condition}
                    onChange={(e) =>
                      setPipingInfo({
                        ...pipingInfo,
                        insulation_condition: e.target.value,
                      })
                    }
                    placeholder="例: 劣化あり、交換推奨"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-sm">ドレン排水</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>排水経路</Label>
                    <Input
                      value={drainInfo.drain_route}
                      onChange={(e) =>
                        setDrainInfo({
                          ...drainInfo,
                          drain_route: e.target.value,
                        })
                      }
                      placeholder="例: 外壁沿い排水"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ドレン種類</Label>
                    <Select
                      value={drainInfo.drain_type}
                      onValueChange={(v) =>
                        setDrainInfo({ ...drainInfo, drain_type: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="自然排水">自然排水</SelectItem>
                        <SelectItem value="ドレンアップ">ドレンアップ（ポンプ）</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={drainInfo.slope_confirmed}
                    onCheckedChange={(checked) =>
                      setDrainInfo({ ...drainInfo, slope_confirmed: checked })
                    }
                  />
                  <Label>勾配確認済み</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Outdoor Unit */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>室外機</CardTitle>
              <CardDescription>室外機の設置場所の情報</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>設置場所</Label>
                <Select
                  value={outdoorUnit.location}
                  onValueChange={(v) =>
                    setOutdoorUnit({ ...outdoorUnit, location: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="地面置き">地面置き</SelectItem>
                    <SelectItem value="ベランダ置き">ベランダ置き</SelectItem>
                    <SelectItem value="壁面取付">壁面取付</SelectItem>
                    <SelectItem value="屋上設置">屋上設置</SelectItem>
                    <SelectItem value="天吊り">天吊り</SelectItem>
                    <SelectItem value="二段置き">二段置き</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={outdoorUnit.stand_required}
                  onCheckedChange={(checked) =>
                    setOutdoorUnit({ ...outdoorUnit, stand_required: checked })
                  }
                />
                <Label>架台が必要</Label>
              </div>
              {outdoorUnit.stand_required && (
                <div className="space-y-2">
                  <Label>架台の種類</Label>
                  <Input
                    value={outdoorUnit.stand_type}
                    onChange={(e) =>
                      setOutdoorUnit({
                        ...outdoorUnit,
                        stand_type: e.target.value,
                      })
                    }
                    placeholder="例: 壁面金具、二段置き架台"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>搬入経路</Label>
                <Input
                  value={outdoorUnit.access_route}
                  onChange={(e) =>
                    setOutdoorUnit({
                      ...outdoorUnit,
                      access_route: e.target.value,
                    })
                  }
                  placeholder="例: 正面玄関 → 階段 → ベランダ"
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={outdoorUnit.space_sufficient}
                  onCheckedChange={(checked) =>
                    setOutdoorUnit({
                      ...outdoorUnit,
                      space_sufficient: checked,
                    })
                  }
                />
                <Label>設置スペース十分</Label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Wall */}
        {currentStep === 6 && (
          <Card>
            <CardHeader>
              <CardTitle>壁面・スリーブ</CardTitle>
              <CardDescription>壁の材質とスリーブの状態</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>壁材質</Label>
                <Select
                  value={wallInfo.wall_material}
                  onValueChange={(v) =>
                    setWallInfo({ ...wallInfo, wall_material: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="木造">木造</SelectItem>
                    <SelectItem value="コンクリート">コンクリート</SelectItem>
                    <SelectItem value="ALC">ALC</SelectItem>
                    <SelectItem value="鉄骨">鉄骨</SelectItem>
                    <SelectItem value="タイル">タイル</SelectItem>
                    <SelectItem value="その他">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>壁の厚さ (推定)</Label>
                <Input
                  value={wallInfo.wall_thickness}
                  onChange={(e) =>
                    setWallInfo({ ...wallInfo, wall_thickness: e.target.value })
                  }
                  placeholder="例: 約15cm"
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={wallInfo.sleeve_exists}
                  onCheckedChange={(checked) =>
                    setWallInfo({ ...wallInfo, sleeve_exists: checked })
                  }
                />
                <Label>配管スリーブあり</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={wallInfo.drilling_possible}
                  onCheckedChange={(checked) =>
                    setWallInfo({ ...wallInfo, drilling_possible: checked })
                  }
                />
                <Label>穴あけ可能</Label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 7: Additional Work */}
        {currentStep === 7 && (
          <Card>
            <CardHeader>
              <CardTitle>追加工事</CardTitle>
              <CardDescription>必要な追加作業をチェック</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  key: "cosmetic_cover" as const,
                  label: "化粧カバー取付",
                },
                {
                  key: "electrical_work" as const,
                  label: "電源工事（専用回路増設等）",
                },
                {
                  key: "drain_pump" as const,
                  label: "ドレンアップポンプ取付",
                },
                { key: "crane_required" as const, label: "クレーン使用" },
                { key: "scaffold_required" as const, label: "足場設置" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <Checkbox
                    checked={additionalWork[key]}
                    onCheckedChange={(checked) =>
                      setAdditionalWork({
                        ...additionalWork,
                        [key]: !!checked,
                      })
                    }
                  />
                  <Label>{label}</Label>
                </div>
              ))}
              <div className="space-y-2">
                <Label>その他の追加工事</Label>
                <Textarea
                  value={additionalWork.other}
                  onChange={(e) =>
                    setAdditionalWork({
                      ...additionalWork,
                      other: e.target.value,
                    })
                  }
                  placeholder="その他の追加工事や特記事項があれば記入してください"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 8: Photos */}
        {currentStep === 8 && formId && (
          <PhotoUpload
            formId={formId}
            photos={photos}
            onPhotosChange={setPhotos}
          />
        )}

        {/* Step 9: Comments & Submit */}
        {currentStep === 9 && (
          <Card>
            <CardHeader>
              <CardTitle>コメント・確認</CardTitle>
              <CardDescription>
                最終コメントを入力して調査を完了してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>調査コメント</Label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="調査全体のコメント、注意事項、提案などを入力してください"
                  rows={6}
                />
              </div>

              <div className="rounded-lg border bg-primary/5 p-4">
                <h3 className="font-medium text-sm text-foreground mb-2">
                  調査概要
                </h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-primary">部屋</dt>
                  <dd>{roomInfo.room_name || "未入力"}</dd>
                  <dt className="text-primary">既存エアコン</dt>
                  <dd>{existingAc.has_existing ? "あり" : "なし"}</dd>
                  <dt className="text-primary">電源</dt>
                  <dd>{electricalInfo.power_type}</dd>
                  <dt className="text-primary">配管</dt>
                  <dd>{pipingInfo.piping_route || "未入力"}</dd>
                  <dt className="text-primary">室外機</dt>
                  <dd>{outdoorUnit.location || "未入力"}</dd>
                  <dt className="text-primary">写真</dt>
                  <dd>{photos.length}枚</dd>
                </dl>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button variant="outline" onClick={goPrev}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              前へ
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveForm} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            保存
          </Button>
          {currentStep < SURVEY_STEPS.length ? (
            <Button onClick={goNext}>
              次へ
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              調査完了・送信
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
