Promise.prototype['spread'] = function (f: Function) {
	return this.then(function (args: any[]) {
		return f.apply(this, args);
	});
};