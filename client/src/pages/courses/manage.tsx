import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Course } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { FileUpload } from "@/components/ui/file-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ManageCoursesPage() {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: files, isLoading: isLoadingFiles } = useQuery({
    queryKey: ["/api/courses", selectedCourse?.id, "files"],
    queryFn: async () => {
      if (!selectedCourse) return null;
      const res = await fetch(`/api/courses/${selectedCourse.id}/files`);
      if (!res.ok) throw new Error("Failed to fetch files");
      return res.json();
    },
    enabled: !!selectedCourse,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </DashboardLayout>
    );
  }

  const instructorCourses = courses?.filter((c) => c.instructorId === user?.id) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">コース管理</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>コース一覧</CardTitle>
            </CardHeader>
            <CardContent>
              {instructorCourses.length === 0 ? (
                <p className="text-sm text-gray-500">作成したコースはありません</p>
              ) : (
                <div className="space-y-2">
                  {instructorCourses.map((course) => (
                    <div
                      key={course.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        selectedCourse?.id === course.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-gray-50"
                      }`}
                    >
                      <button
                        onClick={() => setSelectedCourse(course)}
                        className="flex-1 text-left"
                      >
                        <h3 className="font-medium">{course.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {course.description}
                        </p>
                      </button>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {/* TODO: 編集機能の実装 */}}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {/* TODO: 削除機能の実装 */}}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedCourse && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>ファイルアップロード</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    courseId={selectedCourse.id}
                    onSuccess={() =>
                      queryClient.invalidateQueries([
                        "/api/courses",
                        selectedCourse.id,
                        "files",
                      ])
                    }
                    allowedTypes={[
                      "application/pdf",
                      "image/jpeg",
                      "image/png",
                      "video/mp4",
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                    ]}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>アップロード済みファイル</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingFiles ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-border" />
                    </div>
                  ) : files?.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      アップロードされたファイルはありません
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {files?.map((file) => (
                        <a
                          key={file.id}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-4 rounded-lg border border-border hover:bg-gray-50"
                        >
                          <p className="font-medium">{file.originalName}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(file.createdAt).toLocaleString()}
                          </p>
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}