import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { contestApi } from '../../services/api';
import type { Contest, LeaderboardEntry } from '../../types';

const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
};

const ContestLeaderboardPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [contest, setContest] = useState<Contest | null>(null);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadLeaderboard = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const response = await contestApi.getLeaderboard(slug, { page, limit: 50 });
      if (response.success && response.data) {
        setLeaderboard(response.data.leaderboard || []);
        setContest(response.data.contest);
        setCurrentUserRank(response.data.currentUserRank || null);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 5000);
    return () => clearInterval(interval);
  }, [slug, page]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500">
        加载中...
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500">
        竞赛不存在
      </div>
    );
  }

  const problemIndices = contest.problems?.map((p) => p.index) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Link to={`/contests/${slug}`} className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
              ← 返回竞赛
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{contest.title} - 排行榜</h1>
          </div>
          {contest.isFrozen && (
            <div className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium">
              🔒 封榜中
            </div>
          )}
        </div>
      </div>

      {currentUserRank && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-blue-600">我的排名</span>
            <span className="text-2xl font-bold text-blue-700">#{currentUserRank.rank}</span>
            <span className="text-sm text-gray-600">
              解决 {currentUserRank.solvedCount} 题
            </span>
            {contest.ruleType === 'ACM' && (
              <span className="text-sm text-gray-600">
                罚时 {formatTime(currentUserRank.penalty)}
              </span>
            )}
            {contest.ruleType !== 'ACM' && (
              <span className="text-sm text-gray-600">
                得分 {currentUserRank.totalScore}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  排名
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  解题
                </th>
                {contest.ruleType === 'ACM' && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    罚时
                  </th>
                )}
                {contest.ruleType !== 'ACM' && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    得分
                  </th>
                )}
                {problemIndices.map((idx) => (
                  <th
                    key={idx}
                    className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
                  >
                    {idx}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((entry) => (
                <tr
                  key={entry.userId}
                  className={`hover:bg-gray-50 ${
                    currentUserRank?.userId === entry.userId ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-gray-900 font-medium">#{entry.rank}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-medium text-gray-900">
                      {entry.nickname || entry.username}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center font-semibold text-green-600">
                    {entry.solvedCount}
                  </td>
                  {contest.ruleType === 'ACM' && (
                    <td className="px-4 py-3 whitespace-nowrap text-center text-gray-600">
                      {formatTime(entry.penalty)}
                    </td>
                  )}
                  {contest.ruleType !== 'ACM' && (
                    <td className="px-4 py-3 whitespace-nowrap text-center text-gray-600">
                      {entry.totalScore}
                    </td>
                  )}
                  {problemIndices.map((idx) => {
                    const stat = entry.problemStats[idx];
                    if (!stat) {
                      return (
                        <td key={idx} className="px-2 py-3 whitespace-nowrap text-center text-gray-400">
                          -
                        </td>
                      );
                    }
                    if (stat.pending) {
                      return (
                        <td key={idx} className="px-2 py-3 whitespace-nowrap text-center text-gray-400">
                          ⏳
                        </td>
                      );
                    }
                    if (stat.solved) {
                      const attempts = stat.attempts > 0 ? `+${stat.attempts - 1}` : '';
                      return (
                        <td
                          key={idx}
                          className="px-2 py-3 whitespace-nowrap text-center text-green-600 font-semibold"
                        >
                          <div className="text-sm">
                            {contest.ruleType === 'ACM' ? (
                              <>
                                ✓{attempts}
                                <div className="text-xs text-gray-400">
                                  {stat.solveTimeMinutes && formatTime(stat.solveTimeMinutes)}
                                </div>
                              </>
                            ) : (
                              <>{stat.score} 分</>
                            )}
                          </div>
                          {stat.firstBlood && (
                            <span className="text-xs text-red-500">🔥 一血</span>
                          )}
                        </td>
                      );
                    }
                    if (stat.attempts > 0) {
                      return (
                        <td
                          key={idx}
                          className="px-2 py-3 whitespace-nowrap text-center text-red-500 font-semibold"
                        >
                          -{stat.attempts}
                        </td>
                      );
                    }
                    return (
                      <td key={idx} className="px-2 py-3 whitespace-nowrap text-center text-gray-400">
                        -
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-8 text-gray-500">暂无排行数据</div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 p-4 border-t">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              上一页
            </button>
            <span className="text-gray-600">
              第 {page} / {totalPages} 页
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContestLeaderboardPage;
