module GPACalc {
	var DEFAULT_GPA_PRECISION = 4;

	/**
	 * Finds the grade point from a grade. To find the unweighted grade point,
	 * specify offset = 0. To find weighted on 5.0 scale, specify offset = 1. To
	 * find weighted on 6.0 scale, specify offset = 2.
	 */
	function gradePoint(grade: number, offset: number) : number {
		if (isNaN(grade)) return NaN;
		if (grade < 70) return 0;
		return Math.min((grade - 60) / 10, 4) + offset;
	}

	/** Calculates the unweighted grade point average of a list of courses. */
	export function unweighted(grades: Course[]) : number {
		return grades.map(
			(x) => x.semesters.map(
				(y) => gradePoint(y.average, 0))
			).flatten().average();
	}

	/**
	 * Calculates the weighted grade point average of a list of courses, given a
	 * list of courses that should be treated as honors and an offset to add.
	 */
	export function weighted
			(grades: Course[], honors: string[], offset: number) : number {
		return grades.map(function(x) {
				var offset1 = offset + ((honors.indexOf(x.title) == -1) ? 0 : 1);
				return x.semesters.map((y) => gradePoint(y.average, offset1));
			}).flatten().average();
	}
}