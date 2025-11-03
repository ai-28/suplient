"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Users, Building2, TrendingUp, Shield } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/app/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useTranslation } from "@/app/context/LanguageContext";

const monthlyData = [
  { month: "Jan", coaches: 18, clients: 95 },
  { month: "Feb", coaches: 20, clients: 110 },
  { month: "Mar", coaches: 19, clients: 125 },
  { month: "Apr", coaches: 22, clients: 140 },
  { month: "May", coaches: 23, clients: 145 },
  { month: "Jun", coaches: 24, clients: 156 },
];

const incomeData = [
  { month: "Jan", income: 12500 },
  { month: "Feb", income: 15200 },
  { month: "Mar", income: 18900 },
  { month: "Apr", income: 22100 },
  { month: "May", income: 24800 },
  { month: "Jun", income: 28400 },
];

// These will be updated inside the component to use translations
const getChartConfig = (t) => ({
  coaches: {
    label: t("dashboard.admin.coaches"),
    color: "hsl(var(--primary))",
  },
  clients: {
    label: t("dashboard.admin.clients"), 
    color: "hsl(var(--accent))",
  },
});

const getIncomeChartConfig = (t) => ({
  income: {
    label: t("dashboard.admin.revenue"),
    color: "hsl(var(--success))",
  },
});

export default function AdminDashboard() {
  const t = useTranslation();
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.admin.title")}</h1>
        <p className="text-muted-foreground">
          {t("dashboard.admin.subtitle")}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.admin.activeCoaches")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">22/24</div>
            <p className="text-xs text-muted-foreground">+3 active {t("dashboard.admin.fromLastMonth")}</p>
            <p className="text-xs text-success mt-1">91.7% {t("dashboard.admin.activityRate")}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.admin.activeClients")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142/156</div>
            <p className="text-xs text-muted-foreground">+18 active {t("dashboard.admin.fromLastMonth")}</p>
            <p className="text-xs text-success mt-1">91.0% {t("dashboard.admin.activityRate")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
        {/* Monthly Growth Chart */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{t("dashboard.admin.monthlyGrowth")}</CardTitle>
            <CardDescription>{t("dashboard.admin.monthlyGrowthDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <ChartContainer config={getChartConfig(t)} className="h-[250px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barCategoryGap="20%" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="coaches" 
                    fill="var(--color-coaches)"
                    radius={[2, 2, 0, 0]}
                    name={t("dashboard.admin.coaches")}
                  />
                  <Bar 
                    dataKey="clients" 
                    fill="var(--color-clients)"
                    radius={[2, 2, 0, 0]}
                    name={t("dashboard.admin.clients")}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Monthly Income Chart */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{t("dashboard.admin.monthlyRevenue")}</CardTitle>
            <CardDescription>{t("dashboard.admin.monthlyRevenueDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <ChartContainer config={getIncomeChartConfig(t)} className="h-[250px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                      formatter={(value) => [`$${value.toLocaleString()}`, t("dashboard.admin.revenue")]}
                    />} 
                  />
                  <Bar 
                    dataKey="income" 
                    fill="var(--color-income)"
                    radius={[4, 4, 0, 0]}
                    name={t("dashboard.admin.revenue")}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.admin.recentCoachRegistrations")}</CardTitle>
          <CardDescription>{t("dashboard.admin.latestCoachesJoined")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium">Dr. Sarah Johnson</p>
                <p className="text-sm text-muted-foreground">{t("dashboard.admin.joined")} 2 {t("dashboard.admin.daysAgo")}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium">Michael Chen</p>
                <p className="text-sm text-muted-foreground">{t("dashboard.admin.joined")} 5 {t("dashboard.admin.daysAgo")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}