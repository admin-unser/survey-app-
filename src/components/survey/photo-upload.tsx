"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Camera, Upload, X, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { SurveyPhoto, PhotoCategory } from "@/types/database";
import { PHOTO_CATEGORY_LABELS } from "@/types/database";

interface PhotoUploadProps {
  formId: string;
  photos: SurveyPhoto[];
  onPhotosChange: (photos: SurveyPhoto[]) => void;
}

export function PhotoUpload({
  formId,
  photos,
  onPhotosChange,
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<PhotoCategory>("room");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const uploadPhoto = useCallback(
    async (file: File, category: PhotoCategory) => {
      const supabase = createClient();

      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });

      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${formId}/${category}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("survey-photos")
        .upload(fileName, compressed, { contentType: compressed.type });

      if (uploadError) throw new Error(uploadError.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from("survey-photos").getPublicUrl(fileName);

      const { data: photoRecord, error: dbError } = await supabase
        .from("survey_photos")
        .insert({
          form_id: formId,
          storage_path: fileName,
          category,
          caption: "",
          sort_order: photos.length,
        })
        .select()
        .single();

      if (dbError) throw new Error(dbError.message);

      return { ...photoRecord, public_url: publicUrl } as SurveyPhoto;
    },
    [formId, photos.length]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newPhotos: SurveyPhoto[] = [];

    try {
      for (const file of Array.from(files)) {
        const photo = await uploadPhoto(file, selectedCategory);
        newPhotos.push(photo);
      }
      onPhotosChange([...photos, ...newPhotos]);
      toast.success(`${newPhotos.length}枚の写真をアップロードしました`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("写真のアップロードに失敗しました");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async (photo: SurveyPhoto) => {
    const supabase = createClient();

    try {
      await supabase.storage
        .from("survey-photos")
        .remove([photo.storage_path]);
      await supabase.from("survey_photos").delete().eq("id", photo.id);

      onPhotosChange(photos.filter((p) => p.id !== photo.id));
      toast.success("写真を削除しました");
    } catch {
      toast.error("写真の削除に失敗しました");
    }
  };

  const handleCaptionChange = async (photoId: string, caption: string) => {
    const supabase = createClient();
    await supabase
      .from("survey_photos")
      .update({ caption })
      .eq("id", photoId);

    onPhotosChange(
      photos.map((p) => (p.id === photoId ? { ...p, caption } : p))
    );
  };

  const getPublicUrl = (path: string) => {
    const supabase = createClient();
    return supabase.storage.from("survey-photos").getPublicUrl(path).data
      .publicUrl;
  };

  const categorizedPhotos = Object.entries(PHOTO_CATEGORY_LABELS).map(
    ([cat, label]) => ({
      category: cat as PhotoCategory,
      label,
      photos: photos.filter((p) => p.category === cat),
    })
  );

  return (
    <div className="space-y-6">
      {/* Upload controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">写真を追加</CardTitle>
          <CardDescription>
            カテゴリを選択して写真を撮影またはアップロードしてください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>カテゴリ</Label>
            <Select
              value={selectedCategory}
              onValueChange={(v) => setSelectedCategory(v as PhotoCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PHOTO_CATEGORY_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Camera className="mr-2 h-4 w-4" />
              )}
              撮影
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              ファイル選択
            </Button>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Photo grid by category */}
      {categorizedPhotos.map(
        ({ category, label, photos: catPhotos }) =>
          catPhotos.length > 0 && (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                {label}
                <span className="text-muted-foreground font-normal">
                  ({catPhotos.length}枚)
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {catPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative overflow-hidden rounded-lg border bg-muted"
                  >
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={photo.public_url || getPublicUrl(photo.storage_path)}
                        alt={photo.caption || label}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photo)}
                        className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="p-2">
                      <Input
                        placeholder="キャプション..."
                        value={photo.caption}
                        onChange={(e) =>
                          handleCaptionChange(photo.id, e.target.value)
                        }
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
      )}

      {photos.length === 0 && (
        <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
          まだ写真が追加されていません
        </div>
      )}
    </div>
  );
}
