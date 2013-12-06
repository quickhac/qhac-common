/// <reference path='data.ts'/>

interface GradeRetriever {
	login(uname : string, pass : string, studentID : string) : boolean;
	retrieveAverages() : Course[];
	retrieveClassGrades(urlHash : string) : ClassGrades[];
}

class RoundRockGradeRetriever implements GradeRetriever {
	// TODO
}

class AustinGradeRetriever implements GradeRetriever {
	// TODO
}

var GRADE_RETRIEVERS = {
	ROUNDROCK: RoundRockGradeRetriever,
	AUSTIN: AustinGradeRetriever
};