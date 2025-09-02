import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { calculateCostPerKm, calculateFuelCost, calculateTotalCost, formatCurrency } from "@/lib/calculations";
import { Save } from "lucide-react";

// Mock user ID - in a real app this would come from authentication
const MOCK_USER_ID = "user-1";

const tripSchema = z.object({
  date: z.string().min(1, "Data é obrigatória"),
  origin: z.string().min(1, "Origem é obrigatória"),
  destination: z.string().min(1, "Destino é obrigatório"),
  kilometers: z.number().min(1, "Quilometragem deve ser maior que 0"),
  parkingCost: z.number().min(0, "Custo de estacionamento deve ser >= 0"),
  tollCost: z.number().min(0, "Custo de pedágio deve ser >= 0"),
  otherCost: z.number().min(0, "Outras despesas devem ser >= 0"),
  notes: z.string().optional(),
});

type TripFormData = z.infer<typeof tripSchema>;

export default function NewTrip() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [costs, setCosts] = useState({
    fuel: 0,
    parking: 0,
    toll: 0,
    other: 0,
    total: 0,
  });

  const { data: routes } = useQuery({
    queryKey: ['/api/routes', MOCK_USER_ID],
  });

  const { data: user } = useQuery({
    queryKey: ['/api/users', MOCK_USER_ID],
  });

  const form = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 16),
      origin: "",
      destination: "",
      kilometers: 0,
      parkingCost: 0,
      tollCost: 0,
      otherCost: 0,
      notes: "",
    },
  });

  const createTripMutation = useMutation({
    mutationFn: async (data: TripFormData) => {
      const fuelPricePerLiter = parseFloat(user?.fuelPricePerLiter || "6.00");
      const costPerKm = calculateCostPerKm(fuelPricePerLiter);
      const fuelCost = calculateFuelCost(data.kilometers, costPerKm);
      const totalCost = calculateTotalCost(fuelCost, data.parkingCost, data.tollCost, data.otherCost);

      const selectedRoute = routes?.find(r => r.origin === data.origin && r.destination === data.destination);

      const tripData = {
        date: new Date(data.date),
        origin: data.origin,
        destination: data.destination,
        kilometers: data.kilometers,
        fuelCost: fuelCost.toString(),
        parkingCost: data.parkingCost.toString(),
        tollCost: data.tollCost.toString(),
        otherCost: data.otherCost.toString(),
        totalCost: totalCost.toString(),
        notes: data.notes || "",
        userId: MOCK_USER_ID,
        routeId: selectedRoute?.id || null,
      };

      console.log("Sending trip data:", tripData);
      return apiRequest('POST', '/api/trips', tripData);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Viagem registrada com sucesso!",
      });
      form.reset();
      setCosts({ fuel: 0, parking: 0, toll: 0, other: 0, total: 0 });
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
    },
    onError: (error: any) => {
      console.log("Trip creation error:", error);
      let errorMessage = "Erro ao registrar viagem. Tente novamente.";
      
      if (error?.errors) {
        errorMessage = `Erro de validação: ${error.errors.map((e: any) => e.message).join(", ")}`;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const watchedValues = form.watch();

  useEffect(() => {
    const fuelPricePerLiter = parseFloat(user?.fuelPricePerLiter || "6.00");
    const costPerKm = calculateCostPerKm(fuelPricePerLiter);
    const fuelCost = calculateFuelCost(watchedValues.kilometers || 0, costPerKm);
    const parkingCost = watchedValues.parkingCost || 0;
    const tollCost = watchedValues.tollCost || 0;
    const otherCost = watchedValues.otherCost || 0;
    const totalCost = calculateTotalCost(fuelCost, parkingCost, tollCost, otherCost);

    setCosts({
      fuel: fuelCost,
      parking: parkingCost,
      toll: tollCost,
      other: otherCost,
      total: totalCost,
    });
  }, [watchedValues, user?.fuelPricePerLiter]);

  const onSubmit = (data: TripFormData) => {
    console.log("Form data:", data);
    console.log("Form errors:", form.formState.errors);
    createTripMutation.mutate(data);
  };

  const handleRouteSelect = (value: string) => {
    const route = routes?.find(r => `${r.origin} → ${r.destination}` === value);
    if (route) {
      form.setValue("destination", route.destination);
      form.setValue("kilometers", route.kilometers);
    }
  };

  const originOptions = [...new Set(routes?.map(r => r.origin) || [])];
  const destinationOptions = routes?.filter(r => r.origin === form.watch("origin")) || [];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2" data-testid="text-new-trip-title">Nova Viagem</h2>
        <p className="text-muted-foreground">Registre uma nova viagem e calcule os custos automaticamente</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Data e Hora</Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      {...form.register("date")}
                      data-testid="input-date"
                    />
                    {form.formState.errors.date && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.date.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="collaborator">Colaborador</Label>
                    <Input
                      id="collaborator"
                      value={user?.name || "João Silva"}
                      readOnly
                      className="bg-muted"
                      data-testid="input-collaborator"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="origin">Origem</Label>
                    <Select onValueChange={(value) => form.setValue("origin", value)} value={form.watch("origin")}>
                      <SelectTrigger data-testid="select-origin">
                        <SelectValue placeholder="Selecione a origem" />
                      </SelectTrigger>
                      <SelectContent>
                        {originOptions.map((origin) => (
                          <SelectItem key={origin} value={origin}>
                            {origin}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.origin && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.origin.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="destination">Destino</Label>
                    <Select onValueChange={handleRouteSelect} value={destinationOptions.find(r => r.destination === form.watch("destination")) ? `${form.watch("origin")} → ${form.watch("destination")}` : ""}>
                      <SelectTrigger data-testid="select-destination">
                        <SelectValue placeholder="Selecione o destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {destinationOptions.map((route) => (
                          <SelectItem key={route.id} value={`${route.origin} → ${route.destination}`}>
                            {route.destination}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.destination && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.destination.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="kilometers">Quilometragem (KM)</Label>
                    <Input
                      id="kilometers"
                      type="number"
                      {...form.register("kilometers", { valueAsNumber: true })}
                      data-testid="input-kilometers"
                    />
                    {form.formState.errors.kilometers && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.kilometers.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="costPerKm">Custo por KM</Label>
                    <Input
                      id="costPerKm"
                      value={formatCurrency(calculateCostPerKm(parseFloat(user?.fuelPricePerLiter || "6.00")))}
                      readOnly
                      className="bg-muted text-muted-foreground"
                      data-testid="input-cost-per-km"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-medium">Despesas Adicionais</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="parkingCost">Estacionamento</Label>
                      <Input
                        id="parkingCost"
                        type="number"
                        step="0.01"
                        {...form.register("parkingCost", { valueAsNumber: true })}
                        data-testid="input-parking-cost"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tollCost">Pedágio</Label>
                      <Input
                        id="tollCost"
                        type="number"
                        step="0.01"
                        {...form.register("tollCost", { valueAsNumber: true })}
                        data-testid="input-toll-cost"
                      />
                    </div>
                    <div>
                      <Label htmlFor="otherCost">Outras Despesas</Label>
                      <Input
                        id="otherCost"
                        type="number"
                        step="0.01"
                        {...form.register("otherCost", { valueAsNumber: true })}
                        data-testid="input-other-cost"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    {...form.register("notes")}
                    className="h-24 resize-none"
                    placeholder="Adicione observações sobre a viagem..."
                    data-testid="textarea-notes"
                  />
                </div>

                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createTripMutation.isPending}
                    data-testid="button-save-trip"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {createTripMutation.isPending ? "Salvando..." : "Salvar Viagem"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="px-6"
                    onClick={() => form.reset()}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Cost Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Resumo de Custos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Combustível:</span>
                  <span data-testid="text-fuel-cost">{formatCurrency(costs.fuel)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estacionamento:</span>
                  <span data-testid="text-parking-cost">{formatCurrency(costs.parking)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pedágio:</span>
                  <span data-testid="text-toll-cost">{formatCurrency(costs.toll)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Outras:</span>
                  <span data-testid="text-other-cost">{formatCurrency(costs.other)}</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-primary" data-testid="text-total-cost">
                    {formatCurrency(costs.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
