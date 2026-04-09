import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, MessageCircle, Gift } from 'lucide-react';

export default function Cart() {
  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerPoints, setCustomerPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
  }, []);

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  
  // Check points when phone number changes
  useEffect(() => {
    if (customerPhone.length >= 10) {
      fetch(`/api/customers/${customerPhone}`)
        .then(res => {
          if (res.ok) return res.json();
          return { points: 0 };
        })
        .then(data => setCustomerPoints(data.points))
        .catch(() => setCustomerPoints(0));
    } else {
      setCustomerPoints(0);
      setUsePoints(false);
    }
  }, [customerPhone]);

  const discount = usePoints ? Math.min(customerPoints / 100, total) : 0;
  const finalTotal = total - discount;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    setIsCheckingOut(true);

    try {
      // Create an order for the first item (simplified for prototype)
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: cart[0].id,
          customerName,
          customerPhone,
          items: cart,
          usePoints
        }),
      });

      if (res.ok) {
        localStorage.removeItem('cart');
        setCart([]);
        alert('Pedido realizado com sucesso! Você receberá uma confirmação no WhatsApp em breve.');
        navigate('/');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Falha ao realizar o pedido.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Carrinho de Compras</h1>

      {cart.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-lg text-gray-500">Seu carrinho está vazio.</p>
          <button onClick={() => navigate('/')} className="mt-4 text-indigo-600 font-medium hover:text-indigo-500">
            Continuar Comprando
          </button>
        </div>
      ) : (
        <div className="mt-12">
          <ul role="list" className="divide-y divide-gray-200 border-t border-b border-gray-200">
            {cart.map((item, index) => (
              <li key={index} className="flex py-6 sm:py-10">
                <div className="shrink-0">
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="h-24 w-24 rounded-xl object-cover object-center sm:h-32 sm:w-32"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                  <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                    <div>
                      <div className="flex justify-between">
                        <h3 className="text-sm">
                          <a href="#" className="font-medium text-gray-700 hover:text-gray-800">
                            {item.name}
                          </a>
                        </h3>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Tamanho: {item.selectedSize}</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">${item.price}</p>
                    </div>

                    <div className="mt-4 sm:mt-0 sm:pr-9">
                      <button
                        type="button"
                        onClick={() => removeFromCart(index)}
                        className="-m-2 inline-flex p-2 text-gray-400 hover:text-gray-500"
                      >
                        <span className="sr-only">Remover</span>
                        <Trash2 className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-10 bg-gray-50 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Detalhes da Compra</h2>
            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                <input
                  type="text"
                  id="name"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Número do WhatsApp</label>
                <input
                  type="tel"
                  id="phone"
                  required
                  placeholder="+55 11 99999-9999"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                />
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" /> Enviaremos atualizações do pedido pelo WhatsApp.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-6">
                <div className="flex items-center justify-between text-base text-gray-900 mb-2">
                  <p>Subtotal</p>
                  <p>${total.toFixed(2)}</p>
                </div>
                
                {customerPoints > 0 && (
                  <div className="flex items-center justify-between text-sm mb-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-indigo-600" />
                      <span className="text-indigo-900 font-medium">Você tem {customerPoints} pontos (R${(customerPoints/100).toFixed(2)})</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={usePoints} 
                        onChange={(e) => setUsePoints(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-indigo-700 text-xs font-medium">Usar Pontos</span>
                    </label>
                  </div>
                )}

                {usePoints && discount > 0 && (
                  <div className="flex items-center justify-between text-sm text-green-600 mb-2">
                    <p>Desconto de Pontos</p>
                    <p>-R${discount.toFixed(2)}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-lg font-bold text-gray-900 mt-4">
                  <p>Total</p>
                  <p>${finalTotal.toFixed(2)}</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCheckingOut}
                className="mt-6 w-full rounded-full border border-transparent bg-black px-4 py-4 text-base font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-70"
              >
                {isCheckingOut ? 'Processando...' : 'Finalizar Compra'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
