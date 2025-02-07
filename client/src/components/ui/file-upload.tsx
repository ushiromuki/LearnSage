import { useState } from "react";
import { Button } from "./button";
import { Loader2, Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "./card";
import { Progress } from "./progress";

interface FileUploadProps {
  courseId: number;
  onSuccess?: () => void;
  allowedTypes?: string[];
}

export function FileUpload({ courseId, onSuccess, allowedTypes }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルタイプのチェック
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      toast({
        title: "エラー",
        description: "このファイル形式はサポートされていません",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await fetch(`/api/courses/${courseId}/files`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "アップロード完了",
        description: "ファイルが正常にアップロードされました",
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "ファイルのアップロードに失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500">
                クリックまたはドラッグ＆ドロップでファイルを選択
              </p>
              <p className="text-xs text-gray-500">
                {allowedTypes
                  ? `サポートされている形式: ${allowedTypes.join(", ")}`
                  : "全てのファイル形式"}
              </p>
            </div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
              accept={allowedTypes?.join(",")}
            />
          </label>
        </div>

        {isUploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} />
            <div className="flex items-center justify-center text-sm text-gray-500">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              アップロード中...
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
