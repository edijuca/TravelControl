export function calculateCostPerKm(fuelPricePerLiter: number): number {
  return fuelPricePerLiter / 4;
}

export function calculateFuelCost(kilometers: number, costPerKm: number): number {
  return kilometers * costPerKm;
}

export function calculateTotalCost(
  fuelCost: number,
  parkingCost: number = 0,
  tollCost: number = 0,
  otherCost: number = 0
): number {
  return fuelCost + parkingCost + tollCost + otherCost;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
