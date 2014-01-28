package com.quickhac.common;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import com.quickhac.common.data.*;
import com.quickhac.common.districts.GradeSpeedDistrict;
import com.quickhac.common.util.Base64;
import com.quickhac.common.util.Hash;
import com.quickhac.common.util.Numeric;

public class GradeParser {
	
	/**
	 * The regex to compare against assignment titles to guess if it's extra
	 * credit or not.
	 */
	static final Pattern EXTRA_CREDIT_REGEX =
			Pattern.compile("^extra credit$|^ec$", Pattern.CASE_INSENSITIVE);
	
	/**
	 * The regex to compare against assignment notes to guess if it's extra
	 * credit or not.
	 */
	static final Pattern EXTRA_CREDIT_NOTE_REGEX =
			Pattern.compile("extra credit", Pattern.CASE_INSENSITIVE);
	

	static final Pattern NUMERIC_REGEX = Pattern.compile("(\\d+)");
	static final Pattern CYCLE_HEADER_REGEX =
			Pattern.compile("cycle (\\d+)", Pattern.CASE_INSENSITIVE);
	static final Pattern EXAM_HEADER_REGEX =
			Pattern.compile("exam (\\d+)", Pattern.CASE_INSENSITIVE);
	static final Pattern SEMESTER_HEADER_REGEX =
			Pattern.compile("semester (\\d+)", Pattern.CASE_INSENSITIVE);
	static final Pattern GRADE_CELL_URL_REGEX =
			Pattern.compile("\\?data=([\\w\\d%]*)");
	
	static final Pattern CLASS_NAME_REGEX =
			Pattern.compile("(.*) \\(Period (\\d+)\\)");
	static final Pattern CATEGORY_NAME_REGEX =
			Pattern.compile("^(.*) - (\\d+)%$");
	static final Pattern ALT_CATEGORY_NAME_REGEX = // IB-MVPS grading
			Pattern.compile("^(.*) - Each assignment counts (\\d+)");
	
	final GradeSpeedDistrict district;
	
	public GradeParser(final GradeSpeedDistrict d) {
		district = d;
	}
	
	public Course[] parseAverages(final String html) {
		// set up DOM for parsing
		final Document doc = Jsoup.parse(html);
		
		// find the grade table
		final Element $gradeTable = doc.getElementsByClass("DataTable").first();
		
		// make semester parameters
		final Elements $headerCells = $gradeTable.select("tr.TableHeader").first().getElementsByTag("th");
		final SemesterParams semParams = new SemesterParams();
		
		// parse through all cells to find parameters
		Matcher cycleMatcher, examMatcher, semMatcher;
		String text;
		semParams.hasExams = false; semParams.hasSemesterAverages = false;
		for (Element $cell : $headerCells) {
			text = $cell.text();
			
			// "Cycle 1..6"
			cycleMatcher = CYCLE_HEADER_REGEX.matcher(text);
			if (cycleMatcher.matches()) {
				semParams.cyclesPerSemester = Integer.valueOf(cycleMatcher.group(1));
				continue;
			}
			
			// "Exam 1..2" 
			examMatcher = EXAM_HEADER_REGEX.matcher(text);
			if (examMatcher.matches()) {
				semParams.hasExams = true;
				continue;
			}
			
			// "Semester 1..2"
			semMatcher = SEMESTER_HEADER_REGEX.matcher(text);
			if (semMatcher.matches()) {
				semParams.hasSemesterAverages = true;
				semParams.semesters = Integer.valueOf(semMatcher.group(1));
			}
		}
		
		if (semParams.semesters == 0) semParams.semesters = 1;
		semParams.cyclesPerSemester /= semParams.semesters;
		
		// find each course
		final Elements $rows = $gradeTable.select("tr.DataRow, tr.DataRowAlt");
		
		final Course[] courses = new Course[$rows.size()];
		
		// parse each course
		for (int i = 0; i < courses.length; i++)
			courses[i] = parseCourse($rows.get(i), semParams);
		
		return courses;
	}
	
