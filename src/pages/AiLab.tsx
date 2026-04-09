import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import Markdown from 'react-markdown';
import { MessageSquare, Image as ImageIcon, Video, Mic, Send, Sparkles, MapPin, Search, Camera } from 'lucide-react';

// Initialize Gemini for general tasks
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function AiLab() {
  const [activeTab, setActiveTab] = useState<'chat' | 'image' | 'video' | 'live' | 'analysis'>('chat');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-8">
        <Sparkles className="h-8 w-8 text-indigo-600" />
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Laboratório de Inovação IA</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="flex flex-col space-y-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'chat' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MessageSquare className="h-5 w-5" />
              Assistente de Moda
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'image' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ImageIcon className="h-5 w-5" />
              Estúdio de Design
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'video' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Video className="h-5 w-5" />
              Vitrine de Vídeo
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'live' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Mic className="h-5 w-5" />
              Consultoria ao Vivo
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === 'analysis' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ImageIcon className="h-5 w-5" />
              Análise de Imagem
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[600px] overflow-hidden">
          {activeTab === 'chat' && <ChatInterface />}
          {activeTab === 'image' && <ImageStudio />}
          {activeTab === 'video' && <VideoStudio />}
          {activeTab === 'live' && <LiveConsultation />}
          {activeTab === 'analysis' && <ImageAnalysis />}
        </div>
      </div>
    </div>
  );
}

