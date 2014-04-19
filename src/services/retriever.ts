class Retriever {
    
    credentials: Credentials;
    student: Student;
    parser: Parser;
    lastResponse: Document;
    lastResponseTime: number;
    lastGradesResponse: Document;
    lastGradesResponseTime: number;
    
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
	 * Logs into the GradeSpeed server of a district with specific login
	 * information and callbacks.
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
                else
                    _this.selectStudent(_this.student.studentId).then(resolve, reject);
            }
        });
	}

	// select a student
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
        			query: api.selectStudent.makeSubmitQuery(studentId, this.lastResponse)
        	    }).send();
            }
            
            function _resolve(text: string, doc: Document) {
                if (!api.selectStudent.validate(doc)) {
                    Function.maybeCall(reject, null, [new Error('validation failed')]);
                    return;
                }
                
                __this.lastResponse = doc;
                __this.lastResponseTime = +new Date();
                Function.maybeCall(resolve, null, []);
            }
        });
	}

	getYear(): Promise {
        var __this = this;
        return new Promise((resolve: (courses: Course[]) => any, reject: (e: Error) => any) => {
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
                Function.maybeCall(resolve, null, [__this.parser.parseYear(doc)]);
            }
        })
	}

	getCycle(urlHash: string): Promise {
        var __this = this;
		return new Promise((resolve: (cycle: Cycle) => any, reject: (e: Error) => any) => {
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
                Function.maybeCall(resolve, null, [__this.parser.parseCycle(doc, urlHash)]);
            }
        });
	}
    
    isLoggedIn(): boolean {
        return this.lastResponseTime != null &&
            this.lastResponseTime + 1000 * 60 * 5 >= +new Date();
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
