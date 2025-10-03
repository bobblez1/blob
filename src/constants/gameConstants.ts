// Game Constants
export const GAME_CONSTANTS = {
  // Canvas dimensions
  CANVAS_WIDTH: 1000,
  CANVAS_HEIGHT: 1500,
  VIEWPORT_WIDTH: 360,
  VIEWPORT_HEIGHT: 640,
  
  // Player settings
  PLAYER_MIN_SIZE: 20,
  PLAYER_INITIAL_SIZE: 20,
  PLAYER_BASE_SPEED: 2.5,
  PLAYER_SPEED_BOOST: 3.5,
  
  // Bot settings
  BOT_MIN_SIZE: 10,
  BOT_MAX_INITIAL_SIZE: 40,
  BOT_BASE_SPEED: 1.5,
  BOT_DETECTION_RANGE: 150,
  BOT_CHASE_RANGE: 100,
  BOT_AVOID_RANGE: 80,
  
  // Food settings
  FOOD_COUNT: 200,
  FOOD_MIN_SIZE: 2,
  FOOD_MAX_SIZE: 6,
  FOOD_REGENERATION_THRESHOLD: 150,
  FOOD_REGENERATION_BATCH: 30,
  
  // Game mechanics
  DECAY_INTERVAL: 2000, // ms
  DECAY_AMOUNT: 0.5,
  FOOD_GROWTH: 0.3,
  BOT_GROWTH_MULTIPLIER: 0.1,
  
  // Grid and visual
  GRID_SIZE: 40,
  
  // Game modes
  TIME_ATTACK_DURATION: 180, // seconds
  BATTLE_ROYALE_SHRINK_RATE: 2,
  BATTLE_ROYALE_MIN_RADIUS: 100,
} as const;

export const FOOD_COLORS = {
  RED: '#DC2626',
  ORANGE: '#EA580C',
  YELLOW: '#CA8A04',
  GREEN: '#16A34A',
  BLUE: '#2563EB',
  PURPLE: '#9333EA',
  PINK: '#DB2777',
} as const;

export const TEAM_COLORS = {
  red: '#EF4444',
  blue: '#3B82F6',
} as const;

export const BOT_COLORS = [
  '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16'
] as const;

export const BOT_NAMES = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 
  'Sigma', 'Theta', 'Zeta', 'Kappa', 'Lambda'
] as const;

export const UPGRADE_IDS = {
  SPEED_BOOST: 'speed_boost',
  POINT_MULTIPLIER: 'point_multiplier',
  INSTANT_KILL: 'instant_kill',
  AUTO_REVIVE: 'auto_revive',
  RED_SKIN: 'red_skin',
  GOLD_SKIN: 'gold_skin',
  RAINBOW_SKIN: 'rainbow_skin',
  SHIELD: 'shield',
  DOUBLE_POINTS: 'double_points',
  EXTRA_LIVES: 'extra_lives',
} as const;

export const CHALLENGE_TYPES = {
  EAT_BLOBS: 'eat_blobs',
  SURVIVE_TIME: 'survive_time',
  DAILY_GAMES: 'daily_games',
  WIN_STREAK: 'win_streak',
} as const;

export const EVOLUTION_STAGES = {
  BASIC: { name: 'basic', threshold: 0, color: '#FFFFFF' },
  COMMON: { name: 'common', threshold: 30, color: '#10B981' },
  RARE: { name: 'rare', threshold: 50, color: '#3B82F6' },
  EPIC: { name: 'epic', threshold: 70, color: '#9333EA' },
  LEGENDARY: { name: 'legendary', threshold: 100, color: '#FFD700' },
} as const;