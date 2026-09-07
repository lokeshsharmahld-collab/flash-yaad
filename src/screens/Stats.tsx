import React from 'react';
import { useAppState } from '../hooks/useAppState';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Flame, Trophy, CheckCircle, BarChart3, Clock, TrendingUp } from 'lucide-react';
import { subDays, format, parseISO } from 'date-fns';

export const Stats: React.FC = () => {
  const { state, today } = useAppState();

  const activeCards = state.cards.filter((c) => c.deletedAt === null);

  // Box distribution counts
  const boxCounts = [
    { box: 'Box 1', days: '1 day', count: activeCards.filter((c) => c.box === 1).length, color: '#f87171' },
    { box: 'Box 2', days: '2 days', count: activeCards.filter((c) => c.box === 2).length, color: '#fb923c' },
    { box: 'Box 3', days: '4 days', count: activeCards.filter((c) => c.box === 3).length, color: '#facc15' },
    { box: 'Box 4', days: '7 days', count: activeCards.filter((c) => c.box === 4).length, color: '#60a5fa' },
    { box: 'Box 5', days: 'Mastered', count: activeCards.filter((c) => c.box === 5).length, color: '#34d399' },
  ];

  // Overall retention metrics
  let totalReviews = 0;
  let totalCorrect = 0;
  activeCards.forEach((c) => {
    totalReviews += c.totalReviews;
    totalCorrect += c.totalCorrect;
  });

  const overallRetention = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;

  // 30-day activity calculation from reviewLog
  const reviewsByDate: Record<string, number> = {};
  state.reviewLog.forEach((log) => {
    reviewsByDate[log.on] = (reviewsByDate[log.on] || 0) + 1;
  });

  const past30Days: Array<{ date: string; label: string; count: number }> = [];
  const todayDate = parseISO(today);

  for (let i = 29; i >= 0; i--) {
    const d = subDays(todayDate, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayLabel = format(d, 'MMM d');
    past30Days.push({
      date: dateStr,
      label: dayLabel,
      count: reviewsByDate[dateStr] || 0,
    });
  }

  // 7-day rolling reviews & accuracy
  const past7Days = past30Days.slice(23);
  const reviewsInPast7Days = past7Days.reduce((acc, curr) => acc + curr.count, 0);

  // Empty state check
  if (totalReviews === 0 && activeCards.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 text-stone-400 rounded-3xl flex items-center justify-center mx-auto text-3xl">
          📊
        </div>
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          Study today to see your retention curve
        </h1>
        <p className="text-sm text-stone-500 max-w-sm mx-auto">
          As you review cards through the 5 Leitner boxes, this dashboard will visualize your memory retention and daily study habits.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Retention & Progress
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Continuous cognitive feedback computed purely from offline Leitner events.
        </p>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1">
            Overall Accuracy
          </span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {overallRetention}%
          </span>
          <span className="text-[11px] text-stone-400 block mt-0.5">
            {totalCorrect} / {totalReviews} correct
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1">
            Current Streak
          </span>
          <span className="text-2xl font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
            🔥 {state.streak.current}d
          </span>
          <span className="text-[11px] text-stone-400 block mt-0.5">
            Longest: {state.streak.longest}d
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1">
            Mastered (Box 5)
          </span>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {boxCounts[4].count}
          </span>
          <span className="text-[11px] text-stone-400 block mt-0.5">
            Permanent memory
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1">
            7-Day Activity
          </span>
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {reviewsInPast7Days}
          </span>
          <span className="text-[11px] text-stone-400 block mt-0.5">
            Reviews in last 7d
          </span>
        </div>
      </div>

      {/* Leitner Box Distribution */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            Leitner Box Distribution
          </h2>
          <p className="text-xs text-stone-500">
            Cards migrate rightward to Box 5 as you consistently recall them.
          </p>
        </div>

        {/* Visual Stacked Progress Bar */}
        <div className="w-full h-7 bg-stone-100 dark:bg-stone-800 rounded-xl overflow-hidden flex shadow-inner">
          {boxCounts.map((box, i) => {
            const percentage = activeCards.length > 0 ? (box.count / activeCards.length) * 100 : 0;
            if (percentage === 0) return null;
            return (
              <div
                key={box.box}
                style={{ width: `${percentage}%`, backgroundColor: box.color }}
                title={`${box.box}: ${box.count} cards (${Math.round(percentage)}%)`}
                className="h-full transition-all duration-500 flex items-center justify-center text-[10px] font-bold text-stone-900 font-mono overflow-hidden px-1"
              >
                {percentage >= 8 ? `${box.count}` : ''}
              </div>
            );
          })}
        </div>

        {/* Box breakdown cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          {boxCounts.map((item) => (
            <div
              key={item.box}
              className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-100 dark:border-stone-800 text-center"
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200">{item.box}</span>
              </div>
              <span className="text-xl font-extrabold text-stone-900 dark:text-stone-100 block">
                {item.count}
              </span>
              <span className="text-[11px] text-stone-400 font-medium">
                {item.days} interval
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 30-Day Review Activity Bar Chart */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            30-Day Study Activity
          </h2>
          <p className="text-xs text-stone-500">
            Number of flashcards reviewed each day over the last 30 days.
          </p>
        </div>

        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={past30Days} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <XAxis
                dataKey="label"
                interval={6}
                tick={{ fontSize: 10, fill: '#78716c' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#78716c' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1c1917',
                  color: '#fafaf9',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#a8a29e' }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
