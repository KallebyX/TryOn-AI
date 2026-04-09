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
    
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      const base64Data = await base64Promise;

      const prompt = `Analise esta imagem para um provador virtual de sapatos.
      Produto: "${product.name}"
      Estilo: "${product.style}"
      
      Instruções:
      1. Verifique se a imagem mostra claramente os pés ou pernas do usuário.
      2. Identifique a posição e o ângulo dos pés.
      3. Se for válido, descreva detalhadamente como o sapato "${product.name}" deve ser posicionado para parecer realista.
      4. Retorne um JSON estrito:
      {
        "isValid": boolean,
        "analysis": "descrição detalhada do caimento",
        "positioning_hints": "instruções para a geração da imagem",
        "confidence": "high/medium/low"
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
        // Try to generate a simulation image using gemini-3.1-flash-image-preview for maximum precision
        try {
          // @ts-ignore
          if (!await window.aistudio?.hasSelectedApiKey()) {
            // @ts-ignore
            await window.aistudio?.openSelectKey();
          }
          
          const userAi = new GoogleGenAI({});
          
          const genResponse = await userAi.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: {
              parts: [
                { inlineData: { data: base64Data, mimeType: file.type } },
                { text: `Coloque o sapato "${product.name}" (${product.style}) nos pés da pessoa nesta imagem. 
                O sapato deve estar perfeitamente alinhado com a posição dos pés: ${result.positioning_hints}.
                Mantenha a iluminação, sombras e o fundo originais. O resultado deve parecer uma fotografia real de alta qualidade.` }
              ]
            },
            config: {
              // @ts-ignore
              imageConfig: {
                aspectRatio: "1:1",
                imageSize: "1K"
              }
            }
          });

          let simulatedUrl = product.images[0];
          for (const part of genResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              simulatedUrl = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
          result.simulatedImageUrl = simulatedUrl;
        } catch (genErr: any) {
          console.error('Generation error:', genErr);
          // Fallback to gemini-2.5-flash-image if user key fails or is not provided
          try {
            const fallbackResponse = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: {
                parts: [
                  { inlineData: { data: base64Data, mimeType: file.type } },
                  { text: `Coloque o sapato "${product.name}" nos pés da pessoa nesta imagem de forma realista.` }
                ]
              }
            });
            for (const part of fallbackResponse.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData) {
                result.simulatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
                break;
              }
            }
          } catch (fallbackErr) {
            result.simulatedImageUrl = product.images[0];
          }
        }
      }

      // Increment try-on count in backend
      fetch('/api/ai/try-on/increment', { method: 'POST' }).catch(console.error);

      setTryOnResult(result);
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
                    <>
                      <div className="relative flex-1 overflow-hidden rounded-2xl bg-white shadow-lg">
                        <img 
                          src={tryOnResult.simulatedImageUrl} 
                          alt="Virtual Try-On" 
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/90 p-4 backdrop-blur-sm shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <Check className="h-5 w-5 text-green-500" />
                            <span className="font-semibold text-gray-900">Combinação Perfeita</span>
                          </div>
                          <p className="text-sm text-gray-700">{tryOnResult.analysis}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setTryOnActive(false)}
                        className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Ver Produto Original
                      </button>
                    </>
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

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <button
              onClick={addToCart}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-black px-8 py-4 text-base font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            >
              <ShoppingBag className="h-5 w-5" />
              Adicionar ao Carrinho
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-indigo-600 bg-white px-8 py-4 text-base font-medium text-indigo-600 transition-colors hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
            >
              <Camera className="h-5 w-5" />
              Provador Virtual
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleTryOnUpload} 
              accept="image/*" 
              className="hidden" 
            />
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
