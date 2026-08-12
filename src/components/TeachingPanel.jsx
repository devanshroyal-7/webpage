import { GraduationCap } from 'lucide-react';
import { TEACHING_INSTITUTIONS, TEACHING_PANEL } from '../lib/teaching';

const ProfessorLink = ({ professor }) => {
    const label = (
        <>
            {professor.name}
            {professor.term ? (
                <span className="course-prof-term">{professor.term}</span>
            ) : null}
        </>
    );

    if (!professor.url) {
        return <span className="course-prof">{label}</span>;
    }

    return (
        <a
            className="course-prof"
            href={professor.url}
            target="_blank"
            rel="noopener noreferrer"
        >
            {label}
        </a>
    );
};

const CourseItem = ({ course }) => {
    const professors = course.professors ?? [];
    const highlights = course.highlights ?? [];

    return (
        <article className="course-item">
            <div className="course-heading">
                <div className="course-title-block">
                    <h3>{course.title}</h3>
                    {professors.length === 1 ? (
                        <ProfessorLink professor={professors[0]} />
                    ) : professors.length > 1 ? (
                        <div className="course-profs">
                            {professors.map((professor) => (
                                <ProfessorLink
                                    key={`${course.id}-${professor.name}`}
                                    professor={professor}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>
                {course.period ? <time>{course.period}</time> : null}
            </div>
            {highlights.length > 0 ? (
                <ul>
                    {highlights.map((highlight) => (
                        <li key={`${course.id}-${highlight.label}`}>
                            <strong>{highlight.label}:</strong>{' '}
                            {highlight.text}
                        </li>
                    ))}
                </ul>
            ) : null}
        </article>
    );
};

const TeachingPanel = ({ animationDelay = '0.3s' }) => (
    <section
        className="research-panel glass-panel full-width teaching-panel"
        style={{ animationDelay }}
    >
        <span className="panel-index">{TEACHING_PANEL.index}</span>
        <div className="panel-header">
            <GraduationCap className="panel-icon" />
            <h2>{TEACHING_PANEL.title}</h2>
        </div>

        {TEACHING_INSTITUTIONS.map((institution, index) => (
            <div key={institution.id}>
                <div
                    className={`teaching-meta${index > 0 ? ' teaching-meta-secondary' : ''}`}
                >
                    <div>
                        <h3>{institution.name}</h3>
                        {institution.location ? <p>{institution.location}</p> : null}
                    </div>
                    {institution.role ? <span>{institution.role}</span> : null}
                </div>

                {institution.courses?.length ? (
                    <div className="course-list">
                        {institution.courses.map((course) => (
                            <CourseItem key={course.id} course={course} />
                        ))}
                    </div>
                ) : null}
            </div>
        ))}
    </section>
);

export default TeachingPanel;
