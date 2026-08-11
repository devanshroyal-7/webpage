import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import './Layout.css';

const Layout = () => {
    return (
        <div className="layout">
            <div className="container">
                <Navbar />
                <main className="main-content">
                    <Outlet />
                </main>
                <footer className="footer">
                    <p>© {new Date().getFullYear()} Devansh · Built between simulations</p>
                </footer>
            </div>
        </div>
    );
};

export default Layout;
