import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { plagiarismApi } from '../../services/api';
import type { PlagiarismReport, PlagiarismReportStatus } from '../../types';

const statusColors: Record<PlagiarismReportStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<PlagiarismReportStatus, string> = {
  PENDING: '等待中',
  PROCESSING: '处理中',
  COMPLETED: '已完成',
  FAILED: '失败',
};

const PlagiarismReportsPage: React.FC = () => {
  const [reports, setReports] = useState<PlagiarismReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<PlagiarismReportStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'PROBLEM' | 'CONTEST'>('PROBLEM');
  const [problemId, setProblemId] = useState('');
  const [contestId, setContestId] = useState('');
  const [algorithm, setAlgorithm] = useState('TOKEN_SIMILARITY');
  const [threshold, setThreshold] = useState(0.8);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (status) params.status = status;

      const response = await plagiarismApi.listReports(params);
      if (response.success && response.data) {
        setReports(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, status]);

  const handleCreateReport = async () => {
    try {
      const data: any = {
        type: createType,
        algorithm,
        threshold,
      };
      if (createType === 'PROBLEM' && problemId) {
        data.problemId = problemId;
      } else if (createType === 'CONTEST' && contestId) {
        data.contestId = contestId;
      }

      await plagiarismApi.createReport(data);
      setShowCreateModal(false);
      setProblemId('');
      setContestId('');
      fetchReports();
    } catch (error) {
      console.error('Failed to create report:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">查重报告</h1>
          <p className="text-gray-600 mt-1">管理和查看代码查重报告</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 新建查重
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-4">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PlagiarismReportStatus | '')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部状态</option>
              <option value="PENDING">等待中</option>
              <option value="PROCESSING">处理中</option>
              <option value="COMPLETED">已完成</option>
              <option value="FAILED">失败</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    提交数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    可疑匹配
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    算法
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    阈值
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                        {report.type === 'PROBLEM' ? '题目' : report.type === 'CONTEST' ? '竞赛' : '手动'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[report.status]}`}>
                        {statusLabels[report.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.totalSubmissions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-semibold ${report.suspiciousPairs > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {report.suspiciousPairs}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.algorithm}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Math.round(report.threshold * 100)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/admin/plagiarism/${report.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        查看详情
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  第 {page} 页，共 {totalPages} 页
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}

            {reports.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                暂无查重报告
              </div>
            )}
          </>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">新建查重任务</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">查重类型</label>
              <select
                value={createType}
                onChange={(e) => setCreateType(e.target.value as 'PROBLEM' | 'CONTEST')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="PROBLEM">题目查重</option>
                <option value="CONTEST">竞赛查重</option>
              </select>
            </div>

            {createType === 'PROBLEM' ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">题目 ID</label>
                <input
                  type="text"
                  value={problemId}
                  onChange={(e) => setProblemId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入题目 ID"
                />
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">竞赛 ID</label>
                <input
                  type="text"
                  value={contestId}
                  onChange={(e) => setContestId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入竞赛 ID"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">检测算法</label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="TOKEN_SIMILARITY">Token 相似度</option>
                <option value="AST_SIMILARITY">AST 相似度</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                相似度阈值: {Math.round(threshold * 100)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCreateReport}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                创建任务
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlagiarismReportsPage;
