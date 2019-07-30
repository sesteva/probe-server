// @ts-ignore
function morgan(format, options) {
	// @ts-ignore
	return function logger(req, res, next) {
		next();
	};
}

export = morgan;
