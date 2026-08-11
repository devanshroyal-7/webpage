import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { getAllPosts } from '../lib/posts';
import './Blog.css';

const Blog = () => {
    const posts = getAllPosts();

    return (
        <div className="blog-container">
            <header className="page-header">
                <div className="page-kicker">
                    <span>05 / LOG</span>
                    <span>FIELD.NOTES</span>
                </div>
                <h1>Writing<span className="logo-accent">.</span></h1>
                <p className="subtitle">Notes from robotics, code, and the spaces between.</p>
            </header>

            <div className="posts-list">
                {posts.map((post) => (
                    <article key={post.slug} className="post-card glass-panel">
                        <Link to={`/blog/${post.slug}`} className="post-link">
                            <h2 className="post-title">{post.title}</h2>
                            <p className="post-snippet">{post.snippet}</p>
                            <div className="post-meta">
                                <span className="post-date">
                                    <Calendar size={14} className="meta-icon" />
                                    {post.displayDate}
                                </span>
                                <span className="meta-separator">•</span>
                                <span>{post.readTime}</span>
                            </div>
                        </Link>
                    </article>
                ))}
            </div>
        </div>
    );
};

export default Blog;
