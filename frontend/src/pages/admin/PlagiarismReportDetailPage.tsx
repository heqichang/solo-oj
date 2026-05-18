import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { plagiarismApi } from '../../services/api';
import type { PlagiarismReport, PlagiarismMatch, PlagiarismMatchStatus } from '../../types';

const matchStatusColors: Record<PlagiarismMatchStatus, string> = {
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
  REVIEWED: 'bg-blue-100 text-blue-800',
  CONFIRMED_CHEATING: 'bg-red-100 text-red-800',
  FALSE_POSITIVE: 'bg-green-100 text-green-800',
};

const matchStatusLabels: Record<PlagiarismMatchStatus, string> = {
  PENDING_REVIEW: '待审核',
  REVIEWED: '已审核',
  CONFIRMED_CHEATING: '确认作弊',
  FALSE_POSITIVE: '误报',
};

const PlagiarismReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<PlagiarismReport | null>(null);
  const [matches, setMatches] = useState<PlagiarismMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<PlagiarismMatch | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<PlagiarismMatchStatus>('PENDING_REVIEW');
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [reportResponse, matchesResponse] = await Promise.all([
          plagiarismApi.getReport(id),
          plagiarismApi.listMatches({ reportId: id, limit: 100 }),
        ]);

        if (reportResponse.success && reportResponse.data) {
          setReport(reportResponse.data);
        }
        if (matchesResponse.success && matchesResponse.data) {
          setMatches(matchesResponse.data);
        }
      } catch (error) {
        console.error('Failed to fetch report:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const handleReview = async () => {
    if (!selectedMatch) return;
    try {
      await plagiarismApi.reviewMatch(selectedMatch.id, {
        status: reviewStatus,
        reviewComment,
      });
      setShowMatchModal(false);
      setMatches(prev =>
        prev.map(m =>
          m.id === selectedMatch.id
            ? { ...m, status: reviewStatus, reviewComment }
            : m
        )
      );
    } catch (error) {
      console.error('Failed to review match:', error);
    }
  };

  const openMatchModal = (match: PlagiarismMatch) => {
    setSelectedMatch(match);
    setReviewStatus(match.status);
    setReviewComment(match.reviewComment || '');
    setShowMatchModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12 text-gray-500">
        报告不存在
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">查重报告详情</h1>
        <p className="text-gray-600">
          {report.type === 'PROBLEM' ? '题目' : report.type === 'CONTEST' ? '竞赛' : '手动'}查重
          {report.problem?.title && ` - ${report.problem.title}`}
          {report.contest?.title && ` - ${report.contest.title}`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">总提交数</div>
          <div className="text-3xl font-bold text-gray-900">{report.totalSubmissions}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">可疑匹配</div>
          <div className="text-3xl font-bold text-red-600">{report.suspiciousPairs}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">检测算法</div>
          <div className="text-xl font-semibold text-gray-900">{report.algorithm}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">阈值</div>
          <div className="text-3xl font-bold text-blue-600">
            {Math.round(report.threshold * 100)}%
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">相似匹配列表</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户 1
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户 2
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  总体相似度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Token 相似度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  结构相似度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {matches.map((match) => (
                <tr key={match.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {match.user1?.username || match.userId1}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(match.submission1?.createdAt || '').toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {match.user2?.username || match.userId2}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(match.submission2?.createdAt || '').toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-lg font-bold ${
                      match.similarityScore >= 0.9 ? 'text-red-600' :
                      match.similarityScore >= 0.8 ? 'text-orange-600' : 'text-yellow-600'
                    }`}>
                      {Math.round(match.similarityScore * 100)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round(match.tokenSimilarity * 100)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round(match.structureSimilarity * 100)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${matchStatusColors[match.status]}`}>
                      {matchStatusLabels[match.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openMatchModal(match)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {matches.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            没有发现相似匹配
          </div>
        )}
      </div>

      {showMatchModal && selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold">相似匹配详情</h3>
              <button
                onClick={() => setShowMatchModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500">总体相似度</div>
                  <div className="text-2xl font-bold text-red-600">
                    {Math.round(selectedMatch.similarityScore * 100)}%
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500">Token 相似度</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(selectedMatch.tokenSimilarity * 100)}%
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500">结构相似度</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {Math.round(selectedMatch.structureSimilarity * 100)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    用户 1: {selectedMatch.user1?.username || selectedMatch.userId1}
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-2">
                      匹配行数: {selectedMatch.matchedLines1.length} 行
                    </div>
                    <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto max-h-64">
                      {selectedMatch.submission1?.code || '代码不可用'}
                    </pre>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    用户 2: {selectedMatch.user2?.username || selectedMatch.userId2}
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-2">
                      匹配行数: {selectedMatch.matchedLines2.length} 行
                    </div>
                    <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto max-h-64">
                      {selectedMatch.submission2?.code || '代码不可用'}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-medium text-gray-900 mb-4">审核</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">审核状态</label>
                    <select
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value as PlagiarismMatchStatus)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="PENDING_REVIEW">待审核</option>
                      <option value="REVIEWED">已审核</option>
                      <option value="CONFIRMED_CHEATING">确认作弊</option>
                      <option value="FALSE_POSITIVE">误报</option>
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">审核备注</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="输入审核备注..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowMatchModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleReview}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    提交审核
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlagiarismReportDetailPage;
