import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { getAllPosts } from '../lib/posts';
import './Blog.css';

const Blog = () => {
    const posts = getAllPosts();

    return (
        <>
            <PageHeader
                kickerIndex="05 / LOG"
                kickerLabel="FIELD.NOTES"
                title="Writing"
            >
                <p className="subtitle">Notes from robotics, code, and the spaces between.</p>
            </PageHeader>

            <div className="blog-container">
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
        </>
    );
};

export default Blog;
