import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminProblemApi } from '../../services/api';
import type { Problem, ProblemStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';

const STATUS_LABELS: Record<ProblemStatus, string> = {
  DRAFT: '草稿',
  PENDING_REVIEW: '审核中',
  PUBLISHED: '已发布',
  REJECTED: '已拒绝',
};

const STATUS_COLORS: Record<ProblemStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const AdminProblemsPage: React.FC = () => {
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<ProblemStatus | ''>('');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [newProblem, setNewProblem] = useState({
    title: '',
    slug: '',
    description: '',
    inputFormat: '标准输入',
    outputFormat: '标准输出',
    examples: [] as Array<{ input: string; output: string; explanation?: string }>,
    hints: [] as string[],
    difficulty: 'EASY' as 'EASY' | 'MEDIUM' | 'HARD',
    timeLimitMs: 1000,
    memoryLimitMB: 128,
  });

  const loadProblems = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 10 };
      if (status) params.status = status;
      if (search) params.search = search;

      const response = await adminProblemApi.list(params);
      if (response.success && response.data) {
        setProblems(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to load problems:', error);
    }
    setLoading(false);
  };

  const handleSubmitReview = async (problemId: string) => {
    try {
      const response = await adminProblemApi.submitReview(problemId);
      if (response.success) {
        setMessage({ type: 'success', text: '已提交审核' });
        loadProblems();
      } else {
        setMessage({ type: 'error', text: response.error || '操作失败' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || '操作失败' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleApprove = async (problemId: string) => {
    try {
      const response = await adminProblemApi.review(problemId, { action: 'approve' });
      if (response.success) {
        setMessage({ type: 'success', text: '已通过审核' });
        loadProblems();
      } else {
        setMessage({ type: 'error', text: response.error || '操作失败' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || '操作失败' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleReject = async (problemId: string) => {
    if (!rejectComment.trim()) {
      setMessage({ type: 'error', text: '请填写拒绝原因' });
      return;
    }
    try {
      const response = await adminProblemApi.review(problemId, {
        action: 'reject',
        comment: rejectComment,
      });
      if (response.success) {
        setShowRejectModal(null);
        setRejectComment('');
        setMessage({ type: 'success', text: '已拒绝' });
        loadProblems();
      } else {
        setMessage({ type: 'error', text: response.error || '操作失败' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || '操作失败' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProblem.title.trim() || !newProblem.slug.trim() || !newProblem.description.trim()) {
      setMessage({ type: 'error', text: '请填写必填字段' });
      return;
    }
    setSubmitting(true);
    try {
      const response = await adminProblemApi.create(newProblem);
      if (response.success) {
        setShowCreateModal(false);
        setNewProblem({
          title: '',
          slug: '',
          description: '',
          inputFormat: '标准输入',
          outputFormat: '标准输出',
          examples: [],
          hints: [],
          difficulty: 'EASY',
          timeLimitMs: 1000,
          memoryLimitMB: 128,
        });
        setMessage({ type: 'success', text: '题目创建成功（草稿状态）' });
        loadProblems();
      } else {
        setMessage({ type: 'error', text: response.error || '创建失败' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || '创建失败' });
    }
    setSubmitting(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      setMessage({ type: 'error', text: '请选择文件' });
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      const response = await adminProblemApi.bulkImport(formData);
      if (response.success) {
        setShowImportModal(false);
        setImportFile(null);
        setMessage({
          type: 'success',
          text: `导入完成：成功 ${response.data?.imported} 个，失败 ${response.data?.failed} 个`,
        });
        loadProblems();
      } else {
        setMessage({ type: 'error', text: response.error || '导入失败' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || '导入失败' });
    }
    setSubmitting(false);
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    if (user?.isAdmin) {
      loadProblems();
    }
  }, [page, status, search, user?.isAdmin]);

  if (!user?.isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500">
        没有权限访问此页面
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">题目管理</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              批量导入
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              创建题目
            </button>
          </div>
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
              onSubmit={(e) => { e.preventDefault(); setPage(1); loadProblems(); }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索题目..."
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                搜索
              </button>
            </form>

            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as ProblemStatus | ''); setPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">所有状态</option>
              <option value="DRAFT">草稿</option>
              <option value="PENDING_REVIEW">审核中</option>
              <option value="PUBLISHED">已发布</option>
              <option value="REJECTED">已拒绝</option>
            </select>

            {(status || search) && (
              <button
                onClick={() => { setStatus(''); setSearch(''); setPage(1); }}
                className="text-blue-600 hover:text-blue-700"
              >
                清除筛选
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : problems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无题目</div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    题目
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    难度
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    提交数
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    通过率
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {problems.map((problem) => (
                  <tr key={problem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[problem.status]}`}>
                        {STATUS_LABELS[problem.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{problem.title}</div>
                      <div className="text-sm text-gray-500">{problem.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        problem.difficulty === 'EASY' ? 'bg-green-100 text-green-700' :
                        problem.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {problem.difficulty === 'EASY' ? '简单' : problem.difficulty === 'MEDIUM' ? '中等' : '困难'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600">
                      {problem.submissionsCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-600">
                      {problem.acceptanceRate ?? 0}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link
                        to={`/problems/${problem.slug}`}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        查看
                      </Link>
                      {problem.status === 'DRAFT' && (
                        <button
                          onClick={() => handleSubmitReview(problem.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          提交审核
                        </button>
                      )}
                      {problem.status === 'PENDING_REVIEW' && (
                        <>
                          <button
                            onClick={() => handleApprove(problem.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            通过
                          </button>
                          <button
                            onClick={() => setShowRejectModal(problem.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            拒绝
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">拒绝审核</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleReject(showRejectModal);
                }}
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    拒绝原因
                  </label>
                  <textarea
                    value={rejectComment}
                    onChange={(e) => setRejectComment(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="请填写拒绝原因"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectModal(null);
                      setRejectComment('');
                    }}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !rejectComment.trim()}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {submitting ? '提交中...' : '确认拒绝'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">创建题目</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      题目名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newProblem.title}
                      onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="请输入题目名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newProblem.slug}
                      onChange={(e) => setNewProblem({ ...newProblem, slug: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="example: two-sum"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    难度
                  </label>
                  <select
                    value={newProblem.difficulty}
                    onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="EASY">简单</option>
                    <option value="MEDIUM">中等</option>
                    <option value="HARD">困难</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      时间限制 (ms)
                    </label>
                    <input
                      type="number"
                      value={newProblem.timeLimitMs}
                      onChange={(e) => setNewProblem({ ...newProblem, timeLimitMs: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      内存限制 (MB)
                    </label>
                    <input
                      type="number"
                      value={newProblem.memoryLimitMB}
                      onChange={(e) => setNewProblem({ ...newProblem, memoryLimitMB: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    题目描述 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newProblem.description}
                    onChange={(e) => setNewProblem({ ...newProblem, description: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="请输入题目描述，支持 Markdown"
                  />
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
                    {submitting ? '创建中...' : '创建（草稿）'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">批量导入题目</h3>
              <form onSubmit={handleImport}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择 JSON 文件
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    支持 JSON 格式的题目数据文件
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportModal(false);
                      setImportFile(null);
                    }}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !importFile}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {submitting ? '导入中...' : '导入'}
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

export default AdminProblemsPage;
