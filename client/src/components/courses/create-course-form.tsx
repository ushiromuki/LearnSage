import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCourseSchema, type Course } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

export function CreateCourseForm() {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertCourseSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: [],
      content: { sections: [] },
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: Omit<Course, "id" | "instructorId">) => {
      const res = await apiRequest("POST", "/api/courses", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      form.reset();
      toast({
        title: "コース作成完了",
        description: "新しいコースが作成されました",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => createCourseMutation.mutate(data))}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>タイトル</FormLabel>
              <FormControl>
                <Input {...field} />
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
              <FormLabel>説明</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>タグ（カンマ区切り）</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ? field.value.join(", ") : ""}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    const tags = inputValue
                      ? inputValue
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter((tag) => tag.length > 0)
                      : [];
                    field.onChange(tags);
                  }}
                  placeholder="例: プログラミング, Web開発, JavaScript"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={createCourseMutation.isPending}
        >
          {createCourseMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          コースを作成
        </Button>
      </form>
    </Form>
  );
}