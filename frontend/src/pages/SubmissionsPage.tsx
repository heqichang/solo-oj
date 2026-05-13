import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { submissionApi } from '../services/api';
import type { Submission } from '../types';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_BG_COLORS,
  LANGUAGE_LABELS,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
} from '../utils/judgeStatus';

const SubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [language, setLanguage] = useState('');

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (status) params.status = status;
      if (language) params.language = language;

      const response = await submissionApi.listMy(params);
      if (response.success && response.data) {
        setSubmissions(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSubmissions();
  }, [page, status, language]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">我的提交记录</h1>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex flex-wrap gap-4 items-center">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有状态</option>
              <option value="ACCEPTED">通过</option>
              <option value="WRONG_ANSWER">答案错误</option>
              <option value="TIME_LIMIT_EXCEEDED">超时</option>
              <option value="MEMORY_LIMIT_EXCEEDED">内存超限</option>
              <option value="RUNTIME_ERROR">运行时错误</option>
              <option value="COMPILATION_ERROR">编译错误</option>
            </select>

            <select
              value={language}
              onChange={(e) => { setLanguage(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有语言</option>
              {Object.entries(LANGUAGE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {(status || language) && (
              <button
                onClick={() => { setStatus(''); setLanguage(''); setPage(1); }}
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
      ) : submissions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无提交记录</div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    提交时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    题目
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用时/内存
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    语言
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    详情
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatTime(submission.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      {submission.problem && (
                        <div className="space-y-1">
                          <Link
                            to={`/problems/${submission.problem.slug}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {submission.problem.title}
                          </Link>
                          <div className={`text-xs ${DIFFICULTY_COLORS[submission.problem.difficulty]}`}>
                            {DIFFICULTY_LABELS[submission.problem.difficulty]}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_BG_COLORS[submission.status]} ${STATUS_COLORS[submission.status]}`}>
                        {STATUS_LABELS[submission.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div>
                        {submission.runtimeMs !== null ? `${submission.runtimeMs}ms` : '-'}
                        {' / '}
                        {submission.memoryMB !== null ? `${submission.memoryMB}MB` : '-'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {submission.passedTestCases} / {submission.totalTestCases}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {LANGUAGE_LABELS[submission.language] || submission.language}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/submissions/${submission.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        查看
                      </Link>
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

export default SubmissionsPage;
