import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Course, Enrollment } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Loader2 } from "lucide-react";

const CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function AnalyticsDashboard() {
  const { data: courses, isLoading: isLoadingCourses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: enrollments, isLoading: isLoadingEnrollments } = useQuery<
    Enrollment[]
  >({
    queryKey: ["/api/enrollments/all"],
  });

  if (isLoadingCourses || isLoadingEnrollments) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </DashboardLayout>
    );
  }

  // タグの分析データを作成
  const tagStats = courses?.reduce((acc: { [key: string]: number }, course) => {
    course.tags?.forEach((tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {});

  const tagChartData = Object.entries(tagStats || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // コース別の統計データを作成
  const courseStats = courses?.map((course) => {
    const courseEnrollments = enrollments?.filter((e) => e.courseId === course.id) || [];
    const averageProgress = courseEnrollments.reduce((sum, e) => sum + e.progress, 0) / (courseEnrollments.length || 1);
    const completionRate = (courseEnrollments.filter(e => e.completed).length / (courseEnrollments.length || 1)) * 100;

    return {
      name: course.title,
      students: courseEnrollments.length,
      avgProgress: Math.round(averageProgress),
      completionRate: Math.round(completionRate),
    };
  });

  // 全体の統計を計算
  const totalEnrollments = enrollments?.length || 0;
  const completedEnrollments = enrollments?.filter(e => e.completed).length || 0;
  const completionPercentage = totalEnrollments
    ? (completedEnrollments / totalEnrollments) * 100
    : 0;
  const averageProgress = enrollments?.reduce((sum, e) => sum + e.progress, 0) || 0;
  const totalAverageProgress = totalEnrollments ? averageProgress / totalEnrollments : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">分析ダッシュボード</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>総コース数</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{courses?.length || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>総受講者数</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{totalEnrollments}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>平均完了率</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {completionPercentage.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>平均進捗率</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {totalAverageProgress.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>人気のタグ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tagChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name} (${value})`}
                    >
                      {tagChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>コース別受講者数と完了率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" unit="%" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="students" fill="#8884d8" name="受講者数" />
                    <Bar yAxisId="right" dataKey="completionRate" fill="#82ca9d" name="完了率" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>コース別進捗状況</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis unit="%" />
                    <Tooltip />
                    <Bar dataKey="avgProgress" fill="#ffc658" name="平均進捗率" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}