	public ClassGrades parseClassGrades(final String html, final String urlHash, final int semesterIndex,
			final int cycleIndex) {
		// set up DOM for parsing
		final Document doc = Jsoup.parse(html);
		
		// sometimes GradeSpeed decides to return nothing
		// if there's nothing to see, return nothing
		final Elements $className = doc.getElementsByClass("ClassName");
		if ($className.size() == 0)
			return null;
		
		// class name cell contains title and period
		// the matches from this will be ["Class Title", "xx"] (xx = period)
		final Matcher classNameMatches = CLASS_NAME_REGEX.matcher(
				$className.first().text());
		classNameMatches.find();
		
		// get category names
		final Elements catNames = doc.getElementsByClass("CategoryName");
		final Elements $categories = doc.getElementsByClass("DataTable");
		// ignore first table, since it is the overall grades
		$categories.remove(0);
		
		// generate course ID
		final String courseId =
				Hash.SHA1(Base64.decode(decodeURIComponent(urlHash)));
		
		// parse category average
		final Matcher averageMatcher = NUMERIC_REGEX.matcher(
				doc.getElementsByClass("CurrentAverage").first().text());
		averageMatcher.find();
		
		// parse categories
		final Category[] cats = new Category[$categories.size()];
		assert(catNames.size() == $categories.size());
		for (int i = 0; i < cats.length; i++)
			cats[i] = parseCategory(catNames.get(i), $categories.get(i), courseId);
		
		// return class grades
		final ClassGrades grades = new ClassGrades();
		grades.title = classNameMatches.group(1);
		grades.urlHash = urlHash;
		grades.period = Integer.valueOf(classNameMatches.group(2));
		grades.semesterIndex = semesterIndex;
		grades.cycleIndex = cycleIndex;
		grades.average = Integer.valueOf(averageMatcher.group(0));
		grades.categories = cats;
		return grades;
	}
	
	public StudentInfo parseStudentInfo(final String html) {
		return district.parseStudentInfo(Jsoup.parse(html));
	}
	
	Course parseCourse(final Element $row, final SemesterParams semParams) {
		// find the cells in this row
		final Elements $cells = $row.getElementsByTag("td");
		
		// find the teacher name and email
		final Element $teacherCell = $row.getElementsByClass("EmailLink").first();
		
		// get the course number
		final String courseNum = findCourseNum($cells);
		final String courseId = courseNum == null ? null : Hash.SHA1(courseNum);
		
		// parse semesters
		final Semester[] semesters = new Semester[semParams.semesters];
		for (int i = 0; i < semParams.semesters; i++) {
			// get cells for the semester
			final Element[] $semesterCells = new Element[semParams.cyclesPerSemester];
			final int cellOffset = district.gradesColOffset() +
					i * (semParams.cyclesPerSemester + (semParams.hasExams ? 1 : 0)
					+ (semParams.hasSemesterAverages ? 1 : 0));

			// find the cycle cells for this semester
			for (int j = 0; j < $semesterCells.length; j++)
				$semesterCells[j] = $cells.get(cellOffset + j);
			
			// exam cell is after that
			final Element $examCell = semParams.hasExams
					? $cells.get(cellOffset + semParams.cyclesPerSemester)
					: null;
			
			// and semester cell is after that
			final Element $semAvgCell = semParams.hasSemesterAverages
					? $cells.get(cellOffset + semParams.cyclesPerSemester + (semParams.hasExams ? 1 : 0))
					: null;
			
			// parse the semester
			semesters[i] = parseSemester($semesterCells, $examCell, $semAvgCell, i, semParams);
		}
		
		// create the course
		final Course course = new Course();
		course.title = $cells.get(district.titleColOffset()).text();
		course.teacherName = $teacherCell.text();
		course.teacherEmail = $teacherCell.attr("href").substring(7);
		course.courseId = courseId;
		course.semesters = semesters;
		return course;
	}
	
