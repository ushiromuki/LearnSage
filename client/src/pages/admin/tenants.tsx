import { useQuery } from "@tanstack/react-query";
import { Tenant } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { CreateTenantForm } from "@/components/admin/create-tenant-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function TenantsPage() {
  const { data: tenants, isLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
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
        <h1 className="text-3xl font-bold">テナント管理</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>新規テナント作成</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateTenantForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>テナント一覧</CardTitle>
            </CardHeader>
            <CardContent>
              {tenants?.length === 0 ? (
                <p className="text-sm text-gray-500">テナントが登録されていません</p>
              ) : (
                <div className="space-y-4">
                  {tenants?.map((tenant) => (
                    <div
                      key={tenant.id}
                      className="p-4 rounded-lg border border-border"
                    >
                      <h3 className="font-medium">{tenant.name}</h3>
                      <p className="text-sm text-gray-500">コード: {tenant.code}</p>
                      <p className="text-sm text-gray-500">
                        作成日: {new Date(tenant.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
