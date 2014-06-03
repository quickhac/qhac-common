interface SemesterParams {
	semesters: number;
	cyclesPerSemester: number;
	hasExams: boolean;
	hasSemesterAverages: boolean;
}

class Parser {
	EXTRA_CREDIT_REGEX = /^extra credit$|^ec$/i;
	EXTRA_CREDIT_NOTE_REGEX = /extra credit/i;
	GRADE_CELL_URL_REGEX = /\?data=([\w\d%]*)/;
	
	district: District;
	calculator: Calculator;
	
	constructor(district: District, calculator: Calculator) {
		this.district = district;
		this.calculator = calculator;
	}
	
	setDistrict(district: District) {
		this.district = district;
	}
	
	setCalculator(calculator: Calculator) {
		this.calculator = calculator;
	}

	getCourseIdFromHash(hash: string): string {
		return hash.split('|')[3];
	}

	findCourseNum($cells: NodeList): string {
		// Loop through the cells until we find one with a URL hash we can parse
		for (var i = this.district.columnOffsets.courses; i < $cells.length; i++) {
			var $links = $cells[i].findTag('a');
			if ($links.length !== 0) { // if we found a link, parse the data hash
				return this.getCourseIdFromHash( // get the course number from the decoded hash
					atob(decodeURIComponent( // decode the data attribute
						$links[0].attr('href').split('data=')[1] // retrieve the data attribute
					))
				);
			}
		}

		// There is no course ID. Return nothing.
		return null;
	}
	
	parseSemesterParams($headerCells: NodeList): SemesterParams {
		var semParams: SemesterParams = {
			semesters: 1,
			cyclesPerSemester: 0,
			hasExams: false,
			hasSemesterAverages: false
		};
		
		$headerCells.toArray().forEach(($cell: Node) => {
			var text = $cell.innerText, matches = [];
			
			if (matches = text.match(/cycle (\d+)/i)) {
				// Cycle #
				semParams.cyclesPerSemester = parseInt(matches[1]);
			} else if (matches = text.match(/exam (\d+)/i)) {
				// Exam #
				semParams.hasExams = true;
			} else if (matches = text.match(/semester (\d+)/i)) {
				// Semester #
				semParams.hasSemesterAverages = true;
				semParams.semesters = parseInt(matches[1]);
			}
		});
		
		return semParams;
	}
	
	/** Returns `true` if the grades table uses letter grades. */
	checkForLetterGrades($rows: Node[]): boolean {
		var $row: Node[], rowsLen = $rows.length, $cell: Node, cellsLen: number;
		for (var i = 0; i < rowsLen; i++) {
			$row = $rows[i].find('td').toArray();
			cellsLen = $row.length;
			for (var j = this.district.columnOffsets.courses; j < cellsLen; j++) {
				$cell = $row[j];
				if ($cell.innerText.match(/[ABCDF]/))
					return true;
				else if ($cell.innerText.match(/\d/))
					return false;
			}
		}
		
		return false;
	}

