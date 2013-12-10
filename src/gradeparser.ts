/// <reference path='data.ts'/>
/// <reference path='qmath.ts'/>
/// <reference path='query.ts'/>


// This is the GradeSpeed version. In the future, we will need to implement a
// corresponding txConnect version.
module GradeParser {
	var EXTRA_CREDIT_REGEX = /^extra credit$|^ec$/i;
	var EXTRA_CREDIT_NOTE_REGEX = /extra credit/i;
	var GRADE_CELL_URL_REGEX = /\?data=([\w\d%]*)/;

	function parseCycle(district : District, $cell : HTMLElement, idx : number) : Cycle {
		// find a link, if any
		var $link = $cell.findTag('a');

		// if there is no link, the cell is empty; return empty values
		if (!$link.length) return {index: idx, average: NaN, urlHash: undefined};

		// find a grade
		var average = parseInt($link[0].innerText);
		var urlHash = GRADE_CELL_URL_REGEX.exec($link[0].attr('href'))[1];

		// return it
		return {
			index: idx,
			average: average,
			urlHash: urlHash
		}
	}

	function parseSemester(district : District, $cells : HTMLElement[], idx : number) : Semester {
		// parse cycles
		var cycles : Cycle[] = [];
		for (var i = 0; i < district.cyclesPerSemester; i++) {
			cycles[i] = parseCycle(district, $cells[i], i);
		}

		// parse exam grade
		var $exam = $cells[district.cyclesPerSemester];
		var examGrade : number = NaN, examIsExempt : boolean = false;
		if ($exam.innerHTML === '' || $exam.innerHTML === '&nbsp;') {}
		else if ($exam.innerHTML === 'EX' || $exam.innerHTML === 'Exc')
			examIsExempt = true;
		else
			examGrade = parseInt($exam.innerHTML);

		// parse semester average
		// TODO: calculate semester average instead of parsing it? because
		// GradeSpeed sometimes messes up
		var semesterAverage = parseInt($cells[district.cyclesPerSemester + 1].innerText);

		// return a semester
		return {
			index: idx,
			average: semesterAverage,
			examGrade: examGrade,
			examIsExempt: examIsExempt,
			cycles: cycles
		}
	}

	function parseCourse(district : District, $row : HTMLElement) : Course {
		// find the cells in this row
		var $cells = $row.findTag('td');

		// find the teacher name and email
		var $teacherCell = $row.findClass('EmailLink')[0];

		// TODO: get the course ID

		// parse semesters
		var semesters : Semester[] = [];
		for (var i = 0; i < district.semesters; i++) {
			// get cells for the semester
			var $semesterCells = [];
			for (var j = 0; j < district.cyclesPerSemester + 2; j++)
				$semesterCells[j] = $cells[district.columnOffsets.grades + j];
			// parse the semester
			semesters[i] = parseSemester(district, $semesterCells, i);
		}

		return {
			title: $cells[district.columnOffsets.title].innerText,
			teacherName: $teacherCell.innerText,
			teacherEmail: $teacherCell.attr('href').substr(7),
			courseId: null, // TODO
			semesters: semesters
		}
	}

	/** Gets information for all courses */
	export function parseAverages(district : District, doc : string) : Course[] {
		// set up DOM for parsing
		var $dom = document.createElement('div');
		$dom.innerHTML = doc;

		// find the grade table
		var $gradeTable = $dom.find('.DataTable')[0];

		// find each course
		var $rows = $gradeTable.find('tr.DataRow, tr.DataRowAlt');

		// parse each course
		return $rows.map((r : HTMLElement) => parseCourse(district, r));
	}
}