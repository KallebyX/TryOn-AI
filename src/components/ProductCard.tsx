import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    style: string;
  };
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 transition-all hover:shadow-md"
    >
      <Link to={`/product/${product.id}`} className="block aspect-square overflow-hidden bg-gray-100">
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
      </Link>
      <div className="flex flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{product.style}</p>
          </div>
          <p className="font-medium text-gray-900">R${product.price}</p>
        </div>
        <Link 
          to={`/product/${product.id}`}
          className="mt-4 w-full rounded-full bg-black py-2 text-center text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Provador Virtual
        </Link>
      </div>
    </motion.div>
  );
}

export default ProductCard;
