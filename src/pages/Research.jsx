import { BookOpen, FileText } from 'lucide-react';
import BashTypewriter from '../components/BashTypewriter';
import TeachingPanel from '../components/TeachingPanel';
import './Research.css';

const RESEARCH_SUBTITLE = [
    'Planning, learning, and perception for robots.',
];

const Research = () => {
    return (
        <div className="research-container">
            <header className="page-header">
                <div className="page-kicker">
                    <span>02 / 04</span>
                    <span>RESEARCH.LOG</span>
                </div>
                <h1>Research<span className="logo-accent">.</span></h1>
                <BashTypewriter
                    phrases={RESEARCH_SUBTITLE}
                    className="subtitle"
                    onceKey="research-subtitle"
                />
            </header>

            <div className="research-grid">
                <section className="research-panel glass-panel" style={{ animationDelay: '0s' }}>
                    <span className="panel-index">01 // CURRENT VECTOR</span>
                    <div className="panel-header">
                        <BookOpen className="panel-icon" />
                        <h2>Current Focus</h2>
                    </div>
                    <p className="panel-body">
                        Building{' '}
                        <a
                            href="https://github.com/devanshroyal-7/E-sim"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-link"
                        >
                            E-sim
                        </a>
                        , leveraging physics simulator experience for fast online planning.
                    </p>
                    <div className="status-badge"><span /> Active research</div>
                </section>

                <section className="research-panel glass-panel" style={{ animationDelay: '0.1s' }}>
                    <span className="panel-index">02 // RESEARCH THREADS</span>
                    <div className="panel-header">
                        <FileText className="panel-icon" />
                        <h2>Methods</h2>
                    </div>
                    <div className="publication-list">
                        <div className="publication-item">
                            <h3>Perception &amp; Grasping</h3>
                            <p>Learning useful geometric representations from 3D point clouds.</p>
                        </div>
                        <div className="publication-item">
                            <h3>Search &amp; Reinforcement Learning</h3>
                            <p>Combining learned policies with structure from heuristic search.</p>
                        </div>
                    </div>
                </section>

                <section className="research-panel glass-panel full-width" style={{ animationDelay: '0.2s' }}>
                    <span className="panel-index">03 // AFFILIATION</span>
                    <div className="panel-header">
                        <h2>Collaborations & Lab</h2>
                    </div>
                    <p className="panel-body">
                        Member of the{' '}
                        <a
                            href="https://www.ri.cmu.edu/robotics-groups/search-based-planning-laboratory/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-link"
                        >
                            Search-based Planning Laboratory
                        </a>
                        {' '}at Carnegie Mellon University&apos;s Robotics Institute, led by Maxim Likhachev.
                        We develop planners that work in real-time for complex real-world environments,
                        spanning motion planning, multi-agent systems, and learning from experience.
                    </p>
                </section>

                <TeachingPanel />
            </div>
        </div>
    );
};

export default Research;
