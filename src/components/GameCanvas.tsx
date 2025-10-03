import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { Play, Pause, RotateCcw, Heart, Home, Zap, Shield, Star } from 'lucide-react';

// Constants
const FOOD_COLOR = '#DC2626';

interface Blob {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  isPlayer?: boolean;
  isBot?: boolean;
  vx?: number;
  vy?: number;
  name?: string;
  team?: 'red' | 'blue';
}

interface GameCanvasProps {
  onGameEnd: () => void;
}

// Portrait-oriented game world
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 1500;
const VIEWPORT_WIDTH = 360;
const VIEWPORT_HEIGHT = 640;

function GameCanvas({ onGameEnd }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const keysRef = useRef<Set<string>>(new Set());
  const lastDecayTime = useRef<number>(Date.now());
  const gameStartTime = useRef<number>(Date.now());
  
  const { 
    stats, 
    upgrades, 
    challenges,
    activePowerUps,
    gameMode,
    selectedTeam,
    currentPoints, 
    playerSize,
    gameActive, 
    startGame, 
    endGame, 
    useLife, 
    revivePlayer,
    updateChallengeProgress,
    activatePowerUp,
    growPlayer
  } = useGame();
  
  const [player, setPlayer] = useState<Blob>({
    id: 'player',
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    size: 20,
    color: '#3B82F6',
    isPlayer: true,
    name: 'You',
  });
  
  const [bots, setBots] = useState<Blob[]>([]);
  const [foods, setFoods] = useState<Blob[]>([]);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [shieldActive, setShieldActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes for Time Attack
  const [playAreaRadius, setPlayAreaRadius] = useState(Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 2); // For Battle Royale

  // Initialize game
  useEffect(() => {
    generateBots();
    generateFoods();
    gameStartTime.current = Date.now();
    setTimeRemaining(180); // Reset timer for Time Attack
    setPlayAreaRadius(Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 2); // Reset play area for Battle Royale
    
    // Hide controls after 3 seconds
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [gameMode]);

  // Game mode specific timers
  useEffect(() => {
    if (!gameActive || gameOver || isPaused) return;
    
    const interval = setInterval(() => {
      if (gameMode === 'timeAttack') {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
      } else if (gameMode === 'battleRoyale') {
        setPlayAreaRadius(prev => {
          const minRadius = 100;
          const shrinkRate = 2;
          return Math.max(minRadius, prev - shrinkRate);
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameActive, gameOver, isPaused, gameMode]);

  // Check for active shield power-up
  useEffect(() => {
    const shield = activePowerUps.find(p => p.id === 'shield');
    setShieldActive(!!shield);
  }, [activePowerUps]);

  // Mouse and keyboard event handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(prev => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (gameActive && !gameOver && !isPaused) {
      const gameLoop = () => {
        try {
          updateGame();
          draw();
          animationRef.current = requestAnimationFrame(gameLoop);
        } catch (error) {
          console.error('Game loop error:', error);
          setGameOver(true);
        }
      };
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameActive, gameOver, isPaused, player, bots, foods, activePowerUps]);

  const generateBots = () => {
    const newBots: Blob[] = [];
    const colors = ['#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
    const teamColors = { red: '#EF4444', blue: '#3B82F6' };
    const names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Sigma', 'Theta', 'Zeta', 'Kappa', 'Lambda'];
    
    const botCount = gameMode === 'battleRoyale' ? 20 : gameMode === 'team' ? 10 : 15;
    
    for (let i = 0; i < botCount; i++) {
      const team = gameMode === 'team' ? (i % 2 === 0 ? 'red' : 'blue') : undefined;
      const botColor = gameMode === 'team' ? teamColors[team as 'red' | 'blue'] : colors[Math.floor(Math.random() * colors.length)];
      
      newBots.push({
        id: `bot-${i}`,
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: 10 + Math.random() * 40,
        color: botColor,
        isBot: true,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        name: names[Math.floor(Math.random() * names.length)],
        team: team,
      });
    }
    setBots(newBots);
  };

  const generateFoods = () => {
    const newFoods: Blob[] = [];
    
    for (let i = 0; i < 200; i++) {
      newFoods.push({
        id: `food-${i}`,
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: 2 + Math.random() * 4,
        color: FOOD_COLOR,
      });
    }
    setFoods(newFoods);
  };

  // Helper function for distance calculation
  const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  };

  const updateGame = () => {
    // Create mutable copies for processing
    let currentFoods = [...foods];
    let currentBots = [...bots];
    let newPlayerSize = playerSize;
    
    // Blob decay mechanic - slowly shrink if inactive
    const now = Date.now();
    if (now - lastDecayTime.current > 2000) { // Every 2 seconds
      if (newPlayerSize > 20) { // Don't shrink below minimum size
        growPlayer(-0.5); // Use context function to update size
        newPlayerSize = Math.max(20, newPlayerSize - 0.5);
      }
      lastDecayTime.current = now;
    }
    
    // Handle player movement with size-based speed
    const canvas = canvasRef.current;
    if (canvas) {
      const centerX = VIEWPORT_WIDTH / 2;
      const centerY = VIEWPORT_HEIGHT / 2;
      
      let targetX = mouseRef.current.x;
      let targetY = mouseRef.current.y;
      
      // Calculate speed based on size (bigger = slower)
      const baseSpeed = upgrades.find(u => u.id === 'speed_boost' && u.owned) ? 3.5 : 2.5;
      const sizeSpeedFactor = Math.max(0.3, 1 - (newPlayerSize - 20) / 200); // Slower as size increases
      const speed = baseSpeed * sizeSpeedFactor;
      
      let moveX = 0;
      let moveY = 0;
      
      // Keyboard movement for desktop
      if (keysRef.current.has('w') || keysRef.current.has('arrowup')) moveY -= speed;
      if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) moveY += speed;
      if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) moveX -= speed;
      if (keysRef.current.has('d') || keysRef.current.has('arrowright')) moveX += speed;
      
      // Mouse movement
      if (Math.abs(targetX - centerX) > 5 || Math.abs(targetY - centerY) > 5) {
        const dx = targetX - centerX;
        const dy = targetY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const normalizedDx = (dx / distance) * speed;
          const normalizedDy = (dy / distance) * speed;
          moveX += normalizedDx;
          moveY += normalizedDy;
        }
      }
      
      // Apply movement
      if (moveX !== 0 || moveY !== 0) {
        setPlayer(prev => ({
          ...prev,
          x: Math.max(newPlayerSize, Math.min(CANVAS_WIDTH - newPlayerSize, prev.x + moveX)),
          y: Math.max(newPlayerSize, Math.min(CANVAS_HEIGHT - newPlayerSize, prev.y + moveY)),
        }));
        
        // Reset decay timer when moving
        lastDecayTime.current = now;
      }
    }
    
    // Update camera to follow player
    setCamera({
      x: Math.max(0, Math.min(CANVAS_WIDTH - VIEWPORT_WIDTH, player.x - VIEWPORT_WIDTH / 2)),
      y: Math.max(0, Math.min(CANVAS_HEIGHT - VIEWPORT_HEIGHT, player.y - VIEWPORT_HEIGHT / 2)),
    });

    // Player-Food Interaction
    let totalGrowthThisFrame = 0;
    currentFoods = currentFoods.filter(food => {
      const distance = calculateDistance(player.x, player.y, food.x, food.y);
      if (distance < newPlayerSize / 2 + food.size / 2) {
        totalGrowthThisFrame += 0.3;
        return false; // Remove food
      }
      return true; // Keep food
    });
    
    // Apply player growth
    if (totalGrowthThisFrame > 0) {
      growPlayer(totalGrowthThisFrame);
      newPlayerSize += totalGrowthThisFrame;
    }

    // Bot-Food Interaction
    currentBots = currentBots.map(bot => {
      let botGrowth = 0;
      currentFoods = currentFoods.filter(food => {
        const distance = calculateDistance(bot.x, bot.y, food.x, food.y);
        if (distance < bot.size / 2 + food.size / 2) {
          botGrowth += 0.2;
          return false; // Remove food
        }
        return true; // Keep food
      });
      
      return { ...bot, size: bot.size + botGrowth };
    });

    // Update bots with improved AI
    currentBots = currentBots.map(bot => {
      // Bot speed based on size
      let botBaseSpeed = Math.max(0.5, 1.5 - (bot.size - 10) / 100);
      
      // Increase aggression based on game mode
      if (gameMode === 'timeAttack') {
        const aggressionMultiplier = 1 + (180 - timeRemaining) / 180; // More aggressive over time
        botBaseSpeed *= aggressionMultiplier;
      } else if (gameMode === 'battleRoyale') {
        botBaseSpeed *= 1.5; // Always more aggressive in Battle Royale
      }
      
      let targetX = bot.x;
      let targetY = bot.y;
      let foundTarget = false;
      
      // Find nearest food
      let nearestFood = null;
      let nearestFoodDistance = Infinity;
      
      currentFoods.forEach(food => {
        const distance = calculateDistance(bot.x, bot.y, food.x, food.y);
        if (distance < nearestFoodDistance && distance < 150) {
          nearestFood = food;
          nearestFoodDistance = distance;
        }
      });
      
      // Find nearest smaller bot to eat
      let nearestSmallBot = null;
      let nearestSmallBotDistance = Infinity;
      
      currentBots.forEach(otherBot => {
        if (otherBot.id !== bot.id && otherBot.size < bot.size * 0.8) {
          const distance = calculateDistance(bot.x, bot.y, otherBot.x, otherBot.y);
          if (distance < nearestSmallBotDistance && distance < 100) {
            nearestSmallBot = otherBot;
            nearestSmallBotDistance = distance;
          }
        }
      });
      
      // Find nearest larger bot to avoid
      let nearestLargeBot = null;
      let nearestLargeBotDistance = Infinity;
      
      currentBots.forEach(otherBot => {
        if (otherBot.id !== bot.id && otherBot.size > bot.size * 1.2) {
          const distance = calculateDistance(bot.x, bot.y, otherBot.x, otherBot.y);
          if (distance < nearestLargeBotDistance && distance < 80) {
            nearestLargeBot = otherBot;
            nearestLargeBotDistance = distance;
          }
        }
      });
      
      // Team mode: prioritize enemy team members
      if (gameMode === 'team' && bot.team) {
        let nearestEnemy = null;
        let nearestEnemyDistance = Infinity;
        
        // Check other bots
        currentBots.forEach(otherBot => {
          if (otherBot.id !== bot.id && otherBot.team !== bot.team && otherBot.size < bot.size) {
            const distance = calculateDistance(bot.x, bot.y, otherBot.x, otherBot.y);
            if (distance < nearestEnemyDistance && distance < 100) {
              nearestEnemy = otherBot;
              nearestEnemyDistance = distance;
            }
          }
        });
        
        // Check player if on different team
        if (selectedTeam !== bot.team && newPlayerSize < bot.size) {
          const playerDistance = calculateDistance(bot.x, bot.y, player.x, player.y);
          if (playerDistance < nearestEnemyDistance && playerDistance < 100) {
            nearestEnemy = player;
            nearestEnemyDistance = playerDistance;
          }
        }
        
        // Prioritize enemy over food
        if (nearestEnemy && nearestEnemyDistance < 80) {
          const dx = nearestEnemy.x - bot.x;
          const dy = nearestEnemy.y - bot.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            targetX = bot.x + (dx / distance) * botBaseSpeed * 1.5;
            targetY = bot.y + (dy / distance) * botBaseSpeed * 1.5;
            foundTarget = true;
          }
        }
      }
      
      // Avoid larger bots and player (highest priority)
      if (!foundTarget && nearestLargeBot && nearestLargeBotDistance < 60) {
        const dx = bot.x - nearestLargeBot.x;
        const dy = bot.y - nearestLargeBot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          targetX = bot.x + (dx / distance) * botBaseSpeed * 2;
          targetY = bot.y + (dy / distance) * botBaseSpeed * 2;
          foundTarget = true;
        }
      }
      
      // Avoid larger player
      if (!foundTarget) {
        const playerDistance = calculateDistance(bot.x, bot.y, player.x, player.y);
        if (playerDistance < 80 && newPlayerSize > bot.size * 1.2 && !shieldActive) {
          const dx = bot.x - player.x;
          const dy = bot.y - player.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            targetX = bot.x + (dx / distance) * botBaseSpeed * 2;
            targetY = bot.y + (dy / distance) * botBaseSpeed * 2;
            foundTarget = true;
          }
        }
      }
      
      // Chase smaller bots
      if (!foundTarget && nearestSmallBot && nearestSmallBotDistance < 80) {
        const dx = nearestSmallBot.x - bot.x;
        const dy = nearestSmallBot.y - bot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          targetX = bot.x + (dx / distance) * botBaseSpeed * 1.5;
          targetY = bot.y + (dy / distance) * botBaseSpeed * 1.5;
          foundTarget = true;
        }
      }
      
      // Move towards food if found
      if (!foundTarget && nearestFood) {
        const dx = nearestFood.x - bot.x;
        const dy = nearestFood.y - bot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          targetX = bot.x + (dx / distance) * botBaseSpeed;
          targetY = bot.y + (dy / distance) * botBaseSpeed;
          foundTarget = true;
        }
      }
      
      // Random movement if no target
      if (!foundTarget) {
        if (!bot.vx || !bot.vy || Math.random() < 0.02) {
          bot.vx = (Math.random() - 0.5) * 4;
          bot.vy = (Math.random() - 0.5) * 4;
        }
        targetX = bot.x + bot.vx * botBaseSpeed;
        targetY = bot.y + bot.vy * botBaseSpeed;
      }
      
      // Bounce off walls
      if (targetX < bot.size || targetX > CANVAS_WIDTH - bot.size) {
        bot.vx = -(bot.vx || 0);
        targetX = Math.max(bot.size, Math.min(CANVAS_WIDTH - bot.size, targetX));
      }
      if (targetY < bot.size || targetY > CANVAS_HEIGHT - bot.size) {
        bot.vy = -(bot.vy || 0);
        targetY = Math.max(bot.size, Math.min(CANVAS_HEIGHT - bot.size, targetY));
      }
      
      // Battle Royale: damage bots outside play area
      if (gameMode === 'battleRoyale') {
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        const distanceFromCenter = calculateDistance(bot.x, bot.y, centerX, centerY);
        
        if (distanceFromCenter > playAreaRadius) {
          bot.size = Math.max(5, bot.size - 1); // Shrink if outside safe zone
        }
      }
      
      return { ...bot, x: targetX, y: targetY };
    });
    
    // Bot-Bot Interaction (bots eating other bots)
    const botsToRemove = new Set<string>();
    currentBots = currentBots.map(bot => {
      if (botsToRemove.has(bot.id)) return bot;
      
      let botGrowth = 0;
      currentBots.forEach(otherBot => {
        if (bot.id !== otherBot.id && !botsToRemove.has(otherBot.id)) {
          const distance = calculateDistance(bot.x, bot.y, otherBot.x, otherBot.y);
          if (distance < bot.size / 2 + otherBot.size / 2 && bot.size > otherBot.size) {
            botGrowth += otherBot.size * 0.1;
            botsToRemove.add(otherBot.id);
          }
        }
      });
      
      return { ...bot, size: bot.size + botGrowth };
    }).filter(bot => !botsToRemove.has(bot.id));
    
    // Regenerate food if needed
    if (currentFoods.length < 150) {
      for (let i = 0; i < 30; i++) {
        currentFoods.push({
          id: `food-${Date.now()}-${i}`,
          x: Math.random() * CANVAS_WIDTH,
          y: Math.random() * CANVAS_HEIGHT,
          size: 2 + Math.random() * 4,
          color: FOOD_COLOR,
        });
      }
    }

    // Battle Royale: damage player outside play area
    if (gameMode === 'battleRoyale') {
      const centerX = CANVAS_WIDTH / 2;
      const centerY = CANVAS_HEIGHT / 2;
      const distanceFromCenter = calculateDistance(player.x, player.y, centerX, centerY);
      
      if (distanceFromCenter > playAreaRadius) {
        growPlayer(-0.5); // Use context function
        newPlayerSize = Math.max(20, newPlayerSize - 0.5);
      }
    }

    // Battle Royale: Check if only player remains
    if (gameMode === 'battleRoyale' && currentBots.length === 0) {
      handleGameOver(); // Player wins!
    }

    // Check collisions with bots
    const hasInstantKill = upgrades.find(u => u.id === 'instant_kill' && u.owned);
    const doublePoints = activePowerUps.find(p => p.id === 'double_points');
    
    const botsToRemoveFromPlayer = new Set<string>();
    currentBots.forEach(bot => {
      if (botsToRemoveFromPlayer.has(bot.id)) return;
      
      const distance = calculateDistance(player.x, player.y, bot.x, bot.y);
      
      if (distance < newPlayerSize / 2 + bot.size / 2) {
        if (newPlayerSize > bot.size || hasInstantKill) {
          // Player eats bot - gain points and growth
          const basePoints = Math.floor(bot.size / 2);
          const multiplier = upgrades.find(u => u.id === 'point_multiplier' && u.owned) ? 2 : 1;
          const doubleMultiplier = doublePoints ? 2 : 1;
          const totalPoints = basePoints * multiplier * doubleMultiplier;
          
          updateStats(totalPoints);
          updateChallengeProgress('eat_blobs', 1);
          
          // Growth from eating other blobs
          const growthAmount = bot.size * 0.1;
          growPlayer(growthAmount);
          newPlayerSize += growthAmount;
          
          botsToRemoveFromPlayer.add(bot.id);
          
          // Add new bot to maintain population
          if (gameMode !== 'battleRoyale') { // Don't respawn in Battle Royale
            const teamColors = { red: '#EF4444', blue: '#3B82F6' };
            const names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Sigma', 'Theta', 'Zeta', 'Kappa', 'Lambda'];
            const team = gameMode === 'team' ? (Math.random() > 0.5 ? 'red' : 'blue') : undefined;
            const colors = ['#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
            const botColor = gameMode === 'team' ? teamColors[team as 'red' | 'blue'] : colors[Math.floor(Math.random() * colors.length)];
            
            currentBots.push({
              id: `bot-${Date.now()}`,
              x: Math.random() * CANVAS_WIDTH,
              y: Math.random() * CANVAS_HEIGHT,
              size: 10 + Math.random() * 40,
              color: botColor,
              isBot: true,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              name: names[Math.floor(Math.random() * names.length)],
              team: team,
            });
          }
        } else if (!shieldActive) {
          // Bot eats player - game over (only if no shield)
          handleGameOver();
        }
      }
    });
    
    // Remove bots eaten by player
    currentBots = currentBots.filter(bot => !botsToRemoveFromPlayer.has(bot.id));
    
    // Update component state
    setFoods(currentFoods);
    setBots(currentBots);

    // Update survival time challenge
    const survivalTime = (now - gameStartTime.current) / 1000;
    if (survivalTime >= 60) { // 1 minute survival
      updateChallengeProgress('survive_time', Math.floor(survivalTime / 60));
    }
  };

  const handleGameOver = () => {
    const hasAutoRevive = upgrades.find(u => u.id === 'auto_revive' && u.owned);
    
    if (hasAutoRevive) {
      revivePlayer();
      setPlayer(prev => ({ ...prev, size: 20 }));
    } else {
      setGameOver(true);
      endGame(currentPoints);
      
      // Use a life when game ends
      useLife();
    }
  };

  const handleRestart = () => {
    if (stats.livesRemaining > 0) {
      setGameOver(false);
      setPlayer({
        id: 'player',
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        color: getPlayerColor(),
        isPlayer: true,
        name: 'You',
      });
      generateBots();
      generateFoods();
      gameStartTime.current = Date.now();
      startGame();
    }
  };

  const getPlayerColor = () => {
    const cosmetic = upgrades.find(u => u.category === 'cosmetic' && u.owned);
    return cosmetic?.color || '#3B82F6';
  };

  const getEvolutionStage = (size: number) => {
    if (size >= 100) return 'legendary';
    if (size >= 70) return 'epic';
    if (size >= 50) return 'rare';
    if (size >= 30) return 'common';
    return 'basic';
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    
    for (let x = -camera.x % gridSize; x < VIEWPORT_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, VIEWPORT_HEIGHT);
      ctx.stroke();
    }
    
    for (let y = -camera.y % gridSize; y < VIEWPORT_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VIEWPORT_WIDTH, y);
      ctx.stroke();
    }
    
    // Draw Battle Royale safe zone
    if (gameMode === 'battleRoyale') {
      const centerX = CANVAS_WIDTH / 2 - camera.x;
      const centerY = CANVAS_HEIGHT / 2 - camera.y;
      
      // Draw danger zone (outside safe area)
      ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
      ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
      
      // Draw safe zone
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(centerX, centerY, playAreaRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      
      // Draw safe zone border
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, playAreaRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw foods
    foods.forEach(food => {
      const screenX = food.x - camera.x;
      const screenY = food.y - camera.y;
      
      if (screenX > -20 && screenX < VIEWPORT_WIDTH + 20 && 
          screenY > -20 && screenY < VIEWPORT_HEIGHT + 20) {
        ctx.fillStyle = food.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, food.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add subtle glow
        ctx.shadowColor = food.color;
        ctx.shadowBlur = 3;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
    
    // Draw bots
    bots.forEach(bot => {
      const screenX = bot.x - camera.x;
      const screenY = bot.y - camera.y;
      
      if (screenX > -100 && screenX < VIEWPORT_WIDTH + 100 && 
          screenY > -100 && screenY < VIEWPORT_HEIGHT + 100) {
        // Draw bot
        ctx.fillStyle = bot.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, bot.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw bot outline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        
        // Team mode: different outline colors
        if (gameMode === 'team' && bot.team) {
          ctx.strokeStyle = bot.team === 'red' ? '#EF4444' : '#3B82F6';
        }
        
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw bot name
        if (bot.size > 15) {
          ctx.fillStyle = 'white';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(bot.name || '', screenX, screenY + 3);
        }
      }
    });
    
    // Draw player with evolution effects
    const playerScreenX = player.x - camera.x;
    const playerScreenY = player.y - camera.y;
    const evolutionStage = getEvolutionStage(playerSize);
    
    // Player glow based on evolution
    if (evolutionStage !== 'basic') {
      ctx.shadowColor = player.color;
      ctx.shadowBlur = evolutionStage === 'legendary' ? 20 : evolutionStage === 'epic' ? 15 : 10;
    }
    
    let playerColor = getPlayerColor();
    
    // Team mode: use team colors
    if (gameMode === 'team') {
      playerColor = selectedTeam === 'red' ? '#EF4444' : '#3B82F6';
    }
    
    ctx.fillStyle = playerColor;
    ctx.beginPath();
    ctx.arc(playerScreenX, playerScreenY, playerSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw shield effect
    if (shieldActive) {
      ctx.strokeStyle = '#60A5FA';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(playerScreenX, playerScreenY, playerSize / 2 + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw player outline
    ctx.strokeStyle = evolutionStage === 'legendary' ? '#FFD700' : 
                     evolutionStage === 'epic' ? '#9333EA' :
                     evolutionStage === 'rare' ? '#3B82F6' : '#FFFFFF';
                     
    // Team mode: team-colored outline
    if (gameMode === 'team') {
      ctx.strokeStyle = selectedTeam === 'red' ? '#EF4444' : '#3B82F6';
    }
                     
    ctx.lineWidth = evolutionStage === 'legendary' ? 4 : 2;
    ctx.stroke();
    
    // Draw player name and evolution indicator
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('You', playerScreenX, playerScreenY + 4);
    
    if (evolutionStage !== 'basic') {
      ctx.font = '8px Arial';
      ctx.fillStyle = evolutionStage === 'legendary' ? '#FFD700' : 
                     evolutionStage === 'epic' ? '#9333EA' :
                     evolutionStage === 'rare' ? '#3B82F6' : '#10B981';
      ctx.fillText(evolutionStage.toUpperCase(), playerScreenX, playerScreenY - playerSize / 2 - 8);
    }
    
    // Draw leaderboard
    drawLeaderboard(ctx);
    
    // Draw active power-ups indicator
    if (activePowerUps.length > 0) {
      drawPowerUpsIndicator(ctx);
    }
  };

  const drawLeaderboard = (ctx: CanvasRenderingContext2D) => {
    const playerBlob = { ...player, size: playerSize };
    const allBlobs = [playerBlob, ...bots].sort((a, b) => b.size - a.size).slice(0, 5);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, 140, 110);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Leaderboard', 15, 28);
    
    allBlobs.forEach((blob, index) => {
      const y = 45 + index * 13;
      ctx.font = '10px Arial';
      ctx.fillStyle = blob.isPlayer ? '#3B82F6' : '#888';
      const name = blob.name || 'Bot';
      const size = Math.round(blob.size);
      ctx.fillText(`${index + 1}. ${name} (${size})`, 15, y);
    });
  };

  const drawPowerUpsIndicator = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(VIEWPORT_WIDTH - 120, 10, 110, 30 + activePowerUps.length * 15);
    
    ctx.fillStyle = '#60A5FA';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Active Power-ups', VIEWPORT_WIDTH - 115, 25);
    
    activePowerUps.forEach((powerUp, index) => {
      const y = 40 + index * 15;
      const timeLeft = Math.ceil((powerUp.expiresAt - Date.now()) / 1000);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '9px Arial';
      ctx.fillText(`${powerUp.name}: ${timeLeft}s`, VIEWPORT_WIDTH - 115, y);
    });
  };

  const handleTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    mouseRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  };

  return (
    <div className="relative w-full h-full flex flex-col max-w-sm mx-auto">
      {/* Game HUD */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex justify-between items-center text-white text-sm">
          <div className="flex items-center gap-3">
            <div className="font-bold">Score: {currentPoints}</div>
            <div className="flex items-center gap-1">
              <Heart size={14} className="text-red-400" />
              <span>{stats.livesRemaining}</span>
            </div>
            {gameMode === 'timeAttack' && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">⏱️</span>
                <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
              </div>
            )}
            {gameMode === 'battleRoyale' && (
              <div className="flex items-center gap-1">
                <span className="text-green-400">🛡️</span>
                <span>{Math.round(playAreaRadius)}</span>
              </div>
            )}
            {gameMode === 'team' && (
              <div className="flex items-center gap-1">
                <span className={selectedTeam === 'red' ? 'text-red-400' : 'text-blue-400'}>
                  {selectedTeam === 'red' ? '🔴' : '🔵'}
                </span>
                <span className="capitalize">{selectedTeam}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onGameEnd}
              className="p-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            >
              <Home size={14} />
            </button>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Controls Help */}
      {showControls && (
        <div className="absolute bottom-16 left-2 right-2 z-10 bg-black/80 p-2 rounded-lg text-white text-xs text-center">
          <p className="mb-1">🖱️ Move mouse or WASD to move</p>
          <p>📱 Touch to move on mobile</p>
        </div>
      )}

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={VIEWPORT_WIDTH}
        height={VIEWPORT_HEIGHT}
        className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 cursor-crosshair"
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        style={{ touchAction: 'none', aspectRatio: `${VIEWPORT_WIDTH}/${VIEWPORT_HEIGHT}` }}
      />

      {/* Pause Screen */}
      {isPaused && gameActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
          <div className="bg-gray-900/90 p-6 rounded-2xl text-white text-center">
            <h2 className="text-xl font-bold mb-4">Game Paused</h2>
            <button
              onClick={() => setIsPaused(false)}
              className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 mx-auto"
            >
              <Play size={18} />
              Resume
            </button>
          </div>
        </div>
      )}

      {/* Game Over / Start Screen */}
      {(!gameActive || gameOver) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
          <div className="bg-gray-900/90 p-6 rounded-2xl text-white text-center max-w-xs mx-4">
            {gameOver ? (
              <>
                <h2 className="text-xl font-bold mb-2">Game Over!</h2>
                <p className="text-gray-300 mb-2">Final Score: {currentPoints}</p>
                <p className="text-sm text-gray-400 mb-4">
                  Evolution: {getEvolutionStage(playerSize).toUpperCase()}
                </p>
                
                <div className="flex gap-2">
                  <button
                    onClick={onGameEnd}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 justify-center text-sm"
                  >
                    <Home size={16} />
                    Home
                  </button>
                  
                  {stats.livesRemaining > 0 && (
                    <button
                      onClick={handleRestart}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 justify-center text-sm"
                    >
                      <RotateCcw size={16} />
                      Retry
                    </button>
                  )}
                </div>
                
                {stats.livesRemaining <= 0 && (
                  <div className="text-red-400 mt-3">
                    <p className="text-sm">No lives remaining!</p>
                    <p className="text-xs text-gray-400">Lives reset daily</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4">Ready to Play?</h2>
                <p className="text-gray-300 mb-6 text-sm">Eat food to grow, eat smaller blobs for points!</p>
                <button
                  onClick={startGame}
                  className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 mx-auto"
                >
                  <Play size={18} />
                  Start Game
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GameCanvas;