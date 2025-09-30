import React, { createContext, useContext, useState, useEffect } from 'react';

interface GameStats {
  totalPoints: number;
  gamesPlayed: number;
  highScore: number;
  livesRemaining: number;
  lastLifeReset: string;
  lastLoginDate: string;
  loginStreak: number;
}

interface Upgrade {
  id: string;
  name: string;
  description: string;
  price: number;
  owned: boolean;
  type: 'speed' | 'multiplier' | 'revive' | 'kill' | 'cosmetic' | 'powerup' | 'utility';
  category?: 'cosmetic' | 'powerup' | 'utility' | 'permanent';
  color?: string;
  effectDuration?: number; // in milliseconds
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  completed: boolean;
  reward: number;
  type: 'eat_blobs' | 'survive_time' | 'daily_games' | 'win_streak';
}

interface ActivePowerUp {
  id: string;
  name: string;
  expiresAt: number;
}

interface GameContextType {
  stats: GameStats;
  upgrades: Upgrade[];
  challenges: Challenge[];
  activePowerUps: ActivePowerUp[];
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
  updateChallengeProgress: (challengeType: string, value: number) => void;
  claimChallengeReward: (challengeId: string) => void;
  activatePowerUp: (powerUpId: string) => void;
  refillLives: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const INITIAL_STATS: GameStats = {
  totalPoints: 0,
  gamesPlayed: 0,
  highScore: 0,
  livesRemaining: 10,
  lastLifeReset: new Date().toDateString(),
  lastLoginDate: new Date().toDateString(),
  loginStreak: 1,
};

const INITIAL_UPGRADES: Upgrade[] = [
  // Permanent Upgrades
  {
    id: 'speed_boost',
    name: 'Speed Boost',
    description: 'Increase movement speed by 25%',
    price: 100,
    owned: false,
    type: 'speed',
    category: 'permanent',
  },
  {
    id: 'point_multiplier',
    name: '2x Point Multiplier',
    description: 'Double points from eating blobs',
    price: 150,
    owned: false,
    type: 'multiplier',
    category: 'permanent',
  },
  {
    id: 'instant_kill',
    name: 'Instant Kill',
    description: 'Ability to eat any blob regardless of size',
    price: 200,
    owned: false,
    type: 'kill',
    category: 'permanent',
  },
  {
    id: 'auto_revive',
    name: 'Auto Revive',
    description: 'Automatically revive once per game',
    price: 250,
    owned: false,
    type: 'revive',
    category: 'permanent',
  },
  // Cosmetic Upgrades
  {
    id: 'red_skin',
    name: 'Crimson Blob',
    description: 'Stand out with a fiery red appearance',
    price: 50,
    owned: false,
    type: 'cosmetic',
    category: 'cosmetic',
    color: '#EF4444',
  },
  {
    id: 'gold_skin',
    name: 'Golden Blob',
    description: 'Shine bright with golden colors',
    price: 100,
    owned: false,
    type: 'cosmetic',
    category: 'cosmetic',
    color: '#F59E0B',
  },
  {
    id: 'rainbow_skin',
    name: 'Rainbow Blob',
    description: 'Cycle through rainbow colors',
    price: 200,
    owned: false,
    type: 'cosmetic',
    category: 'cosmetic',
    color: '#8B5CF6',
  },
  // Temporary Power-ups
  {
    id: 'shield',
    name: '5s Shield',
    description: 'Temporary invulnerability for 5 seconds',
    price: 30,
    owned: false,
    type: 'powerup',
    category: 'powerup',
    effectDuration: 5000,
  },
  {
    id: 'double_points',
    name: '1min Double Points',
    description: 'Double all points for 1 minute',
    price: 50,
    owned: false,
    type: 'powerup',
    category: 'powerup',
    effectDuration: 60000,
  },
  // Utility
  {
    id: 'extra_lives',
    name: 'Refill Lives',
    description: 'Instantly refill all 10 lives',
    price: 75,
    owned: false,
    type: 'utility',
    category: 'utility',
  },
];

const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'eat_10_blobs',
    name: 'Blob Hunter',
    description: 'Eat 10 blobs in total',
    targetValue: 10,
    currentValue: 0,
    completed: false,
    reward: 25,
    type: 'eat_blobs',
  },
  {
    id: 'eat_50_blobs',
    name: 'Blob Master',
    description: 'Eat 50 blobs in total',
    targetValue: 50,
    currentValue: 0,
    completed: false,
    reward: 100,
    type: 'eat_blobs',
  },
  {
    id: 'survive_5_minutes',
    name: 'Survivor',
    description: 'Survive for 5 minutes in a single game',
    targetValue: 5,
    currentValue: 0,
    completed: false,
    reward: 50,
    type: 'survive_time',
  },
  {
    id: 'play_daily',
    name: 'Daily Player',
    description: 'Play 5 games in one day',
    targetValue: 5,
    currentValue: 0,
    completed: false,
    reward: 30,
    type: 'daily_games',
  },
];

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(INITIAL_UPGRADES);
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [playerSize, setPlayerSize] = useState(20);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedStats = localStorage.getItem('agarGameStats');
    const savedUpgrades = localStorage.getItem('agarGameUpgrades');
    const savedChallenges = localStorage.getItem('agarGameChallenges');
    
    if (savedStats) {
      const parsedStats = JSON.parse(savedStats);
      const today = new Date().toDateString();
      
      // Check if we need to reset daily lives
      if (parsedStats.lastLifeReset !== today) {
        parsedStats.livesRemaining = 10;
        parsedStats.lastLifeReset = today;
      }
      
      // Check login streak
      if (parsedStats.lastLoginDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (parsedStats.lastLoginDate === yesterday.toDateString()) {
          // Consecutive day - increment streak
          parsedStats.loginStreak += 1;
        } else {
          // Streak broken - reset to 1
          parsedStats.loginStreak = 1;
        }
        
        parsedStats.lastLoginDate = today;
        
        // Apply streak rewards
        const streakBonus = Math.min(parsedStats.loginStreak * 5, 50);
        parsedStats.totalPoints += streakBonus;
      }
      
      setStats(parsedStats);
    }
    
    if (savedUpgrades) {
      setUpgrades(JSON.parse(savedUpgrades));
    }
    
    if (savedChallenges) {
      setChallenges(JSON.parse(savedChallenges));
    }
  }, []);

  // Save data to localStorage when stats, upgrades, or challenges change
  useEffect(() => {
    localStorage.setItem('agarGameStats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('agarGameUpgrades', JSON.stringify(upgrades));
  }, [upgrades]);

  useEffect(() => {
    localStorage.setItem('agarGameChallenges', JSON.stringify(challenges));
  }, [challenges]);

  // Clean up expired power-ups
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setActivePowerUps(prev => prev.filter(powerUp => powerUp.expiresAt > now));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const updateStats = (points: number) => {
    setCurrentPoints(prev => prev + points);
    setPlayerSize(prev => prev + points * 0.3);
  };

  const purchaseUpgrade = (upgradeId: string) => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade || stats.totalPoints < upgrade.price) return;

    if (upgrade.category === 'powerup') {
      // Activate temporary power-up
      activatePowerUp(upgradeId);
    } else if (upgrade.category === 'utility') {
      // Handle utility purchases
      if (upgradeId === 'extra_lives') {
        refillLives();
      }
    } else {
      // Permanent upgrades
      setUpgrades(prev => 
        prev.map(u => 
          u.id === upgradeId ? { ...u, owned: true } : u
        )
      );
    }

    setStats(prev => ({
      ...prev,
      totalPoints: prev.totalPoints - upgrade.price,
    }));
  };

  const activatePowerUp = (powerUpId: string) => {
    const upgrade = upgrades.find(u => u.id === powerUpId);
    if (!upgrade || !upgrade.effectDuration) return;

    const expiresAt = Date.now() + upgrade.effectDuration;
    
    setActivePowerUps(prev => [
      ...prev.filter(p => p.id !== powerUpId), // Remove existing same power-up
      {
        id: powerUpId,
        name: upgrade.name,
        expiresAt,
      }
    ]);
  };

  const refillLives = () => {
    setStats(prev => ({
      ...prev,
      livesRemaining: 10,
    }));
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

    // Update daily games challenge
    updateChallengeProgress('daily_games', 1);
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

  const updateChallengeProgress = (challengeType: string, value: number) => {
    setChallenges(prev => 
      prev.map(challenge => {
        if (challenge.type === challengeType && !challenge.completed) {
          const newValue = challenge.currentValue + value;
          const completed = newValue >= challenge.targetValue;
          
          if (completed && !challenge.completed) {
            // Auto-claim reward
            setStats(prevStats => ({
              ...prevStats,
              totalPoints: prevStats.totalPoints + challenge.reward,
            }));
          }
          
          return {
            ...challenge,
            currentValue: Math.min(newValue, challenge.targetValue),
            completed,
          };
        }
        return challenge;
      })
    );
  };

  const claimChallengeReward = (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || !challenge.completed) return;

    setStats(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + challenge.reward,
    }));
  };

  const resetAllData = () => {
    setStats(INITIAL_STATS);
    setUpgrades(INITIAL_UPGRADES);
    setChallenges(INITIAL_CHALLENGES);
    setActivePowerUps([]);
    localStorage.removeItem('agarGameStats');
    localStorage.removeItem('agarGameUpgrades');
    localStorage.removeItem('agarGameChallenges');
  };

  return (
    <GameContext.Provider value={{
      stats,
      upgrades,
      challenges,
      activePowerUps,
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
      updateChallengeProgress,
      claimChallengeReward,
      activatePowerUp,
      refillLives,
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