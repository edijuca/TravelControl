import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Download } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/calculations";
import type { Trip } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function Reports() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    origin: "",
    destination: "",
  });

  const { data: trips, isLoading } = useQuery<Trip[]>({
    queryKey: ['/api/trips', user?.id, filters],
    enabled: !!user?.id,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.origin) params.append('origin', filters.origin);
      if (filters.destination) params.append('destination', filters.destination);
      
      const response = await fetch(`/api/trips/${user?.id}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch trips');
      return response.json();
    },
  });

  const { data: routes } = useQuery({
    queryKey: ['/api/routes', user?.id],
    enabled: !!user?.id,
  });

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.origin) params.append('origin', filters.origin);
      if (filters.destination) params.append('destination', filters.destination);

      const response = await fetch(`/api/trips/${user?.id}/export?${params}`);
      if (!response.ok) throw new Error('Failed to export data');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'viagens.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const totalTrips = trips?.length || 0;
  const totalKilometers = trips?.reduce((sum, trip) => sum + trip.kilometers, 0) || 0;
  const totalExpenses = trips?.reduce((sum, trip) => sum + parseFloat(trip.totalCost), 0) || 0;

  const originOptions = [...new Set(routes?.map(r => r.origin) || [])];
  const destinationOptions = [...new Set(routes?.map(r => r.destination) || [])];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2" data-testid="text-reports-title">Relatórios</h2>
        <p className="text-muted-foreground">Analise suas viagens e gastos por período</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                data-testid="input-start-date"
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                data-testid="input-end-date"
              />
            </div>
            <div>
              <Label htmlFor="origin">Origem</Label>
              <Select 
                value={filters.origin || "all"} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, origin: value === "all" ? "" : value }))}
              >
                <SelectTrigger data-testid="select-filter-origin">
                  <SelectValue placeholder="Todas as origens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as origens</SelectItem>
                  {originOptions.map((origin) => (
                    <SelectItem key={origin} value={origin}>
                      {origin}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="destination">Destino</Label>
              <Select 
                value={filters.destination || "all"} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, destination: value === "all" ? "" : value }))}
              >
                <SelectTrigger data-testid="select-filter-destination">
                  <SelectValue placeholder="Todos os destinos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os destinos</SelectItem>
                  {destinationOptions.map((destination) => (
                    <SelectItem key={destination} value={destination}>
                      {destination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <Button data-testid="button-apply-filters">
              <Search className="mr-2 h-4 w-4" />
              Aplicar Filtros
            </Button>
            <Button 
              onClick={handleExportCSV}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-export-csv"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <h4 className="font-medium text-muted-foreground mb-2">Total de Viagens</h4>
            <p className="text-3xl font-bold" data-testid="text-report-total-trips">{totalTrips}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h4 className="font-medium text-muted-foreground mb-2">Total de KM</h4>
            <p className="text-3xl font-bold" data-testid="text-report-total-km">
              {totalKilometers.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h4 className="font-medium text-muted-foreground mb-2">Gasto Total</h4>
            <p className="text-3xl font-bold text-primary" data-testid="text-report-total-expenses">
              {formatCurrency(totalExpenses)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trip History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Viagens</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : trips?.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>KM</TableHead>
                    <TableHead>Combustível</TableHead>
                    <TableHead>Despesas</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.map((trip) => {
                    const additionalCosts = parseFloat(trip.parkingCost) + parseFloat(trip.tollCost) + parseFloat(trip.otherCost);
                    return (
                      <TableRow key={trip.id} data-testid={`row-trip-${trip.id}`}>
                        <TableCell>{formatDate(new Date(trip.date))}</TableCell>
                        <TableCell>{trip.origin}</TableCell>
                        <TableCell>{trip.destination}</TableCell>
                        <TableCell>{trip.kilometers}</TableCell>
                        <TableCell>{formatCurrency(parseFloat(trip.fuelCost))}</TableCell>
                        <TableCell>{formatCurrency(additionalCosts)}</TableCell>
                        <TableCell className="font-medium text-primary">
                          {formatCurrency(parseFloat(trip.totalCost))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground" data-testid="text-no-trips">
                Nenhuma viagem encontrada para o período selecionado
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
