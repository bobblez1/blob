import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Star, Zap, FileX2 as X2, Skull, RotateCcw, ShoppingCart, Coins, ArrowLeft, CheckCircle } from 'lucide-react';

interface StoreProps {
  onBack: () => void;
}

function Store({ onBack }: StoreProps) {
  const { stats, upgrades, purchaseUpgrade } = useGame();
  const [purchaseAnimation, setPurchaseAnimation] = useState<string | null>(null);

  const handlePurchase = (upgradeId: string) => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade || upgrade.owned || stats.totalPoints < upgrade.price) return;
    
    purchaseUpgrade(upgradeId);
    setPurchaseAnimation(upgradeId);
    setTimeout(() => setPurchaseAnimation(null), 1000);
  };
  const getUpgradeIcon = (type: string) => {
    switch (type) {
      case 'speed': return <Zap size={24} />;
      case 'multiplier': return <X2 size={24} />;
      case 'kill': return <Skull size={24} />;
      case 'revive': return <RotateCcw size={24} />;
      default: return <Star size={24} />;
    }
  };

  const getUpgradeColor = (type: string) => {
    switch (type) {
      case 'speed': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
      case 'multiplier': return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'kill': return 'from-red-500/20 to-pink-500/20 border-red-500/30';
      case 'revive': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      default: return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
    }
  };

  const getButtonColor = (type: string) => {
    switch (type) {
      case 'speed': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'multiplier': return 'bg-green-500 hover:bg-green-600';
      case 'kill': return 'bg-red-500 hover:bg-red-600';
      case 'revive': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col text-white">
      {/* Header */}
      <div className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-700/50 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Store</h1>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-2xl mx-auto space-y-6">
          {/* Current Points */}
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
            <div className="flex items-center justify-center gap-2">
              <Coins size={20} className="text-yellow-400" />
              <span className="text-xl font-bold">{stats.totalPoints.toLocaleString()}</span>
              <span className="text-gray-400">Points Available</span>
            </div>
          </div>

        {/* Telegram Stars Info */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Star size={20} className="text-blue-400" />
            <span className="font-semibold text-blue-400">Telegram Stars Integration</span>
          </div>
          <p className="text-sm text-gray-300">
            In production, upgrades would be purchased using Telegram Stars. 
            For now, you can use your earned points to buy upgrades!
          </p>
        </div>

        {/* Upgrades Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart size={20} />
            Available Upgrades
          </h2>
          
          {upgrades.map(upgrade => (
            <div 
              key={upgrade.id} 
              className={`bg-gradient-to-r ${getUpgradeColor(upgrade.type)} p-6 rounded-xl border`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${getButtonColor(upgrade.type).split(' ')[0]}/20`}>
                  {getUpgradeIcon(upgrade.type)}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">{upgrade.name}</h3>
                  <p className="text-gray-300 text-sm mb-3">{upgrade.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-yellow-400" />
                      <span className="font-semibold">{upgrade.price} Points</span>
                    </div>
                    
                    {upgrade.owned ? (
                      <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                        <CheckCircle size={16} />
                        ACTIVE
                      </div>
                    ) : (
                      <button
                        onClick={() => handlePurchase(upgrade.id)}
                        disabled={stats.totalPoints < upgrade.price}
                        className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 ${getButtonColor(upgrade.type)} ${
                          purchaseAnimation === upgrade.id ? 'animate-pulse' : ''
                        }`}
                      >
                        {purchaseAnimation === upgrade.id ? 'Purchased!' : 'Purchase'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Purchase Info */}
        <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
          <h3 className="font-semibold mb-2">How to Earn Points</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Eat small food blobs: +1 point each</li>
            <li>• Eat other players/bots: +5-20 points based on size</li>
            <li>• Survive longer games for bonus points</li>
            <li>• Use 2x multiplier upgrade to double all points</li>
          </ul>
        </div>
      </div>
      </div>
    </div>
  );
}

export default Store;