/// <reference path='data.ts'/>
/// <reference path='qmath.ts'/>
/// <reference path='query.ts'/>

module GradeParser {
	var EXTRA_CREDIT_REGEX = /^extra credit$|^ec$/i;
	var EXTRA_CREDIT_NOTE_REGEX = /extra credit/i;
	var GRADE_CELL_URL_REGEX = /\?data=([\w\d%]*)"/g;

	/** column offset for finding parts of grade tables */
	var COL_OFFSET = {
		'ROUNDROCK': {
			'TITLE': 0,
			'GRADE': 2
		},
		'AUSTIN': {
			'TITLE': 1,
			'GRADE': 3
		}
	};

	interface SixWeeks {
		grade : number;
		url : string;
	}

	/** Takes a six weeks cell and returns a grade and a URL hash. */
	function parseSixWeeksCell(cell : HTMLElement) : SixWeeks {
		// find a link, if any
		var $link = cell.findTag('a');

		// if there is no link, the cell is empty; return empty values
		if (!$link.length) return {grade: NaN, url: undefined}

		// find a grade
		var grade = parseInt($link[0].innerText);
		var url = GRADE_CELL_URL_REGEX.exec($link[0].attr('href'))[1];

		// return it
		return {grade: grade, url: url};
	}

	/** Takes a grade cell and returns a number; NaN if empty */
	function parseGradeCell(cell : HTMLElement) : number {
		var gradeText = cell.innerHTML;
		if (gradeText === '') return NaN;
		if (gradeText === "&nbsp;") return NaN;
		return parseInt(gradeText);
	}

	/** Gets all course information from a course */
	function parseCourse(row : HTMLElement, district : string) : Course {
		// find the cells in this row
		var $cells = row.findTag('td');

		// TODO: teacher and teacher email

		// find the cells with grades in nthem
		var $gradeCells = $cells.splice(COL_OFFSET[district].GRADE);
		var $sixWeekCells = [
			$gradeCells[0], $gradeCells[1], $gradeCells[2],
			$gradeCells[5], $gradeCells[6], $gradeCells[7]
		];
		var $examCells = [$gradeCells[3], $gradeCells[8]];
		var $semesterCells = [$gradeCells[4], $gradeCells[9]];

		// parse six weeeks cells
		var sixWeeks = $sixWeekCells.map(parseSixWeeksCell);

		// finally, create the object to return
		var course : Course = {
			title: $cells[COL_OFFSET[district].TITLE].innerText,
			teacher: null,
			teacherEmail: null,
			sixWeeksAverages: sixWeeks.map((x) => x.grade),
			sixWeeksUrlHashes: sixWeeks.map((x) => x.url),
			examGrades: $examCells.map(parseGradeCell),
			semesterAverages: $semesterCells.map(parseGradeCell)
		}

		return course;
	}

	/** Gets information for all courses */
	export function parseAverages(doc : string, district: string) : Course[] {
		// set up DOM for parsing
		var dom = document.createElement('div');
		dom.innerHTML = doc;

		// find the grade table
		var gradeTable = dom.find('.DataTable:first');

		// find each course
		var rows = gradeTable.find('tr.DataRow, tr.DataRowAlt');

		// parse each course
		return rows.map((r) => parseCourse(r, district));
	}
}