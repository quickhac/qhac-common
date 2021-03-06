/// <reference path='data.ts'/>
/// <reference path='xhr.ts'/>

module GradeRetriever {

	// get the viewstate and eventvalidation on a page on GradeSpeed
	function getPageState($dom : HTMLElement) : ASPNETPageState {
		// gets the value of an element on the page
		function getAttr(id : string) {
			var $elem = $dom.find(id);
			if ($elem.length) return $elem[0].attr('value');
			else return null;
		}

		// return values parsed from the page
		return {
			viewstate: getAttr('#__VIEWSTATE'),
			eventvalidation: getAttr('#__EVENTVALIDATION'),
			eventtarget: getAttr('#__EVENTTARGET'),
			eventargument: getAttr('#__EVENTARGUMENT')
		}
	}

	/**
	 * Logs into the GradeSpeed server of a district with specific login
	 * information and callbacks.
	 */
	export function login(district : District, uname : string, pass : string,
		success : (doc : string, $dom : HTMLElement, choices : DisambiguationChoice[], state : ASPNETPageState) => any,
		fail : (ev : ErrorEvent) => any)
		: void {
		// get the login page
		new XHR('GET', district.api.login.url)
			.success(do_login)
			.fail(fail)
			.send();

		// process the login page
		function do_login(doc : string) {
			// load the page DOM
			var $dom = document.createElement('div');
			$dom.innerHTML = doc;

			// load the page state
			var state = getPageState($dom);

			// construct a query
			var query = district.api.login.makeQuery(
				uname, pass, state);

			// perform login
			new XHR('POST', district.api.login.url)
				.success(getDisambigChoices)
				.fail(fail)
				.params(query)
				.send();
		}

		// return student choices if there are any
		function getDisambigChoices(doc : string) {
			// load the page DOM
			var $dom = document.createElement('div');
			$dom.innerHTML = doc;

			var state = getPageState($dom);

			// only return choices if there are any; the success callback should
			// detect whether the disambiguation choices array is null or not.
			if (district.api.disambiguate.isRequired($dom)) {
				// if the disambiguation choices load from a separate picker, load that picker first.
				if (district.api.disambiguate.pickerLoadsFromAjax) {
					new XHR('GET', district.api.disambiguate.url)
						.success((doc : string) => {
							var $dom = document.createElement('div');
							$dom.innerHTML = doc;
							var choices = district.api.disambiguate.getDisambiguationChoices($dom);
							XHR._maybeCall(success, null, [doc, $dom, choices, state]);
						})
						.fail(fail)
						.send();
				} else {
					var choices = district.api.disambiguate.getDisambiguationChoices($dom);
					XHR._maybeCall(success, null, [doc, $dom, choices, state])
				}
			} else {
				XHR._maybeCall(success, null, [doc, $dom, null, state]);
			}
		}
	}

	// select a student
	export function disambiguate(district : District, studentID : string,
		state : ASPNETPageState, success : Function,
		fail : (ev : ErrorEvent) => any) : void {
		// construct a query
		var query = district.api.disambiguate.makeQuery(studentID, state);

		// pass query to GradeSpeed
		new XHR(district.api.disambiguate.method, district.api.disambiguate.url)
			.success(success)
			.fail(fail)
			.params(query)
			.send();
	}

	export function getAverages(district: District, success : Function,
		fail : (ev : ErrorEvent) => any) : void {
		new XHR('GET', district.api.grades.url)
			.success(success)
			.fail(fail)
			.send();
	}

	export function getClassGrades(district : District, urlHash : string,
		gradesPage : string, success : Function, fail : (ev : ErrorEvent) => any) : void {
		// GradeSpeed loads the page from a URL.
		if (district.driver === 'gradespeed') {
			new XHR('GET', district.api.classGrades.url)
				.success(success)
				.fail(fail)
				.params(district.api.classGrades.makeQuery(urlHash, null))
				.send();
		}
		// txConnect loads class grades using an AJAX postback. This means we
		// need to take into account the page state of the loaded grades page
		// before making the class grade load request.
		else if (district.driver === 'txconnect') {
			var $dom = document.createElement('div');
			$dom.innerHTML = gradesPage;
			var state = getPageState($dom);
			new XHR('GET', district.api.classGrades.url)
				.success(success)
				.fail(fail)
				.params(district.api.classGrades.makeQuery(urlHash, state))
				.send();
		}
	}

}