// --- Chat Interface ---
function ChatInterface() {
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // We need to keep track of the chat session
  const [chatSession, setChatSession] = useState<any>(null);

  useEffect(() => {
    // Initialize chat session
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "Você é um assistente de moda útil para a TryOn AI Shoes. Você pode ajudar os usuários a encontrar sapatos, verificar tendências e localizar lojas.",
        tools: [{ googleSearch: {} }],
        toolConfig: { includeServerSideToolInvocations: true }
      }
    });
    setChatSession(chat);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatSession) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await chatSession.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: response.text || '' }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Desculpe, encontrei um erro.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Assistente de Moda</h2>
          <p className="text-sm text-gray-500">Alimentado por Gemini 3.1 Pro com Busca Google</p>
        </div>
        <div className="flex gap-2 text-gray-400">
          <Search className="h-5 w-5" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>Olá! Posso ajudar você a encontrar as últimas tendências de calçados ou localizar uma loja próxima.</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'
            }`}>
              <div className="markdown-body text-sm">
                <Markdown>{msg.text}</Markdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl p-4 flex gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-100">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Pergunte sobre tendências, lojas ou conselhos de moda..."
            className="flex-1 rounded-full border-gray-300 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-full bg-indigo-600 p-3 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Image Studio ---
function ImageStudio() {
  const [mode, setMode] = useState<'generate' | 'edit'>('generate');
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1K');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [sourceImage, setSourceImage] = useState<string | null>(null);

  const handleSourceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setError('');
    
    try {
      // @ts-ignore
      if (!await window.aistudio?.hasSelectedApiKey()) {
        // @ts-ignore
        await window.aistudio?.openSelectKey();
      }
      
      const userAi = new GoogleGenAI({});
      
      if (mode === 'generate') {
        const response = await userAi.models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: { parts: [{ text: prompt }] },
          config: {
            // @ts-ignore
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: size
            }
          }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            setImageUrl(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      } else {
        if (!sourceImage) return;
        const base64Data = sourceImage.split(',')[1];
        const mimeType = sourceImage.split(';')[0].split(':')[1];
        
        const response = await userAi.models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: {
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: prompt }
            ]
          }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            setImageUrl(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to process image. Did you select a valid API key?');
      // @ts-ignore
      if (err.message?.includes('not found')) window.aistudio?.openSelectKey();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-gray-900">Estúdio de Design</h2>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('generate')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'generate' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Gerar
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'edit' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Editar
          </button>
        </div>
      </div>
      <p className="text-gray-500 mb-8">
        {mode === 'generate' ? 'Gere designs de sapatos de alta qualidade usando Gemini 3 Pro Image.' : 'Edite uma imagem existente usando Gemini 3.1 Flash Image.'}
      </p>

      {mode === 'edit' && (
        <div className="mb-4">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center h-32 relative bg-gray-50">
            {sourceImage ? (
              <img src={sourceImage} alt="Source" className="h-full object-contain" />
            ) : (
              <div className="text-center text-gray-500 text-sm">
                <Camera className="mx-auto h-6 w-6 mb-1" />
                Carregue a imagem para editar
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleSourceImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder={mode === 'generate' ? "Descreva um design de sapato..." : "Descreva como editar a imagem..."}
          className="flex-1 rounded-xl border-gray-300 shadow-sm p-3 border focus:ring-indigo-500 focus:border-indigo-500"
        />
        {mode === 'generate' && (
          <select
            value={size}
            onChange={e => setSize(e.target.value)}
            className="rounded-xl border-gray-300 shadow-sm p-3 border focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="1K">Resolução 1K</option>
            <option value="2K">Resolução 2K</option>
            <option value="4K">Resolução 4K</option>
          </select>
        )}
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt || (mode === 'edit' && !sourceImage)}
          className="rounded-xl bg-black px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Processando...' : mode === 'generate' ? 'Gerar' : 'Editar'}
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-center overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center text-gray-400">
            <Sparkles className="h-12 w-12 animate-pulse mb-4" />
            <p>{mode === 'generate' ? 'Desenhando seu sapato...' : 'Editando imagem...'}</p>
          </div>
        ) : imageUrl ? (
          <img src={imageUrl} alt="Result" className="w-full h-full object-contain" />
        ) : (
          <div className="text-gray-400 flex flex-col items-center">
            <ImageIcon className="h-12 w-12 mb-2" />
            <p>Seu {mode === 'generate' ? 'design' : 'imagem editada'} aparecerá aqui</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Video Studio ---
function VideoStudio() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [sourceImage, setSourceImage] = useState<string | null>(null);

  const handleSourceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt && !sourceImage) return;
    setLoading(true);
    setError('');
    
    try {
      // @ts-ignore
      if (!await window.aistudio?.hasSelectedApiKey()) {
        // @ts-ignore
        await window.aistudio?.openSelectKey();
      }
      
      const userAi = new GoogleGenAI({});
      
      const config: any = {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      };

      const params: any = {
        model: 'veo-3.1-lite-generate-preview',
        config
      };

      if (prompt) params.prompt = prompt;
      
      if (sourceImage) {
        const base64Data = sourceImage.split(',')[1];
        const mimeType = sourceImage.split(';')[0].split(':')[1];
        params.image = {
          imageBytes: base64Data,
          mimeType: mimeType
        };
      }
      
      let operation = await userAi.models.generateVideos(params);

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await userAi.operations.getVideosOperation({operation: operation});
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        // @ts-ignore
        const apiKey = process.env.API_KEY; // Injected by AI Studio
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: { 'x-goog-api-key': apiKey },
        });
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha ao gerar vídeo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Vitrine de Vídeo</h2>
      <p className="text-gray-500 mb-8">Anime seus designs de sapatos em vídeos cinematográficos usando Veo.</p>

      <div className="mb-4">
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center h-32 relative bg-gray-50">
          {sourceImage ? (
            <img src={sourceImage} alt="Source" className="h-full object-contain" />
          ) : (
            <div className="text-center text-gray-500 text-sm">
              <Camera className="mx-auto h-6 w-6 mb-1" />
              Carregue uma imagem para animar (opcional)
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleSourceImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Descreva o vídeo (ex: Um movimento cinematográfico de um tênis brilhante)"
          className="flex-1 rounded-xl border-gray-300 shadow-sm p-3 border focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || (!prompt && !sourceImage)}
          className="rounded-xl bg-black px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Animando...' : 'Gerar Vídeo'}
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-center overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center text-gray-400">
            <Video className="h-12 w-12 animate-pulse mb-4" />
            <p>Gerando vídeo (isso pode levar alguns minutos)...</p>
          </div>
        ) : videoUrl ? (
          <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
        ) : (
          <div className="text-gray-400 flex flex-col items-center">
            <Video className="h-12 w-12 mb-2" />
            <p>Seu vídeo aparecerá aqui</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Live Consultation ---
function LiveConsultation() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const sessionRef = useRef<any>(null);

  const toggleConnection = async () => {
    if (isConnected) {
      sessionRef.current?.close();
      setIsConnected(false);
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      // In a real app, we would set up Web Audio API here to capture mic and play audio
      // For this prototype, we'll just connect to the Live API to show the capability
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            // Here we would start sending audio chunks
          },
          onmessage: async (message: any) => {
            // Here we would decode and play audio chunks
          },
          onerror: (err) => {
            console.error(err);
            setError('Connection error');
            setIsConnected(false);
          },
          onclose: () => {
            setIsConnected(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are a friendly fashion consultant. Help the user choose the perfect shoes.",
        },
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error(err);
      setError('Failed to connect to Live API');
      setIsConnecting(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col items-center justify-center text-center">
      <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-all duration-500 ${
        isConnected ? 'bg-indigo-100 shadow-[0_0_50px_rgba(79,70,229,0.5)]' : 'bg-gray-100'
      }`}>
        <Mic className={`h-12 w-12 ${isConnected ? 'text-indigo-600 animate-pulse' : 'text-gray-400'}`} />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Consultoria de Voz ao Vivo</h2>
      <p className="text-gray-500 mb-8 max-w-md">
        Fale diretamente com nosso Consultor de Moda IA. Obtenha conselhos em tempo real sobre estilos, ajustes e tendências.
      </p>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <button
        onClick={toggleConnection}
        disabled={isConnecting}
        className={`rounded-full px-8 py-4 font-medium text-white transition-colors ${
          isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
        } disabled:opacity-50`}
      >
        {isConnecting ? 'Conectando...' : isConnected ? 'Encerrar Consultoria' : 'Iniciar Consultoria'}
      </button>
    </div>
  );
}

