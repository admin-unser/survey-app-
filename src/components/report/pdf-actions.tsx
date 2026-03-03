"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Download, Eye, FileText, Loader2, Mail } from "lucide-react";
import type {
  SurveyCase,
  SurveyForm,
  SurveyPhoto,
} from "@/types/database";
import { ReportDocument } from "@/lib/pdf/report-template";

interface PdfActionsProps {
  surveyCase: SurveyCase;
  surveyForm: SurveyForm;
  photos: SurveyPhoto[];
  generatedDate: string;
  onSaveBlob: (blob: Blob) => Promise<void>;
  isGenerating: boolean;
}

export function PdfActions({
  surveyCase,
  surveyForm,
  photos,
  generatedDate,
  onSaveBlob,
  isGenerating,
}: PdfActionsProps) {
  const [isRendering, setIsRendering] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const generateBlob = async () => {
    setIsRendering(true);
    try {
      const doc = (
        <ReportDocument
          surveyCase={surveyCase}
          surveyForm={surveyForm}
          photos={photos}
          generatedDate={generatedDate}
        />
      );
      const blob = await pdf(doc).toBlob();
      return blob;
    } finally {
      setIsRendering(false);
    }
  };

  const handlePreview = async () => {
    const blob = await generateBlob();
    if (blob) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    }
  };

  const handleDownload = async () => {
    const blob = await generateBlob();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${surveyCase.case_number}_調査報告書.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleSave = async () => {
    const blob = await generateBlob();
    if (blob) {
      await onSaveBlob(blob);
    }
  };

  const handleMail = () => {
    const to = surveyCase.client_email ?? "";
    const subject = encodeURIComponent(
      `【作業報告書】${surveyCase.case_number} ${surveyCase.client_name}様`
    );
    const bodyLines = [
      "お世話になっております。",
      "",
      "下記案件の現場調査・作業報告書をお送りいたします。",
      "",
      `案件番号: ${surveyCase.case_number}`,
      `お客様名: ${surveyCase.client_name}`,
      `現場住所: ${surveyCase.address}`,
      "",
      "添付のPDFをご確認のうえ、ご不明点等ございましたらご連絡ください。",
      "",
      "以上、よろしくお願いいたします。",
    ];
    const body = encodeURIComponent(bodyLines.join("\n"));

    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  const busy = isRendering || isGenerating;

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handlePreview} variant="outline" disabled={busy}>
          {isRendering ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Eye className="mr-2 h-4 w-4" />
          )}
          プレビュー
        </Button>
        <Button onClick={handleMail} variant="outline" disabled={busy}>
          <Mail className="mr-2 h-4 w-4" />
          メールで送信（メールアプリ起動）
        </Button>
        <Button onClick={handleSave} disabled={busy}>
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          報告書を発行・保存
        </Button>
        <Button onClick={handleDownload} variant="outline" disabled={busy}>
          {isRendering ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          ダウンロード
        </Button>
      </div>

      {previewUrl && (
        <div className="mt-4">
          <iframe
            src={previewUrl}
            className="w-full h-[600px] rounded-lg border"
            title="Report Preview"
          />
        </div>
      )}
    </>
  );
}
