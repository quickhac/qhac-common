/// <reference path='data.ts'/>
/// <reference path='xhr.ts'/>

interface GradeRetriever {
	login(uname : string, pass : string, studentID : string, callback : Function) : boolean;
	retrieveAverages(callback : Function) : Course[];
	retrieveClassGrades(urlHash : string, callback : Function) : ClassGrades[];
}

class RoundRockGradeRetriever implements GradeRetriever {
	static LOGIN_URL = 'https://accesscenter.roundrockisd.org/homeaccess/default.aspx';
	static DISAMBIGUATE_URL = 'https://accesscenter.roundrockisd.org/homeaccess/Student/DailySummary.aspx';
	static DIRECT_GRADES_URL = 'https://gradebook.roundrockisd.org/pc/displaygrades.aspx';

	/** Log into Round Rock ISD Home Access Center. */
	login(uname : string, pass : string, studentID : string, callback : Function) : boolean {
		new XHR('GET', this.LOGIN_URL).success(do_login);

		function do_login(doc) {
			
		}
		// TODO
		return null;
	}

	retrieveAveragesDirectly(idHash : string, callback : Function) : Course[] {
		// TODO
		return null;
	}

	retrieveAverages(callback : Function) : Course[] {
		// TODO
		return null;
	}

	retrieveClassGrades(urlHash : string, callback : Function) : ClassGrades[] {
		// TODO
		return null;
	}
}

class AustinGradeRetriever implements GradeRetriever {
	// TODO

	login(uname : string, pass : string, studentID : string, callback : Function) : boolean {
		// TODO
		return null;
	}

	retrieveAverages(callback : Function) : Course[] {
		// TODO
		return null;
	}

	retrieveClassGrades(urlHash : string, callback : Function) : ClassGrades[] {
		// TODO
		return null;
	}
}

var GRADE_RETRIEVERS = {
	ROUNDROCK: RoundRockGradeRetriever,
	AUSTIN: AustinGradeRetriever
};