"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Calendar } from "@/app/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/app/lib/utils";
import { useTranslation } from "@/app/context/LanguageContext";
import PolarAreaChart from "./PolarAreaChart";

// Helper function to format date in local timezone (YYYY-MM-DD)
const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function CoachClientCheckInView({ clientId }) {
  const t = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [checkInData, setCheckInData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch check-in data when date changes
  useEffect(() => {
    const fetchCheckInData = async () => {
      if (!clientId) return;

      setLoading(true);
      setError(null);

      try {
        const dateStr = formatDateLocal(selectedDate);
        const response = await fetch(`/api/coach/clients/${clientId}/checkin?date=${dateStr}`);

        if (!response.ok) {
          throw new Error('Failed to fetch check-in data');
        }

        const data = await response.json();
        setCheckInData(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching check-in data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCheckInData();
  }, [clientId, selectedDate]);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  // Prepare data for Polar Area Chart (goals only)
  const polarData = checkInData?.goalDistribution ? {
    labels: checkInData.goalDistribution.map(item => item.name),
    datasets: [
      {
        label: 'Goal Performance',
        data: checkInData.goalDistribution.map(item => item.value),
        backgroundColor: checkInData.goalDistribution.map(item => item.color + '80'),
        borderColor: '#ffffff',
        borderWidth: 1,
      },
    ],
  } : null;

  const polarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.parsed.r} / 5`;
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
          color: 'hsl(var(--muted-foreground))',
          font: {
            size: 12
          },
          display: true,
        },
        grid: {
          color: '#e5e7eb',
          lineWidth: 1
        },
        pointLabels: {
          color: 'hsl(var(--muted-foreground))',
          font: {
            size: 12
          }
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          {t('clients.dailyCheckIn', 'Daily Check-in')}
        </CardTitle>
        <CardDescription>
          {t('clients.viewClientDailyTracking', 'View client\'s daily check-in metrics and notes')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Selector */}
        <div className="flex items-center justify-center gap-2 p-4 bg-muted/30 rounded-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDate('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal min-w-[200px]",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDate('next')}
            disabled={isToday(selectedDate)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(new Date())}
            className="ml-2"
          >
            {t('common.time.today', 'Today')}
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">
              {t('clients.loadingCheckIn', 'Loading check-in data...')}
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8 text-red-500">
            <p>{t('clients.errorLoadingCheckIn', 'Error loading check-in data')}: {error}</p>
          </div>
        )}

        {/* No Data State */}
        {!loading && !error && !checkInData?.checkIn && (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('clients.noCheckInForDate', 'No check-in found for this date')}</p>
            <p className="text-sm mt-1">
              {formatDate(selectedDate)}
            </p>
          </div>
        )}

        {/* Check-in Data */}
        {!loading && !error && checkInData?.checkIn && (
          <div className="space-y-6">
            {/* Goal Metrics - Polar Chart */}
            {checkInData.goalDistribution && checkInData.goalDistribution.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {t('clients.goalMetrics', 'Goal Metrics')}
                </h3>
                <div className="h-80 w-full">
                  {polarData && (
                    <PolarAreaChart data={polarData} options={polarOptions} />
                  )}
                </div>
                {/* Goal Legend */}
                <div className="grid grid-cols-2 gap-2">
                  {checkInData.goalDistribution.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 rounded bg-muted/30">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-sm font-medium truncate">{item.name}</span>
                      <span className="text-sm text-muted-foreground ml-auto">{item.value}/5</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bad Habits */}
            {checkInData.badHabits && checkInData.badHabits.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {t('clients.badHabits', 'Habits to Reduce')}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {checkInData.badHabits.map((habit) => (
                    <div key={habit.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{habit.icon}</span>
                        <span className="text-sm font-medium">{habit.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(habit.value / 5) * 100}%`,
                              backgroundColor: habit.color
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground min-w-[30px] text-right">
                          {habit.value}/5
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {t('clients.dailyNotes', 'Daily Notes')}
              </h3>
              {checkInData.notes ? (
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {checkInData.notes}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted/30 border text-center text-muted-foreground">
                  <p className="text-sm">
                    {t('clients.noNotesForDate', 'No notes saved for this date')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CoachClientCheckInView;

