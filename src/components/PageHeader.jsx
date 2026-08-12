const PageHeader = ({
    kickerIndex,
    kickerLabel,
    title,
    children,
    actions,
    className = '',
}) => {
    const classes = ['page-header'];
    if (actions) classes.push('page-header-actions');
    if (className) classes.push(className);

    const heading = (
        <>
            <h1>
                {title}
                <span className="logo-accent">.</span>
            </h1>
            {children}
        </>
    );

    return (
        <header className={classes.join(' ')}>
            <div className="page-kicker">
                <span>{kickerIndex}</span>
                <span>{kickerLabel}</span>
            </div>
            {actions ? (
                <>
                    <div>{heading}</div>
                    {actions}
                </>
            ) : (
                heading
            )}
        </header>
    );
};

export default PageHeader;
