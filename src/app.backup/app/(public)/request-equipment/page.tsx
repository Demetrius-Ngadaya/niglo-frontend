'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { CartItem, getCart, removeFromCart, updateQuantity, clearCart } from '@/lib/rentalCart';

export default function RequestEquipmentPage() {
  const [cart, setCartState] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCartState(getCart());
    setLoaded(true);
  }, []);

  function changeQty(id: number, qty: number) {
    updateQuantity(id, qty);
    setCartState(getCart());
  }

  function remove(id: number) {
    removeFromCart(id);
    setCartState(getCart());
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (cart.length === 0) {
      setError('Your equipment list is empty — go back to Rentals and add some items first.');
      return;
    }

    const form = new FormData(e.currentTarget);
    const payload = {
      full_name: form.get('full_name'),
      email: form.get('email') || null,
      phone: form.get('phone'),
      items: cart,
      rental_start_date: form.get('rental_start_date') || null,
      rental_end_date: form.get('rental_end_date') || null,
      location: form.get('location') || null,
      details: form.get('details') || null,
    };

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/rental-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Something went wrong. Please try again.');
      }

      const data = await res.json();
      setSubmitted(data.reference_no);
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20">
        <div className="border border-brass bg-brass/10 p-10 text-center">
          <div className="eyebrow mb-3">Request received</div>
          <h2 className="font-display text-2xl mb-3">Thank you — we&apos;re checking availability.</h2>
          <p className="text-ink/70 mb-6">
            Your reference number is <span className="font-mono font-semibold text-ink">{submitted}</span>.
            Save it — you can track this request anytime using this reference and your phone number.
          </p>
          <Link href="/track-request" className="btn-outline">Track Your Request</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <div className="eyebrow mb-3">Equipment request</div>
      <h1 className="font-display text-4xl md:text-5xl mb-4">Review &amp; Submit</h1>
      <p className="text-ink/70 mb-10">
        Confirm the equipment you need, add your dates, and we&apos;ll check availability.
      </p>

      {loaded && cart.length === 0 && (
        <div className="border border-ink/10 bg-white/40 p-8 text-center mb-8">
          <p className="text-ink/60 mb-4">Your equipment list is empty.</p>
          <Link href="/rentals" className="btn-primary">Browse Rentals</Link>
        </div>
      )}

      {cart.length > 0 && (
        <>
          <div className="space-y-2 mb-8">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3 border border-ink/10 bg-white/40 p-3">
                <span className="flex-1 text-sm font-medium">{item.name}</span>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => changeQty(item.id, Number(e.target.value))}
                  className="w-16 border border-ink/15 px-2 py-1 text-sm text-center focus-ring"
                />
                <button onClick={() => remove(item.id)} className="text-red-700 text-sm hover:underline">
                  Remove
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <input name="full_name" required placeholder="Full name" className="border border-ink/15 px-4 py-3 bg-white/60 focus-ring" />
              <input name="phone" required placeholder="Phone number" className="border border-ink/15 px-4 py-3 bg-white/60 focus-ring" />
              <input name="email" type="email" placeholder="Email (optional)" className="border border-ink/15 px-4 py-3 bg-white/60 focus-ring" />
              <input name="location" placeholder="Delivery / pickup location" className="border border-ink/15 px-4 py-3 bg-white/60 focus-ring" />
              <div>
                <label className="text-xs text-ink/50 block mb-1">Rental start date</label>
                <input name="rental_start_date" type="date" className="w-full border border-ink/15 px-4 py-3 bg-white/60 focus-ring" />
              </div>
              <div>
                <label className="text-xs text-ink/50 block mb-1">Rental end date</label>
                <input name="rental_end_date" type="date" className="w-full border border-ink/15 px-4 py-3 bg-white/60 focus-ring" />
              </div>
            </div>
            <textarea
              name="details"
              rows={3}
              placeholder="Anything else we should know (event type, delivery instructions, etc.)"
              className="w-full border border-ink/15 px-4 py-3 bg-white/60 focus-ring"
            />

            {error && <p className="text-red-700 text-sm">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto justify-center disabled:opacity-50">
              {loading ? 'Sending…' : 'Submit Equipment Request'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
