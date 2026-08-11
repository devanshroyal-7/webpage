import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { getPostBySlug } from '../lib/posts';
import './BlogPost.css';

const BlogPost = () => {
    const { slug } = useParams();
    const post = getPostBySlug(slug);

    if (!post) return <div className="post-not-found">Post not found</div>;

    return (
        <article className="blog-post-container">
            <nav className="post-breadcrumbs">
                <Link to="/blog" className="back-link">
                    <ArrowLeft size={16} />
                    Back to Blog
                </Link>
            </nav>

            <div className="post-header-glass glass-panel">
                <div className="page-kicker">
                    <span>FIELD NOTE</span>
                    <span>DEVANSH.LOG</span>
                </div>
                <h1 className="post-title">{post.title}</h1>
                <div className="post-meta-details">
                    <span><Calendar size={14} /> {post.displayDate}</span>
                    <span className="meta-separator">•</span>
                    <span><Clock size={14} /> {post.readTime}</span>
                </div>
            </div>

            <div className="post-content glass-panel content-panel">
                <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
        </article>
    );
};

export default BlogPost;
