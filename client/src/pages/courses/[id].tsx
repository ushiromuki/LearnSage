import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Course, QuizQuestion } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [selectedSection, setSelectedSection] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);

  const { data: course, isLoading: isLoadingCourse } = useQuery<Course>({
    queryKey: ["/api/courses", id],
    enabled: !!id,
  });

  const { data: quizQuestions, isLoading: isLoadingQuiz } = useQuery<QuizQuestion[]>({
    queryKey: ["/api/courses", id, "quiz-questions"],
    enabled: !!id,
  });

  const { data: learningProgress, isLoading: isLoadingProgress } = useQuery({
    queryKey: ["/api/courses", id, "progress"],
    enabled: !!id && !!user,
  });

  if (isLoadingCourse || isLoadingQuiz || isLoadingProgress) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold">コースが見つかりませんでした</h1>
        </div>
      </DashboardLayout>
    );
  }

  const currentSection = course.content?.sections[selectedSection];
  const sectionQuizzes = quizQuestions?.filter(q => q.sectionIndex === selectedSection) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <div className="text-sm text-gray-500">
            {learningProgress ? `進捗: ${learningProgress.timeSpent}秒` : null}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[300px,1fr]">
          {/* セクション一覧 */}
          <Card>
            <CardHeader>
              <CardTitle>セクション</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {course.content?.sections.map((section, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedSection(index);
                      setQuizStarted(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg ${
                      selectedSection === index
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary"
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* セクション内容 */}
          <div className="space-y-6">
            {currentSection && (
              <Card>
                <CardHeader>
                  <CardTitle>{currentSection.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    {currentSection.content}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* クイズセクション */}
            {sectionQuizzes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>クイズ</CardTitle>
                </CardHeader>
                <CardContent>
                  {!quizStarted ? (
                    <Button onClick={() => setQuizStarted(true)}>
                      クイズを開始
                    </Button>
                  ) : (
                    <div className="space-y-6">
                      {sectionQuizzes.map((quiz, index) => (
                        <div key={quiz.id} className="space-y-4">
                          <h3 className="font-medium">
                            問題 {index + 1}: {quiz.question}
                          </h3>
                          <div className="space-y-2">
                            {quiz.options.map((option, optionIndex) => (
                              <button
                                key={optionIndex}
                                onClick={() => {
                                  const newAnswers = [...selectedAnswers];
                                  newAnswers[index] = optionIndex;
                                  setSelectedAnswers(newAnswers);
                                }}
                                className={`w-full text-left p-3 rounded-lg border ${
                                  selectedAnswers[index] === optionIndex
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:bg-secondary/50"
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <Button
                        className="w-full"
                        disabled={selectedAnswers.length !== sectionQuizzes.length}
                      >
                        回答を送信
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
