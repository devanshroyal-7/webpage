/**
 * Teaching experience content for the Research page.
 *
 * Add / remove / reorder institutions and courses here — the TeachingPanel
 * renders whatever is in this list.
 *
 * Shape:
 * {
 *   id: string,
 *   name: string,
 *   location: string,
 *   role: string,
 *   courses: [{
 *     id: string,
 *     title: string,
 *     period: string,
 *     professors: [{ name: string, url?: string, term?: string }],
 *     highlights: [{ label: string, text: string }],
 *   }],
 * }
 */

export const TEACHING_PANEL = {
    index: '04 // TEACHING',
    title: 'Graduate Teaching Assistant Experience',
};

export const TEACHING_INSTITUTIONS = [
    {
        id: 'cmu',
        name: 'Carnegie Mellon University',
        location: 'Pittsburgh, PA',
        role: 'Course Assistant (Graduate)',
        courses: [
            {
                id: '24-452',
                title: '24-452: Mechanical Systems Experimentation',
                period: 'May 2026 – Aug 2026',
                professors: [
                    {
                        name: 'Prof. Mark Bedillion',
                        url: 'https://engineering.cmu.edu/directory/bios/bedillion-mark.html',
                    },
                ],
                highlights: [
                    {
                        label: 'Hardware Procurement & Collaboration',
                        text: 'Spearheaded the acquisition and integration of new lab hardware by consulting directly with the founder of Robots5, successfully specifying and securing custom mass attachments for experimental carriages.',
                    },
                    {
                        label: 'Software Development & Architecture',
                        text: 'Engineered a custom "MSE App" utilizing MATLAB Object-Oriented Programming (OOP) and Model-View-Controller (MVC) architecture to streamline student interaction with complex mechanical systems.',
                    },
                    {
                        label: 'Real-Time Control Integration',
                        text: 'Integrated the MATLAB application with Simulink Desktop Real-Time (SLDRT) to establish seamless, real-time control and feedback loops between the software interface and the physical hardware.',
                    },
                ],
            },
            {
                id: '24-251',
                title: '24-251: Electronics for Sensing and Actuation',
                period: 'Aug 2025 – May 2026',
                professors: [
                    {
                        name: 'Prof. Sarah Bergbreiter',
                        url: 'https://www.meche.engineering.cmu.edu/directory/bios/bergbreiter-sarah.html',
                        term: 'Fall 2025',
                    },
                    {
                        name: 'Prof. Douglas Weber',
                        url: 'https://www.meche.engineering.cmu.edu/directory/bios/weber-douglas.html',
                        term: 'Spring 2026',
                    },
                ],
                highlights: [
                    {
                        label: 'Hardware & Systems Guidance',
                        text: 'Instructed students across 4 mini-semesters in the practical application of mechatronics, actively diagnosing and resolving hardware, circuitry, and software integration bottlenecks during lab operations.',
                    },
                ],
            },
        ],
    },
    {
        id: 'iitm',
        name: 'Indian Institute of Technology Madras (IITM)',
        location: 'Chennai, India',
        role: 'Teaching Assistant',
        courses: [
            {
                id: 'data-science',
                title: 'Data Science: Theory and Practice',
                period: 'Aug 2022 – May 2023',
                professors: [
                    {
                        name: 'Prof. Ramanathan M',
                        url: 'https://ed.iitm.ac.in/faculty.html?id=Ramanathan_M',
                    },
                ],
                highlights: [
                    {
                        label: 'Lab Instruction & Mentorship',
                        text: 'Conducted weekly hands-on lab sessions for 60+ students across two semesters, actively troubleshooting and debugging code in Python, Keras, and Scikit-Learn.',
                    },
                    {
                        label: 'Algorithmic Guidance',
                        text: 'Mentored students on foundational machine learning theory, clarifying complex mathematical concepts including optimization, gradient descent mechanics, and neural network architectures.',
                    },
                    {
                        label: 'Evaluation & Code Review',
                        text: 'Assessed laboratory projects and theoretical homework, providing targeted, constructive feedback on code quality and algorithmic implementation.',
                    },
                ],
            },
        ],
    },
];
