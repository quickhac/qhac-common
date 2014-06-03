class Retriever {
	
	credentials: Credentials;
	student: Student;
	parser: Parser;
	lastResponse: Document;
	lastResponseTime: number;
	lastGradesResponse: Document;
	lastGradesResponseTime: number;
	lastAttendanceResponse: Document;
	lastAttendanceResponseTime: number;
	
	/**
	 * Creates a new Retriever with the account credentials, optional student,
	 * and parser provided. The parser must be in the same district as the student.
	 */
	constructor(credentials: Credentials, student: Student, parser: Parser) {
		this.credentials = credentials;
		this.student = student;
		this.parser = parser;
	}
	
	setCredentials(credentials: Credentials): void {
		this.credentials = credentials;
		
		// reset other information on credential change
		this.student = this.lastResponse = this.lastResponseTime
			= this.lastGradesResponse = this.lastGradesResponseTime = null;
	}
	
	setStudent(student: Student): void {
		this.student = student;
	}
	
	setParser(parser: Parser): void {
		this.parser = parser;
	}

	/**
	 * Logs into the GradeSpeed server. If <code>this.student</code> is undefined,
	 * this method will resolve with a list of students to choose from if there
	 * are multiple students under the account. If there is only one student under
	 * the account or <code>this.student</code> is set to a student under the
	 * current account, <code>resolve</code> is called with <code>null</code>.
	 */
	login(): Promise {
		var creds = this.credentials;
		var api = creds.district.api;
		var _this = this;
		return new Promise((
				resolve: (choices: Student[]) => any,
				reject: (e: Error) => any) => {
			// get the login page
			new XHR({
				method: api.login.loadMethod,
				url: api.login.loadUrl,
				query: null,
				success: do_login,
				fail: reject
			}).send();
	
			// process the login page
			function do_login(text: string, doc: Document) {
				if (!api.login.validateLoginPage(doc)) {
					Function.maybeCall(reject, null, [new Error('validation failed')]);
					return;
				}
				
				new XHR({
					method: api.login.submitMethod,
					url: api.login.submitUrl,
					success: getDisambigChoices,
					query: api.login.makeQuery(creds.username, creds.password, doc),
					fail: reject
				}).send();
			}
	
			// return student choices if there are any
			function getDisambigChoices(text: string, doc: Document) {
				if (!api.login.validateAfterLogin(doc)) {
					Function.maybeCall(reject, null, [new Error('validation failed')]);
					return;
				}
				
				_this.lastResponse = doc;
				_this.lastResponseTime = +new Date();
				
				// only return choices if there are any; the success callback should
				// detect whether the disambiguation choices array is null or not.
				if (api.selectStudent.isRequired(doc)) {
					// if the disambiguation choices load from a separate picker, load that picker first.
					if (api.selectStudent.pickerLoadsFromAjax) {
						new XHR({
							method: api.selectStudent.loadMethod,
							url: api.selectStudent.loadUrl,
							query: api.selectStudent.makeLoadQuery(doc),
							success: (text: string, doc: Document) => {
								resolveChoice(doc);
							},
							fail: reject
						}).send();
					} else {
						resolveChoice(doc);
					}
				} else {
					Function.maybeCall(resolve, null, [null]);
				}
			}
			
			function resolveChoice(doc: Document) {
				if (api.selectStudent.pickerLoadsFromAjax)
					if (!api.selectStudent.validate(doc)) {
						Function.maybeCall(reject, null, [new Error('validation failed')]);
						return;
					} else {
						_this.lastResponse = doc;
						_this.lastResponseTime = +new Date();
					}
				
				var choices = api.selectStudent.getChoices(doc);
				if (typeof _this.student === 'undefined' || _this.student === null)
					Function.maybeCall(resolve, null, [choices]);
				else if (choices.map(s => s.studentId).indexOf(_this.student.studentId) === -1)
					Function.maybeCall(reject, null, [new Error('student not under account')]);
				else
					_this.selectStudent(_this.student.studentId).then(resolve, reject);
			}
		});
	}

	/**
	 * Attempts to select the student under the account with the requested
	 * student ID. Assumes that the student needs to be selected and that he can
	 * be selected.
	 */
	selectStudent(studentId: string): Promise {
		var __this = this;
		return new Promise((resolve: Function, reject: (e: Error) => any) => {
			var api = __this.credentials.district.api;
			
			__this.assureLoggedIn().then(sendSelectRequest, reject);

			function sendSelectRequest() {
				new XHR({
					method: api.selectStudent.submitMethod,
					url: api.selectStudent.submitUrl,
					success: _resolve,
					fail: reject,
					query: api.selectStudent.makeSubmitQuery(studentId, __this.lastResponse)
				}).send();
			}
			
			function _resolve(text: string, doc: Document) {
				if (!api.login.validateAfterLogin(doc)) {
					Function.maybeCall(reject, null, [new Error('validation failed')]);
					return;
				}
				
				__this.lastResponse = doc;
				__this.lastResponseTime = +new Date();
				Function.maybeCall(resolve, null, []);
			}
		});
	}

	/**
	 * Retrieves the year table of grades for the currently logged in student.
	 * Attempts to log in if the last call to the server was longer than five
	 * minutes ago.
	 */
	getYear(): Promise {
		var __this = this;
		return new Promise((resolve: (grades: Grades, student: Student) => any, reject: (e: Error) => any) => {
			var api = __this.credentials.district.api;
			
			if (typeof __this.student === 'undefined' || __this.student === null) {
				Function.maybeCall(reject, null, [new Error('no student loaded')]);
				return;
			}
			
			__this.assureLoggedIn().then(sendYearRequest, reject);
			
			function sendYearRequest() {
				new XHR({
					method: api.year.loadMethod,
					url: api.year.loadUrl,
					query: api.year.makeQuery(this.lastResponse),
					success: _resolve,
					fail: reject
				}).send();
			}
			
			function _resolve(text: string, doc: Document) {
				if (!api.year.validate(doc)) {
					Function.maybeCall(reject, null, [new Error('validation failed')]);
					return;
				}
				
				if (!api.cycle.requiresYearLoaded)
					__this.lastResponse = doc;
				__this.lastResponseTime = +new Date();
				__this.lastGradesResponse = doc;
				__this.lastGradesResponseTime = +new Date();
				Function.maybeCall(resolve, null, [__this.parser.parseYear(doc), __this.parser.parseStudentInfo(doc)]);
			}
		})
	}

	/**
	 * Retrieves the cycle with the specified url hash (or data hash; used as
	 * the "?data=" query parameter for the GradeSpeed server). Assures that
	 * the current student is logged in, and if the district server setup
	 * requires that the year table is loaded before any cycle is loaded, loads
	 * the year table first.
	 */
	getCycle(urlHash: string): Promise {
		var __this = this;
		return new Promise((resolve: (cycle: Cycle, grades: Grades) => any, reject: (e: Error) => any) => {
			var api = __this.credentials.district.api;
			
			__this.assureYearLoadRequirementsSatisfied().then(sendCycleRequest, reject);
			
			function sendCycleRequest() {
				new XHR({
					method: api.cycle.loadMethod,
					url: api.cycle.loadUrl,
					query: api.cycle.makeQuery(urlHash, this.lastResponse),
					success: _resolve,
					fail: reject
				}).send();
			}
			
			function _resolve(text: string, doc: Document) {
				if (!api.cycle.validate(doc))
					Function.maybeCall(reject, null, [new Error('validation failed')]);
				
				if (!api.cycle.requiresYearLoaded)
					__this.lastResponse = doc;
				__this.lastResponseTime = +new Date();
				__this.lastGradesResponse = doc;
				__this.lastGradesResponseTime = +new Date();
				Function.maybeCall(resolve, null, [__this.parser.parseCycle(doc, urlHash), __this.parser.parseYear(doc)]);
			}
		});
	}
	
	/**
	 * Retrieves the attendance table for the currently logged in student.
	 * Assures that the student is logged in.
	 */
	getAttendance(): Promise {
		var __this = this;
		return new Promise((resolve, reject) => {
			var api = __this.credentials.district.api;
			
			__this.assureLoggedIn().then(sendAttendanceRequest, reject);
			
			function sendAttendanceRequest() {
				new XHR({
					method: api.attendance.loadMethod,
					url: api.attendance.loadUrl,
					query: api.attendance.makeQuery(this.lastResponse),
					success: _resolve,
					fail: reject
				}).send();
			}
			
			function _resolve(text: string, doc: Document) {
				if (!api.attendance.validate(doc))
					Function.maybeCall(reject, null, [new Error('validation failed')]);
				
				__this.lastResponseTime = +new Date();
				__this.lastAttendanceResponse = doc;
				__this.lastAttendanceResponseTime = +new Date();
				Function.maybeCall(resolve, null, [api.attendance.getEvents(doc)]);
			}
		});
	}
	
	isLoggedIn(): boolean {
		return (this.lastResponseTime != null &&
			this.lastResponseTime + 1000 * 60 * 5 >= +new Date()) ||
			(!this.credentials.district.api.cycle.requiresYearLoaded && this.isYearLoaded());
	}
	
	isYearLoaded(): boolean {
		return this.lastGradesResponseTime != null &&
			this.lastGradesResponseTime + 1000 * 60 * 5 >= +new Date();
	}
	
	assureLoggedIn(): Promise {
		return new Promise((resolve, reject) => {
			if (!this.isLoggedIn()) this.login().then(resolve, reject);
			else Function.maybeCall(resolve, null, []);
		});
	}
	
	assureYearLoadRequirementsSatisfied(): Promise {
		var __this = this;
		return new Promise((resolve, reject) => {
			__this.assureLoggedIn().then(() => {
				if (__this.credentials.district.api.cycle.requiresYearLoaded && !__this.isYearLoaded())
					__this.getYear().then(resolve, reject);
				else Function.maybeCall(resolve, null, []);
			}, reject);
		});
	}

}
