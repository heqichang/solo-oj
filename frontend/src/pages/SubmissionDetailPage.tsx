import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { submissionApi } from '../services/api';
import type { Submission } from '../types';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  LANGUAGE_LABELS,
} from '../utils/judgeStatus';
import Editor from '@monaco-editor/react';

const SubmissionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSubmission = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await submissionApi.get(id);
      if (response.success && response.data) {
        setSubmission(response.data.submission);
      }
    } catch (error) {
      console.error('Failed to load submission:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSubmission();
  }, [id]);

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      ACCEPTED: 'bg-green-100 text-green-700',
      WRONG_ANSWER: 'bg-red-100 text-red-700',
      TIME_LIMIT_EXCEEDED: 'bg-purple-100 text-purple-700',
      MEMORY_LIMIT_EXCEEDED: 'bg-yellow-100 text-yellow-700',
      RUNTIME_ERROR: 'bg-red-100 text-red-700',
      COMPILATION_ERROR: 'bg-orange-100 text-orange-700',
      PENDING: 'bg-gray-100 text-gray-700',
      RUNNING: 'bg-blue-100 text-blue-700',
      SYSTEM_ERROR: 'bg-gray-100 text-gray-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const getLanguageForMonaco = (lang: string) => {
    const map: Record<string, string> = {
      cpp: 'cpp',
      c: 'c',
      java: 'java',
      python: 'python',
      javascript: 'javascript',
    };
    return map[lang] || 'plaintext';
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-center text-gray-500">
        加载中...
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-center text-gray-500">
        提交记录不存在
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/submissions" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← 返回提交列表
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">提交详情</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <span className="text-sm text-gray-500">题目</span>
            <div className="font-medium">
              {submission.problem ? (
                <Link
                  to={`/problems/${submission.problem.slug}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {submission.problem.title}
                </Link>
              ) : '-'}
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500">状态</span>
            <div>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusStyle(submission.status)}`}>
                {STATUS_LABELS[submission.status]}
              </span>
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500">语言</span>
            <div className="font-medium">
              {LANGUAGE_LABELS[submission.language] || submission.language}
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500">提交时间</span>
            <div className="font-medium text-sm">
              {formatTime(submission.createdAt)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4">
          <div>
            <span className="text-sm text-gray-500">运行时间</span>
            <div className="font-medium">
              {submission.runtimeMs !== null ? `${submission.runtimeMs}ms` : '-'}
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500">内存使用</span>
            <div className="font-medium">
              {submission.memoryMB !== null ? `${submission.memoryMB}MB` : '-'}
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500">通过测试用例</span>
            <div className="font-medium">
              {submission.passedTestCases} / {submission.totalTestCases}
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500">提交ID</span>
            <div className="font-medium text-xs text-gray-600">
              {submission.id}
            </div>
          </div>
        </div>
      </div>

      {submission.errorMessage && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-red-600">错误信息</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <pre className="text-sm text-red-700 whitespace-pre-wrap">
              {submission.errorMessage}
            </pre>
          </div>
        </div>
      )}

      {submission.code && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">代码</h3>
          <Editor
            height="400px"
            language={getLanguageForMonaco(submission.language)}
            value={submission.code}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
            }}
          />
        </div>
      )}

      {submission.testResults?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">测试用例详情</h3>
          <div className="space-y-4">
            {submission.testResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">测试用例 {result.testCase}</span>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusStyle(result.status)}`}>
                    {STATUS_LABELS[result.status]}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">时间: {result.runtime}ms</span>
                  </div>
                  <div>
                    <span className="text-gray-500">内存: {result.memory}MB</span>
                  </div>
                </div>
                {result.status !== 'ACCEPTED' && result.status !== 'PENDING' && result.status !== 'RUNNING' && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">输入:</span>
                      <pre className="bg-gray-100 p-3 rounded mt-1 text-xs overflow-x-auto">
                        {result.input || '-'}
                      </pre>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">期望输出:</span>
                      <pre className="bg-gray-100 p-3 rounded mt-1 text-xs overflow-x-auto">
                        {result.expectedOutput || '-'}
                      </pre>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">实际输出:</span>
                      <pre className="bg-gray-100 p-3 rounded mt-1 text-xs overflow-x-auto">
                        {result.actualOutput || '-'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionDetailPage;
