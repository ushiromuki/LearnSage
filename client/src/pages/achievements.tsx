import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Clock } from "lucide-react";
import { Achievement, UserAchievement } from "@shared/schema";
import { Loader2 } from "lucide-react";

const achievementIcons = {
  course_completion: Trophy,
  quiz_score: Star,
  time_spent: Clock,
};

export default function AchievementsPage() {
  const { data: achievements, isLoading: isLoadingAchievements } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  const { data: userAchievements, isLoading: isLoadingUserAchievements } = useQuery<UserAchievement[]>({
    queryKey: ["/api/user/achievements"],
  });

  if (isLoadingAchievements || isLoadingUserAchievements) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">実績</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {achievements?.map((achievement) => {
            const userAchievement = userAchievements?.find(
              (ua) => ua.achievementId === achievement.id
            );
            const Icon = achievementIcons[achievement.type] || Trophy;
            const progress = userAchievement?.progress || 0;
            const progressPercentage = Math.min(
              100,
              (progress / achievement.requiredValue) * 100
            );

            return (
              <Card key={achievement.id} className="relative overflow-hidden">
                {userAchievement?.completed && (
                  <div className="absolute top-0 right-0 p-2">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <CardTitle>{achievement.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-4">
                    {achievement.description}
                  </p>
                  <div className="space-y-2">
                    <Progress value={progressPercentage} />
                    <p className="text-sm text-gray-500">
                      進捗: {progress} / {achievement.requiredValue}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
