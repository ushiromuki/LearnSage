import { useQuery } from "@tanstack/react-query";
import { User, Tenant, Group } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { CreateUserForm } from "@/components/admin/create-user-form";
import { ImportUsersForm } from "@/components/admin/import-users-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function UsersPage() {
  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">ユーザー管理</h1>

        <Card>
          <CardHeader>
            <CardTitle>ユーザー作成</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="individual">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="individual">個別作成</TabsTrigger>
                <TabsTrigger value="import">CSVインポート</TabsTrigger>
              </TabsList>

              <TabsContent value="individual">
                <CreateUserForm tenants={tenants} groups={groups} />
              </TabsContent>

              <TabsContent value="import">
                <ImportUsersForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ユーザー一覧</CardTitle>
          </CardHeader>
          <CardContent>
            {users?.length === 0 ? (
              <p className="text-sm text-gray-500">ユーザーが登録されていません</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名前</TableHead>
                    <TableHead>ユーザー名</TableHead>
                    <TableHead>ロール</TableHead>
                    <TableHead>テナント</TableHead>
                    <TableHead>グループ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => {
                    const tenant = tenants?.find((t) => t.id === user.tenantId);
                    const group = groups?.find((g) => g.id === user.groupId);

                    return (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{tenant?.name || "-"}</TableCell>
                        <TableCell>{group?.name || "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
