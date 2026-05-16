import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { codeApi } from '../../services/api';
import type { CodeNote } from '../../types';
import { useAuth } from '../../context/AuthContext';

const CodeNotesPage: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<CodeNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newSubmissionId, setNewSubmissionId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const response = await codeApi.listNotes(undefined, { page, limit: 10 });
      if (response.success && response.data) {
        setNotes(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条笔记吗？')) return;
    try {
      await codeApi.deleteNote(id);
      loadNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await codeApi.createNote({
        submissionId: newSubmissionId,
        content: newContent,
      });
      if (response.success) {
        setShowModal(false);
        setNewContent('');
        setNewSubmissionId('');
        loadNotes();
      }
    } catch (error) {
      console.error('Failed to create note:', error);
    }
    setSubmitting(false);
  };

  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [page, user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500">
        请先登录
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">代码笔记</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            添加笔记
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <Link
            to="/code/favorites"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
          >
            我的收藏
          </Link>
          <Link
            to="/code/notes"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
          >
            代码笔记
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : notes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
          <div className="text-4xl mb-4">📝</div>
          <p>暂无代码笔记</p>
          <p className="text-sm mt-2">查看代码时可以添加笔记记录解题思路</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {note.submission?.problem && (
                      <div className="mb-2">
                        <Link
                          to={`/problems/${note.submission.problem.slug}`}
                          className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                        >
                          {note.submission.problem.title}
                        </Link>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
                      {note.startLine && note.endLine && (
                        <span>行 {note.startLine} - {note.endLine}</span>
                      )}
                      <span>
                        创建于: {new Date(note.createdAt).toLocaleString('zh-CN')}
                      </span>
                      {note.updatedAt !== note.createdAt && (
                        <span>
                          更新于: {new Date(note.updatedAt).toLocaleString('zh-CN')}
                        </span>
                      )}
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <pre className="whitespace-pre-wrap text-gray-700 text-sm">{note.content}</pre>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Link
                      to={`/submissions/${note.submissionId}`}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-600 rounded"
                    >
                      查看代码
                    </Link>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-600 rounded"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">添加代码笔记</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    提交 ID
                  </label>
                  <input
                    type="text"
                    value={newSubmissionId}
                    onChange={(e) => setNewSubmissionId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入提交记录 ID（可选）"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    笔记内容
                  </label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="请输入笔记内容"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !newContent.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? '保存中...' : '保存'}
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

export default CodeNotesPage;