	/** Gets information for all courses */
	parseYear(doc: Document): Grades {
		var _this = this;
		// find the grade table
		var $gradeTable = doc.find('.DataTable')[0];

		// make semester parameters
		var $headerCells = $gradeTable.find('tr.TableHeader')[0].find('th');
		var semParams = this.parseSemesterParams($headerCells);

		// find each course
		var $rows = $gradeTable.find('tr.DataRow, tr.DataRowAlt')
			// filter out cumulative GPA row if any
			.toArray().filter((r: Node) =>
				!!r.find('td').item(0).innerText.match(/cumulative gpa/i));

		// parse each course
		return {
			lastUpdated: +new Date(),
			changedGrades: null,
			usesLetterGrades: this.checkForLetterGrades($rows),
			hasExams: semParams.hasExams,
			hasSemesterAverages: semParams.hasSemesterAverages,
			courses: $rows.map((r : Node) => parseCourse(r))
		};
		
		function parseCourse($row: Node): Course {
			// find the cells in this row
			var $cells = $row.findTag('td');
	
			// find the teacher name and email
			var $teacherCell = $row.findClass('EmailLink')[0];
	
			// get the course number
			var courseNum = _this.findCourseNum($cells);
			var courseId = courseNum === null ? null : CryptoJS.SHA1(courseNum).toString();
			
			// get the period
			var period = parseInt($cells[_this.district.columnOffsets.period].innerText, 10);
	
			// parse semesters
			var semesters: Semester[] = [],
				cyclesStartOffset = _this.district.columnOffsets.courses,
				perSemesterOffset = semParams.cyclesPerSemester +
					(semParams.hasExams ? 1 : 0) +
					(semParams.hasSemesterAverages ? 1 : 0);
			for (var i = 0; i < semParams.semesters; i++) {
				// get cells for the semester
				var $cycles = [], $exam: Node, $semester: Node;
				
				// find the cycles in the semester
				var cyclesOffset = cyclesStartOffset + i * perSemesterOffset;
				for (var j = 0; j < semParams.cyclesPerSemester; j++)
					$cycles[j] = $cells[cyclesOffset + j];
				
				var cyclesEndOffset = cyclesOffset + semParams.cyclesPerSemester;
				// find the exam and semester average cells, if any
				if (semParams.hasExams) {
					$exam = $cells[cyclesEndOffset + 1];
					if (semParams.hasSemesterAverages)
						$semester = $cells[cyclesEndOffset + 2];
				} else if (semParams.hasSemesterAverages)
					$semester = $cells[cyclesEndOffset + 1];
				
				// parse the semester
				semesters[i] = parseSemester($cycles, $exam, $semester);
			}
	
			return {
				id: courseId,
				title: $cells[_this.district.columnOffsets.title].innerText,
				teacherName: $teacherCell.innerText,
				teacherEmail: $teacherCell.attr('href').substr(7),
				period: period,
				semesters: semesters
			}
			
			function parseSemester($cycles: Node[], $exam: Node, $semester: Node): Semester {
				// parse cycles
				var cycles: Cycle[] = [];
				for (var i = 0; i < semParams.cyclesPerSemester; i++) {
					cycles[i] = parseCycleInYear($cycles[i]);
				}
		
				// parse exam grade
				var examGrade = NaN, examIsExempt = false;
				if ($exam.innerText === '' || $exam.innerText === '&nbsp;') {}
				else if ($exam.innerText === 'EX' || $exam.innerText === 'Exc')
					examIsExempt = true;
				else
					examGrade = parseInt($exam.innerText);
		
				// parse semester average
				// TODO: calculate semester average instead of parsing it? because
				// GradeSpeed sometimes messes up
				var semesterAverage = parseInt($semester.innerText);
		
				// return a semester
				return {
					average: semesterAverage,
					examGrade: examGrade,
					examIsExempt: examIsExempt,
					cycles: cycles
				}
				
				function parseCycleInYear($cell: Node): Cycle {
					// find a link, if any
					var $link = $cell.findTag('a');
			
					// if there is no link, the cell is empty; return empty values
					if (!$link.length) return {
						id: null,
						urlHash: null,
						lastUpdated: null,
						changedGrades: null,
						usesLetterGrades: null,
						average: NaN,
						title: null,
						categories: null
					};
			
					// find a grade
					var average = GradeValue.parseInt($link[0].innerText);
					var urlHash = decodeURIComponent(_this.GRADE_CELL_URL_REGEX.exec($link[0].attr('href'))[1]);
			
					// return it
					return {
						urlHash: urlHash,
						lastUpdated: null,
						changedGrades: null,
						usesLetterGrades: null,
						average: average,
						title: null,
						categories: null
					}
				}
			}
		}
	}

	/** Gets the name of the current student. */
	getStudentName(district: District, doc: Document) : string {
		return doc.findClass('StudentName')[0].innerText;
	}

	parseAssignment($row: Node, is100Pt: boolean, catId: string): Assignment {
		// retrieve an element from the row and get its inner text
		var getText = (cl: string): string => $row.find('.' + cl)[0].innerText;

		// get data
		var title: string,
			dateDue: number,
			dateAssigned: number,
			note: string,
			ptsEarned: string,
			ptsEarnedNum: number,
			ptsPossNum: number,
			weight: number;
		title = getText('AssignmentName');
		dateDue = DateTools.parseGradeSpeedDate(getText('DateDue'));
		dateAssigned = DateTools.parseGradeSpeedDate(getText('DateAssigned'));
		note = getText('AssignmentNote');
		ptsEarned = getText('AssignmentGrade');
		ptsPossNum = is100Pt ? 100 : parseInt(getText('AssignmentPointsPossible'));

		// Retrieve both the points earned and the weight of the assignment. Some teachers
		// put in assignments with weights; if so, they look like this:
		//     88x0.6
		//     90x0.2
		//     100x0.2
		// The first number is the number of points earned on the assignment; the second is
		// the weight of the assignment within the category.
		// If the weight is not specified, it is assumed to be 1.
		// Also, sometimes assignments are marked as "Exc" for excused.
		if (ptsEarned === 'Exc') {
			ptsEarnedNum = NaN;
			weight = 1;
		} else if (ptsEarned.indexOf('x') === -1) {
			ptsEarnedNum = GradeValue.parseFloat(ptsEarned);
			weight = 1;
		} else {
			var ptsSplit = ptsEarned.split('x');
			if (actuallyIsNaN(ptsSplit[0]) && actuallyIsNaN(ptsSplit[1])) {
				ptsEarnedNum = NaN;
				weight = 1;
			} else {
				// Don't use GradeValue's parseFloat here since we probably won't
				// be working with weighted letter grade values.
				ptsEarnedNum = parseFloat(ptsSplit[0]);
				weight = parseFloat(ptsSplit[1]);
			}
		}

		// generate the assignment ID
		var assignmentId = CryptoJS.SHA1(catId + '|' + title).toString();

		// Guess if the assignment is extra credit or not. GradeSpeed doesn't exactly
		// just tell us if an assignment is extra credit or not, but we can guess
		// from the assignment title and the note attached.
		// If either contains something along the lines of 'extra credit', we assume
		// that it is extra credit.
		var extraCredit =
			this.EXTRA_CREDIT_REGEX.test(title) ||
			this.EXTRA_CREDIT_NOTE_REGEX.test(note);

		return {
			id: assignmentId,
			title: title,
			dateDue: dateDue,
			dateAssigned: dateAssigned,
			ptsEarned: ptsEarnedNum,
			ptsPossible: ptsPossNum,
			weight: weight,
			note: note,
			extraCredit: extraCredit
		};
	}

