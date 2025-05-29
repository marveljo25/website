import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/HomePage';
import PropertyDetailsPage from './pages/PropertyDetailsPage';
import SearchPage from './pages/SearchPage';
import FavoritesPage from './pages/FavoritesPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import PropertyManagement from './pages/PropertyManagement';
import LogPage from './pages/LogPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/property/:id" element={<PropertyDetailsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/property" element={<PropertyManagement />} />
          <Route path="/logs" element={<LogPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;