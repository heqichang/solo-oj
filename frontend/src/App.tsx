import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProblemsPage from './pages/ProblemsPage';
import ProblemDetailPage from './pages/ProblemDetailPage';
import SubmissionsPage from './pages/SubmissionsPage';
import SubmissionDetailPage from './pages/SubmissionDetailPage';
import ProfilePage from './pages/ProfilePage';

import ContestsPage from './pages/contests/ContestsPage';
import ContestDetailPage from './pages/contests/ContestDetailPage';
import ContestLeaderboardPage from './pages/contests/ContestLeaderboardPage';

import RankingsPage from './pages/rankings/RankingsPage';
import UserStatsPage from './pages/rankings/UserStatsPage';

import AdminProblemsPage from './pages/admin/AdminProblemsPage';
import PlagiarismReportsPage from './pages/admin/PlagiarismReportsPage';
import PlagiarismReportDetailPage from './pages/admin/PlagiarismReportDetailPage';
import JudgeAdminPage from './pages/admin/JudgeAdminPage';

import DiscussionsPage from './pages/discussions/DiscussionsPage';
import DiscussionDetailPage from './pages/discussions/DiscussionDetailPage';

import CodeFavoritesPage from './pages/code/CodeFavoritesPage';
import CodeNotesPage from './pages/code/CodeNotesPage';

import ProblemSetsPage from './pages/problem-sets/ProblemSetsPage';
import ProblemSetDetailPage from './pages/problem-sets/ProblemSetDetailPage';

import LearningPathPage from './pages/learning/LearningPathPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/problems" element={<ProblemsPage />} />
              <Route path="/problems/:slug" element={<ProblemDetailPage />} />

              <Route
                path="/submissions"
                element={
                  <ProtectedRoute>
                    <SubmissionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/submissions/:id"
                element={
                  <ProtectedRoute>
                    <SubmissionDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              <Route path="/contests" element={<ContestsPage />} />
              <Route path="/contests/:slug" element={<ContestDetailPage />} />
              <Route path="/contests/:slug/leaderboard" element={<ContestLeaderboardPage />} />

              <Route path="/rankings" element={<RankingsPage />} />
              <Route
                path="/stats"
                element={
                  <ProtectedRoute>
                    <UserStatsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/problems"
                element={
                  <ProtectedRoute>
                    <AdminProblemsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/plagiarism"
                element={
                  <ProtectedRoute>
                    <PlagiarismReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/plagiarism/:id"
                element={
                  <ProtectedRoute>
                    <PlagiarismReportDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/judge"
                element={
                  <ProtectedRoute>
                    <JudgeAdminPage />
                  </ProtectedRoute>
                }
              />

              <Route path="/discussions" element={<DiscussionsPage />} />
              <Route path="/discussions/:id" element={<DiscussionDetailPage />} />

              <Route
                path="/code/favorites"
                element={
                  <ProtectedRoute>
                    <CodeFavoritesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/code/notes"
                element={
                  <ProtectedRoute>
                    <CodeNotesPage />
                  </ProtectedRoute>
                }
              />

              <Route path="/problem-sets" element={<ProblemSetsPage />} />
              <Route
                path="/problem-sets/:slug"
                element={
                  <ProtectedRoute>
                    <ProblemSetDetailPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/learning"
                element={
                  <ProtectedRoute>
                    <LearningPathPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
