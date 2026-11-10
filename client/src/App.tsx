import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { CollegeTutor } from './pages/CollegeTutor/CollegeTutor';
import { StudyPlanner } from './pages/StudyPlanner/StudyPlanner';
import { Notes } from './pages/Notes/Notes';
import { ExamCentre } from './pages/ExamCentre/ExamCentre';
import { CodingLab } from './pages/CodingLab/CodingLab';
import { SkillDevelopment } from './pages/SkillDevelopment/SkillDevelopment';
import { AIAssistant } from './pages/AIAssistant/AIAssistant';
import { Analytics } from './pages/Analytics/Analytics';
import { ProfileSettings } from './pages/ProfileSettings/ProfileSettings';
import { BrainGames } from './pages/BrainGames/BrainGames';

export const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="tutor" element={<CollegeTutor />} />
          <Route path="planner" element={<StudyPlanner />} />
          <Route path="notes" element={<Notes />} />
          <Route path="exams" element={<ExamCentre />} />
          <Route path="coding" element={<CodingLab />} />
          <Route path="skills" element={<SkillDevelopment />} />
          <Route path="assistant" element={<AIAssistant />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<ProfileSettings />} />
          <Route path="games" element={<BrainGames />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
