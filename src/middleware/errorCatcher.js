const errorCatcher = (err, req, res, next) => {
    if (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            error: "Oopsies! Internal server error :("
        });
    }
    next();
}

export default errorCatcher;