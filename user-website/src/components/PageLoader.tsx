import React from 'react';
import { Crown } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="min-h-screen bg-dark-800 flex flex-col items-center justify-center">
      <div className="animate-float">
        <Crown size={40} className="text-gold-500" />
      </div>
      <div className="mt-4 flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
