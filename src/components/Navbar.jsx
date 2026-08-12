import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GALLERY_ENABLED } from '../lib/gallery';
import { getAllPosts } from '../lib/posts';
import { jumpToTop, smoothScrollToTop } from '../lib/scrollToTop';
import './Navbar.css';

const NAV_ITEMS = [
    { path: '/', label: 'Home' },
    { path: '/research', label: 'Research' },
    { path: '/github', label: 'GitHub' },
    { path: '/gallery', label: 'Gallery', requiresGallery: true },
    { path: '/blog', label: 'Blog', requiresPosts: true },
];

const Navbar = () => {
    const location = useLocation();
    const hasPosts = getAllPosts().length > 0;
    const linksRef = useRef(null);
    const linkRefs = useRef(new Map());
    const [slider, setSlider] = useState({ left: 0, width: 0, ready: false });

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    const visibleItems = NAV_ITEMS
        .filter((item) => {
            if (item.requiresPosts && !hasPosts) return false;
            if (item.requiresGallery && !GALLERY_ENABLED) return false;
            return true;
        })
        .map((item, index) => ({
            ...item,
            index: String(index + 1).padStart(2, '0'),
        }));
    const activePath = visibleItems.find((item) => isActive(item.path))?.path ?? '/';

    const updateSlider = useCallback(() => {
        const linksEl = linksRef.current;
        const activeEl = linkRefs.current.get(activePath);

        if (!linksEl || !activeEl) {
            return;
        }

        const linksRect = linksEl.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();

        setSlider({
            left: activeRect.left - linksRect.left + linksEl.scrollLeft,
            width: activeRect.width,
            ready: true,
        });
    }, [activePath]);

    useLayoutEffect(() => {
        updateSlider();
    }, [updateSlider, visibleItems.length]);

    useEffect(() => {
        const linksEl = linksRef.current;
        if (!linksEl) {
            return undefined;
        }

        const observer = new ResizeObserver(updateSlider);
        observer.observe(linksEl);

        const activeEl = linkRefs.current.get(activePath);
        if (activeEl) {
            observer.observe(activeEl);
        }

        window.addEventListener('resize', updateSlider);
        linksEl.addEventListener('scroll', updateSlider, { passive: true });

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateSlider);
            linksEl.removeEventListener('scroll', updateSlider);
        };
    }, [activePath, updateSlider]);

    const handleNavClick = (path) => () => {
        if (location.pathname === path) {
            smoothScrollToTop();
            return;
        }
        jumpToTop();
    };

    return (
        <nav className="navbar glass-panel">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo" onClick={handleNavClick('/')}>
                    Devansh<span className="logo-accent">.</span>
                </Link>
                <div className="navbar-links" ref={linksRef}>
                    <span
                        className={`nav-slider${slider.ready ? ' is-ready' : ''}`}
                        aria-hidden="true"
                        style={{
                            transform: `translateX(${slider.left}px)`,
                            width: `${slider.width}px`,
                        }}
                    />
                    {visibleItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-link${isActive(item.path) ? ' active' : ''}`}
                            onClick={handleNavClick(item.path)}
                            ref={(node) => {
                                if (node) {
                                    linkRefs.current.set(item.path, node);
                                } else {
                                    linkRefs.current.delete(item.path);
                                }
                            }}
                        >
                            <span>{item.index}</span> {item.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
