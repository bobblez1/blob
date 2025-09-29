import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Trophy, Star, Heart, TrendingUp, Gamepad2, Target, ArrowLeft, Award, Calendar, Zap } from 'lucide-react';

interface DashboardProps {
  onBack: () => void;
}

function Dashboard({ onBack }: DashboardProps) {
  const { stats, upgrades } = useGame();
  const [selectedTab, setSelectedTab] = useState<'stats' | 'achievements'>('stats');

  const ownedUpgrades = upgrades.filter(u => u.owned);
  
  const achievements = [
    { id: 'first_game', name: 'First Steps', description: 'Play your first game', completed: stats.gamesPlayed > 0, icon: '🎮' },
    { id: 'score_100', name: 'Century', description: 'Score 100 points in a single game', completed: stats.highScore >= 100, icon: '💯' },
    { id: 'score_500', name: 'High Roller', description: 'Score 500 points in a single game', completed: stats.highScore >= 500, icon: '🚀' },
    { id: 'games_10', name: 'Dedicated', description: 'Play 10 games', completed: stats.gamesPlayed >= 10, icon: '🏆' },
    { id: 'total_1000', name: 'Collector', description: 'Earn 1000 total points', completed: stats.totalPoints >= 1000, icon: '⭐' },
    { id: 'first_upgrade', name: 'Enhanced', description: 'Purchase your first upgrade', completed: ownedUpgrades.length > 0, icon: '⚡' },
  ];
  
  const completedAchievements = achievements.filter(a => a.completed);
  
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
          <h1 className="text-xl font-bold">Dashboard</h1>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setSelectedTab('stats')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTab === 'stats' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
            }`}
          >
            Statistics
          </button>
          <button
            onClick={() => setSelectedTab('achievements')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTab === 'achievements' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
            }`}
          >
            Achievements ({completedAchievements.length}/{achievements.length})
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {selectedTab === 'stats' ? (
          <>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-4 rounded-xl border border-blue-500/30">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Star size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</div>
                <div className="text-sm text-gray-400">Total Points</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 p-4 rounded-xl border border-green-500/30">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 p-2 rounded-lg">
                <Trophy size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.highScore.toLocaleString()}</div>
                <div className="text-sm text-gray-400">High Score</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-4 rounded-xl border border-purple-500/30">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500 p-2 rounded-lg">
                <Gamepad2 size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.gamesPlayed}</div>
                <div className="text-sm text-gray-400">Games Played</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 p-4 rounded-xl border border-red-500/30">
            <div className="flex items-center gap-3">
              <div className="bg-red-500 p-2 rounded-lg">
                <Heart size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.livesRemaining}</div>
                <div className="text-sm text-gray-400">Lives Left</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={20} />
            Progress
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Points to Next Milestone</span>
                <span>{Math.max(0, 1000 - (stats.totalPoints % 1000))}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(stats.totalPoints % 1000) / 10}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Average Score</span>
                <span>{stats.gamesPlayed > 0 ? Math.round(stats.totalPoints / stats.gamesPlayed) : 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Owned Upgrades */}
        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target size={20} />
            Active Upgrades
          </h3>
          
          {ownedUpgrades.length > 0 ? (
            <div className="grid gap-3">
              {ownedUpgrades.map(upgrade => (
                <div key={upgrade.id} className="bg-gray-700/50 p-3 rounded-lg border border-gray-600/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{upgrade.name}</div>
                      <div className="text-sm text-gray-400">{upgrade.description}</div>
                    </div>
                    <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-semibold">
                      ACTIVE
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-center py-4">
              <p>No upgrades purchased yet</p>
              <p className="text-sm mt-1">Visit the store to get upgrades!</p>
            </div>
          )}
        </div>

        {/* Daily Reset Info */}
        <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <Heart size={16} />
            <span className="font-semibold">Daily Lives</span>
          </div>
          <p className="text-sm text-gray-300">
            You have {stats.livesRemaining} lives remaining. Lives reset every 24 hours at midnight.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Last reset: {stats.lastLifeReset}
          </p>
        </div>
          </>
        ) : (
          <>
            {/* Achievements */}
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {completedAchievements.length}/{achievements.length}
                </div>
                <p className="text-gray-400">Achievements Unlocked</p>
              </div>
              
              {achievements.map(achievement => (
                <div 
                  key={achievement.id}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    achievement.completed 
                      ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30' 
                      : 'bg-gray-800/30 border-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`text-3xl ${achievement.completed ? '' : 'grayscale opacity-50'}`}>
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <div className={`font-bold ${achievement.completed ? 'text-yellow-400' : 'text-gray-400'}`}>
                        {achievement.name}
                      </div>
                      <div className="text-sm text-gray-300">
                        {achievement.description}
                      </div>
                    </div>
                    {achievement.completed && (
                      <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                        UNLOCKED
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}

export default Dashboard;