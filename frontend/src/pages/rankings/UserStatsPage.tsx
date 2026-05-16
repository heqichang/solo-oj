import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { rankingApi } from '../../services/api';
import type { UserStats } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { STATUS_LABELS } from '../../utils/judgeStatus';

const UserStatsPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const userId = id || undefined;
      const response = await rankingApi.getUserStats(userId);
      if (response.success && response.data) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, [id]);

  const renderHeatmap = () => {
    if (!stats?.submissionHeatmap) return null;

    const dates = Object.keys(stats.submissionHeatmap).sort();
    if (dates.length === 0) return null;

    const maxCount = Math.max(...Object.values(stats.submissionHeatmap));
    const getColor = (count: number) => {
      if (count === 0) return 'bg-gray-100';
      const ratio = count / maxCount;
      if (ratio < 0.25) return 'bg-green-200';
      if (ratio < 0.5) return 'bg-green-400';
      if (ratio < 0.75) return 'bg-green-600';
      return 'bg-green-700';
    };

    const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    const days = ['日', '一', '二', '三', '四', '五', '六'];

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">提交热力图</h3>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="flex gap-1 mb-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="text-xs text-gray-500 w-8 text-center">
                  {months[i]}
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, dayIdx) => (
                <div key={dayIdx} className="flex flex-col gap-1">
                  {dayIdx === 1 && (
                    <div className="text-xs text-gray-500 h-3 flex items-center">
                      {days[dayIdx]}
                    </div>
                  )}
                  {dayIdx === 3 && (
                    <div className="text-xs text-gray-500 h-3 flex items-center">
                      {days[dayIdx]}
                    </div>
                  )}
                  {dayIdx === 5 && (
                    <div className="text-xs text-gray-500 h-3 flex items-center">
                      {days[dayIdx]}
                    </div>
                  )}
                  {dayIdx !== 1 && dayIdx !== 3 && dayIdx !== 5 && (
                    <div className="h-3" />
                  )}
                  {Array.from({ length: 53 }).map((_, weekIdx) => {
                    const dateIndex = weekIdx * 7 + dayIdx;
                    const date = dates[dateIndex];
                    const count = date ? stats.submissionHeatmap[date] || 0 : 0;
                    return (
                      <div
                        key={weekIdx}
                        className={`w-3 h-3 rounded-sm ${getColor(count)}`}
                        title={date ? `${date}: ${count} 次提交` : ''}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500">
              <span>少</span>
              <div className="w-3 h-3 rounded-sm bg-gray-100" />
              <div className="w-3 h-3 rounded-sm bg-green-200" />
              <div className="w-3 h-3 rounded-sm bg-green-400" />
              <div className="w-3 h-3 rounded-sm bg-green-600" />
              <div className="w-3 h-3 rounded-sm bg-green-700" />
              <span>多</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500">
        加载中...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500">
        暂无统计数据
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {id ? '用户统计' : '我的统计'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-3xl font-bold text-blue-600">{stats.totalSolved}</div>
          <div className="text-sm text-gray-500 mt-1">已解决题目</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-3xl font-bold text-green-600">{stats.totalSubmissions}</div>
          <div className="text-sm text-gray-500 mt-1">总提交次数</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-3xl font-bold text-purple-600">
            {stats.totalSubmissions > 0
              ? Math.round((stats.totalSolved / stats.totalSubmissions) * 100)
              : 0}%
          </div>
          <div className="text-sm text-gray-500 mt-1">总通过率</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-3xl font-bold text-orange-600">
            {stats.tagStats.length}
          </div>
          <div className="text-sm text-gray-500 mt-1">涉及标签</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-500 mb-2">简单题</div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-green-600">{stats.easySolved}</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ width: `${Math.min(100, stats.easySolved * 10)}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-500 mb-2">中等题</div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-yellow-600">{stats.mediumSolved}</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500"
              style={{ width: `${Math.min(100, stats.mediumSolved * 10)}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-500 mb-2">困难题</div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-red-600">{stats.hardSolved}</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500"
              style={{ width: `${Math.min(100, stats.hardSolved * 10)}%` }}
            />
          </div>
        </div>
      </div>

      {renderHeatmap()}

      {stats.tagStats.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">标签统计</h3>
          <div className="space-y-3">
            {stats.tagStats
              .sort((a, b) => b.solved - a.solved)
              .slice(0, 10)
              .map((tag) => (
                <div key={tag.tagName} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-medium text-gray-700">{tag.tagName}</div>
                  <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 flex items-center justify-end pr-2"
                      style={{ width: `${(tag.solved / Math.max(1, tag.total)) * 100}%` }}
                    >
                      {tag.solved > 0 && (
                        <span className="text-xs text-white font-medium">{tag.solved}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-16 text-sm text-gray-500 text-right">
                    {tag.solved}/{tag.total}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {stats.recentSubmissions && stats.recentSubmissions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">最近提交</h3>
          <div className="space-y-3">
            {stats.recentSubmissions.slice(0, 10).map((submission) => (
              <div
                key={submission.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {submission.problem?.title || '未知题目'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(submission.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    submission.status === 'ACCEPTED'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {STATUS_LABELS[submission.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStatsPage;
