/// <reference path='data.ts'/>
/// <reference path='qmath.ts'/>
/// <reference path='query.ts'/>


// This is the GradeSpeed version. In the future, we will need to implement a
// corresponding txConnect version.
module GradeParser {
	var EXTRA_CREDIT_REGEX = /^extra credit$|^ec$/i;
	var EXTRA_CREDIT_NOTE_REGEX = /extra credit/i;
	var GRADE_CELL_URL_REGEX = /\?data=([\w\d%]*)/;

	interface SemesterParams {
		semesters: number;
		cyclesPerSemester: number;
	}

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

	function parseSemester(district : District, $cells : HTMLElement[],
			idx : number, semParams : SemesterParams) : Semester {
		// parse cycles
		var cycles : Cycle[] = [];
		for (var i = 0; i < semParams.cyclesPerSemester; i++) {
			cycles[i] = parseCycle(district, $cells[i], i);
		}

		// parse exam grade
		var $exam = $cells[semParams.cyclesPerSemester];
		var examGrade : number = NaN, examIsExempt : boolean = false;
		if ($exam.innerHTML === '' || $exam.innerHTML === '&nbsp;') {}
		else if ($exam.innerHTML === 'EX' || $exam.innerHTML === 'Exc')
			examIsExempt = true;
		else
			examGrade = parseInt($exam.innerHTML);

		// parse semester average
		// TODO: calculate semester average instead of parsing it? because
		// GradeSpeed sometimes messes up
		var semesterAverage = parseInt($cells[semParams.cyclesPerSemester + 1].innerText);

		// return a semester
		return {
			index: idx,
			average: semesterAverage,
			examGrade: examGrade,
			examIsExempt: examIsExempt,
			cycles: cycles
		}
	}

	function parseCourse(district : District, $row : HTMLElement, semParams : SemesterParams) : Course {
		// find the cells in this row
		var $cells = $row.findTag('td');

		// find the teacher name and email
		var $teacherCell = $row.findClass('EmailLink')[0];

		// TODO: get the course ID

		// parse semesters
		var semesters : Semester[] = [];
		for (var i = 0; i < semParams.semesters; i++) {
			// get cells for the semester
			var $semesterCells = [];
			var cellOffset = district.columnOffsets.grades + i * (semParams.cyclesPerSemester + 2);
			for (var j = 0; j < semParams.cyclesPerSemester + 2; j++)
				$semesterCells[j] = $cells[cellOffset + j];
			// parse the semester
			semesters[i] = parseSemester(district, $semesterCells, i, semParams);
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

		// make semester parameters
		var $headerCells = $gradeTable.find('tr.TableHeader')[0].find('th');
		var sem = parseInt($headerCells[$headerCells.length - 1].innerText.match(/\d+/)[0]);
		var cyc = parseInt($headerCells[$headerCells.length - 3].innerText.match(/\d+/)[0]) / sem;
		var semParams : SemesterParams = {semesters: sem, cyclesPerSemester: cyc};

		// find each course
		var $rows = $gradeTable.find('tr.DataRow, tr.DataRowAlt');

		// parse each course
		return $rows.map((r : HTMLElement) => parseCourse(district, r, semParams));
	}

	function parseCategory(district : District, catName : string, $cat : HTMLElement) : Category {
		return {}; // TODO
	}

	/** Gets information for a single cycle */
	export function parseClassGrades(district : District, doc : string, urlHash : string,
			semesterIndex : number, cycleIndex : number) : ClassGrades {
		// set up DOM for parsing
		var $dom = document.createElement('div');
		$dom.innerHTML = doc;

		// class name cell contains title and period
		// this array will contain something like this: ['Class Title (Period xx)', 'Class Title', 'xx']
		var classNameMatches = $dom.find('h3.ClassName')[0].innerText.match(/(.*) \(Period (\d+)\)/);

		// get category names
		var catNames = $dom.find('span.CategoryName');
		var $categories = $dom.find('.DataTable').splice(2);

		return {
			title: classNameMatches[1],
			urlHash: urlHash,
			period: parseInt(classNameMatches[2], 10),
			semesterIndex: semesterIndex,
			cycleIndex: cycleIndex,
			average: parseInt($dom.find('.CurrentAverage')[0].innerText.match(/\d+/)[0]),
			categories: [] /* TODO */
		}
	}
}