 const formatZodErrors = (error) => {
    const errors = {};

    error.issues.forEach((issue) => {
        const field = issue.path.join(".");

        if (!errors[field]) {
            errors[field] = issue.message;
        }
    });

    return errors;
};
module.exports={
    formatZodErrors
}