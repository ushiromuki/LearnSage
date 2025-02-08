import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Course } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useNavigate } from "wouter";

export default function CreateCoursePage() {
  const { toast } = useToast();
  const [_, navigate] = useNavigate();

  const form = useForm<Course>({
    defaultValues: {
      title: "",
      description: "",
      tags: [],
      content: { sections: [] },
    },
  });

  const onSubmit = async (data: Course) => {
    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create course");

      const course = await response.json();
      queryClient.invalidateQueries(["/api/courses"]);
      toast({
        title: "コースを作成しました",
        description: "コースの編集画面に移動します",
      });
      navigate(`/courses/manage`);
    } catch (error) {
      toast({
        title: "エラー",
        description: "コースの作成に失敗しました",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">新規コース作成</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>コースタイトル</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="例：プログラミング入門" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>コース説明</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="コースの説明を入力してください"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit">作成</Button>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
