import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Route, Edit2, Trash2 } from "lucide-react";
import type { Route as RouteType } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

const routeSchema = z.object({
  origin: z.string().min(1, "Origem é obrigatória"),
  destination: z.string().min(1, "Destino é obrigatório"),
  kilometers: z.number().min(1, "Quilometragem deve ser maior que 0"),
});

type RouteFormData = z.infer<typeof routeSchema>;

export default function Routes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteType | null>(null);

  const { data: routes, isLoading } = useQuery<RouteType[]>({
    queryKey: ['/api/routes', user?.id],
    enabled: !!user?.id,
  });

  const form = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      origin: "",
      destination: "",
      kilometers: 0,
    },
  });

  const createRouteMutation = useMutation({
    mutationFn: async (data: RouteFormData) => {
      const routeData = {
        ...data,
        userId: user?.id,
      };
      return apiRequest('POST', '/api/routes', routeData);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Rota criada com sucesso!",
      });
      form.reset();
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar rota. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateRouteMutation = useMutation({
    mutationFn: async (data: RouteFormData) => {
      if (!editingRoute) throw new Error("No route selected for editing");
      return apiRequest('PUT', `/api/routes/${editingRoute.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Rota atualizada com sucesso!",
      });
      form.reset();
      setIsDialogOpen(false);
      setEditingRoute(null);
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar rota. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteRouteMutation = useMutation({
    mutationFn: async (routeId: string) => {
      return apiRequest('DELETE', `/api/routes/${routeId}`);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Rota excluída com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir rota. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RouteFormData) => {
    if (editingRoute) {
      updateRouteMutation.mutate(data);
    } else {
      createRouteMutation.mutate(data);
    }
  };

  const handleEdit = (route: RouteType) => {
    setEditingRoute(route);
    form.reset({
      origin: route.origin,
      destination: route.destination,
      kilometers: route.kilometers,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (routeId: string) => {
    if (confirm("Tem certeza que deseja excluir esta rota?")) {
      deleteRouteMutation.mutate(routeId);
    }
  };

  const handleNewRoute = () => {
    setEditingRoute(null);
    form.reset();
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Rotas</h2>
          <p className="text-muted-foreground">Gerencie suas rotas cadastradas</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2" data-testid="text-routes-title">Rotas</h2>
            <p className="text-muted-foreground">Gerencie suas rotas cadastradas</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewRoute} data-testid="button-new-route">
                <Plus className="mr-2 h-4 w-4" />
                Nova Rota
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingRoute ? "Editar Rota" : "Nova Rota"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="origin">Origem</Label>
                  <Input
                    id="origin"
                    {...form.register("origin")}
                    placeholder="Ex: São Paulo - SP"
                    data-testid="input-route-origin"
                  />
                  {form.formState.errors.origin && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.origin.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="destination">Destino</Label>
                  <Input
                    id="destination"
                    {...form.register("destination")}
                    placeholder="Ex: Campinas - SP"
                    data-testid="input-route-destination"
                  />
                  {form.formState.errors.destination && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.destination.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="kilometers">Quilometragem (KM)</Label>
                  <Input
                    id="kilometers"
                    type="number"
                    {...form.register("kilometers", { valueAsNumber: true })}
                    placeholder="Ex: 95"
                    data-testid="input-route-kilometers"
                  />
                  {form.formState.errors.kilometers && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.kilometers.message}
                    </p>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-route"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createRouteMutation.isPending || updateRouteMutation.isPending}
                    data-testid="button-save-route"
                  >
                    {editingRoute ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Routes Grid */}
      {routes?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route, index) => (
            <Card key={route.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: index % 2 === 0 
                        ? "linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(271 91% 65%) 100%)"
                        : "hsl(var(--accent))"
                    }}
                  >
                    <Route className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(route)}
                      data-testid={`button-edit-route-${route.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(route.id)}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-delete-route-${route.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <h4 className="font-semibold mb-2" data-testid={`text-route-name-${route.id}`}>
                  {route.origin} → {route.destination}
                </h4>
                <p className="text-muted-foreground text-sm mb-4" data-testid={`text-route-distance-${route.id}`}>
                  Distância: {route.kilometers} km
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Route className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2" data-testid="text-no-routes">Nenhuma rota cadastrada</h3>
          <p className="text-muted-foreground mb-4">
            Comece criando uma nova rota para suas viagens mais frequentes.
          </p>
          <Button onClick={handleNewRoute} data-testid="button-create-first-route">
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeira Rota
          </Button>
        </div>
      )}
    </div>
  );
}
