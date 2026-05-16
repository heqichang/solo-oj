import React, { useState, useEffect } from 'react';
import { rankingApi } from '../../services/api';
import type { GlobalRankingEntry } from '../../types';

const RankingsPage: React.FC = () => {
  const [rankings, setRankings] = useState<GlobalRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  const loadRankings = async () => {
    setLoading(true);
    try {
      const response = await rankingApi.getGlobal({ page, limit: 50, search });
      if (response.success && response.data) {
        setRankings(response.data.rankings || []);
        setCurrentUserRank(response.data.currentUserRank || null);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to load rankings:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRankings();
  }, [page, search]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">全球排名</h1>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <form
            onSubmit={(e) => { e.preventDefault(); setPage(1); loadRankings(); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索用户..."
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 max-w-md"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              搜索
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setPage(1); }}
                className="text-gray-600 hover:text-gray-800 px-4 py-2"
              >
                清除
              </button>
            )}
          </form>
        </div>

        {currentUserRank !== null && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <span className="text-sm text-blue-600">我的排名:</span>{' '}
            <span className="text-xl font-bold text-blue-700">#{currentUserRank}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  排名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  解题数
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  得分
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rankings.map((entry, index) => (
                <tr key={entry.userId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        index === 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : index === 1
                          ? 'bg-gray-200 text-gray-700'
                          : index === 2
                          ? 'bg-orange-100 text-orange-700'
                          : 'text-gray-700'
                      }`}
                    >
                      {entry.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {entry.avatar ? (
                        <img
                          src={entry.avatar}
                          alt={entry.nickname || entry.username}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {(entry.nickname || entry.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {entry.nickname || entry.username}
                        </div>
                        <div className="text-sm text-gray-500">@{entry.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-green-600 font-semibold">
                    {entry.solvedCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-blue-600 font-semibold">
                    {entry.totalScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rankings.length === 0 && (
            <div className="text-center py-8 text-gray-500">暂无排名数据</div>
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
      )}
    </div>
  );
};

export default RankingsPage;
