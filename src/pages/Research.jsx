import { BookOpen, FileText, GraduationCap } from 'lucide-react';
import BashTypewriter from '../components/BashTypewriter';
import './Research.css';

const RESEARCH_SUBTITLE = [
    'Planning, learning, and perception for robots.',
];

const Research = () => {
    return (
        <div className="research-container">
            <header className="page-header">
                <div className="page-kicker">
                    <span>02 / 03</span>
                    <span>RESEARCH.LOG</span>
                </div>
                <h1>Research<span className="logo-accent">.</span></h1>
                <BashTypewriter
                    phrases={RESEARCH_SUBTITLE}
                    className="subtitle"
                />
            </header>

            <div className="research-grid">
                <section className="research-panel glass-panel">
                    <span className="panel-index">01 // CURRENT VECTOR</span>
                    <div className="panel-header">
                        <BookOpen className="panel-icon" />
                        <h2>Current Focus</h2>
                    </div>
                    <p className="panel-body">
                        Exploring robust robotic manipulation with 3D point cloud transformers,
                        grasp prediction, and planners that can react under real-world constraints.
                    </p>
                    <div className="status-badge"><span /> Active research</div>
                </section>

                <section className="research-panel glass-panel">
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

                <section className="research-panel glass-panel full-width">
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
                        {' '}at Carnegie Mellon University's Robotics Institute, led by Maxim Likhachev.
                        We develop planners that work in real-time for complex real-world environments,
                        spanning motion planning, multi-agent systems, and learning from experience.
                    </p>
                </section>

                <section className="research-panel glass-panel full-width teaching-panel">
                    <span className="panel-index">04 // TEACHING</span>
                    <div className="panel-header">
                        <GraduationCap className="panel-icon" />
                        <h2>Graduate Teaching Assistant Experience</h2>
                    </div>

                    <div className="teaching-meta">
                        <div>
                            <h3>Carnegie Mellon University</h3>
                            <p>Pittsburgh, PA</p>
                        </div>
                        <span>Course Assistant (Graduate)</span>
                    </div>

                    <div className="course-list">
                        <article className="course-item">
                            <div className="course-heading">
                                <h3>24-452: Mechanical Systems Experimentation</h3>
                                <time>May 2026 – Aug 2026</time>
                            </div>
                            <ul>
                                <li>
                                    <strong>Hardware Procurement &amp; Collaboration:</strong>{' '}
                                    Spearheaded the acquisition and integration of new lab hardware
                                    by consulting directly with the founder of Robots5, successfully
                                    specifying and securing custom mass attachments for experimental
                                    carriages.
                                </li>
                                <li>
                                    <strong>Software Development &amp; Architecture:</strong>{' '}
                                    Engineered a custom &quot;MSE App&quot; utilizing MATLAB
                                    Object-Oriented Programming (OOP) and Model-View-Controller
                                    (MVC) architecture to streamline student interaction with
                                    complex mechanical systems.
                                </li>
                                <li>
                                    <strong>Real-Time Control Integration:</strong>{' '}
                                    Integrated the MATLAB application with Simulink Desktop
                                    Real-Time (SLDRT) to establish seamless, real-time control and
                                    feedback loops between the software interface and the physical
                                    hardware.
                                </li>
                            </ul>
                        </article>

                        <article className="course-item">
                            <div className="course-heading">
                                <h3>24-251: Electronics for Sensing and Actuation</h3>
                                <time>Aug 2025 – May 2026</time>
                            </div>
                            <ul>
                                <li>
                                    <strong>Hardware &amp; Systems Guidance:</strong>{' '}
                                    Instructed students across 4 mini-semesters in the practical
                                    application of mechatronics, actively diagnosing and resolving
                                    hardware, circuitry, and software integration bottlenecks during
                                    lab operations.
                                </li>
                            </ul>
                        </article>
                    </div>

                    <div className="teaching-meta teaching-meta-secondary">
                        <div>
                            <h3>Indian Institute of Technology Madras (IITM)</h3>
                            <p>Chennai, India</p>
                        </div>
                        <span>Teaching Assistant</span>
                    </div>

                    <div className="course-list">
                        <article className="course-item">
                            <div className="course-heading">
                                <h3>Data Science: Theory and Practice</h3>
                                <time>Aug 2022 – May 2023</time>
                            </div>
                            <ul>
                                <li>
                                    <strong>Lab Instruction &amp; Mentorship:</strong>{' '}
                                    Conducted weekly hands-on lab sessions for 60+ students across
                                    two semesters, actively troubleshooting and debugging code in
                                    Python, Keras, and Scikit-Learn.
                                </li>
                                <li>
                                    <strong>Algorithmic Guidance:</strong>{' '}
                                    Mentored students on foundational machine learning theory,
                                    clarifying complex mathematical concepts including optimization,
                                    gradient descent mechanics, and neural network architectures.
                                </li>
                                <li>
                                    <strong>Evaluation &amp; Code Review:</strong>{' '}
                                    Assessed laboratory projects and theoretical homework, providing
                                    targeted, constructive feedback on code quality and algorithmic
                                    implementation.
                                </li>
                            </ul>
                        </article>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Research;
