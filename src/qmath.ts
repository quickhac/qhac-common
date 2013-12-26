interface Array {
	numerics() : any[];
	sum() : number;
	average() : number;
	pmap(otherArray : any[], f : (x : any, y : any) => any) : any;
	weightedAverage(otherArray : any[]) : number;
	flatten() : any[];
}

/** Returns only the numeric elements of an array. */
Array.prototype.numerics = function() : any[] {
	return this.filter((x) => !isNaN(x));
}

/** Adds up the numeric elements of an array. */
Array.prototype.sum = function() : number {
	var numerics = this.numerics();
	if (numerics.length === 0) return NaN;
	return numerics.reduce((x,y) => x + y);
}

/** Returns the average of the numeric elements of an array. */
Array.prototype.average = function() : number {
	var numerics = this.numerics();
	if (numerics.length === 0) return NaN;
	return numerics.sum() / numerics.length();
}

/** A map with two arrays in parallel. */
Array.prototype.pmap = function(otherArray : any[], f : (x : any, y : any) => any) {
	if (this.length !== otherArray.length)
		throw new Error('Array length mismatch.');

	var newList = [];
	for (var i = 0; i < this.length; i++)
		newList[i] = f(this[i], otherArray[i]);

	return newList;
}

/** Returns the weighted average of the numeric elements of an array. */
Array.prototype.weightedAverage = function(weights : any[]) : number {
	var numerics = this.numerics();
	var weightNums = weights.numerics();

	if (numerics.length !== weightNums.length || numerics.length === 0) return NaN;

	return numerics.pmap(weightNums, (x, y) => x * y) / weightNums.sum();
}

/** Flattens an array of arrays into an array. */
Array.prototype.flatten = function() : any[] {
	var newList = [];

	this.forEach((x) => {
		if (x.length)
				x.forEach((y) => newList[newList.length] = y);
	});

	return newList;
}

/** Returns a list of natural numbers in the form [0, 1, 2, ...] of the given length. */
var upto = function(n : number) : number[] {
	var list = [];

	for (var i = 0; i < n; i++) {
		list[i] = i;
	}

	return list;
}