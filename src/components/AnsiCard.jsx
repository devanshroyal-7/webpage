import { Github, Mail } from 'lucide-react';
import GraphSearchAnsi from './GraphSearchAnsi';
import './AnsiCard.css';

/**
 * Terminal-style A* search demo card.
 * Archived from the Home about section — import and drop in where needed:
 *
 *   import AnsiCard from '../components/AnsiCard';
 *   <AnsiCard />
 */
const AnsiCard = ({
    host = 'devansh@sbpl:~',
    label = 'a*',
    githubUrl = 'https://github.com/devanshroyal-7',
    email = 'mailto:djonnala@andrew.cmu.edu',
    aside = 'Photography · cooking · birds',
}) => (
    <div className="ansi-card">
        <div className="ansi-title">
            <span>{host}</span>
            <span>{label}</span>
        </div>
        <GraphSearchAnsi />
        <div className="ansi-footer">
            <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub profile"
            >
                <Github size={18} />
            </a>
            <a href={email} aria-label="Email Devansh">
                <Mail size={18} />
            </a>
            <span>{aside}</span>
        </div>
    </div>
);

export default AnsiCard;