	Semester parseSemester(Element[] $cycles, Element $exam, Element $semAvg, int index, SemesterParams semParams) {
		// parse cycles
		final Cycle[] cycles = new Cycle[semParams.cyclesPerSemester];
		for (int i = 0; i < semParams.cyclesPerSemester; i++)
			cycles[i] = parseCycle($cycles[i], i);
		
		// parse exam grade
		GradeValue examGrade = new GradeValue();
		if (semParams.hasExams) {
			final String examText = $exam.text();
			if (examText.equals("EX") || examText.equals("Exc")) {
				examGrade.type = GradeValue.TYPE_NONE;
				examGrade.value = GradeValue.VALUE_EXEMPT;
			}
			else if (examText.matches("\\d+"))
				examGrade = GradeValue.parse($exam.text());
		} else {
			examGrade.type = GradeValue.TYPE_NONE;
			examGrade.value = GradeValue.VALUE_NOT_APPLICABLE;
		}
		
		// return a semester
		final Semester semester = new Semester();
		semester.index = index;
		semester.examGrade = examGrade;
		semester.cycles = cycles;
		
		// calculate our own semester average unless using letter grades
		if (semParams.hasSemesterAverages) {
			GradeValue parsedSemAvg = GradeValue.parse($semAvg.text());
			if (parsedSemAvg.type == GradeValue.TYPE_LETTER)
				semester.average = parsedSemAvg;
			else
				semester.average = GradeCalc.semesterAverage(semester, district.examWeight());
		} else {
			GradeValue semAvg = new GradeValue();
			semAvg.type = GradeValue.TYPE_NONE;
			semAvg.value = GradeValue.VALUE_NOT_APPLICABLE;
		}
		
		return semester;
	}
	
	Cycle parseCycle(Element $cell, int index) {
		// find a link, if any
		final Elements $link = $cell.getElementsByTag("a");
		
		// if there is no link, the cell is empty; return empty values
		if ($link.size() == 0) {
			final Cycle cycle = new Cycle();
			cycle.index = index;
			return cycle;
		}
		
		// find a grade
		final GradeValue average = GradeValue.parse($link.first().text());
		final Matcher urlHashMatcher = GRADE_CELL_URL_REGEX.matcher($link.first().attr("href"));
		final String urlHash;
		if (urlHashMatcher.find())
			urlHash = decodeURIComponent(urlHashMatcher.group(1));
		else
			urlHash = null;
		
		// return it
		final Cycle cycle = new Cycle();
		cycle.index = index;
		cycle.average = average;
		cycle.urlHash = urlHash;
		return cycle;
	}
	
	Category parseCategory(final Element $catName, final Element $cat,
			final String courseId) {
		// Try to retrieve a weight for each category. Since we have to support IB-MYP grading,
		// category weights are not guaranteed to add up to 100%. However, regardless of which
		// weighting scheme we are using, grade calculations should be able to use the weights
		// as they are parsed below.
		final Matcher catNameMatches = CATEGORY_NAME_REGEX.matcher($catName.text());
		if (!catNameMatches.find()) {
			catNameMatches.usePattern(ALT_CATEGORY_NAME_REGEX);
			if (!catNameMatches.find())
				System.err.println("Did not find category name.");
		}
		
		// Some teachers don't put their assignments out of 100 points. Check if this is the case.
		final boolean is100Pt = $cat.select("td.AssignmentPointsPossible").size() == 0;
		
		// Find all of the rows in this category.
		final Elements $rows = $cat.getElementsByTag("tr");
		
		// Find all of the assignments
		final Elements $assignments = $cat.select("tr.DataRow, tr.DataRowAlt");
		
		// Find the average cell
		final Elements $averageRow = $rows.last().getElementsByTag("td");
		Element $averageCell = null;
		for (int i = 0; i < $averageRow.size(); i++)
			if ($averageRow.get(i).text().contains("Average")) {
				$averageCell = $averageRow.get(i + 1);
				break;
			}
		
		// generate category ID
		final String catId = Hash.SHA1(courseId + '|' + catNameMatches.group(0));
		
		// parse assignments
		Assignment[] assignments = new Assignment[$assignments.size()];
		for (int i = 0; i < assignments.length; i++) {
			assignments[i] = parseAssignment($assignments.get(i), is100Pt, catId);
		}
		
		final Category cat = new Category();
		cat.id = catId;
		cat.title = catNameMatches.group(1);
		cat.weight = Integer.valueOf(catNameMatches.group(2));
		cat.average = Numeric.isNumeric($averageCell.text()) ? Double.valueOf($averageCell.text()) : null;
		cat.bonus = GradeCalc.categoryBonuses(assignments);
		cat.assignments = assignments;
		return cat;
	}
	
