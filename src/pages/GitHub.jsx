import { useState, useEffect } from 'react';
import { Star, GitFork, Github as GitIcon, ExternalLink } from 'lucide-react';
import BashTypewriter from '../components/BashTypewriter';
import './GitHub.css';

const GITHUB_USER = 'devanshroyal-7';
const FEATURED = new Set(['E-sim', 'Contact-GraspTransformer', 'RL-Pacman', 'MSE_lab']);
const GITHUB_SUBTITLE = [
    'Robotics code, simulations, experiments, and useful detours.',
];

const GitHub = () => {
    const [repos, setRepos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function loadRepos() {
            try {
                const res = await fetch(
                    `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`
                );
                if (!res.ok) throw new Error('Failed to load repositories');

                const data = await res.json();
                if (cancelled) return;

                const ownRepos = data
                    .filter((repo) => !repo.fork)
                    .map((repo) => ({
                        id: repo.id,
                        name: repo.name,
                        description: repo.description || 'No description provided.',
                        language: repo.language,
                        stars: repo.stargazers_count,
                        forks: repo.forks_count,
                        url: repo.html_url,
                        isPinned: FEATURED.has(repo.name),
                    }))
                    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned));

                let featuredAssigned = false;
                setRepos(
                    ownRepos.map((repo) => {
                        const featured = repo.isPinned && !featuredAssigned;
                        if (featured) featuredAssigned = true;
                        return { ...repo, featured };
                    })
                );
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadRepos();
        return () => { cancelled = true; };
    }, []);

    return (
        <div className="github-container">
            <header className="page-header flex-header">
                <div className="page-kicker">
                    <span>03 / 03</span>
                    <span>REPOSITORY.INDEX</span>
                </div>
                <div>
                    <h1>Open Source<span className="logo-accent">.</span></h1>
                    <BashTypewriter
                        phrases={GITHUB_SUBTITLE}
                        className="subtitle"
                    />
                </div>
                <a
                    href={`https://github.com/${GITHUB_USER}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="github-profile-link glass-panel"
                >
                    <GitIcon size={20} />
                    <span>@{GITHUB_USER}</span>
                </a>
            </header>

            {loading && <p className="repos-status">Loading repositories…</p>}
            {error && (
                <p className="repos-status">
                    Couldn’t load repos. View them on{' '}
                    <a href={`https://github.com/${GITHUB_USER}`} target="_blank" rel="noopener noreferrer" className="text-link">
                        GitHub
                    </a>.
                </p>
            )}

            {!loading && !error && (
                <div className="repos-grid">
                    {repos.map((repo, index) => (
                        <div
                            key={repo.id}
                            className={`repo-card glass-panel ${repo.featured ? 'featured' : ''}`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="repo-header">
                                <span className="repo-index">{String(index + 1).padStart(2, '0')}</span>
                                <a
                                    href={repo.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="repo-name-link"
                                >
                                    <h3>{repo.name}</h3>
                                    <ExternalLink size={16} className="external-icon" />
                                </a>
                            </div>

                            <p className="repo-desc">{repo.description}</p>

                            <div className="repo-footer">
                                {repo.language ? (
                                    <div className="repo-lang">
                                        <span className={`lang-dot ${repo.language.toLowerCase()}`}></span>
                                        {repo.language}
                                    </div>
                                ) : (
                                    <div className="repo-lang" />
                                )}
                                <div className="repo-stats">
                                    <span><Star size={14} /> {repo.stars}</span>
                                    <span><GitFork size={14} /> {repo.forks}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GitHub;