	/** Adds up all of the bonus points in the list of assignments given.
	  * TODO: put this in GradeEditor
	  */
	totalBonuses(assignments: Assignment[]): number {
		return assignments.map((a) => a.extraCredit ? a.ptsEarned : 0).sum();
	}

	parseCategory(catName: Node, $cat: Node, urlHash: string): Category {
		// Try to retrieve a weight for each category. Since we have to support IB-MYP grading,
		// category weights are not guaranteed to add up to 100%. However, regardless of which
		// weighting scheme we are using, grade calculations should be able to use the weights
		// as they are parsed below.
		var catNameMatches = catName.innerText.match(/^(.*) - (\d+)%$/);
		if (catNameMatches === null) {
			catNameMatches = catName.innerText.match(/^(.*) - Each assignment counts (\d+)/);
		}

		// Some teachers don't put their assignments out of 100 points. Check if this is the case.
		var is100Pt = !$cat.find('td.AssignmentPointsPossible').length;

		// Find all of the rows in this category.
		var $rows = $cat.findTag('tr');

		// Find all of the assignments.
		var $assignments = $cat.find('tr.DataRow, tr.DataRowAlt');

		// Find the average cell.
		var $averageRow = $rows[$rows.length - 1].findTag('td');
		var $averageCell;
		// The average cell is the cell immediately after the cell that contains the word "Average".
		for (var i = 0; i < $averageRow.length; i++) {
			if ($averageRow[i].innerText.indexOf('Average') !== -1) {
				$averageCell = $averageRow[i + 1];
				break;
			}
		}

		// generate category ID
		var catId = CryptoJS.SHA1(urlHash + '|' + catNameMatches[1]).toString(); // "#{courseId}|#{categoryTitle}"

		// parse assignments
		var assignments = $assignments.map((a) => this.parseAssignment(a, is100Pt, catId));

		return {
			id: catId, 
			title: catNameMatches[1],
			weight: parseInt(catNameMatches[2]),
			average: parseFloat($averageCell.innerText),
			bonus: this.calculator.categoryBonuses(assignments),
			assignments: assignments
		};
	}

	/** Gets information for a single cycle */
	parseCycle(doc: Document, urlHash: string): Cycle {
		// class name cell contains title and period
		// this array will contain something like this: ['Class Title (Period xx)', 'Class Title', 'xx']
		var classNameMatches = doc.find('h3.ClassName')[0].innerText.match(/(.*) \(Period (\d+)\)/);

		// get category names
		var catNames = doc.find('span.CategoryName');
		var $categories = doc.find('.DataTable').splice(1);
		
		// try to find a letter grade
		function checkForLetterGrades($nodes: Node[]) {
			var text: string, len = $nodes.length;
			for (var i = 0; i < len; i++) {
				text = $nodes[i].innerText;
				if (text.match(/[ABCDF]/i))
					return true;
				else if (text.match(/\d+/))
					return false;
			}
			return false;
		}

		return {
			lastUpdated: null,
			changedGrades: null,
			title: classNameMatches[1],
			urlHash: urlHash,
			usesLetterGrades: checkForLetterGrades(doc.find('.AssignmentGrade').toArray()),
			period: parseInt(classNameMatches[2], 10),
			average: parseInt(doc.find('.CurrentAverage')[0].innerText.match(/\d+/)[0]),
			categories: $categories.pmap(catNames.toArray(), (c, n) => this.parseCategory(n, c, urlHash))
		}
	}

	// only call this function on the grades page
	parseStudentInfo(doc: Document): Student {
		Log.err('unimplemented');
		return {
			id: null,
			name: null,
			school: null,
			studentId: null,
			gpaData: null,
			grades: null,
			attendance: null,
			preferences: null
		};
	}
}