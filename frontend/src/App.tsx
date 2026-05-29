import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./Pages/Home";
import About from "./Pages/About";
import Contacts from "./Pages/Contacts";
import Blog from "./Pages/Blog";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#17212b', color: '#f5f6f7' }}>
        
        {/* Navigation bar fixed at the top */}
        <Header />
        
        {/* Main Content Area */}
        <main className="flex-grow-1" style={{ paddingTop: '75px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/blog" element={<Blog />} />
          </Routes>
        </main>
        
        {/* Global Footer */}
        <Footer />
        
      </div>
    </Router>
  );
}
