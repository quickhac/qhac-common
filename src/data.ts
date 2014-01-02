// Interfaces for dealing with different types of data

interface Course {
	title: string;
	teacherName: string;
	teacherEmail: string;
	courseId: string; // unique course identifier from URL hashes
	semesters: Semester[];
}

interface Semester {
	index: number; // index of this semester in the year
	average: number;
	examGrade: number;
	examIsExempt: boolean; // NaN cannot distinguish between exempt and unentered
	cycles: Cycle[];
}

interface Cycle {
	index: number; // index of this cycle in the semester
	average: number;
	urlHash: string; // base64-encoded URL to pass to GradeSpeed to get class grades
}

interface ClassGrades {
	title: string; // the title of the course to display
	urlHash: string;
	period: number;
	semesterIndex: number;
	cycleIndex: number;
	average: number;
	categories: Category[];
}

interface Category {
	id: string; // SHA1 of "#{course id}|#{category title}"
	title: string;
	weight: number; // integer multiplier for this category (out of 100)
	average: number;
	bonus: number; // extra credit points to add to overall average from this category
	assignments: Assignment[];
}

interface Assignment {
	id: string; // SHA1 of "#{category id}|#{assignment title}"
	title: string; // name of the assignment
	date: string; // the date the assignment is due
	ptsEarned: number;
	ptsPossible: number;
	weight: number; // weight of the assignment within the category (this is only shown in GradeSpeed if != 1)
	note: string;
	extraCredit: boolean;
}

// District interop

interface District {
	name: string;
	driver: string; // GradeSpeed or txConnect?
	examWeight: number;
	gpaOffset: number;
	columnOffsets: ColumnOffsets;
	// If the averages need to be loaded shortly before the class grades are
	// loaded, this setting should be set to true.
	classGradesRequiresAverageLoaded: boolean;
	api: GradeAPI;
}

interface GradeAPI {
	login: LoginLoader;
	disambiguate: DisambiguateLoader;
	grades: GradeLoader;
	classGrades: ClassGradeLoader;
}

interface LoginLoader {
	url: string;
	method: string;
	// create parameter object to pass to GradeSpeed/txConnect
	makeQuery: (u : string, p : string, state : ASPNETPageState) => Object;
}

interface DisambiguateLoader {
	url: string;
	method: string; // GET or POST?
	// checks if disambiguation is required given the DOM of the page returned after login
	isRequired: (dom : HTMLElement) => boolean;
	// create parameter object to pass to GradeSpeed/txConnect
	makeQuery: (id : string, state : ASPNETPageState) => Object;
	// parse a page and get the list of students available under the account
	getDisambiguationChoices: (dom : HTMLElement) => DisambiguationChoice[];
}

interface GradeLoader {
	url: string;
	method: string;
}

interface ClassGradeLoader {
	url: string;
	method: string;
	makeQuery: (hash : string, state : ASPNETPageState) => Object;
}

interface DisambiguationChoice {
	name: string; // name of student
	id: string; // student ID
}

interface ColumnOffsets {
	title: number;
	grades: number;
}

interface ASPNETPageState {
	viewstate: string;
	eventvalidation: string;
	eventtarget: string;
	eventargument: string;
}

// CryptoJS methods
var CryptoJS : Crypto;

interface Crypto {
	SHA1: (message : string) => WordArray;
}

interface WordArray {
	sigBytes: number;
	words: number[];
	toString: () => string;
}

/** Iterates through all properties that belong to an object. */
var eachOwnProperty = function(o : Object, f : (k : string, v : any) => any) {
	for (var k in o)
		if (Object.prototype.hasOwnProperty.call(o, k))
			f(k, o[k]);
}

/** Map through all properties that belong to an object, returning an array.. */
var mapOwnProperties = function(o : Object, f : (k : string, v : any) => any) {
	var newList = [];

	for (var k in o)
		if (Object.prototype.hasOwnProperty.call(o, k))
			newList[newList.length] = f(k, o[k]);

	return newList;
}