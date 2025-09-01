import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Calculator, Book } from "lucide-react";

export default function Help() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2" data-testid="text-help-title">Ajuda</h2>
        <p className="text-muted-foreground">Guia de uso do TravelControl</p>
      </div>

      <div className="space-y-6">
        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Rocket className="mr-3 h-5 w-5 text-primary" />
              Primeiros Passos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <p className="text-sm">
                  Configure o preço do combustível em <strong>Configurações</strong>
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <p className="text-sm">Cadastre suas rotas mais utilizadas</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <p className="text-sm">
                  Comece a registrar suas viagens em <strong>Nova Viagem</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="mr-3 h-5 w-5 text-accent" />
              Fórmulas de Cálculo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h5 className="font-medium mb-2">Custo por Quilômetro</h5>
                <code className="text-primary text-sm">
                  Custo por KM = Preço do combustível por litro ÷ 4
                </code>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h5 className="font-medium mb-2">Custo de Combustível da Viagem</h5>
                <code className="text-primary text-sm">
                  Combustível = KM percorrido × Custo por KM
                </code>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h5 className="font-medium mb-2">Custo Total da Viagem</h5>
                <code className="text-primary text-sm">
                  Total = Combustível + Estacionamento + Pedágios + Outras despesas
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Book className="mr-3 h-5 w-5 text-green-500" />
              Funcionalidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium mb-2">Dashboard</h5>
                <p className="text-sm text-muted-foreground">
                  Visualize estatísticas mensais, gráficos de gastos e suas rotas mais utilizadas.
                </p>
              </div>
              <div>
                <h5 className="font-medium mb-2">Nova Viagem</h5>
                <p className="text-sm text-muted-foreground">
                  Registre viagens com cálculo automático de custos e preenchimento automático de distâncias.
                </p>
              </div>
              <div>
                <h5 className="font-medium mb-2">Relatórios</h5>
                <p className="text-sm text-muted-foreground">
                  Gere relatórios detalhados por período e exporte dados em CSV.
                </p>
              </div>
              <div>
                <h5 className="font-medium mb-2">Rotas</h5>
                <p className="text-sm text-muted-foreground">
                  Cadastre rotas frequentes para agilizar o registro de viagens.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
