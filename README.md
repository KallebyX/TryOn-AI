# TryOn AI Shoes Platform

## 🧠 Arquitetura do Sistema

A plataforma foi projetada utilizando uma arquitetura moderna baseada em microserviços (simulada neste protótipo full-stack) para garantir alta escalabilidade e performance.

### Componentes Principais:
1. **Frontend (React + Vite + Tailwind CSS):**
   - Interface "Apple-like", minimalista e focada em conversão.
   - Utiliza `framer-motion` para micro-interações fluidas.
   - Responsivo (Mobile-first) para garantir a melhor experiência no celular, onde a câmera é mais utilizada.

2. **Backend (Node.js + Express):**
   - API RESTful para gerenciar produtos, pedidos e integrações.
   - Atua como um *BFF (Backend for Frontend)*, orquestrando as chamadas para os serviços de IA.

3. **Motor de IA (Gemini API):**
   - **Virtual Try-On:** Analisa a foto do pé do usuário e o sapato selecionado, retornando uma análise de fit e simulando a renderização (neste protótipo, a renderização visual é simulada, mas a análise de contexto é real via Gemini Vision).
   - **Fashion AI (Recomendação):** Analisa o look do usuário (upload de foto) e classifica o estilo (casual, formal, sport), recomendando os sapatos do catálogo que melhor combinam.

4. **Banco de Dados (PostgreSQL - Modelo):**
   - *Nota: O protótipo usa arrays em memória para facilitar a execução imediata, mas a modelagem relacional ideal seria:*
   - `Products`: id, name, price, style, stock, created_at
   - `ProductImages`: id, product_id, url, is_primary
   - `ProductVariants`: id, product_id, size, color, stock
   - `Orders`: id, customer_name, customer_phone, total_amount, status
   - `OrderItems`: id, order_id, product_id, variant_id, quantity, price

5. **Armazenamento (AWS S3 / Cloud Storage):**
   - Para armazenar as imagens dos produtos e as fotos temporárias enviadas pelos usuários para o Try-On.

6. **Integração WhatsApp:**
   - O backend simula o envio de mensagens via WhatsApp API (ex: Twilio ou Meta Graph API) assim que um pedido é criado.

---

## 📂 Estrutura de Pastas

```text
/
├── server.ts                 # Backend Express (APIs, Integração Gemini)
├── src/
│   ├── App.tsx               # Roteamento principal (React Router)
│   ├── main.tsx              # Entry point do React
│   ├── index.css             # Tailwind CSS global
│   ├── components/           # Componentes reutilizáveis
│   │   ├── Navbar.tsx        # Navegação superior
│   │   └── ProductCard.tsx   # Card de produto com animação
│   ├── pages/                # Páginas da aplicação
│   │   ├── Home.tsx          # Feed de produtos e Fashion AI (Recomendação)
│   │   ├── ProductDetails.tsx# Detalhes do produto e Virtual Try-On
│   │   ├── Cart.tsx          # Carrinho e Checkout (Coleta de WhatsApp)
│   │   └── Admin.tsx         # Dashboard do Lojista (Métricas e Pedidos)
│   └── lib/
│       └── utils.ts          # Funções utilitárias (ex: cn para Tailwind)
```

---

## 🚀 Roadmap de Desenvolvimento (MVP → Escala)

### Fase 1: MVP (Atual)
- Catálogo de produtos básico.
- Simulação de Virtual Try-On com IA Generativa (análise de contexto).
- Recomendação de estilo baseada em imagem do look.
- Carrinho simples e coleta de dados para WhatsApp.
- Dashboard admin básico.

### Fase 2: Integrações Reais
- **Banco de Dados:** Migrar de memória para PostgreSQL (via Prisma ORM).
- **Pagamentos:** Integrar Stripe ou MercadoPago (PIX/Cartão).
- **WhatsApp:** Integrar API oficial da Meta para envio real de mensagens de status.
- **Try-On Visual:** Integrar um modelo de difusão (Stable Diffusion + ControlNet) hospedado em GPU (ex: Replicate ou RunPod) para gerar a imagem sobreposta real.

### Fase 3: Escala (SaaS)
- **Multi-tenant:** Permitir que múltiplos lojistas criem contas e gerenciem seus próprios catálogos.
- **Subdomínios:** Cada loja ter seu próprio link (ex: `loja1.tryonshoes.com`).
- **Analytics Avançado:** Rastrear taxa de conversão de usuários que usaram o Try-On vs. os que não usaram.

---

## 💡 Sugestão de Stack Ideal para Produção
- **Frontend:** Next.js (React) hospedado na Vercel (para SSR e SEO).
- **Backend/API:** NestJS ou FastAPI (Python) se houver muito processamento de IA local.
- **Banco de Dados:** PostgreSQL hospedado na Supabase ou AWS RDS.
- **IA (Visão):** Modelos customizados no AWS SageMaker ou APIs como Gemini 1.5 Pro para análise multimodal.
- **Mensageria:** RabbitMQ para processar as imagens do Try-On de forma assíncrona sem travar a API.
