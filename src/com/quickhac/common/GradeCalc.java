package com.quickhac.common;

import java.util.List;
import java.util.ArrayList;

import com.quickhac.common.data.Assignment;
import com.quickhac.common.data.Category;
import com.quickhac.common.data.ClassGrades;
import com.quickhac.common.data.GradeValue;
import com.quickhac.common.data.Semester;
import com.quickhac.common.util.Numeric;

// Beware! These functions will return null if there is nothing to calculate.
// Make sure to handle nulls in your code when you call these functions.
public class GradeCalc {
	
	public static GradeValue semesterAverage(Semester semester, int examWeight) {
		// get a list of all cycle averages
		final List<Double> cycles = new ArrayList<Double>(semester.cycles.length);
		for (int i = 0; i < semester.cycles.length; i++)
			if (semester.cycles[i].average != null && semester.cycles[i].average.type == GradeValue.TYPE_INTEGER)
				cycles.add((double) semester.cycles[i].average.value);
		
		// weighted average accumulators
		double weightedTotal = 0;
		double weights = 0;
		
		// calculate the cycle grades
		final double cycleAvg = Numeric.average(cycles);
		final double cycleWeight =
				// total cycle weight + exam weight = 100, therefore
				// total cycle weight = 100 - exam weight
				(100 - examWeight)
				// multiply the total cycle weight by the proportion of cycles that we are
				// including in the calculation
				* cycles.size() / (semester.cycles.length == 0 ? 1 : semester.cycles.length);
		if (cycleWeight > 0) {
			weightedTotal += cycleAvg * cycleWeight;
			weights += cycleWeight;
		}
		
		// calculate the exam grade
		if (semester.examGrade != null && semester.examGrade.type == GradeValue.TYPE_INTEGER) {
			weightedTotal += ((double) semester.examGrade.value) * examWeight;
			weights += examWeight;
		}
		
		// don't return anything if there is no semester average
		if (weights == 0.0) {
			GradeValue g = new GradeValue();
			g.type = GradeValue.TYPE_NONE;
			g.value = GradeValue.VALUE_NONE;
			return g;
		}
		
		// take the weighted average
		return GradeValue.fromInt((int) Math.round(weightedTotal / weights));
	}
	
	public static GradeValue cycleAverage(ClassGrades cycle) {
		// get all categories with an average
		final List<Category> filteredCategories = new ArrayList<Category>(cycle.categories.length);
		for (int i = 0; i < cycle.categories.length; i++)
			if (cycle.categories[i].average != null)
				filteredCategories.add(cycle.categories[i]);
		
		// take the weighted average of categories
		double weightedTotal = 0;
		double weights = 0;
		
		for (Category cat : filteredCategories) {
			weightedTotal += cat.average * cat.weight;
			weights += cat.weight;
		}
		
		// if there is no average, return nothing
		if (weights == 0.0) {
			GradeValue g = new GradeValue();
			g.type = GradeValue.TYPE_NONE;
			g.value = GradeValue.VALUE_NONE;
			return g;
		}
		
		// add any bonuses from each category, even ones that don't have an average
		double bonus = 0;
		for (int i = 0; i < cycle.categories.length; i++)
			bonus += cycle.categories[i].bonus;
		
		// return final average
		return GradeValue.fromInt((int) Math.round(weightedTotal / weights + bonus));
	}
	
	public static Double categoryAverage(Assignment[] assignments) {
		// get all assignments with a grade, excluding extra credit assignments
		// and dropped assignments
		final List<Assignment> filteredAssignments = new ArrayList<Assignment>(assignments.length);
		for (int i = 0; i < assignments.length; i++)
			if (!assignments[i].extraCredit &&
					assignments[i].ptsEarned != null &&
					assignments[i].ptsEarned.type == GradeValue.TYPE_DOUBLE &&
					!assignments[i].note.contains("(Dropped)"))
				filteredAssignments.add(assignments[i]);
		
		// take the weighted average
		double weightedTotal = 0;
		double weights = 0;
		
		for (Assignment a : filteredAssignments) {
			weightedTotal += a.ptsEarned.value_d * 100 * a.weight / a.ptsPossible;
			weights += a.weight;
		}
		
		// if there is no average, return nothing
		if (weights == 0.0) return null;
		
		// return weighted average
		return weightedTotal / weights;
	}
	
	// this one never returns null (gasp)
	public static double categoryBonuses(Assignment[] assignments) {
		// include only extra credit assignments with a grade entered
		final List<Assignment> ecAssignments = new ArrayList<Assignment>(assignments.length);
		for (int i = 0; i < assignments.length; i++)
			if (assignments[i].extraCredit &&
					assignments[i].ptsEarned != null &&
					assignments[i].ptsEarned.type == GradeValue.TYPE_DOUBLE)
				ecAssignments.add(assignments[i]);
		
		// add up points earned
		double total = 0;
		for (Assignment a : ecAssignments)
			total += a.ptsEarned.value_d;
		
		return total;
	}

}
