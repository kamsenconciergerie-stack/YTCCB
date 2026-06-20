export function formatPrice(price: unknown): string {
  const num = Number(price);
  return `${new Intl.NumberFormat("fr-FR").format(num)} FCFA`;
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
