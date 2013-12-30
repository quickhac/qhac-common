/// <reference path='driver-gradespeed.ts'/>

module GradeRetriever {

	/** Get the viewstate and eventvalidation, etc. on an ASP.NET page. */
	export function getPageState($dom : HTMLElement) : ASPNETPageState {
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

	export function login(district : District, uname : string, pass : string, studentID : string, success : Function, fail : (ev : ErrorEvent) => any) : void {
		district.driver.login(district, uname, pass, studentId, success, fail);
	}

	export function getAverages(district: District, success : Function, fail : (ev : ErrorEvent) => any) : void {
		district.driver.getAverages(district, success, fail);
	}

	export function getClassGrades(district : District, urlHash : string, gradesPage : string, success : Function, fail : (ev : ErrorEvent) => any) : void {
		district.driver.getClassGrades(district, urlHash, gradesPage, success, fail);
	}

}
