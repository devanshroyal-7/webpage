import { useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { jumpToTop } from '../lib/scrollToTop';
import Navbar from './Navbar';
import './Layout.css';

const Layout = () => {
    const { pathname } = useLocation();

    useLayoutEffect(() => {
        jumpToTop();
    }, [pathname]);

    return (
        <div className="layout">
            <div className="container">
                <Navbar />
                <main className="main-content">
                    <Outlet />
                </main>
                <footer className="footer">
                    <p>© {new Date().getFullYear()} Devansh</p>
                </footer>
            </div>
        </div>
    );
};

export default Layout;
