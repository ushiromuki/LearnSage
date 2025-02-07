import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Course, Enrollment } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: enrollments } = useQuery<Enrollment[]>({
    queryKey: ["/api/enrollments"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>My Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {enrollments?.length || 0} Courses
              </p>
            </CardContent>
          </Card>

          {user?.role === "instructor" ? (
            <Card>
              <CardHeader>
                <CardTitle>My Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {
                    courses?.filter((c) => c.instructorId === user.id).length || 0
                  } Created
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Available Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {courses?.length || 0} Total
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
