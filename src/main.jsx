import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import IntroOverlay from './components/IntroOverlay';
import Layout from './components/Layout';
import Home from './pages/Home';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Research from './pages/Research';
import GitHub from './pages/GitHub';
import Gallery from './pages/Gallery';
import './index.css';

const shouldPlayHomeIntro = window.location.pathname === '/';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {shouldPlayHomeIntro && <IntroOverlay />}
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<BlogPost />} />
          <Route path="research" element={<Research />} />
          <Route path="github" element={<GitHub />} />
          <Route path="gallery" element={<Gallery />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
