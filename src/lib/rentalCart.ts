// Simple localStorage-backed cart for equipment rental requests. Kept as plain
// functions (not React context) so any page can read/write it without a
// provider — /rentals adds items, /request-equipment reads and submits them.

export type CartItem = { id: number; name: string; quantity: number };

const KEY = 'niglo_rental_cart';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('niglo-cart-updated'));
}

export function addToCart(item: CartItem) {
  const cart = getCart();
  const existing = cart.find((i) => i.id === item.id);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }
  setCart(cart);
}

export function removeFromCart(id: number) {
  setCart(getCart().filter((i) => i.id !== id));
}

export function updateQuantity(id: number, quantity: number) {
  const cart = getCart();
  const item = cart.find((i) => i.id === id);
  if (item) {
    item.quantity = Math.max(1, quantity);
    setCart(cart);
  }
}

export function clearCart() {
  setCart([]);
}

export function cartCount(): number {
  return getCart().reduce((sum, i) => sum + i.quantity, 0);
}
