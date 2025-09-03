import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Car, Route, DollarSign, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/analytics/stats', user?.id],
    enabled: !!user?.id,
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['/api/analytics/monthly', user?.id],
    enabled: !!user?.id,
  });

  const { data: topRoutes, isLoading: routesLoading } = useQuery({
    queryKey: ['/api/analytics/top-routes', user?.id],
    enabled: !!user?.id,
  });

  if (statsLoading || monthlyLoading || routesLoading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Visão geral das suas viagens e gastos</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2" data-testid="text-dashboard-title">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral das suas viagens e gastos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Viagens Este Mês</p>
                <p className="text-2xl font-bold" data-testid="text-monthly-trips">
                  {stats?.monthlyTrips ?? 0}
                </p>
              </div>
              <div className="gradient-bg w-10 h-10 rounded-lg flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">KM Total</p>
                <p className="text-2xl font-bold" data-testid="text-total-km">
                  {stats?.totalKm?.toLocaleString('pt-BR') ?? 0}
                </p>
              </div>
              <div className="bg-accent w-10 h-10 rounded-lg flex items-center justify-center">
                <Route className="h-5 w-5 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gasto Total</p>
                <p className="text-2xl font-bold" data-testid="text-total-expenses">
                  {formatCurrency(parseFloat(stats?.totalExpenses ?? "0"))}
                </p>
              </div>
              <div className="success-gradient w-10 h-10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rotas Cadastradas</p>
                <p className="text-2xl font-bold" data-testid="text-total-routes">
                  {stats?.totalRoutes ?? 0}
                </p>
              </div>
              <div className="bg-secondary w-10 h-10 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-secondary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Viagens por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData?.trips ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gastos Mensais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData?.expenses ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(parseFloat(value as string)), "Gastos"]} />
                  <Bar dataKey="amount" fill="hsl(var(--chart-2))" radius={6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quilometragem Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData?.kilometers ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={2} 
                    fill="hsla(var(--chart-3) / 0.2)"
                    fillOpacity={0.2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rotas Mais Utilizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topRoutes?.length ? (
                topRoutes.map((route: any, index: number) => (
                  <div 
                    key={`${route.origin}-${route.destination}`}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    data-testid={`card-route-${index}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: `hsl(var(--chart-${(index % 3) + 1}))`
                        }}
                      ></div>
                      <div>
                        <p className="font-medium text-sm">
                          {route.origin} → {route.destination}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {route.kilometers} km
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium" data-testid={`text-route-count-${index}`}>
                      {route.tripCount} viagens
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground" data-testid="text-no-routes">
                    Nenhuma rota encontrada
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
