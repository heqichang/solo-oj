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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    ruleType: 'ACM' as 'ACM' | 'OI' | 'IOI',
    startTime: '',
    endTime: '',
    freezeTime: '',
    isVisible: true,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.slug.trim() || !formData.startTime || !formData.endTime) {
      setMessage({ type: 'error', text: '请填写必填字段' });
      return;
    }

    setSubmitting(true);
    try {
      const data: any = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        ruleType: formData.ruleType,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        isVisible: formData.isVisible,
      };
      if (formData.freezeTime) {
        data.freezeTime = new Date(formData.freezeTime).toISOString();
      }

      const response = await contestApi.create(data);
      if (response.success) {
        setShowCreateModal(false);
        setFormData({
          title: '',
          slug: '',
          description: '',
          ruleType: 'ACM',
          startTime: '',
          endTime: '',
          freezeTime: '',
          isVisible: true,
        });
        setMessage({ type: 'success', text: '竞赛创建成功！' });
        loadContests();
      } else {
        setMessage({ type: 'error', text: response.error || '创建失败' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || '创建失败' });
    }
    setSubmitting(false);
    setTimeout(() => setMessage(null), 3000);
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
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              创建竞赛
            </button>
          )}
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">创建竞赛</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      竞赛名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="请输入竞赛名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="example: winter-contest-2024"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="竞赛描述"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      规则类型 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.ruleType}
                      onChange={(e) => setFormData({ ...formData, ruleType: e.target.value as 'ACM' | 'OI' | 'IOI' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ACM">ACM（通过数 + 罚时）</option>
                      <option value="OI">OI（总分制）</option>
                      <option value="IOI">IOI（子任务得分）</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      是否可见
                    </label>
                    <select
                      value={formData.isVisible ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, isVisible: e.target.value === 'true' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="true">公开</option>
                      <option value="false">隐藏</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      开始时间 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      结束时间 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    封榜时间（可选）
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.freezeTime}
                    onChange={(e) => setFormData({ ...formData, freezeTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">封榜后排行榜将隐藏部分数据</p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? '创建中...' : '创建'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContestsPage;
