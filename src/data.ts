// Interfaces for dealing with different types of data

interface Course {
	title: string;
	teacher: string;
	teacherEmail: string;
	sixWeeksAverages: number[];
	sixWeeksUrlHashes: string[];
	examGrades: number[];
	semesterAverages: number[];
}

interface ClassGrades {
	title: string;
	urlHash: string;
	period: number;
	sixWeeksIndex: number;
	average: number;
	categories: Category[];
}

interface Category {
	title: string;
	weight: number;
	average: number;
	bonus: number;
	assignments: Assignment[];
}

interface Assignment {
	title: string;
	date: string;
	ptsEarned: number;
	ptsPossible: number;
	weight: number;
	note: string;
	extraCredit: boolean;
}

// Helpful methods
interface Object {
	eachOwnProperty(f : (k : string, v : any) => any) : any;
	mapOwnProperties(f : (k : string, v : any) => any) : any;
}

/** Iterates through all properties that belong to an object. */
Object.prototype.eachOwnProperty = function(f : (k : string, v : any) => any) {
	for (var k in this)
		if (this.hasOwnProperty(k))
			f(k, this[k]);
}

/** Map through all properties that belong to an object, returning an array.. */
Object.prototype.mapOwnProperties = function(f : (k : string, v : any) => any) {
	var newList = [];

	for (var k in this)
		if (this.hasOwnProperty(k))
			newList[newList.length] = f(k, this[k]);

	return newList;
}