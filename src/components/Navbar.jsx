import { Link, useLocation } from 'react-router-dom';
import { getAllPosts } from '../lib/posts';
import './Navbar.css';

const Navbar = () => {
    const location = useLocation();
    const hasPosts = getAllPosts().length > 0;

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    return (
        <nav className="navbar glass-panel">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    D<span className="logo-accent">_</span>J
                </Link>
                <div className="navbar-links">
                    <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}><span>01</span> Home</Link>
                    <Link to="/research" className={`nav-link ${isActive('/research') ? 'active' : ''}`}><span>02</span> Research</Link>
                    <Link to="/github" className={`nav-link ${isActive('/github') ? 'active' : ''}`}><span>03</span> GitHub</Link>
                    <Link to="/gallery" className={`nav-link ${isActive('/gallery') ? 'active' : ''}`}><span>04</span> Gallery</Link>
                    {hasPosts && (
                        <Link to="/blog" className={`nav-link ${isActive('/blog') ? 'active' : ''}`}><span>05</span> Blog</Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
