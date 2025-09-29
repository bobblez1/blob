import React, { createContext, useContext, useState, useEffect } from 'react';

interface GameStats {
  totalPoints: number;
  gamesPlayed: number;
  highScore: number;
  livesRemaining: number;
  lastLifeReset: string;
}

interface Upgrade {
  id: string;
  name: string;
  description: string;
  price: number;
  owned: boolean;
  type: 'speed' | 'multiplier' | 'revive' | 'kill';
}

interface GameContextType {
  stats: GameStats;
  upgrades: Upgrade[];
  currentPoints: number;
  gameActive: boolean;
  playerSize: number;
  updateStats: (points: number) => void;
  purchaseUpgrade: (upgradeId: string) => void;
  startGame: () => void;
  endGame: (finalScore: number) => void;
  useLife: () => boolean;
  revivePlayer: () => void;
  resetAllData: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const INITIAL_STATS: GameStats = {
  totalPoints: 0,
  gamesPlayed: 0,
  highScore: 0,
  livesRemaining: 10,
  lastLifeReset: new Date().toDateString(),
};

const INITIAL_UPGRADES: Upgrade[] = [
  {
    id: 'speed_boost',
    name: 'Speed Boost',
    description: 'Increase movement speed by 25%',
    price: 100,
    owned: false,
    type: 'speed',
  },
  {
    id: 'point_multiplier',
    name: '2x Point Multiplier',
    description: 'Double points from eating blobs',
    price: 150,
    owned: false,
    type: 'multiplier',
  },
  {
    id: 'instant_kill',
    name: 'Instant Kill',
    description: 'Ability to eat any blob regardless of size',
    price: 200,
    owned: false,
    type: 'kill',
  },
  {
    id: 'auto_revive',
    name: 'Auto Revive',
    description: 'Automatically revive once per game',
    price: 250,
    owned: false,
    type: 'revive',
  },
];

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(INITIAL_UPGRADES);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [playerSize, setPlayerSize] = useState(20);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedStats = localStorage.getItem('agarGameStats');
    const savedUpgrades = localStorage.getItem('agarGameUpgrades');
    
    if (savedStats) {
      const parsedStats = JSON.parse(savedStats);
      // Check if we need to reset daily lives
      const today = new Date().toDateString();
      if (parsedStats.lastLifeReset !== today) {
        parsedStats.livesRemaining = 10;
        parsedStats.lastLifeReset = today;
      }
      setStats(parsedStats);
    }
    
    if (savedUpgrades) {
      setUpgrades(JSON.parse(savedUpgrades));
    }
  }, []);

  // Save data to localStorage when stats or upgrades change
  useEffect(() => {
    localStorage.setItem('agarGameStats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('agarGameUpgrades', JSON.stringify(upgrades));
  }, [upgrades]);

  const updateStats = (points: number) => {
    setCurrentPoints(prev => prev + points);
    setPlayerSize(prev => prev + points * 0.5);
  };

  const purchaseUpgrade = (upgradeId: string) => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade || upgrade.owned || stats.totalPoints < upgrade.price) return;

    setStats(prev => ({
      ...prev,
      totalPoints: prev.totalPoints - upgrade.price,
    }));

    setUpgrades(prev => 
      prev.map(u => 
        u.id === upgradeId ? { ...u, owned: true } : u
      )
    );
  };

  const startGame = () => {
    setGameActive(true);
    setCurrentPoints(0);
    setPlayerSize(20);
  };

  const endGame = (finalScore: number) => {
    setGameActive(false);
    const multiplier = upgrades.find(u => u.id === 'point_multiplier' && u.owned) ? 2 : 1;
    const totalScore = finalScore * multiplier;
    
    setStats(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + totalScore,
      gamesPlayed: prev.gamesPlayed + 1,
      highScore: Math.max(prev.highScore, totalScore),
    }));
  };

  const useLife = (): boolean => {
    if (stats.livesRemaining <= 0) return false;
    
    setStats(prev => ({
      ...prev,
      livesRemaining: prev.livesRemaining - 1,
    }));
    return true;
  };

  const revivePlayer = () => {
    setGameActive(true);
    setPlayerSize(20);
  };

  const resetAllData = () => {
    setStats(INITIAL_STATS);
    setUpgrades(INITIAL_UPGRADES);
    localStorage.removeItem('agarGameStats');
    localStorage.removeItem('agarGameUpgrades');
  };
  return (
    <GameContext.Provider value={{
      stats,
      upgrades,
      currentPoints,
      gameActive,
      playerSize,
      updateStats,
      purchaseUpgrade,
      startGame,
      endGame,
      useLife,
      revivePlayer,
      resetAllData,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}