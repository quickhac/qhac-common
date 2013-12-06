interface Course {
	title: string;
	teacher: string;
	teacherEmail: string;
	sixWeeksAverages: number[];
	sixWeeksUrlHashes: string[];
	examGrades: number[];
	semesterAverages: number[];
}

interface ClassGrades {
	title: string;
	urlHash: string;
	period: number;
	sixWeeksIndex: number;
	average: number;
	categories: Category[];
}

interface Category {
	title: string;
	weight: number;
	average: number;
	bonus: number;
	assignments: Assignment[];
}

interface Assignment {
	title: string;
	date: string;
	ptsEarned: number;
	ptsPossible: number;
	weight: number;
	note: string;
	extraCredit: boolean;
}