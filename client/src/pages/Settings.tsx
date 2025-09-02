import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ThemeProvider";
import { apiRequest } from "@/lib/queryClient";
import { calculateCostPerKm, formatCurrency } from "@/lib/calculations";
import { Save, Info } from "lucide-react";

// Mock user ID - in a real app this would come from authentication
const MOCK_USER_ID = "user-1";

const settingsSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  fuelPricePerLiter: z.number().min(0.01, "Preço deve ser maior que 0"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/users', MOCK_USER_ID],
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      fuelPricePerLiter: parseFloat(user?.fuelPricePerLiter || "6.00"),
    },
  });

  // Update form when user data loads
  React.useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email || "",
        fuelPricePerLiter: parseFloat(user.fuelPricePerLiter || "6.00"),
      });
    }
  }, [user, form]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      return apiRequest('PUT', `/api/users/${MOCK_USER_ID}`, {
        ...data,
        fuelPricePerLiter: data.fuelPricePerLiter.toString(),
        darkMode: theme === "dark",
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    updateUserMutation.mutate(data);
  };

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  const fuelPrice = form.watch("fuelPricePerLiter") || 0;
  const costPerKm = calculateCostPerKm(fuelPrice);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Configurações</h2>
          <p className="text-muted-foreground">Personalize sua experiência no TravelControl</p>
        </div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted rounded"></div>
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
        <h2 className="text-3xl font-bold mb-2" data-testid="text-settings-title">Configurações</h2>
        <p className="text-muted-foreground">Personalize sua experiência no TravelControl</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Data */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  data-testid="input-name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  data-testid="input-email"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fuel Calculation */}
        <Card>
          <CardHeader>
            <CardTitle>Configuração de Combustível</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="fuelPrice">Preço do Combustível (por litro)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-muted-foreground">R$</span>
                  <Input
                    id="fuelPrice"
                    type="number"
                    step="0.01"
                    className="pl-8"
                    {...form.register("fuelPricePerLiter", { valueAsNumber: true })}
                    data-testid="input-fuel-price"
                  />
                </div>
                {form.formState.errors.fuelPricePerLiter && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.fuelPricePerLiter.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="costPerKm">Custo por KM (calculado)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-muted-foreground">R$</span>
                  <Input
                    id="costPerKm"
                    value={costPerKm.toFixed(2).replace('.', ',')}
                    readOnly
                    className="pl-8 bg-muted text-muted-foreground"
                    data-testid="input-cost-per-km"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground flex items-center">
                <Info className="mr-2 h-4 w-4" />
                Fórmula: Custo por KM = Preço do combustível ÷ 4
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Modo Escuro</p>
                  <p className="text-sm text-muted-foreground">Interface com tema escuro</p>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={handleThemeToggle}
                  data-testid="switch-dark-mode"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateUserMutation.isPending}
            data-testid="button-save-settings"
          >
            <Save className="mr-2 h-4 w-4" />
            {updateUserMutation.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
