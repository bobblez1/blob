import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { Play, Pause, RotateCcw, Heart, Home, Zap } from 'lucide-react';

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
}

interface GameCanvasProps {
  onGameEnd: () => void;
}

const CANVAS_WIDTH = 2000;
const CANVAS_HEIGHT = 2000;
const VIEWPORT_WIDTH = 400;
const VIEWPORT_HEIGHT = 600;

function GameCanvas({ onGameEnd }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const keysRef = useRef<Set<string>>(new Set());
  
  const { 
    stats, 
    upgrades, 
    currentPoints, 
    gameActive, 
    playerSize, 
    updateStats, 
    startGame, 
    endGame, 
    useLife, 
    revivePlayer 
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

  // Initialize game
  useEffect(() => {
    generateBots();
    generateFoods();
    
    // Hide controls after 3 seconds
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, []);

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
        updateGame();
        draw();
        animationRef.current = requestAnimationFrame(gameLoop);
      };
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameActive, gameOver, isPaused, player, bots, foods]);

  const generateBots = () => {
    const newBots: Blob[] = [];
    const colors = ['#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
    const names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Sigma', 'Theta', 'Zeta', 'Kappa', 'Lambda'];
    
    for (let i = 0; i < 20; i++) {
      newBots.push({
        id: `bot-${i}`,
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: 10 + Math.random() * 50,
        color: colors[Math.floor(Math.random() * colors.length)],
        isBot: true,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        name: names[Math.floor(Math.random() * names.length)],
      });
    }
    setBots(newBots);
  };

  const generateFoods = () => {
    const newFoods: Blob[] = [];
    const colors = ['#FBBF24', '#34D399', '#F87171', '#A78BFA', '#60A5FA', '#F472B6', '#10B981'];
    
    for (let i = 0; i < 150; i++) {
      newFoods.push({
        id: `food-${i}`,
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: 2 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    setFoods(newFoods);
  };

  const updateGame = () => {
    // Update player size
    setPlayer(prev => ({ ...prev, size: playerSize }));
    
    // Handle player movement (desktop: mouse, mobile: touch)
    const canvas = canvasRef.current;
    if (canvas) {
      const centerX = VIEWPORT_WIDTH / 2;
      const centerY = VIEWPORT_HEIGHT / 2;
      
      let targetX = mouseRef.current.x;
      let targetY = mouseRef.current.y;
      
      // Keyboard movement for desktop
      const speed = upgrades.find(u => u.id === 'speed_boost' && u.owned) ? 4 : 2.5;
      let moveX = 0;
      let moveY = 0;
      
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
          x: Math.max(prev.size, Math.min(CANVAS_WIDTH - prev.size, prev.x + moveX)),
          y: Math.max(prev.size, Math.min(CANVAS_HEIGHT - prev.size, prev.y + moveY)),
        }));
      }
    }
    
    // Update camera to follow player
    setCamera({
      x: player.x - VIEWPORT_WIDTH / 2,
      y: player.y - VIEWPORT_HEIGHT / 2,
    });

    // Update bots with improved AI
    setBots(prevBots => prevBots.map(bot => {
      // Simple AI: move towards nearest food or away from larger blobs
      let targetX = bot.x;
      let targetY = bot.y;
      
      // Find nearest food
      let nearestFood = null;
      let nearestFoodDistance = Infinity;
      
      foods.forEach(food => {
        const distance = Math.sqrt(
          Math.pow(bot.x - food.x, 2) + Math.pow(bot.y - food.y, 2)
        );
        if (distance < nearestFoodDistance && distance < 100) {
          nearestFood = food;
          nearestFoodDistance = distance;
        }
      });
      
      // Move towards food if found
      if (nearestFood) {
        const dx = nearestFood.x - bot.x;
        const dy = nearestFood.y - bot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          targetX = bot.x + (dx / distance) * 1.5;
          targetY = bot.y + (dy / distance) * 1.5;
        }
      } else {
        // Random movement
        targetX = bot.x + (bot.vx || 0);
        targetY = bot.y + (bot.vy || 0);
      }
      
      // Avoid larger blobs (including player)
      const playerDistance = Math.sqrt(
        Math.pow(bot.x - player.x, 2) + Math.pow(bot.y - player.y, 2)
      );
      
      if (playerDistance < 80 && player.size > bot.size) {
        const dx = bot.x - player.x;
        const dy = bot.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          targetX = bot.x + (dx / distance) * 3;
          targetY = bot.y + (dy / distance) * 3;
        }
      }
      
      // Bounce off walls
      if (targetX < 0 || targetX > CANVAS_WIDTH) {
        bot.vx = -(bot.vx || 0);
        targetX = Math.max(bot.size, Math.min(CANVAS_WIDTH - bot.size, targetX));
      }
      if (targetY < 0 || targetY > CANVAS_HEIGHT) {
        bot.vy = -(bot.vy || 0);
        targetY = Math.max(bot.size, Math.min(CANVAS_HEIGHT - bot.size, targetY));
      }
      
      return { ...bot, x: targetX, y: targetY };
    }));

    // Check collisions with food
    setFoods(prevFoods => {
      const remainingFoods = prevFoods.filter(food => {
        const distance = Math.sqrt(
          Math.pow(player.x - food.x, 2) + Math.pow(player.y - food.y, 2)
        );
        
        if (distance < player.size / 2 + food.size / 2) {
          updateStats(1);
          return false;
        }
        return true;
      });
      
      // Regenerate food if needed
      if (remainingFoods.length < 100) {
        const colors = ['#FBBF24', '#34D399', '#F87171', '#A78BFA', '#60A5FA', '#F472B6', '#10B981'];
        for (let i = 0; i < 20; i++) {
          remainingFoods.push({
            id: `food-${Date.now()}-${i}`,
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: 2 + Math.random() * 6,
            color: colors[Math.floor(Math.random() * colors.length)],
          });
        }
      }
      
      return remainingFoods;
    });

    // Check collisions with bots
    const hasInstantKill = upgrades.find(u => u.id === 'instant_kill' && u.owned);
    
    bots.forEach(bot => {
      const distance = Math.sqrt(
        Math.pow(player.x - bot.x, 2) + Math.pow(player.y - bot.y, 2)
      );
      
      if (distance < player.size / 2 + bot.size / 2) {
        if (player.size > bot.size || hasInstantKill) {
          // Player eats bot
          updateStats(Math.floor(bot.size / 3));
          setBots(prev => prev.filter(b => b.id !== bot.id));
          
          // Add new bot to maintain population
          const colors = ['#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
          const names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Sigma', 'Theta', 'Zeta', 'Kappa', 'Lambda'];
          
          setBots(prev => [...prev, {
            id: `bot-${Date.now()}`,
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: 10 + Math.random() * 50,
            color: colors[Math.floor(Math.random() * colors.length)],
            isBot: true,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            name: names[Math.floor(Math.random() * names.length)],
          }]);
        } else {
          // Bot eats player - game over
          handleGameOver();
        }
      }
    });
  };

  const handleGameOver = () => {
    const hasAutoRevive = upgrades.find(u => u.id === 'auto_revive' && u.owned);
    
    if (hasAutoRevive) {
      revivePlayer();
      // Remove auto-revive after use (single use per game)
      // This would need to be implemented in the context
    } else {
      setGameOver(true);
      endGame(currentPoints);
    }
  };

  const handleRestart = () => {
    if (useLife()) {
      setGameOver(false);
      setPlayer({
        id: 'player',
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        size: 20,
        color: '#3B82F6',
        isPlayer: true,
        name: 'You',
      });
      generateBots();
      startGame();
    }
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
    const gridSize = 50;
    
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
    
    // Draw foods
    foods.forEach(food => {
      const screenX = food.x - camera.x;
      const screenY = food.y - camera.y;
      
      if (screenX > -50 && screenX < VIEWPORT_WIDTH + 50 && 
          screenY > -50 && screenY < VIEWPORT_HEIGHT + 50) {
        ctx.fillStyle = food.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, food.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        ctx.shadowColor = food.color;
        ctx.shadowBlur = 5;
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
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw bot name
        if (bot.size > 15) {
          ctx.fillStyle = 'white';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(bot.name || '', screenX, screenY + 4);
        }
      }
    });
    
    // Draw player
    const playerScreenX = player.x - camera.x;
    const playerScreenY = player.y - camera.y;
    
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(playerScreenX, playerScreenY, player.size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player outline
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw player name
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('You', playerScreenX, playerScreenY + 5);
    
    // Draw leaderboard
    drawLeaderboard(ctx);
  };

  const drawLeaderboard = (ctx: CanvasRenderingContext2D) => {
    const allBlobs = [player, ...bots].sort((a, b) => b.size - a.size).slice(0, 5);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 150, 120);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Leaderboard', 20, 30);
    
    allBlobs.forEach((blob, index) => {
      const y = 50 + index * 15;
      ctx.font = '12px Arial';
      ctx.fillStyle = blob.isPlayer ? '#3B82F6' : '#888';
      ctx.fillText(`${index + 1}. ${blob.name || 'Bot'} (${Math.round(blob.size)})`, 20, y);
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
    <div className="relative w-full h-full flex flex-col">
      {/* Game HUD */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <div className="text-lg font-bold">Score: {currentPoints}</div>
            <div className="flex items-center gap-1">
              <Heart size={16} className="text-red-400" />
              <span className="text-sm">{stats.livesRemaining}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onGameEnd}
              className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            >
              <Home size={16} />
            </button>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Controls Help */}
      {showControls && (
        <div className="absolute bottom-20 left-4 right-4 z-10 bg-black/70 p-3 rounded-lg text-white text-sm">
          <div className="text-center">
            <p className="mb-1">🖱️ Move mouse or use WASD keys to move</p>
            <p>📱 Touch screen to move on mobile</p>
          </div>
        </div>
      )}

      {/* Active Upgrades Indicator */}
      {upgrades.some(u => u.owned) && (
        <div className="absolute top-16 right-4 z-10 flex gap-1">
          {upgrades.filter(u => u.owned).map(upgrade => (
            <div key={upgrade.id} className="bg-yellow-500/20 border border-yellow-500/30 p-1 rounded">
              <Zap size={12} className="text-yellow-400" />
            </div>
          ))}
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
        style={{ touchAction: 'none' }}
      />

      {/* Pause Screen */}
      {isPaused && gameActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
          <div className="bg-gray-900/90 p-6 rounded-2xl text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Game Paused</h2>
            <button
              onClick={() => setIsPaused(false)}
              className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 mx-auto"
            >
              <Play size={20} />
              Resume
            </button>
          </div>
        </div>
      )}

      {/* Game Over / Start Screen */}
      {(!gameActive || gameOver) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
          <div className="bg-gray-900/90 p-6 rounded-2xl text-white text-center max-w-sm mx-4">
            {gameOver ? (
              <>
                <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
                <p className="text-gray-300 mb-2">Final Score: {currentPoints}</p>
                <p className="text-sm text-gray-400 mb-4">Size Reached: {Math.round(playerSize)}</p>
                
                <div className="flex gap-3">
                  <button
                    onClick={onGameEnd}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 justify-center"
                  >
                    <Home size={20} />
                    Home
                  </button>
                  
                  {stats.livesRemaining > 0 && (
                    <button
                      onClick={handleRestart}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 px-4 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 justify-center"
                    >
                      <RotateCcw size={20} />
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
                <h2 className="text-2xl font-bold mb-4">Ready to Play?</h2>
                <p className="text-gray-300 mb-6">Eat smaller blobs to grow bigger!</p>
                <button
                  onClick={startGame}
                  className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 mx-auto"
                >
                  <Play size={20} />
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