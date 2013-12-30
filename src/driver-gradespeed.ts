/// <reference path='data.ts'/>
/// <reference path='query.ts'/>
/// <reference path='xhr.ts'/>

module GradeSpeedDriverModule {
	export var name = 'gradespeed';

	export function login(district : District, uname : string, pass : string, studentID : string, success : Function, fail : (ev : ErrorEvent) => any) : void {
		var api = <GradeSpeed> district.server.api;

		// get the login page
		new XHR('GET', api.login.url)
			.success(do_login)
			.fail(fail)
			.send();

		// process the login page
		function do_login(doc : string) {
			// load the page DOM
			var $dom = document.createElement('div');
			$dom.innerHTML = doc;

			// load the page state
			var state = GradeRetriever.getPageState($dom);

			// construct a query
			var query = api.login.makeQuery(
				uname, pass, state);

			// perform login
			new XHR('POST', api.login.url)
				.success(disambiguate)
				.fail(fail)
				.params(query)
				.send();
		}

		// select a student
		function disambiguate(doc : string) {
			// load the page DOM
			var $dom = document.createElement('div');
			$dom.innerHTML = doc;

			// only disambiguate if necessary
			if (api.disambiguate.isRequired($dom)) {
				// load the page state
				var state = GradeRetriever.getPageState($dom);

				// construct a query
				var query = api.disambiguate.makeQuery(
					studentID, state);

				// pass query to GradeSpeed
				new XHR(api.disambiguate.method, api.disambiguate.url)
					.success(success)
					.fail(fail)
					.params(query)
					.send();
			} else {
				// no need to select student; call success callback
				XHR._maybeCall(success, null, [doc, $dom]);
			}
		}
	}

	export function getAverages(district: District, success : Function, fail : (ev : ErrorEvent) => any) : void {
		var api = <GradeSpeed> district.server.api;
		new XHR('GET', api.grades.url)
			.success(success)
			.fail(fail)
			.send();
	}

	export function getClassGrades(district : District, urlHash : string, gradesPage : string, success : Function, fail : (ev : ErrorEvent) => any) : void {
		var api = <GradeSpeed> district.server.api;
		new XHR('GET', api.classGrades.url)
			.success(success)
			.fail(fail)
			.params(api.classGrades.makeQuery(urlHash, null))
			.send();
		// txConnect loads class grades using an AJAX postback. This means we
		// need to take into account the page state of the loaded grades page
		// before making the class grade load request.
		// else if (district.driver === 'txconnect') {
		// 	var $dom = document.createElement('div');
		// 	$dom.innerHTML = gradesPage;
		// 	var state = GradeRetriever.getPageState($dom);
		// 	new XHR('GET', district.server.api.classGrades.url)
		// 		.success(success)
		// 		.fail(fail)
		// 		.params(district.server.api.classGrades.makeQuery(urlHash, state))
		// 		.send();
		// }
	}
}

// modules can't extend interfaces, so make an alias that is of the correct type
var GradeSpeedDriver : Driver = GradeSpeedDriverModule;
