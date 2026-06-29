export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  pointure?: string;
  couleur?: string;
}

const STORAGE_KEY = "mts-cart";

function itemKey(productId: string, pointure?: string): string {
  return `${productId}-${pointure ?? ""}`;
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}

export function saveCart(items: CartItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addToCart(item: CartItem): CartItem[] {
  const cart = getCart();
  const key = itemKey(item.productId, item.pointure);
  const existing = cart.find((i) => itemKey(i.productId, i.pointure) === key);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }
  saveCart(cart);
  return [...cart];
}

export function updateQty(productId: string, quantity: number, pointure?: string): CartItem[] {
  const key = itemKey(productId, pointure);
  const cart = getCart().map((i) =>
    itemKey(i.productId, i.pointure) === key ? { ...i, quantity } : i
  );
  saveCart(cart);
  return cart;
}

export function removeFromCart(productId: string, pointure?: string): CartItem[] {
  const key = itemKey(productId, pointure);
  const cart = getCart().filter((i) => itemKey(i.productId, i.pointure) !== key);
  saveCart(cart);
  return cart;
}

export function clearCart(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
