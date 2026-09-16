import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GlycemiaControl from './glycemia-control.component';

const Root: React.FC = () => (
  <BrowserRouter basename={window.getOpenmrsSpaBase()}>
    <Routes>
      <Route path="glycemia-control" element={<GlycemiaControl />} />
    </Routes>
  </BrowserRouter>
);

export default Root;
