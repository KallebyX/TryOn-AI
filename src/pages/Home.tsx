import React, { useState, useEffect, useRef } from 'react';
import { Camera, Sparkles, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import ProductCard from '../components/ProductCard';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
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
    
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      const base64Data = await base64Promise;

      const prompt = `Analise este look. Qual é o estilo? (casual, formal, esportivo). 
      Com base no estilo, recomende o melhor estilo de sapato.
      Retorne um objeto JSON:
      {
        "outfitStyle": "casual|formal|esportivo",
        "analysis": "breve explicação",
        "recommendedColors": ["cor1", "cor2"]
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: file.type
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
        }
      });

      const result = JSON.parse(response.text || '{}');
      
      // Filter products based on AI result
      const recommendedProducts = products.filter((p: any) => 
        p.style.toLowerCase() === result.outfitStyle?.toLowerCase() || 
        result.recommendedColors?.some((c: string) => p.colors.join(' ').toLowerCase().includes(c.toLowerCase()))
      );

      setRecommendation({
        ...result,
        recommendations: recommendedProducts.length > 0 ? recommendedProducts : products.slice(0, 4)
      });
    } catch (error) {
      console.error('Error analyzing outfit:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const allSizes = Array.from(new Set(products.flatMap((p: any) => p.sizes))).sort((a, b) => a - b);

  const toggleSize = (size: number) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const filteredProducts = products.filter((product: any) => {
    if (selectedSizes.length === 0) return true;
    return selectedSizes.some(size => product.sizes.includes(size));
  });

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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Tendências</h2>
          
          {/* Size Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">Filtrar por Tamanho:</span>
            {allSizes.map(size => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition-all ${
                  selectedSizes.includes(size)
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-900 border-gray-200 hover:border-gray-400'
                }`}
              >
                {size}
              </button>
            ))}
            {selectedSizes.length > 0 && (
              <button
                onClick={() => setSelectedSizes([])}
                className="ml-2 text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-gray-200"></div>
            ))}
          </div>
        ) : (
          <>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-lg text-gray-500">Nenhum produto encontrado para os tamanhos selecionados.</p>
                <button 
                  onClick={() => setSelectedSizes([])}
                  className="mt-4 text-indigo-600 font-medium hover:text-indigo-500"
                >
                  Ver todos os produtos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {filteredProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
