// Interfaces for dealing with different types of data

interface Account {
	id: string /* SHA1 */;
	credentials: Credentials;
	students: Student[];
}

interface UnlinkedAccount {
	id: string;
	credentials: UnlinkedCredentials;
	students: UnlinkedStudent[];
}
	
	interface Credentials {
		district: District;
		username: string;
		password: string; }

	interface UnlinkedCredentials {
		district: string;
		username: string;
		password: string; }

	interface Student {
		id: string /* SHA1 */;
		name: string;
		school: string;
		studentId: string;
		gpaData: GPAData;
		grades: Grades;
		attendance: Attendance;
		preferences: StudentPrefs }

	interface UnlinkedStudent {
		id: string;
		name: string;
		school: string;
		studentId: string;
	}

		interface StudentPrefs {
			notifLevel: NotificationLevel;
			gpaWeightedOn: boolean;
			gpaUnweightedOn: boolean;
		}

			enum NotificationLevel { NONE, CYCLE_DROP, CYCLE_CHANGE, ASSIGNMENT }
	
		interface GPAData {
			prevGpa: number /* float */;
			numPrevSemesters: number /* float */;
			weightedCourses: string[] /* Course.id[] */;
			electiveCourses: string[] /* Course.id[] */;
			extraCreditWhitelist: string[] /* Assignment.id[] */;
			extraCreditBlacklist: string[] /* Assignment.id[] */; }
	
		interface Grades {
			lastUpdated: number /* date */;
			changedGrades: GradeChange[];
			usesLetterGrades: boolean;
			hasExams: boolean;
			hasSemesterAverages: boolean;
			courses: Course[]; }
	
			interface GradeChange {
				id: string /* Course.id / Assignment.id */;
				timestamp: number /* date */;
				type: GradeChangeType;
				newGrade: string;
				read: boolean; }
	
				enum GradeChangeType { NEW, UP, DOWN }
	
			interface Course {
				id: string /* SHA1 */;
				title: string;
				teacherName: string;
				teacherEmail: string;
				period: number /* int */;
				semesters: Semester[]; }
	
				interface Semester {
					average: number /* int */;
					examGrade: number /* int */;
					examIsExempt: boolean;
					cycles: Cycle[]; }
	
					interface Cycle {
						urlHash: string /* Base64 */;
						lastUpdated: number /* date */;
						changedGrades: GradeChange[];
						usesLetterGrades: boolean;
						average: number /* int */;
						title: string;
						categories: Category[]; }
	
						interface Category {
							id: string /* SHA1 */;
							title: string;
							weight: number /* float */;
							average: number /* float */;
							bonus: number /* float */;
							assignments: Assignment[]; }
	
							interface Assignment {
								id: string /* SHA1 */;
								title: string;
								dateDue: number /* date */;
								dateAssigned: number /* date */;
								ptsEarned: number /* float */;
								ptsPossible: number /* float */;
								weight: number /* float */;
								note: string;
								extraCredit: boolean; }
	
		interface Attendance {
			lastUpdated: number /* date */;
			events: AttendanceEvent[]; }
	
			interface AttendanceEvent {
				id: string /* SHA1 */;
				date: number /* date */;
				block: number /* int */;
				explanation: string;
				read: boolean; }

interface District {
	id: string;
	name: string;
	examWeight: number /* int */;
	weightedGpaOffset: number /* int */;
	columnOffsets: ColumnOffsets;
	api: DistrictAPI; }

	interface ColumnOffsets {
		title: number /* int */;
		period: number /* int */;
		courses: number /* int */; }

	interface DistrictAPI {
		login: APILogin;
		selectStudent: APISelectStudent;
		year: APIYear;
		cycle: APICycle;
		attendance: APIAttendance;
		registerUrl: string;
		forgotPasswordUrl: string; }

		interface APILogin {
			loadUrl: string;
			loadMethod: string;
			submitUrl: string;
			submitMethod: string;
			validateLoginPage: (doc: Document) => boolean;
			validateAfterLogin: (doc: Document) => boolean;
			makeQuery: (u: string, p: string, doc: Document) => Object; }

		interface APISelectStudent {
			loadUrl: string;
			loadMethod: string;
			submitUrl: string;
			submitMethod: string;
			validate: (doc: Document) => boolean; // validates the picker
			pickerLoadsFromAjax: boolean;
			isRequired: (doc: Document) => boolean;
			makeLoadQuery: (doc: Document) => Object;
			makeSubmitQuery: (id: string, doc: Document) => Object;
			getChoices: (doc: Document) => Student[]; }

		interface APIYear {
			loadUrl: string;
			loadMethod: string;
			validate: (doc: Document) => boolean;
			makeQuery: (doc: Document) => Object; }

		interface APICycle {
			loadUrl: string;
			loadMethod: string;
			validate: (doc: Document) => boolean;
			requiresYearLoaded: boolean;
			makeQuery: (hash: string, doc: Document) => Object; }

		interface APIAttendance {
			loadUrl: string;
			loadMethod: string;
			validate: (doc: Document) => boolean;
			makeQuery: (doc: Document) => Object;
			getEvents: (doc: Document) => AttendanceEvent[]; }

enum LoginStatus {
	NOT_LOGGED_IN = 0,
	LOGGING_IN = 1,
	LOGGED_IN = 2
}

interface State {
	activeStudent: string;
	activeAccount: string;
	lastUpdated: number;
	loginStatus: LoginStatus;
}

// CryptoJS methods
declare var CryptoJS : Crypto;

interface Crypto {
	SHA1: (message: string) => WordArray;
}

interface WordArray {
	sigBytes: number;
	words: number[];
	toString: () => string;
}

// Promise
declare class Promise {
	constructor(f: Function, e?: Function);

	then(f: Function, e?: Function): Promise;
	spread(f: Function, e?: Function): Promise;
}

/** Iterates through all properties that belong to an object. */
var eachOwnProperty = function(o: Object, f: (k: string, v: any) => any): void {
	for (var k in o)
		if (Object.prototype.hasOwnProperty.call(o, k))
			f(k, o[k]);
}

/** Map through all properties that belong to an object, returning an array.. */
var mapOwnProperties = function(o: Object, f: (k: string, v: any) => any): any[] {
	var newList = [];

	for (var k in o)
		if (Object.prototype.hasOwnProperty.call(o, k))
			newList[newList.length] = f(k, o[k]);

	return newList;
}