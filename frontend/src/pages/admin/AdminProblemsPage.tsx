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
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
              批量导入
            </button>
            <Link
              to="/admin/problems/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              创建题目
            </Link>
          </div>
        </div>

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
                        to={`/admin/problems/${problem.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        编辑
                      </Link>
                      {problem.status === 'DRAFT' && (
                        <button className="text-yellow-600 hover:text-yellow-900">
                          提交审核
                        </button>
                      )}
                      {problem.status === 'PENDING_REVIEW' && (
                        <>
                          <button className="text-green-600 hover:text-green-900">
                            通过
                          </button>
                          <button className="text-red-600 hover:text-red-900">
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
    </div>
  );
};

export default AdminProblemsPage;
