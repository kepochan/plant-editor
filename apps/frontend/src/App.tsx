import { Routes, Route } from 'react-router-dom';
import { DiagramsListPage } from './pages/DiagramsListPage';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { MembersPage } from './pages/MembersPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DiagramsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/diagram/:id"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/members"
        element={
          <ProtectedRoute requireAdmin>
            <MembersPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
