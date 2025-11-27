import React from 'react';
import { Flame, Trophy, Target } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { useTranslation } from '@/app/context/LanguageContext';

export function StreakCounter({ 
  streak, 
  totalPoints, 
  level, 
  pointsToNextLevel, 
  activeMilestone,
  recentMilestone 
}) {
  const t = useTranslation();

  const levelProgress = ((level * 100 - pointsToNextLevel) / (level * 100)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-2.5 bg-card rounded-lg border">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-semibold text-foreground">{streak}</span>
          <span className="text-xs text-muted-foreground">{t('streak.dayStreak', 'day streak')}</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium text-foreground">{totalPoints} {t('streak.points', 'Points')}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Target className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-foreground">{t('streak.level', 'Level')} {level}</span>
        </div>
        
        {recentMilestone && (
          <Badge variant="default" className="text-xs bg-green-500 text-white animate-pulse">
            {recentMilestone.title}
          </Badge>
        )}
      </div>
      
      {activeMilestone && (
        <div className="px-2.5">
          <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
            <span>{t('streak.next', 'Next')}: {activeMilestone.title}</span>
            <span>{activeMilestone.streak - streak} {t('streak.daysToGo', 'days to go')}</span>
          </div>
          <Progress value={((streak / activeMilestone.streak) * 100)} className="h-1" />
        </div>
      )}
      
      <div className="px-2.5">
        <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
          <span>{t('streak.level', 'Level')} {level} {t('streak.progress', 'Progress')}</span>
          <span>{pointsToNextLevel} {t('streak.points', 'Points')} {t('streak.toLevel', 'to Level')} {level + 1}</span>
        </div>
        <Progress value={levelProgress} className="h-1" />
      </div>
    </div>
  );
}