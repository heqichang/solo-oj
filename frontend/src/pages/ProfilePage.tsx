import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center text-gray-500">
        请先登录
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password && password !== confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的密码不一致' });
      return;
    }

    setSaving(true);

    const updates: Record<string, any> = {};
    if (nickname !== user.nickname) updates.nickname = nickname;
    if (bio !== user.bio) updates.bio = bio;
    if (password) updates.password = password;

    if (Object.keys(updates).length === 0) {
      setMessage({ type: 'error', text: '没有需要更新的内容' });
      setSaving(false);
      return;
    }

    const result = await updateProfile(updates);
    
    if (result.success) {
      setMessage({ type: 'success', text: '个人信息已更新' });
      setPassword('');
      setConfirmPassword('');
    } else {
      setMessage({ type: 'error', text: result.error || '更新失败' });
    }

    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">个人中心</h1>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-blue-600">
              {(user.nickname || user.username).charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user.nickname || user.username}</h2>
            <p className="text-gray-500">@{user.username}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t pt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{user.solvedCount}</div>
            <div className="text-sm text-gray-500">已解决</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{user.submissionsCount}</div>
            <div className="text-sm text-gray-500">提交次数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {user.submissionsCount > 0
                ? Math.round((user.solvedCount / user.submissionsCount) * 100)
                : 0}%
            </div>
            <div className="text-sm text-gray-500">通过率</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">编辑个人信息</h3>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              用户名
            </label>
            <input
              type="text"
              value={user.username}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邮箱
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              昵称
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="输入昵称"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              个人简介
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="介绍一下自己..."
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">修改密码（留空则不修改）</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  新密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="至少6个字符"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  确认密码
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="再次输入新密码"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存修改'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
