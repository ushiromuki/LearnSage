import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";

export function ImportUsersForm() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const importUsersMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiRequest("POST", "/api/users/import", formData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "インポート完了",
        description: "ユーザーが正常にインポートされました",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    importUsersMutation.mutate(formData);
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="csv-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500">
                クリックまたはドラッグ＆ドロップでCSVファイルを選択
              </p>
              <p className="text-xs text-gray-500">
                ヘッダー: username,password,name,role,tenantCode,groupCode
              </p>
            </div>
            <input
              id="csv-upload"
              type="file"
              className="hidden"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </div>

        {isUploading && (
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            アップロード中...
          </div>
        )}
      </div>
    </Card>
  );
}
