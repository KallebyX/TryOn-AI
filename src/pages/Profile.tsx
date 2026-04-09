import React, { useState } from 'react';
import { User, Gift, Clock, Package } from 'lucide-react';

export default function Profile() {
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/customers/${phone}`);
      if (res.ok) {
        const data = await res.json();
        setCustomer(data);
      } else {
        setError('Cliente não encontrado. Tente 11999999999 para a conta de demonstração.');
      }
    } catch (err) {
      setError('Falha ao buscar perfil.');
    } finally {
      setLoading(false);
    }
  };

  if (!customer) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100 text-center">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Perfil do Cliente</h2>
          <p className="text-gray-500 mb-8">Digite seu número de WhatsApp para ver seus pontos e histórico de pedidos.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="tel"
              required
              placeholder="ex: 11999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-black px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-70"
            >
              {loading ? 'Carregando...' : 'Ver Perfil'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Bem-vindo, {customer.name}</h1>
        <button onClick={() => setCustomer(null)} className="text-sm font-medium text-gray-500 hover:text-gray-900">
          Sair
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Loyalty Points Card */}
        <div className="col-span-1 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Gift className="h-6 w-6 text-indigo-200" />
            <h2 className="text-xl font-semibold">Recompensas TryOn</h2>
          </div>
          <p className="text-5xl font-bold mb-2">{customer.points}</p>
          <p className="text-indigo-100 mb-6">Pontos Disponíveis</p>
          
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-sm font-medium">Valor: R${(customer.points / 100).toFixed(2)}</p>
            <p className="text-xs text-indigo-200 mt-1">Use pontos no checkout para descontos. Ganhe 10 pontos a cada R$1 gasto.</p>
          </div>
        </div>

        {/* Order History */}
        <div className="col-span-1 md:col-span-2 rounded-3xl bg-white p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="h-6 w-6 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900">Histórico de Pedidos</h2>
          </div>

          {customer.orders && customer.orders.length > 0 ? (
            <div className="space-y-6">
              {customer.orders.map((order: any) => (
                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-gray-50 p-3">
                      <Package className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Pedido #{order.id.substring(0, 8)}</p>
                      <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                          {order.status}
                        </span>
                        {order.pointsEarned > 0 && (
                          <span className="text-xs font-medium text-indigo-600">+{order.pointsEarned} pts</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 text-right">
                    <p className="font-semibold text-gray-900">R${order.total?.toFixed(2) || '0.00'}</p>
                    {order.discount > 0 && (
                      <p className="text-xs text-green-600">Economizou R${order.discount.toFixed(2)} com pontos</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nenhum pedido encontrado.</p>
          )}
        </div>
      </div>
    </div>
  );
}
