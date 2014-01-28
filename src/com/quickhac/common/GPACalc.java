package com.quickhac.common;

import java.util.LinkedList;
import java.util.List;

import com.quickhac.common.data.Course;
import com.quickhac.common.data.GradeValue;
import com.quickhac.common.util.Numeric;

public class GPACalc {
	
	public static final int DEFAULT_GPA_PRECISION = 4;
	
	/**
	 * Finds the grade point from a grade. To find the unweighted grade point,
	 * specify offset = 0. To find weighted on 5.0 scale, specify offset = 1. To
	 * find weighted on 6.0 scale, specify offset = 2.
	 */
	public static double gradePoint(final double grade, final double offset) {
		if (grade < 70.0) return 0.0;
		return Math.min((grade - 60.0) / 10.0, 4) + offset;
	}
	
	/** Calculates the unweighted grade point average of a list of courses. */
	public static double unweighted(final Course[] courses) {
		// flatten the courses down into a one dimensional list of semester averages
		final LinkedList<Double> semGradePoints = new LinkedList<Double>();
		for (int i = 0; i < courses.length; i++) 
			for (int j = 0; j < courses[i].semesters.length; j++)
				if (courses[i].semesters[j].average != null && courses[i].semesters[j].average.type == GradeValue.TYPE_INTEGER)
					semGradePoints.add(gradePoint(courses[i].semesters[j].average.value, 0.0));
		
		// take the average
		return Numeric.average(semGradePoints);
	}
	
	/**
	 * Calculates the weighted grade point average of a list of courses, given a
	 * list of courses that should be treated as honors and a bonus for honors
	 * courses.
	 */
	public static double weighted(final Course[] courses, final List<String> honors,
			final double offset) {
		// flatten the courses down into a one dimensional list of semester averages
		final LinkedList<Double> semGradePoints = new LinkedList<Double>();
		for (int i = 0; i < courses.length; i++)
			for (int j = 0; j < courses[i].semesters.length; j++)
				if (courses[i].semesters[j].average != null && courses[i].semesters[j].average.type == GradeValue.TYPE_INTEGER)
					semGradePoints.add(
							gradePoint(courses[i].semesters[j].average.value,
							honors.contains(courses[i].title) ? 1.0 : 0.0 
							) + offset);
		
		// take the average
		return Numeric.average(semGradePoints);
	}

}
