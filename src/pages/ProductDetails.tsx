import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, ShoppingBag, Sparkles, Check, ArrowLeft, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  
  // Try-On State
  const [tryOnActive, setTryOnActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [tryOnResult, setTryOnResult] = useState<any>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'original' | 'profile' | 'frontal'>('original');
  const [zoomLevel, setZoomLevel] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reviews State
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setLoading(false);
      });
      
    fetchReviews();
  }, [id]);

  const fetchReviews = () => {
    fetch(`/api/products/${id}/reviews`)
      .then(res => res.json())
      .then(data => setReviews(data));
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      // AI Sentiment Analysis in Frontend
      let aiSentiment = 'neutral';
      let aiTags = [];
      
      try {
        const prompt = `Analise esta avaliação de produto: "${newReview.comment}". 
        Retorne um objeto JSON com:
        {
          "sentiment": "positive" | "neutral" | "negative",
          "tags": ["tag1", "tag2"] // max 3 tags curtas como "conforto", "tamanho pequeno"
        }`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { responseMimeType: 'application/json' }
        });

        const aiResult = JSON.parse(response.text || '{}');
        aiSentiment = aiResult.sentiment || 'neutral';
        aiTags = aiResult.tags || [];
      } catch (err) {
        console.error('AI Sentiment Error:', err);
      }

      const res = await fetch(`/api/products/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: newReview.name,
          rating: newReview.rating,
          comment: newReview.comment,
          aiSentiment,
          aiTags
        })
      });
      if (res.ok) {
        setNewReview({ name: '', rating: 5, comment: '' });
        fetchReviews();
      }
    } catch (error) {
      console.error('Failed to submit review', error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleTryOnUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !product) return;

    setAnalyzing(true);
    setTryOnActive(true);
    setTryOnResult(null);
    
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          setUserPhoto(reader.result as string);
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });
      const base64Data = await base64Promise;

      const prompt = `Analise esta imagem para um provador virtual de sapatos.
      Produto: "${product.name}"
      Estilo: "${product.style}"
      
      Instruções:
      1. Verifique se a imagem mostra claramente os pés ou pernas do usuário no chão. Fotos de corpo inteiro são ideais.
      2. Identifique a posição e o ângulo exato dos pés.
      3. Se for válido, descreva detalhadamente como o sapato "${product.name}" deve ser posicionado (ângulo, inclinação, perspectiva) para parecer que a pessoa está realmente calçando-o.
      4. Se NÃO for válido (ex: foto apenas do rosto, pés cortados, ambiente muito escuro), explique o motivo e peça uma foto de corpo inteiro.
      5. Retorne um JSON estrito:
      {
        "isValid": boolean,
        "analysis": "descrição do caimento ou motivo de erro",
        "positioning_hints": "instruções técnicas detalhadas para a geração da imagem",
        "confidence": "high/medium/low",
        "suggestion": "dica para o usuário (ex: 'Tente uma foto com mais luz')"
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
      
      if (result.isValid) {
        const views: ('original' | 'profile' | 'frontal')[] = ['original', 'profile', 'frontal'];
        const generatedViews: any = {};

        // Generate views sequentially to avoid overwhelming the API
        for (const view of views) {
          try {
            let viewPrompt = "";
            if (view === 'original') {
              viewPrompt = `MODIFIQUE esta imagem para que a pessoa apareça calçando o sapato "${product.name}" (${product.style}). 
              O sapato deve estar perfeitamente alinhado com os pés da pessoa na posição original da foto. 
              Mantenha o fundo e as roupas. Adicione sombras realistas.`;
            } else if (view === 'profile') {
              viewPrompt = `Gere uma nova imagem mostrando uma vista de PERFIL (lateral) da mesma pessoa da foto original calçando o sapato "${product.name}" (${product.style}). 
              Mantenha as mesmas roupas e características físicas. O foco deve ser nos pés e no calçado.`;
            } else {
              viewPrompt = `Gere uma nova imagem mostrando uma vista FRONTAL (frente) da mesma pessoa da foto original calçando o sapato "${product.name}" (${product.style}). 
              Mantenha as mesmas roupas e características físicas. O foco deve ser nos pés e no calçado.`;
            }

            const genResponse = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: {
                parts: [
                  { inlineData: { data: base64Data, mimeType: file.type } },
                  { text: viewPrompt }
                ]
              }
            });

            let simulatedUrl = null;
            for (const part of genResponse.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData) {
                simulatedUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
              }
            }
            generatedViews[view] = simulatedUrl || userPhoto;
          } catch (genErr) {
            console.error(`Error generating ${view} view:`, genErr);
            generatedViews[view] = userPhoto;
          }
        }
        result.views = generatedViews;
      } else {
        result.views = { original: userPhoto, profile: userPhoto, frontal: userPhoto };
      }

      // Increment try-on count in backend
      fetch('/api/ai/try-on/increment', { method: 'POST' }).catch(console.error);

      setTryOnResult(result);
      setActiveView('original');
    } catch (error: any) {
      console.error('Error during try-on:', error);
      if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        setTryOnResult({
          isValid: false,
          analysis: 'O limite de uso da IA foi atingido para este mês. Por favor, tente novamente mais tarde ou entre em contato com o suporte.',
          confidence: 'low'
        });
      } else {
        setTryOnResult({
          isValid: false,
          analysis: 'Ocorreu um erro inesperado ao processar sua imagem. Por favor, tente novamente.',
          confidence: 'low'
        });
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const [error, setError] = useState<string | null>(null);

  const addToCart = () => {
    if (!selectedSize) {
      setError('Por favor, selecione um tamanho');
      return;
    }
    setError(null);
    // Simple mock cart
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push({ ...product, selectedSize });
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
    navigate('/cart');
  };

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (!product) return <div className="p-8 text-center">Produto não encontrado</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <button 
        onClick={() => navigate(-1)}
        className="mb-8 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-2">
        {/* Image / Try-On Area */}
        <div className="relative overflow-hidden rounded-3xl bg-gray-100 aspect-square lg:aspect-auto lg:h-[600px]">
          {tryOnActive ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 p-8 text-center">
              {analyzing ? (
                <div className="flex flex-col items-center gap-4">
                  <Sparkles className="h-12 w-12 animate-pulse text-indigo-600" />
                  <p className="text-lg font-medium text-gray-900">A IA está analisando seu pé e gerando o provador...</p>
                </div>
              ) : tryOnResult ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full w-full flex flex-col"
                >
                  {tryOnResult.isValid ? (
                    <div className="h-full w-full flex flex-col">
                      <div className="relative flex-1 overflow-hidden rounded-2xl bg-white shadow-lg group">
                        <div 
                          className="h-full w-full transition-transform duration-300 cursor-zoom-in"
                          style={{ transform: `scale(${zoomLevel})` }}
                          onClick={() => setZoomLevel(prev => prev === 1 ? 2 : 1)}
                        >
                          <img 
                            src={tryOnResult.views?.[activeView] || userPhoto || product.images[0]} 
                            alt="Virtual Try-On" 
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        
                        {/* Zoom Controls */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setZoomLevel(prev => Math.min(prev + 0.5, 3)); }}
                            className="bg-white/90 p-2 rounded-full shadow-sm hover:bg-white text-gray-700"
                            title="Aumentar Zoom"
                          >
                            <Sparkles className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setZoomLevel(1); }}
                            className="bg-white/90 p-2 rounded-full shadow-sm hover:bg-white text-gray-700"
                            title="Resetar Zoom"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>

                        {/* View Selector */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/20">
                          {(['original', 'profile', 'frontal'] as const).map(view => (
                            <button
                              key={view}
                              onClick={() => { setActiveView(view); setZoomLevel(1); }}
                              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                activeView === view 
                                  ? 'bg-white text-black shadow-sm' 
                                  : 'text-white hover:bg-white/20'
                              }`}
                            >
                              {view === 'original' ? 'Original' : view === 'profile' ? 'Perfil' : 'Frontal'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Analysis Text Below Image */}
                      <div className="mt-6 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 text-left">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="h-5 w-5 text-indigo-600" />
                          <h4 className="font-bold text-gray-900 uppercase tracking-wider text-sm">Análise do Provador Virtual</h4>
                        </div>
                        <p className="text-gray-700 leading-relaxed text-sm">{tryOnResult.analysis}</p>
                        {tryOnResult.suggestion && (
                          <div className="mt-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-2">
                            <span className="text-indigo-600 font-bold text-sm">💡</span>
                            <p className="text-xs text-indigo-800"><strong>Dica da IA:</strong> {tryOnResult.suggestion}</p>
                          </div>
                        )}
                        <button 
                          onClick={() => { setTryOnActive(false); setTryOnResult(null); }}
                          className="mt-6 w-full py-3 text-sm font-bold text-gray-500 hover:text-gray-700 border-t border-gray-100"
                        >
                          Voltar para o Produto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-lg">
                      <Camera className="h-12 w-12 text-red-500 mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Imagem não reconhecida</h3>
                      <p className="text-sm text-gray-600 mb-6">{tryOnResult.analysis || 'Por favor, envie uma foto clara dos seus pés ou pernas para o provador virtual.'}</p>
                      
                      <div className="bg-blue-50 p-4 rounded-xl mb-6 text-left w-full border border-blue-100">
                        <p className="text-xs font-bold text-blue-800 uppercase mb-2">Dica para melhor precisão:</p>
                        <ul className="text-xs text-blue-700 list-disc ml-4 space-y-1">
                          <li>Tire a foto em um local bem iluminado.</li>
                          <li>Mantenha a câmera na altura do tornozelo.</li>
                          <li>Certifique-se de que seus pés estão totalmente visíveis.</li>
                        </ul>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-black text-white px-6 py-2 rounded-full text-sm font-medium"
                        >
                          Tentar Outra Foto
                        </button>
                        <button 
                          onClick={() => setTryOnActive(false)}
                          className="text-gray-500 text-sm font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : null}
            </div>
          ) : (
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{product.name}</h1>
          <p className="mt-4 text-2xl font-medium text-gray-900">R${product.price}</p>

          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-900">Selecione o Tamanho</h3>
            <div className="mt-4 grid grid-cols-4 gap-4 sm:grid-cols-6">
              {product.sizes.map((size: number) => (
                <button
                  key={size}
                  onClick={() => {
                    setSelectedSize(size);
                    setError(null);
                  }}
                  className={`flex items-center justify-center rounded-xl border py-3 text-sm font-medium uppercase transition-all
                    ${selectedSize === size 
                      ? 'border-black bg-black text-white' 
                      : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          <div className="mt-10 flex flex-col gap-4">
            <button
              onClick={addToCart}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-8 py-4 text-base font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            >
              <ShoppingBag className="h-5 w-5" />
              Adicionar ao Carrinho
            </button>
            
            <div className="mt-4 rounded-2xl bg-indigo-50 p-6 border border-indigo-100">
              <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Provador Virtual Inteligente
              </h3>
              <p className="text-sm text-indigo-700 mb-4">
                Nossa IA vai analisar seu look e simular o sapato nos seus pés com precisão.
              </p>
              <ul className="text-xs text-indigo-800 space-y-2 list-disc ml-5 mb-6">
                <li>Use uma foto de <strong>corpo inteiro</strong> ou que mostre bem seus <strong>pés no chão</strong>.</li>
                <li>Certifique-se de que o ambiente esteja <strong>bem iluminado</strong>.</li>
                <li>Fique em uma posição natural para um melhor alinhamento.</li>
              </ul>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-indigo-700 hover:scale-105"
              >
                <Camera className="h-6 w-6" />
                Provar Agora
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleTryOnUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-8">
            <h3 className="text-sm font-medium text-gray-900">Descrição</h3>
            <div className="mt-4 prose prose-sm text-gray-500">
              <p>Experimente a combinação perfeita de estilo e conforto com o {product.name}. Use nosso Provador Virtual com IA para ver exatamente como eles ficam nos seus pés antes de comprar.</p>
              <ul className="mt-4 list-disc pl-4">
                <li>Estilo: {product.style}</li>
                <li>Cores Disponíveis: {product.colors.join(', ')}</li>
                <li>Em Estoque: {product.stock} unidades</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16 border-t border-gray-200 pt-10">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Avaliações de Clientes</h2>
        
        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Write a review */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-medium text-gray-900">Escrever uma Avaliação</h3>
            <p className="mt-1 text-sm text-gray-500">Compartilhe sua opinião e ajude outros clientes.</p>
            
            <form onSubmit={handleReviewSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  required
                  value={newReview.name}
                  onChange={e => setNewReview({...newReview, name: e.target.value})}
                  className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nota</label>
                <div className="mt-1 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({...newReview, rating: star})}
                      className="focus:outline-none"
                    >
                      <Star className={`h-6 w-6 ${star <= newReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Comentário</label>
                <textarea
                  required
                  rows={4}
                  value={newReview.comment}
                  onChange={e => setNewReview({...newReview, comment: e.target.value})}
                  className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                />
              </div>
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full rounded-full bg-black px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-70"
              >
                {submittingReview ? 'Enviando...' : 'Enviar Avaliação'}
              </button>
            </form>
          </div>

          {/* Review List */}
          <div className="lg:col-span-2">
            {reviews.length === 0 ? (
              <p className="text-gray-500">Nenhuma avaliação ainda. Seja o primeiro a avaliar este produto!</p>
            ) : (
              <div className="space-y-8">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-8 last:border-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{review.customerName}</h4>
                      <p className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <p className="mt-4 text-gray-600">{review.comment}</p>
                    
                    {/* Display AI Tags if available */}
                    {review.aiTags && review.aiTags.length > 0 && (
                      <div className="mt-4 flex gap-2">
                        {review.aiTags.map((tag: string, idx: number) => (
                          <span key={idx} className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
