"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Target, TrendingDown, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/app/context/LanguageContext';
import { IconPicker } from '@/app/components/IconPicker';
import { ColorPicker } from '@/app/components/ColorPicker';

export function CoachClientGoalsHabits({ clientId }) {
  const t = useTranslation();
  const [goals, setGoals] = useState([]);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add goal/habit dialog state
  const [showAddGoalDialog, setShowAddGoalDialog] = useState(false);
  const [showAddHabitDialog, setShowAddHabitDialog] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalIcon, setNewGoalIcon] = useState("🎯");
  const [newGoalColor, setNewGoalColor] = useState("#3B82F6");
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitIcon, setNewHabitIcon] = useState("📱");
  const [newHabitColor, setNewHabitColor] = useState("#EF4444");
  const [saving, setSaving] = useState(false);

  // Fetch goals and habits
  useEffect(() => {
    const fetchGoalsAndHabits = async () => {
      if (!clientId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/coach/clients/${clientId}/goals`);
        const data = await response.json();

        if (data.success) {
          setGoals(data.goals);
          setHabits(data.badHabits);
        } else {
          setError('Failed to load goals and habits');
        }
      } catch (err) {
        console.error('Error fetching goals and habits:', err);
        setError('Failed to load goals and habits');
      } finally {
        setLoading(false);
      }
    };

    fetchGoalsAndHabits();
  }, [clientId]);

  const handleToggleGoal = async (goalId) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    try {
      const response = await fetch(`/api/coach/clients/${clientId}/goals`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: goalId,
          type: 'goal',
          isActive: !goal.isActive
        })
      });

      const data = await response.json();
      if (data.success) {
        setGoals(prev => prev.map(g => 
          g.id === goalId ? { ...g, isActive: !g.isActive } : g
        ));
        toast.success("Goal updated successfully!");
      } else {
        throw new Error(data.error || 'Failed to update goal');
      }
    } catch (error) {
      toast.error(error.message || "Failed to update goal");
    }
  };

  const handleToggleHabit = async (habitId) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    try {
      const response = await fetch(`/api/coach/clients/${clientId}/goals`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: habitId,
          type: 'habit',
          isActive: !habit.isActive
        })
      });

      const data = await response.json();
      if (data.success) {
        setHabits(prev => prev.map(h => 
          h.id === habitId ? { ...h, isActive: !h.isActive } : h
        ));
        toast.success("Habit updated successfully!");
      } else {
        throw new Error(data.error || 'Failed to update habit');
      }
    } catch (error) {
      toast.error(error.message || "Failed to update habit");
    }
  };

  const handleAddGoal = async () => {
    if (!newGoalName.trim()) {
      toast.error("Please enter a goal name");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/coach/clients/${clientId}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'goal',
          name: newGoalName.trim(),
          icon: newGoalIcon || '🎯',
          color: newGoalColor || '#3B82F6'
        })
      });

      const data = await response.json();
      if (data.success) {
        setGoals(prev => [...prev, data.goal]);
        setNewGoalName("");
        setNewGoalIcon("🎯");
        setNewGoalColor("#3B82F6");
        setShowAddGoalDialog(false);
        toast.success("Goal added successfully!");
      } else {
        throw new Error(data.error || 'Failed to add goal');
      }
    } catch (error) {
      toast.error(error.message || "Failed to add goal");
    } finally {
      setSaving(false);
    }
  };

  const handleAddHabit = async () => {
    if (!newHabitName.trim()) {
      toast.error("Please enter a habit name");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/coach/clients/${clientId}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'habit',
          name: newHabitName.trim(),
          icon: newHabitIcon || '📱',
          color: newHabitColor || '#EF4444'
        })
      });

      const data = await response.json();
      if (data.success) {
        setHabits(prev => [...prev, data.habit]);
        setNewHabitName("");
        setNewHabitIcon("📱");
        setNewHabitColor("#EF4444");
        setShowAddHabitDialog(false);
        toast.success("Habit added successfully!");
      } else {
        throw new Error(data.error || 'Failed to add habit');
      }
    } catch (error) {
      toast.error(error.message || "Failed to add habit");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (goalId, goalName) => {
    try {
      const response = await fetch(`/api/coach/clients/${clientId}/goals?id=${goalId}&type=goal`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setGoals(prev => prev.filter(goal => goal.id !== goalId));
        toast.success(`"${goalName}" deleted successfully!`);
      } else {
        throw new Error(data.error || 'Failed to delete goal');
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete goal");
    }
  };

  const handleDeleteHabit = async (habitId, habitName) => {
    try {
      const response = await fetch(`/api/coach/clients/${clientId}/goals?id=${habitId}&type=habit`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setHabits(prev => prev.filter(habit => habit.id !== habitId));
        toast.success(`"${habitName}" deleted successfully!`);
      } else {
        throw new Error(data.error || 'Failed to delete habit');
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete habit");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading goals and habits...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Goals Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              <CardTitle>Life Area Goals</CardTitle>
            </div>
            <Badge variant="outline">
              {goals.filter(g => g.isActive).length} / {goals.length} active
            </Badge>
          </div>
          <CardDescription>
            Manage client's goals for daily tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {goals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-2xl">{goal.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{goal.name}</h3>
                      {goal.isCustom && (
                        <Badge variant="secondary" className="text-xs">Custom</Badge>
                      )}
                      {goal.isDefault && (
                        <Badge variant="outline" className="text-xs">Default</Badge>
                      )}
                    </div>
                    {goal.isActive && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <span>Current: {goal.currentScore}/5</span>
                          <div className="bg-secondary rounded-full w-16 h-1">
                            <div 
                              className="rounded-full h-1 transition-all"
                              style={{ 
                                width: `${(goal.currentScore / 5) * 100}%`,
                                backgroundColor: goal.color
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {goal.isCustom && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteGoal(goal.id, goal.name)}
                      className="text-destructive hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Switch
                    checked={goal.isActive}
                    onCheckedChange={() => handleToggleGoal(goal.id)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add Goal */}
          {!showAddGoalDialog ? (
            <Button 
              variant="outline" 
              onClick={() => setShowAddGoalDialog(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          ) : (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
              <div className="space-y-2">
                <Label>Goal Name</Label>
                <Input
                  placeholder="e.g., Meditation Practice"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <IconPicker
                  value={newGoalIcon}
                  onChange={setNewGoalIcon}
                  placeholder="🎯"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <ColorPicker
                  value={newGoalColor}
                  onChange={setNewGoalColor}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddGoal} size="sm" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add Goal
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddGoalDialog(false);
                    setNewGoalName("");
                    setNewGoalIcon("🎯");
                    setNewGoalColor("#3B82F6");
                  }}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Habits Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <CardTitle>Habits to Reduce</CardTitle>
            </div>
            <Badge variant="outline">
              {habits.filter(h => h.isActive).length} / {habits.length} active
            </Badge>
          </div>
          <CardDescription>
            Manage client's habits for daily tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {habits.map((habit) => (
              <div key={habit.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-2xl">{habit.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{habit.name}</h3>
                      {habit.isCustom && (
                        <Badge variant="secondary" className="text-xs">Custom</Badge>
                      )}
                      {habit.isDefault && (
                        <Badge variant="outline" className="text-xs">Default</Badge>
                      )}
                    </div>
                    {habit.isActive && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <span>Current: {habit.currentScore}/5</span>
                          <div className="bg-secondary rounded-full w-16 h-1">
                            <div 
                              className="rounded-full h-1 transition-all"
                              style={{ 
                                width: `${(habit.currentScore / 5) * 100}%`,
                                backgroundColor: habit.color
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {habit.isCustom && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteHabit(habit.id, habit.name)}
                      className="text-destructive hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Switch
                    checked={habit.isActive}
                    onCheckedChange={() => handleToggleHabit(habit.id)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add Habit */}
          {!showAddHabitDialog ? (
            <Button 
              variant="outline" 
              onClick={() => setShowAddHabitDialog(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Habit
            </Button>
          ) : (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
              <div className="space-y-2">
                <Label>Habit Name</Label>
                <Input
                  placeholder="e.g., Late Night Snacking"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <IconPicker
                  value={newHabitIcon}
                  onChange={setNewHabitIcon}
                  placeholder="📱"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <ColorPicker
                  value={newHabitColor}
                  onChange={setNewHabitColor}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddHabit} size="sm" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add Habit
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddHabitDialog(false);
                    setNewHabitName("");
                    setNewHabitIcon("📱");
                    setNewHabitColor("#EF4444");
                  }}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CoachClientGoalsHabits;

