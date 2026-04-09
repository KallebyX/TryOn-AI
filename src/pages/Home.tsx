import React, { useState, useEffect, useRef } from 'react';
import { Camera, Sparkles, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  const handleOutfitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    const formData = new FormData();
    formData.append('outfitImage', file);

    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setRecommendation(data);
    } catch (error) {
      console.error('Error analyzing outfit:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black px-4 py-24 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1600&q=80" 
            alt="Sneakers background" 
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Encontre o Sapato Perfeito com IA
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-xl text-gray-300"
          >
            Envie uma foto do seu look e deixe nossa IA de Moda recomendar os sapatos perfeitos. Prove-os virtualmente antes de comprar.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10 flex justify-center"
          >
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={analyzing}
              className="group relative flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-black transition-all hover:bg-gray-100 hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
            >
              {analyzing ? (
                <Sparkles className="h-5 w-5 animate-pulse" />
              ) : (
                <Camera className="h-5 w-5 transition-transform group-hover:rotate-12" />
              )}
              {analyzing ? 'Analisando Look...' : 'Analisar Meu Look'}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleOutfitUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </motion.div>
        </div>
      </section>

      {/* AI Recommendations */}
      {recommendation && (
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-indigo-50 to-purple-50 p-8 border border-indigo-100">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="h-6 w-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">Estilista de Moda IA</h2>
            </div>
            <p className="text-lg text-gray-700 mb-4">{recommendation.analysis}</p>
            <div className="flex flex-wrap gap-2 mb-8">
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800">
                Estilo: <span className="capitalize ml-1">{recommendation.outfitStyle}</span>
              </span>
              {recommendation.recommendedColors?.map((color: string) => (
                <span key={color} className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
                  Cor: <span className="capitalize ml-1">{color}</span>
                </span>
              ))}
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-6">Recomendado para este look:</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recommendation.recommendations?.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Product Feed */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Tendências</h2>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-gray-200"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
