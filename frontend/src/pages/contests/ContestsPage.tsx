import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contestApi } from '../../services/api';
import type { Contest } from '../../types';
import { useAuth } from '../../context/AuthContext';

const CONTEST_RULE_LABELS: Record<string, string> = {
  ACM: 'ACM',
  OI: 'OI',
  IOI: 'IOI',
};

const CONTEST_STATUS_LABELS: Record<string, string> = {
  UPCOMING: '即将开始',
  RUNNING: '进行中',
  ENDED: '已结束',
};

const CONTEST_STATUS_COLORS: Record<string, string> = {
  UPCOMING: 'bg-blue-100 text-blue-700',
  RUNNING: 'bg-green-100 text-green-700',
  ENDED: 'bg-gray-100 text-gray-700',
};

const getContestStatus = (contest: Contest): 'UPCOMING' | 'RUNNING' | 'ENDED' => {
  const now = new Date().getTime();
  const start = new Date(contest.startTime).getTime();
  const end = new Date(contest.endTime).getTime();
  
  if (now < start) return 'UPCOMING';
  if (now >= start && now < end) return 'RUNNING';
  return 'ENDED';
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (start: string, end: string) => {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours} 小时 ${minutes} 分钟`;
};

const ContestsPage: React.FC = () => {
  const { user } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<'UPCOMING' | 'RUNNING' | 'ENDED' | ''>('');
  const [search, setSearch] = useState('');

  const loadContests = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (status) params.status = status;
      if (search) params.search = search;

      const response = await contestApi.list(params);
      if (response.success && response.data) {
        setContests(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to load contests:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadContests();
  }, [page, status, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">竞赛列表</h1>
          {user?.isAdmin && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              创建竞赛
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-wrap gap-4 items-center">
            <form
              onSubmit={(e) => { e.preventDefault(); setPage(1); loadContests(); }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索竞赛..."
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                搜索
              </button>
            </form>

            <div className="flex gap-2">
              {(['', 'UPCOMING', 'RUNNING', 'ENDED'] as const).map((s) => (
                <button
                  key={s || 'ALL'}
                  onClick={() => { setStatus(s); setPage(1); }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    status === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {s ? CONTEST_STATUS_LABELS[s] : '全部'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : contests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无竞赛</div>
      ) : (
        <>
          <div className="space-y-4">
            {contests.map((contest) => {
              const cStatus = getContestStatus(contest);
              return (
                <div
                  key={contest.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-xl font-semibold text-gray-900">
                            <Link
                              to={`/contests/${contest.slug}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {contest.title}
                            </Link>
                          </h2>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${CONTEST_STATUS_COLORS[cStatus]}`}>
                            {CONTEST_STATUS_LABELS[cStatus]}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                            {CONTEST_RULE_LABELS[contest.ruleType]}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3 line-clamp-2">{contest.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div>
                            <span className="font-medium text-gray-700">开始时间:</span>{' '}
                            {formatDate(contest.startTime)}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">结束时间:</span>{' '}
                            {formatDate(contest.endTime)}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">时长:</span>{' '}
                            {formatDuration(contest.startTime, contest.endTime)}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">参赛人数:</span>{' '}
                            {contest.participantCount || 0}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">题目数:</span>{' '}
                            {contest.problems?.length || 0}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        {cStatus === 'RUNNING' && (
                          <Link
                            to={`/contests/${contest.slug}`}
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                          >
                            参加比赛
                          </Link>
                        )}
                        {cStatus === 'UPCOMING' && (
                          <Link
                            to={`/contests/${contest.slug}`}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                          >
                            查看详情
                          </Link>
                        )}
                        {cStatus === 'ENDED' && (
                          <Link
                            to={`/contests/${contest.slug}/leaderboard`}
                            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                          >
                            查看排行榜
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
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
        </>
      )}
    </div>
  );
};

export default ContestsPage;
