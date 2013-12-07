/// <reference path='data.ts'/>
/// <reference path='xhr.ts'/>

interface GradeRetriever {
	login(uname : string, pass : string, studentID : string, success : Function, fail : (ev : ErrorEvent) => any) : void;
	getAverages(success : Function, fail : (ev : ErrorEvent) => any) : void;
	getClassGrades(urlHash : string, success : Function, fail : (ev : ErrorEvent) => any) : void;
}

class RoundRockGradeRetriever implements GradeRetriever {
	static LOGIN_URL = 'https://accesscenter.roundrockisd.org/homeaccess/default.aspx';
	static DISAMBIGUATE_URL = 'https://accesscenter.roundrockisd.org/homeaccess/Student/DailySummary.aspx';
	static DIRECT_GRADES_URL = 'https://gradebook.roundrockisd.org/pc/displaygrades.aspx';
	static GRADES_URL = 'https://accesscenter.roundrockisd.org/homeaccess/Student/Gradespeed.aspx?target=https://gradebook.roundrockisd.org/pc/displaygrades.aspx';

	/** Log into Round Rock ISD Home Access Center. */
	login(uname : string, pass : string, studentID : string, success : Function, fail : (ev : ErrorEvent) => any) : void {
		// get the login page
		new XHR('GET', RoundRockGradeRetriever.LOGIN_URL)
			.success(do_login)
			.fail(fail)
			.send();

		// process the login page
		function do_login(doc : string) {
			var $dom = document.createElement('div');
			$dom.innerHTML = doc;

			// required elements for login
			var viewstate = $dom.find('#__VIEWSTATE')[0].attr('value');
			var eventvalidation = $dom.find('#__EVENTVALIDATION')[0].attr('value');
			
			// prepare parameters
			var query = {
				'__VIEWSTATE': viewstate,
				'__EVENTVALIDATION': eventvalidation,
				'ctl00$plnMain$txtLogin': uname,
				'ctl00$plnMain$txtPassword': pass,
				'__EVENTTARGET': null,
				'__EVENTARGUMENT': null,
				'ctl00$strHiddenPageTitle': null,
				'ctl00$plnMain$Submit1': 'Log In'
			};

			// send login request
			new XHR('POST', RoundRockGradeRetriever.LOGIN_URL)
				.success(select_student)
				.fail(fail)
				.params(query)
				.send();
		}

		// select a student on the account
		function select_student(doc : string) {
			new XHR('GET', RoundRockGradeRetriever.DISAMBIGUATE_URL)
				.success(success) // original success callback
				.fail(fail)
				.params({'student_id' : studentID})
				.send();
		}
	}

	/** Retrieve grades directly from gradebook with the unique ID hash. */
	getAveragesDirectly(idHash : string, success : Function, fail : (ev : ErrorEvent) => any) : void {
		new XHR('GET', RoundRockGradeRetriever.DIRECT_GRADES_URL)
			.success(success)
			.fail(fail)
			.params({'studentid' : idHash})
			.send();
	}

	/** Retrieves grades frome Home Access once logged in. */
	getAverages(success : Function, fail : (ev : ErrorEvent) => any) : void {
		new XHR('GET', RoundRockGradeRetriever.GRADES_URL)
			.success(success)
			.fail(fail)
			.send();
	}

	/** Retrieve class grades directly from gradebook. */
	getClassGradesDirectly(idHash : string, urlHash : string, success : Function, fail : (ev : ErrorEvent) => any) : void {
		new XHR('GET', RoundRockGradeRetriever.DIRECT_GRADES_URL)
			.success(success)
			.fail(fail)
			.params({'studentid' : idHash, 'data' : urlHash})
			.send();
	}

	/** Retrieve class grades once logged in. */
	getClassGrades(urlHash : string, success : Function, fail : (ev : ErrorEvent) => any) : void {
		new XHR('GET', RoundRockGradeRetriever.GRADES_URL)
			.success(success)
			.fail(fail)
			.params({'data' : urlHash})
			.send();
	}
}

class AustinGradeRetriever implements GradeRetriever {
	static LOGIN_URL = 'https://gradespeed.austinisd.org/pc/default.aspx?DistrictID=227901';
	static DISAMBIGUATE_URL = 'https://gradespeed.austinisd.org/pc/ParentStudentGrades.aspx';
	static GRADES_URL = 'https://gradespeed.austinisd.org/pc/ParentStudentGrades.aspx';

	login(uname : string, pass : string, studentID : string, success : Function, fail : (ev : ErrorEvent) => any) : void {
		// get login page
		new XHR('GET', AustinGradeRetriever.LOGIN_URL)
			.success(do_login)
			.fail(fail)
			.send();

		// process login page
		function do_login(doc : string) {
			var $dom = document.createElement('div');
			$dom.innerHTML = doc;

			// required elements for login
			var viewstate = $dom.find('#__VIEWSTATE')[0].attr('value');

			// prepare parameters
			var query = {
				"__EVENTTARGET": null,
				"__EVENTARGUMENT": null,
				"__LASTFOCUS": null,
				"__VIEWSTATE": viewstate,
				"__scrollLeft": 0,
				"__scrollTop": 0,
				"ddlDistricts": null,
				"txtUserName": uname,
				"txtPassword": pass,
				"ddlLanguage": "en",
				"btnLogOn": "Log On"
			};

			// send login request
			new XHR('POST', AustinGradeRetriever.LOGIN_URL)
				.success(select_student)
				.fail(fail)
				.params(query)
				.send();
		}

		// select a student if necessary
		function select_student(doc : string) {
			var $dom = document.createElement('div');
			$dom.innerHTML = doc;

			// check if the select box is on the page; if so, we need to select the student
			// from a list of students.
			var $selectBox = $dom.find('#_ctl0_ddlStudents');
			if ($selectBox.length) {
				// required elements >.>
				var viewstate = $dom.find('#__VIEWSTATE')[0].attr('value');
				var eventvalidation = $dom.find('#__EVENTVALIDATION')[0].attr('value');

				// prepare parameters
				var query = {
					'__EVENTTARGET': '_ctl0$ddlStudents',
					'__EVENTARGUMENT': null,
					'__LASTFOCUS': null,
					'__VIEWSTATE': viewstate,
					'__scrollLeft': 0,
					'__scrollTop': 0,
					'__EVENTVALIDATION': eventvalidation,
					'__RUNEVENTTARGET': null,
					'__RUNEVENTARGUMENT': null,
					'__RUNEVENTARGUMENT2': null,
					'_ctl0:ddlStudents': studentID
				};

				// send request
				new XHR('POST', AustinGradeRetriever.DISAMBIGUATE_URL)
					.success(success)
					.fail(fail)
					.send();
			} else {
				// no student selection required; call the success callback
				XHR._maybeCall(success, null, [doc, $dom]);
			}
		}
	}

	getAverages(success : Function, fail : (ev : ErrorEvent) => any) : void {
		new XHR('GET', AustinGradeRetriever.GRADES_URL)
			.success(success)
			.fail(fail)
			.send();
	}

	getClassGrades(urlHash : string, success : Function, fail : (ev : ErrorEvent) => any) : void {
		new XHR('GET', AustinGradeRetriever.GRADES_URL)
			success(success)
			.fail(fail)
			.params({'data': urlHash})
			.send();
	}
}

var GRADE_RETRIEVERS = {
	ROUNDROCK: RoundRockGradeRetriever,
	AUSTIN: AustinGradeRetriever
};