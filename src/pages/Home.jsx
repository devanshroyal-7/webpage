import { ArrowUpRight, Github, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import BashTypewriter from '../components/BashTypewriter';
import './Home.css';

const HOME_ROLES = [
    'Robotics',
    'Deep Learning',
    'Search-based Planning',
    'Control Systems',
    'Perception',
    'Manipulation',
];

const Home = () => {
    return (
        <div className="home-page">
            <section className="hero" aria-labelledby="hero-title">
                <div className="hero-index" aria-hidden="true">
                    <span>01 / 03</span>
                    <span>ROBOTICS · PLANNING · CONTROL</span>
                </div>

                <div className="hero-grid">
                    <div className="hero-copy">
                        <h1 id="hero-title">
                            Devansh Royal<span>.</span>
                        </h1>

                        <div className="availability">
                            <span className="status-dot" />
                            MS @ Carnegie Mellon
                        </div>

                        <BashTypewriter
                            phrases={HOME_ROLES}
                            cycle
                            className="hero-lede"
                        />

                        <div className="hero-actions">
                            <Link to="/research" className="hero-button hero-button-primary">
                                Explore my work <ArrowUpRight size={17} />
                            </Link>
                            <a
                                href="mailto:djonnala@andrew.cmu.edu"
                                className="hero-button hero-button-quiet"
                            >
                                Say hello
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <div className="signal-strip" aria-label="Key facts">
                <span>Based in Pittsburgh, PA</span>
                <span className="signal-glyph" aria-hidden="true">✦</span>
                <span>Search-Based Planning Lab</span>
                <span className="signal-glyph" aria-hidden="true">✦</span>
                <span>Building robust autonomy</span>
            </div>

            <section className="home-about" aria-labelledby="about-title">
                <div className="section-marker">
                    <span>02</span>
                    <span>ABOUT.TXT</span>
                </div>

                <div className="about-copy">
                    <h2 id="about-title">
                        Engineering motion,
                        <span>from automobiles to autonomous robots.</span>
                    </h2>
                    <p>
                        At Carnegie Mellon&apos;s Robotics Institute, I explore faster and more robust
                        ways for autonomous systems to plan, learn, and manipulate. My current work
                        spans 3D point cloud transformers, robotic grasping, and reinforcement
                        learning with heuristic search.
                    </p>
                    <p>
                        Before CMU, I was a CAE Analyst at Mercedes-Benz R&amp;D and earned a dual
                        degree from IIT Madras, where I patented an internal combustion mechanism.
                    </p>
                    <a
                        href="https://www.ri.cmu.edu/robotics-groups/search-based-planning-laboratory/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-arrow-link"
                    >
                        Search-Based Planning Lab
                        <ArrowUpRight size={16} />
                    </a>
                </div>

                <div className="ansi-card">
                    <div className="ansi-title">
                        <span>devansh@robot:~</span>
                        <span>80×24</span>
                    </div>
                    <pre aria-label="ASCII art profile terminal">{`$ whoami
devansh.j

> focus .... manipulation
> mode ..... curious
> status ... online

       [::]
   o====||====o---<
  /
 O
/_\\  READY_`}</pre>
                    <div className="ansi-footer">
                        <a
                            href="https://github.com/devanshroyal-7"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="GitHub profile"
                        >
                            <Github size={18} />
                        </a>
                        <a href="mailto:djonnala@andrew.cmu.edu" aria-label="Email Devansh">
                            <Mail size={18} />
                        </a>
                        <span>Photography · cooking · birds</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
