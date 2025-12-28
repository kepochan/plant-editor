import { Routes, Route } from 'react-router-dom';
import { DiagramsListPage } from './pages/DiagramsListPage';
import { Layout } from './components/Layout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DiagramsListPage />} />
      <Route path="/diagram/:id" element={<Layout />} />
    </Routes>
  );
}

export default App;
