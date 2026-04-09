import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Mock Database
interface Product {
  id: string;
  name: string;
  price: number;
  sizes: number[];
  colors: string[];
  stock: number;
  images: string[];
  style: string;
}

interface Order {
  id: string;
  productId: string;
  status: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  pointsEarned: number;
  pointsUsed: number;
  discount: number;
  total: number;
}

interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  aiSentiment?: 'positive' | 'neutral' | 'negative';
  aiTags?: string[];
}

interface Customer {
  phone: string;
  name: string;
  points: number;
}

let products: Product[] = [
  {
    id: '1',
    name: 'Air Max Pro',
    price: 199.99,
    sizes: [38, 39, 40, 41, 42],
    colors: ['Preto', 'Branco', 'Vermelho'],
    stock: 50,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'],
    style: 'esportivo',
  },
  {
    id: '2',
    name: 'Couro Clássico',
    price: 149.99,
    sizes: [39, 40, 41, 42, 43],
    colors: ['Marrom', 'Preto'],
    stock: 30,
    images: ['https://images.unsplash.com/photo-1614252209825-980f82662016?w=800&q=80'],
    style: 'formal',
  },
  {
    id: '3',
    name: 'Tênis Urbano',
    price: 129.99,
    sizes: [36, 37, 38, 39, 40],
    colors: ['Branco/Preto'],
    stock: 100,
    images: ['https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80'],
    style: 'casual',
  }
];

let orders: Order[] = [];
let reviews: Review[] = [
  {
    id: 'r1',
    productId: '1',
    customerName: 'João Silva',
    rating: 5,
    comment: 'Muito confortável, excelente para correr!',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    aiSentiment: 'positive',
    aiTags: ['confortável', 'corrida']
  }
];
let customers: Customer[] = [
  { phone: '11999999999', name: 'João Silva', points: 500 } // 500 points = $5.00 discount
];

let tryOnCount = 124; // Initial mock value

const POINTS_PER_DOLLAR = 10; // Earn 10 points per $1 spent
const POINTS_REDEMPTION_RATE = 100; // 100 points = $1 discount

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // --- API ROUTES ---

  // 1. Products API
  app.get('/api/products', (req, res) => {
    res.json(products);
  });

  app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Produto não encontrado' });
    }
  });

  // 2. Orders & Loyalty API
  app.get('/api/orders', (req, res) => {
    res.json(orders);
  });

  app.post('/api/orders', (req, res) => {
    const { productId, customerName, customerPhone, items, usePoints } = req.body;
    
    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + item.price, 0);
    let discount = 0;
    let pointsUsed = 0;

    // Handle Customer & Points
    let customer = customers.find(c => c.phone === customerPhone);
    if (!customer) {
      customer = { phone: customerPhone, name: customerName, points: 0 };
      customers.push(customer);
    }

    if (usePoints && customer.points > 0) {
      // Max discount is the subtotal
      const maxPointsToUse = subtotal * POINTS_REDEMPTION_RATE;
      pointsUsed = Math.min(customer.points, maxPointsToUse);
      discount = pointsUsed / POINTS_REDEMPTION_RATE;
      customer.points -= pointsUsed;
    }

    const total = subtotal - discount;
    const pointsEarned = Math.floor(total * POINTS_PER_DOLLAR);
    customer.points += pointsEarned;

    const newOrder: Order = {
      id: uuidv4(),
      productId: items[0].id, // Simplified for prototype
      createdAt: new Date().toISOString(),
      status: 'pending',
      customerName,
      customerPhone,
      pointsEarned,
      pointsUsed,
      discount,
      total
    };
    orders.push(newOrder);
    
    console.log(`[WhatsApp API] Sending order confirmation to ${newOrder.customerPhone}. Earned ${pointsEarned} points!`);
    
    res.status(201).json(newOrder);
  });

  // Customer Profile API
  app.get('/api/customers/:phone', (req, res) => {
    const customer = customers.find(c => c.phone === req.params.phone);
    if (customer) {
      const customerOrders = orders.filter(o => o.customerPhone === req.params.phone);
      res.json({ ...customer, orders: customerOrders });
    } else {
      res.status(404).json({ error: 'Cliente não encontrado' });
    }
  });

  // Admin Stats API
  app.get('/api/admin/stats', (req, res) => {
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    res.json({
      totalRevenue,
      totalOrders: orders.length,
      totalProducts: products.length,
      tryOnCount
    });
  });

  // 3. Reviews API
  app.get('/api/products/:id/reviews', (req, res) => {
    const productReviews = reviews.filter(r => r.productId === req.params.id);
    res.json(productReviews);
  });

  app.get('/api/admin/reviews', (req, res) => {
    res.json(reviews);
  });

  app.post('/api/products/:id/reviews', async (req, res) => {
    const { customerName, rating, comment, aiSentiment, aiTags } = req.body;
    const productId = req.params.id;

    const newReview: Review = {
      id: uuidv4(),
      productId,
      customerName,
      rating,
      comment,
      aiSentiment: aiSentiment || 'neutral',
      aiTags: aiTags || [],
      createdAt: new Date().toISOString()
    };

    reviews.push(newReview);
    res.status(201).json(newReview);
  });

  // 4. AI Virtual Try-On Increment
  app.post('/api/ai/try-on/increment', (req, res) => {
    tryOnCount++;
    res.json({ success: true, tryOnCount });
  });


  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
