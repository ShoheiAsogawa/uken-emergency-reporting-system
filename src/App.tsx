import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CitizenApp from './components/citizen/CitizenApp';
import AdminApp from './components/admin/AdminApp';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CitizenApp />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App

