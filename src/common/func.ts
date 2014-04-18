interface Function {
    maybeCall: (f: any, _this: any, args: any[]) => any;
}

// calls a function if it's defined
Function.maybeCall = function (f: any, _this: any, args: any[]) : any {
	if (typeof f === 'function')
		return f.apply(_this, args);
}