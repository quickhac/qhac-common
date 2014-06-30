module GradeValue {
	
	var letters = {
		'A+': 98,
		'A': 95,
		'A-': 92,
		'B+': 88,
		'B': 85,
		'B-': 82,
		'C+': 78,
		'C': 75,
		'C-': 72,
		'D+': 68,
		'D': 65,
		'D-': 62,
		'F': 0
	}
	
	export function letterGradeToNumber(grade: string): number {
		return letters[grade];
	}
	
	/**
	 * Returns the letter grade closest to (least difference from) the specified
	 * numeric grade.
	 */
	export function numberToLetterGrade(grade: number): string {
		var i, diff = Infinity, oldDiff = Infinity,
			prop = Object.getOwnPropertyNames(letters), len = prop.length;
		
		for (i = 0; i < len; i++) {
			oldDiff = diff;
			diff = Math.abs(letters[prop[i]] - grade);
			if (diff >= oldDiff) return prop[i - 1];
		}
		return 'F';
	}
	
	export function parseInt(grade: string): number {
		if (typeof letters[grade] === 'undefined') return window['parseInt'](grade);
		else return letters[grade];
	}
	
	export function parseFloat(grade: string): number {
		if (typeof letters[grade] === 'undefined') return window['parseFloat'](grade);
		else return letters[grade];
	}
}