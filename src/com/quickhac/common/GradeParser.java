package com.quickhac.common;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.regex.Pattern;

import javax.xml.bind.DatatypeConverter;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import com.quickhac.common.data.*;
import com.quickhac.common.districts.GradeSpeedDistrict;
import com.quickhac.common.util.Hash;

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
	static final Pattern GRADE_CELL_URL_REGEX =
			Pattern.compile("\\?data=([\\w\\d%]*)");
	
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
		semParams.semesters = Integer.valueOf(
				NUMERIC_REGEX.matcher($headerCells.last().text()).group(0));
		semParams.cyclesPerSemester = Integer.valueOf(
				NUMERIC_REGEX.matcher($headerCells.get($headerCells.size() - 3).text()).group(0))
				/ semParams.semesters;
		
		// find each course
		final Elements $rows = $gradeTable.select("tr.DataRow, tr.DataRowAlt");
		
		final Course[] courses = new Course[$rows.size()];
		
		// parse each course
		for (int i = 0; i < courses.length; i++)
			courses[i] = parseCourse($rows.get(i), semParams);
		
		return courses;
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
			final Element[] $semesterCells = new Element[semParams.cyclesPerSemester + 2];
			// find the cells that are pertinent to this semester
			// $semesterCells becomes [cycle, cycle, ... , cycle, exam, semester] after filtering
			final int cellOffset = district.gradesColOffset() + i * (semParams.cyclesPerSemester + 2);
			for (int j = 0; j < $semesterCells.length; i++)
				$semesterCells[j] = $cells.get(cellOffset + j);
			// parse the semester
			semesters[i] = parseSemester($semesterCells, i, semParams);
		}
		
		// create the course
		Course course = new Course();
		course.title = $cells.get(district.titleColOffset()).text();
		course.teacherName = $teacherCell.text();
		course.teacherEmail = $teacherCell.attr("href").substring(7);
		course.courseId = courseId;
		course.semesters = semesters;
		return course;
	}
	
	Semester parseSemester(Element[] $cells, int index, SemesterParams semParams) {
		// parse cycles
		final Cycle[] cycles = new Cycle[semParams.cyclesPerSemester];
		for (int i = 0; i < semParams.cyclesPerSemester; i++)
			cycles[i] = parseCycle($cells[i], i);
		
		// parse exam grade
		final Element $exam = $cells[semParams.cyclesPerSemester];
		int examGrade = -1; boolean examIsExempt = false;
		if ($exam.text().equals("") || $exam.text().equals("&nbsp;")) {}
		else if ($exam.text().equals("EX") || $exam.text().equals("Exc"))
			examIsExempt = true;
		else
			examGrade = Integer.valueOf($exam.text());
		
		// parse semester average
		// TODO: calculate semester average instead of parsing it? because
		// GradeSpeed sometimes messes up
		final int semesterAverage = Integer.valueOf(
				$cells[semParams.cyclesPerSemester + 1].text());
		
		// return a semester
		final Semester semester = new Semester();
		semester.index = index;
		semester.average = semesterAverage;
		semester.examGrade = examGrade;
		semester.examIsExempt = examIsExempt;
		semester.cycles = cycles;
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
		final int average = Integer.valueOf($link.first().text());
		String urlHash = decodeURIComponent(
				GRADE_CELL_URL_REGEX.matcher($link.first().attr("href")).group(0));
		
		// return it
		final Cycle cycle = new Cycle();
		cycle.index = index;
		cycle.average = average;
		cycle.urlHash = urlHash;
		return cycle;
	}
	
	String findCourseNum(final Elements $cells) {
		// loop through the cells until we find one with a URL hash we can parse
		for (int i = district.gradesColOffset(); i < $cells.size(); i++) {
			Elements $links = $cells.get(i).getElementsByTag("a");
			if ($links.size() != 0) // if we found a link, parse the data hash
				return getCourseIdFromHash( // get the course number from the decoded hash
						new String(DatatypeConverter.parseBase64Binary( // decode the data attribute
								$links.first().attr("href").split("data=")[1] // get the data attribute
										)));
		}
		// TODO
		return null;
	}
	
	String getCourseIdFromHash(String hash) {
		return hash.split("|")[3];
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
	
	class SemesterParams {
		public int semesters;
		public int cyclesPerSemester;
	}

}
