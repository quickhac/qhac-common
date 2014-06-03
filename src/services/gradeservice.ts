enum LoginStatus {
	NOT_LOGGED_IN = 0,
	LOGGING_IN = 1,
	LOGGED_IN = 2
}

class GradeService {
	accountId: string;
	studentId: string;
	parser: Parser;
	calculator: Calculator;
	retriever: Retriever;
	augment: Augment;
	store: Store;
	
	cache: Account[];
	loginStatus: LoginStatus;
	newAccount: Account;
	
	constructor() {
		this.store = new Store('quickhac');
		this.store.getAccounts().then(
			(accounts: Account[]) => { this.cache = accounts; },
			(e: Error) => { throw e; }
		);
		this.loginStatus = LoginStatus.NOT_LOGGED_IN;
	}
	
	setIdentity(accountId: string, studentId: string): boolean {
		this.accountId = accountId;
		this.studentId = studentId;
		
		var accounts = this.cache.map(a => a.id);
		var account = this.cache[accounts.indexOf(accountId)];
		if (typeof account === 'undefined') {
			this.loginStatus = LoginStatus.NOT_LOGGED_IN;
			return false;
		}
		
		var students = account.students.map(s => s.id);
		var student = account.students[students.indexOf(studentId)];
		if (typeof student === 'undefined') {
			this.loginStatus = LoginStatus.NOT_LOGGED_IN;
			return false;
		}
		
		this.calculator = new Calculator(account.credentials.district, student);
		this.parser = new Parser(account.credentials.district, this.calculator);
		this.retriever = new Retriever(account.credentials, student, this.parser);
		this.augment = new Augment();
		
		this.loginStatus = LoginStatus.LOGGED_IN;
		return true;
	}
	
	attemptLogin(district: District, username: string, password: string): Promise {
		this.loginStatus = LoginStatus.LOGGING_IN;
		this.newAccount = {
			id: CryptoJS.SHA1(district.name + '|' + username + '|' + password).toString(),
			credentials: {
				district: district,
				username: username,
				password: password
			},
			students: []
		};
		
		this.calculator = new Calculator(district, null);
		this.parser = new Parser(district, this.calculator);
		this.retriever = new Retriever(this.newAccount.credentials, null, this.parser);
		this.augment = new Augment();
		
		return new Promise((resolve: Function, reject: (e: Error) => any) => {
			this.retriever.login().then((choices: Student[]) => {
				if (choices !== null) {
					this.newAccount.students = choices;
					Function.maybeCall(resolve, null, [choices]);
				} else {
					this.loginStatus = LoginStatus.LOGGED_IN;
					this.retriever.getYear().then((grades: Grades, student: Student) => {
						student.id = CryptoJS.SHA1(this.newAccount.id + '|0').toString();
						student.grades = grades;
						student.studentId = "";
						this.newAccount.students = [student];
					});
				}
			}, reject);
		});
	}
	
	// TODO: verify
	attemptSelectStudent(studentId: string): Promise {
		return new Promise((resolve: Function, reject: (e: Error) => any) => {
			this.retriever.selectStudent(studentId).then(() => {
				this.loginStatus = LoginStatus.LOGGED_IN;
				this.retriever.getYear().then((grades: Grades, student: Student) => {
					student.id = CryptoJS.SHA1(this.newAccount.id + '|' + studentId).toString();
					student.grades = grades;
					student.studentId = studentId;
					var studentIndex = this.newAccount.students.map(s => s.studentId).indexOf(studentId);
					this.newAccount.students[studentIndex] = student;
					this.accountId = this.newAccount.id;
					this.cache.push(this.newAccount);
				});
			}, reject);
		});
	}
	
	getAccount(): Account {
		if (typeof this.accountId === 'undefined' || this.accountId === null) return null;
		
		var ids = this.cache.map((a) => a.id);
		var index = ids.indexOf(this.accountId);
		if (index === -1) return null;
		return this.cache[index];
	}
	
	getStudent(): Student {
		if (typeof this.studentId === 'undefined' || this.studentId === null) return null;
		
		var account = this.getAccount();
		if (account === null) return null;
		
		var ids = account.students.map((s) => s.id);
		var index = ids.indexOf(this.studentId);
		if (index === -1) return null;
		return account.students[index];
	}
	