	Assignment parseAssignment(final Element $row, final boolean is100Pt, final String catId) {
		// get data
		final String title        = getTextByClass($row, "AssignmentName");
		final String dateDue      = getTextByClass($row, "DateDue");
		final String dateAssigned = getTextByClass($row, "DateAssigned");
		final String note         = getTextByClass($row, "AssignmentNote");
		final String ptsEarned    = getTextByClass($row, "AssignmentGrade");
		final int ptsPossNum      = is100Pt ? 100 : Integer.valueOf(
				getTextByClass($row, "AssignmentPointsPossible"));
		
		// Retrieve both the points earned and the weight of the assignment. Some teachers
		// put in assignments with weights; if so, they look like this:
		//     88x0.6
		//     90x0.2
		//     100x0.2
		// The first number is the number of points earned on the assignment; the second is
		// the weight of the assignment within the category.
		// If the weight is not specified, it is assumed to be 1.
		Double ptsEarnedNum = null;
		final double weight;
		if (ptsEarned.contains("x")) {
			String[] ptsSplit = ptsEarned.split("x");
			// some teachers like to enter 'Exc' for grades apparently, so check
			// if our split is actually parseable.
			if (Numeric.isNumeric(ptsSplit[0]) && Numeric.isNumeric(ptsSplit[1])) {
				ptsEarnedNum = Double.valueOf(ptsSplit[0]);
				weight = Double.valueOf(ptsSplit[1]);
			} else {
				weight = 1;
			}
		} else {
			ptsEarnedNum = Numeric.isNumeric(ptsEarned) ? Double.valueOf(ptsEarned) : null;
			weight = 1;
		}
		
		// turn ptsEarnedNum into grade value
		GradeValue grade = new GradeValue();
		if (ptsEarnedNum == null) {
			grade.type = GradeValue.TYPE_NONE;
			grade.value = GradeValue.VALUE_NONE;
		} else {
			grade.type = GradeValue.TYPE_DOUBLE;
			grade.value_d = ptsEarnedNum;
		}
		
		// generate the assignment ID
		final String assignmentId = Hash.SHA1(catId + '|' + title);
		
		// Guess if the assignment is extra credit or not. GradeSpeed doesn't exactly
		// just tell us if an assignment is extra credit or not, but we can guess
		// from the assignment title and the note attached.
		// If either contains something along the lines of 'extra credit', we assume
		// that it is extra credit.
		final boolean extraCredit =
				title.matches(EXTRA_CREDIT_REGEX.toString()) ||
				note.matches(EXTRA_CREDIT_NOTE_REGEX.toString());
		
		// return an assignment
		final Assignment assignment = new Assignment();
		assignment.id = assignmentId;
		assignment.title = title;
		assignment.dateDue = dateDue;
		assignment.dateAssigned = dateAssigned;
		assignment.ptsEarned = grade;
		assignment.ptsPossible = ptsPossNum;
		assignment.weight = weight;
		assignment.note = note;
		assignment.extraCredit = extraCredit;
		return assignment;
	}
	
	String findCourseNum(final Elements $cells) {
		// loop through the cells until we find one with a URL hash we can parse
		for (int i = district.gradesColOffset(); i < $cells.size(); i++) {
			Elements $links = $cells.get(i).getElementsByTag("a");
			if ($links.size() != 0) // if we found a link, parse the data hash
				return getCourseIdFromHash( // get the course number from the decoded hash
						Base64.decode(decodeURIComponent( // decode the data attribute
								$links.first().attr("href").split("data=")[1] // get the data attribute
										)));
		}
		return null;
	}
	
	String getCourseIdFromHash(String hash) {
		return hash.split("\\|")[3];
	}
	
	String decodeURIComponent(String str) {
		try {
			return URLDecoder.decode(str.replace("+", "%2B"), "UTF-8").replace("%2B", "+");
		} catch (UnsupportedEncodingException e) {
			System.err.println("URLDecoder threw UnsupportedEncodingException; ignoring.");
			e.printStackTrace();
			return str;
		}
	}
	
	String getTextByClass(Element parent, String klass) {
		return parent.getElementsByClass(klass).first().text();
	}
	
	class SemesterParams {
		public int semesters;
		public int cyclesPerSemester;
		public boolean hasExams;
		public boolean hasSemesterAverages;
	}

}
