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

  // コース別受講者数データを作成
  const courseEnrollments = courses?.map((course) => ({
    name: course.title,
    count: enrollments?.filter((e) => e.courseId === course.id).length || 0,
  }));

  // 完了率の計算
  const completionRate =
    enrollments?.reduce((acc, enrollment) => {
      return acc + (enrollment.completed ? 1 : 0);
    }, 0) || 0;

  const totalEnrollments = enrollments?.length || 0;
  const completionPercentage = totalEnrollments
    ? (completionRate / totalEnrollments) * 100
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">分析ダッシュボード</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              <CardTitle>コース別受講者数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseEnrollments}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
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
