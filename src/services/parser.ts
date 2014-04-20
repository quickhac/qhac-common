interface SemesterParams {
	semesters: number;
	cyclesPerSemester: number;
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

	/** Gets information for all courses */
	parseYear(doc: Document): Course[] {
		var _this = this;
		// find the grade table
		var $gradeTable = doc.find('.DataTable')[0];

		// make semester parameters
		// TODO: support elementary school
		var $headerCells = $gradeTable.find('tr.TableHeader')[0].find('th');
		var sem = parseInt($headerCells[$headerCells.length - 1].innerText.match(/\d+/)[0]);
		var cyc = parseInt($headerCells[$headerCells.length - 3].innerText.match(/\d+/)[0]) / sem;
		var semParams: SemesterParams = {semesters: sem, cyclesPerSemester: cyc};

		// find each course
		var $rows = $gradeTable.find('tr.DataRow, tr.DataRowAlt');

		// parse each course
		return $rows.map((r : Node) => parseCourse(r));
		
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
			var semesters: Semester[] = [];
			for (var i = 0; i < semParams.semesters; i++) {
				// get cells for the semester
				var $semesterCells = [];
				// find the cells that are pertinent to this semester
				// $semesterCells becomes [cycle, cycle, ... , cycle, exam, semester] after filtering
				var cellOffset = _this.district.columnOffsets.courses + i * (semParams.cyclesPerSemester + 2);
				for (var j = 0; j < semParams.cyclesPerSemester + 2; j++)
					$semesterCells[j] = $cells[cellOffset + j];
				// parse the semester
				semesters[i] = parseSemester($semesterCells);
			}
	
			return {
				id: courseId,
				title: $cells[_this.district.columnOffsets.title].innerText,
				teacherName: $teacherCell.innerText,
				teacherEmail: $teacherCell.attr('href').substr(7),
				period: period,
				semesters: semesters
			}
			
			function parseSemester($cells: Node[]): Semester {
				// parse cycles
				var cycles: Cycle[] = [];
				for (var i = 0; i < semParams.cyclesPerSemester; i++) {
					cycles[i] = parseCycleInYear($cells[i]);
				}
		
				// parse exam grade
				var $exam = $cells[semParams.cyclesPerSemester];
				var examGrade = NaN, examIsExempt = false;
				if ($exam.innerText === '' || $exam.innerText === '&nbsp;') {}
				else if ($exam.innerText === 'EX' || $exam.innerText === 'Exc')
					examIsExempt = true;
				else
					examGrade = parseInt($exam.innerText);
		
				// parse semester average
				// TODO: calculate semester average instead of parsing it? because
				// GradeSpeed sometimes messes up
				var semesterAverage = parseInt($cells[semParams.cyclesPerSemester + 1].innerText);
		
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
						average: NaN,
						title: null,
						categories: null
					};
			
					// find a grade
					var average = parseInt($link[0].innerText);
					var urlHash = decodeURIComponent(_this.GRADE_CELL_URL_REGEX.exec($link[0].attr('href'))[1]);
			
					// return it
					return {
						urlHash: urlHash,
						lastUpdated: null,
						changedGrades: null,
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
		if (ptsEarned.indexOf('x') === -1) {
			ptsEarnedNum = parseFloat(ptsEarned);
			weight = 1;
		} else {
			var ptsSplit = ptsEarned.split('x');
			if (actuallyIsNaN(ptsSplit[0]) && actuallyIsNaN(ptsSplit[1])) {
				ptsEarnedNum = NaN;
				weight = 1;
			} else {
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

		return {
			lastUpdated: null,
			changedGrades: null,
			title: classNameMatches[1],
			urlHash: urlHash,
			period: parseInt(classNameMatches[2], 10),
			average: parseInt(doc.find('.CurrentAverage')[0].innerText.match(/\d+/)[0]),
			categories: $categories.pmap(catNames.toArray(), (c, n) => this.parseCategory(n, c, urlHash))
		}
	}

	// only call this function on the grades page
	parseStudentInfo(doc: Document, id: string): Student {
		Log.err('unimplemented');
		return {
			id: null,
			name: null,
			school: null,
			studentId: null,
			gpaData: null,
			grades: null,
			attendance: null
		};
	}
}