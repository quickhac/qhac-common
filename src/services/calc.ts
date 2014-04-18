class Calculator {
    
    district: District;
    
    constructor(district: District) {
        this.district = district;
    }
    
    setDistrict(district: District): void {
        this.district = district;
    }

	/** Calculates a semester average from the cycles and exam grade provided */
	semesterAverage(semester: Semester): number {
		// get a list of all cycle averages by mapping arrays and crazy stuff like that
		var cycles: number[] = semester.cycles.map(c => c.average).numerics();

		var cycleAvg: number,
		    cycleWeight: number,
		    examGrade: number,
		    examWeight: number;

		// calculate the cycle grades
		cycleAvg = cycles.average();
		cycleWeight =
			// total cycle weight + exam weight = 100, therefore
			// total cycle weight = 100 - exam weight
            // but we multiply by 3 to avoid floating point roundoff
			(300 - this.district.examWeight * 3)
			// multiply the total cycle weight by the proportion of cycles that we are
			// including in the calculation
			* cycles.length / semester.cycles.length;

		// calculate the exam grade
		if (!semester.examIsExempt) {
			examGrade = semester.examGrade;
			// set the weight to NaN to ensure weighted average doesn't complain about
			// array length mismatch if there is no exam grade
			examWeight = actuallyIsNaN(examGrade) ? NaN : this.district.examWeight * 3;
		}

		// take the weighted average of cycle and exam
		return [cycleAvg, examGrade].weightedAverage([cycleWeight, examWeight]);
	}

	/** Calculates a cycle average given a ClassGrades object. Reads the category average
	    and bonus by category. */
	cycleAverage(grades: Cycle): number {
		var filteredCategories = grades.categories.filter(c => !actuallyIsNaN(c.average));

		return + // if 'return' is on a line by itself, TypeScript will append a semicolon
			// get a list of all category averages
			filteredCategories.map(c => c.average)
			// take the weighted average
			.weightedAverage(filteredCategories.map(c => c.weight))
			// add any bonuses from each category, even ones that don't have an average
			+ grades.categories.map(c => c.bonus).numerics().sum();
	}

	/** Calculates a category average from a list of assignments */
	categoryAverage(assignments: Assignment[]): number {
		var filteredAssignments = assignments.filter(
			// exclude extra credit assignments
			a => !a.extraCredit &&
			// exclude assignments with no grade
			!actuallyIsNaN(a.ptsEarned) &&
			// exclude dropped assignments
			a.note.indexOf('(Dropped)') === -1);

		return +
			// map each assignment into a score on a scale from 0 to 100
			// while avoiding floating point roundoff
			filteredAssignments.map(a => a.ptsEarned * 100 / a.ptsPossible)
			// and take the weighted average
			.weightedAverage(filteredAssignments.map(a => a.weight));
	}

	/** Calculates the total bonus from extra credit assignments in a category to
	    add to the class grade average. */
	categoryBonuses(assignments: Assignment[]): number {
		// include only extra credit assignments with a grade entered
		var ecAssignments = assignments.filter(a => a.extraCredit && !actuallyIsNaN(a.ptsEarned));

		// add up points earned
		return ecAssignments.map(a => a.ptsEarned).sum();
	}

}