	getGradesYear(): Course[] {
		return this.getStudent().grades.courses;
	}
	
	getGradesCycle(urlHash: string): Cycle {
		var courses = this.getGradesYear(), courseLen = courses.length;
		for (var i = 0; i < courseLen; i++) {
			var course = courses[i], semesterLen = course.semesters.length;
			for (var j = 0; j < semesterLen; j++) {
				var semester = course.semesters[j];
				var foundIndex = semester.cycles.map((c) => c.urlHash).indexOf(urlHash);
				if (foundIndex !== -1)
					return semester.cycles[foundIndex];
			}
		}
		
		return null;
	}
	
	loadGradesYear(): Promise {
		return new Promise((resolve: (grades: Grades, changes: GradeChange[]) => any,
				reject: (e: Error) => any) => {
			var student = this.getStudent();
			this.retriever.getYear().then((grades: Grades) => {
				var changes = this.updateGradesYear(grades.courses, student);
				this.store.updateStudent(student).then(() => {
					Function.maybeCall(resolve, null, [grades, changes]);
				}, reject);
			}, reject);
		});
	}
	
	/**
	 * Updates the cached student object and returns the grade changes from the
	 * newly parsed grades.
	 */
	updateGradesYear(courses: Course[], student: Student): GradeChange[] {
		var changes = this.augment.diffYear(student.grades.courses, courses);
		student.grades.lastUpdated = +new Date();
		student.grades.courses = this.augment.augmentYear(student.grades.courses, courses);
		student.grades.changedGrades = student.grades.changedGrades.concat(changes);
		return changes;
	}
	
	loadGradesCycle(urlHash: string): Promise {
		return new Promise((resolve: (cycle: Cycle, cycleChanges: GradeChange[],
				courses: Course[], yearChanges: GradeChange[]) => any,
				reject: (e: Error) => any) => {
			var student = this.getStudent();
			this.retriever.getCycle(urlHash).then((cycle: Cycle, grades: Grades) => {
				var yearChanges = this.updateGradesYear(grades.courses, student);
				var cycleChanges = this.updateGradesCycle(cycle, student);
				this.store.updateStudent(student).then(() => {
					Function.maybeCall(resolve, null, [cycle, cycleChanges, grades, yearChanges]);
				});
			});
		});
	}
	
	/**
	 * Updates the cached student object with new cycle information and returns
	 * the grade changes from the newly parsed cycle.
	 */
	updateGradesCycle(newCycle: Cycle, student: Student): GradeChange[] {
		// find the cycle from a list
		var courses = student.grades.courses,
			course: Course, semester: Semester, cycle: Cycle,
			i: number, j: number, k: number,
			coursesLen = courses.length,
			semestersLen = courses[0].semesters.length,
			cyclesLen = courses[0].semesters[0].cycles.length;
		findCourseLoop: for (i = 0; i < coursesLen; i++) {
			course = courses[i];
			for (j = 0; j < semestersLen; j++) {
				semester = course.semesters[j];
				for (k = 0; k < cyclesLen; k++) {
					cycle = semester.cycles[k];
					if (cycle.urlHash === newCycle.urlHash)
						break findCourseLoop;
				}
			}
		}
		
		var changes = this.augment.diffCycle(cycle, newCycle);
		cycle.lastUpdated = +new Date();
		newCycle.changedGrades = cycle.changedGrades.concat(changes);
		semester.cycles[k] = newCycle; // no need to augment
		return changes;
	}
	
	loadAttendance(): Promise {
		return new Promise((resolve: (events: AttendanceEvent[]) => any, reject: (e: Error) => any) => {
			var student = this.getStudent();
			this.retriever.getAttendance().then((events: AttendanceEvent[]) => {
				var augmentedEvents = this.updateAttendance(events, student);
				this.store.updateStudent(student).then(() => {
					Function.maybeCall(resolve, null, [augmentedEvents]);
				}, reject);
			}, reject);
		});
	}
	
	updateAttendance(newEvents: AttendanceEvent[], student: Student): AttendanceEvent[] {
		var attendance = student.attendance;
		var augmentedEvents = this.augment.augmentAttendanceEvents(attendance.events, newEvents);
		attendance.lastUpdated = +new Date();
		attendance.events = augmentedEvents;
		return augmentedEvents;
	}
}