// --- Image Analysis ---
function ImageAnalysis() {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image || !prompt) return;
    setLoading(true);
    setResult('');
    try {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: prompt }
          ]
        }
      });
      setResult(response.text || '');
    } catch (err) {
      console.error(err);
      setResult('Falha ao analisar imagem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Análise de Imagem</h2>
      <p className="text-gray-500 mb-8">Carregue uma foto de sapatos ou um look para obter insights detalhados da IA.</p>

      <div className="flex flex-col md:flex-row gap-8 flex-1">
        <div className="flex-1 flex flex-col gap-4">
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[300px] relative bg-gray-50">
            {image ? (
              <img src={image} alt="Upload" className="w-full h-full object-contain rounded-xl" />
            ) : (
              <div className="text-center">
                <Camera className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-500">Clique para carregar uma imagem</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Pergunte algo sobre esta imagem..."
              className="flex-1 rounded-xl border-gray-300 shadow-sm p-3 border focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !image || !prompt}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Analisando...' : 'Analisar'}
            </button>
          </div>
        </div>

        <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 p-6 overflow-y-auto max-h-[500px]">
          <h3 className="font-semibold text-gray-900 mb-4">Resultado da Análise</h3>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span>Gemini está analisando...</span>
            </div>
          ) : result ? (
            <div className="markdown-body text-sm text-gray-700">
              <Markdown>{result}</Markdown>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Carregue uma imagem e faça uma pergunta para ver o resultado aqui.</p>
          )}
        </div>
      </div>
    </div>
  );
}
