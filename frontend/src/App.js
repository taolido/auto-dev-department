import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MeetingList from './components/MeetingList';
import MeetingDetail from './components/MeetingDetail';
import PrototypeList from './components/PrototypeList';
import PrototypeDetail from './components/PrototypeDetail';
import Checklist from './components/Checklist';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>BG修正削減プロジェクト</h1>
        </header>
        <main className="App-main">
          <Routes>
            <Route path="/" element={<MeetingList />} />
            <Route path="/meetings/:id" element={<MeetingDetail />} />
            <Route path="/prototypes" element={<PrototypeList />} />
            <Route path="/prototypes/:id" element={<PrototypeDetail />} />
            <Route path="/checklist" element={<Checklist />} />
          </Routes>
        </main>
        <footer className="App-footer">
          <p>&copy; {new Date().getFullYear()} BG修正削減プロジェクト</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;