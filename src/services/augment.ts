class Augment {
	constructor() {}
	
	diffYear(oldCourses: Course[], newCourses: Course[]): GradeChange[] {
		var diffs: GradeChange[] = [], matchingCourse, matchIndex,
			oldCourseIds = oldCourses.map(c => c.id),
			timestamp = +new Date();
		
		// iterate over new course list for changes, not old course list.
		// the two are not always guaranteed to be the same length and have the
		// same courses in the same order, for example if a course was added or
		// removed by the school/district since the last update
		newCourses.forEach((newCourse: Course) => {
			
			// find a matching course in the old course list
			matchIndex = oldCourseIds.indexOf(newCourse.id);
			
			if (matchIndex === -1) {
				// if we couldn't find a match, mark any new cycles as new.
				newCourse.semesters.map(s => s.cycles).flatten()
					.forEach((cyc: Cycle) => {
						if (cyc.urlHash)
							diffs.push({
								id: cyc.urlHash,
								timestamp: timestamp,
								type: GradeChangeType.NEW,
								newGrade: cyc.average.toString(),
								read: false
							});
					});
			} else {
				// if we found match, compare cycles
				matchingCourse = oldCourses[matchIndex];
				matchingCourse.semesters.peach(newCourse.semesters, (newSem: Semester, oldSem: Semester) => {
					oldSem.cycles.peach(newSem.cycles, (oldCyc: Cycle, newCyc: Cycle) => {
						
						if (!newCyc.urlHash || oldCyc.average === newCyc.average)
							return;
						
						var diff: GradeChange = {
							id: newCyc.urlHash,
							timestamp: timestamp,
							type: null,
							newGrade: newCyc.average.toString(),
							read: false
						};
						
						if (oldCyc.average > newCyc.average) {
							diff.type = GradeChangeType.DOWN;
							diffs.push(diff);
						} else if (oldCyc.average < newCyc.average) {
							diff.type = GradeChangeType.UP;
							diffs.push(diff);
						} else { Log.w('unreachable branch reached'); }
						
					});
				});
			}
		});
		
		return diffs;
	}
	
	diffCycle(oldCycle: Cycle, newCycle: Cycle): GradeChange[] {
		var diffs: GradeChange[] = [], matchingCategory, matchIndex,
			oldCategoryIds = oldCycle.categories.map(c => c.id),
			timestamp = +new Date();
		
		// same; iterate over new categories and assignments
		newCycle.categories.forEach((cat: Category) => {
			matchIndex = oldCategoryIds.indexOf(cat.id);
			
			if (matchIndex === -1)
				// if matching category was not found, add all new assignments
				cat.assignments.forEach((ass: Assignment) => {
					if (ass.ptsEarned !== NaN)
						diffs.push({
							id: ass.id,
							timestamp: timestamp,
							type: GradeChangeType.NEW,
							newGrade: ass.ptsEarned +
								(ass.ptsPossible === 100 ? '' : '/' + ass.ptsPossible),
							read: false
						});
				});
			else {
				// if matching category was found, compare assignments
				matchingCategory = oldCycle.categories[matchIndex];
				var oldAssignmentIds = matchingCategory.assignments.map(a => a.id);
				
				matchingCategory.assignments.peach(cat.assignments, (oldAss: Assignment, newAss: Assignment) => {
					if (newAss.ptsEarned === NaN || oldAss.ptsEarned === newAss.ptsEarned)
						return;
					
					var diff: GradeChange = {
						id: newAss.id,
						timestamp: timestamp,
						type: null,
						newGrade: newAss.ptsEarned +
							(newAss.ptsPossible === 100 ? '' : '/' + newAss.ptsPossible),
						read: false
					};
					if (oldAss.ptsEarned > newAss.ptsEarned) {
						diff.type = GradeChangeType.DOWN;
						diffs.push(diff);
					} else if (oldAss.ptsEarned < newAss.ptsEarned) {
						diff.type = GradeChangeType.UP;
						diffs.push(diff);
					} else { Log.w('unreachable branch reached'); }
				});
			}
		});
		
		return diffs;
	}
	
	augmentYear(oldYear: Course[], newYear: Course[]): Course[] {
		// make searching for cycles O(1)
		var oldCycles = {};
		oldYear.forEach(course => {
			course.semesters.forEach(semester => {
				semester.cycles.forEach(cycle => {
					oldCycles[cycle.urlHash] = cycle;
				});
			});
		});
		
		// deep copy courses with augmented cycles
		return newYear.map((course: Course) => ({
			id: course.id,
			title: course.title,
			teacherName: course.teacherName,
			teacherEmail: course.teacherEmail,
			period: course.period,
			semesters: course.semesters.map((semester: Semester) => ({
				average: semester.average,
				examGrade: semester.examGrade,
				examIsExempt: semester.examIsExempt,
				cycles: semester.cycles.map((cycle: Cycle) => {
					var oldCycle = oldCycles[cycle.urlHash];
					if (typeof oldCycle === 'undefined' || oldCycle === null)
						return cycle;
					else return this.augmentCycle(cycle, oldCycle);
				})
			}))
		}));
	}
	
	/**
	 * Augments a (newer) base cycle with the specific information from an (older)
	 * specific cycle.
	 * 
	 * For a newer specific cycle and an older base cycle, just override all of
	 * the base cycle properties with the specific cycle properties.
	 */
	augmentCycle(base: Cycle, specific: Cycle): Cycle {
		if (base.urlHash !== specific.urlHash)
			throw 'urlHashes do not match';
		
		return {
			urlHash: base.urlHash,
			lastUpdated: specific.lastUpdated,
			changedGrades: specific.changedGrades,
			usesLetterGrades: specific.usesLetterGrades,
			average: base.average,
			title: specific.title,
			categories: specific.categories
		};
	}
	
	/**
	 * Augments two grade change diffs. Trivial.
	 */
	// augmentDiff(oldChanges: GradeChange[], newChanges: GradeChange[]): GradeChange[] {
	//     return oldChanges.concat(newChanges);
	// }
	
	augmentAttendanceEvents(oldEvents: AttendanceEvent[], newEvents: AttendanceEvent[]): AttendanceEvent[] {
		// assumptions we can make:
		// - oldEvents and newEvents are in the same order
		// - only one event can occur in any particular block on any particular day
		//     - if for a particular black, the events don't match between oldEvents
		//       and newEvents, the event in newEvents prevails
		// - once an event has occurred in a particular block, an event on that
		//   block must always occur
		// assumptions we cannot make:
		// - oldEvents is a subset or superset of newEvents
		var augmentedEvents: AttendanceEvent[] = [];
		
		// iterate in order until there are no new events
		var oldIndex = 0, newIndex = 0,
			oldLen = oldEvents.length, newLen = newEvents.length,
			currEvent: AttendanceEvent,
			eventFromOld: AttendanceEvent, eventFromNew: AttendanceEvent;
		while (oldIndex < oldLen && newIndex < newLen) {
			eventFromOld = oldEvents[oldIndex];
			eventFromNew = newEvents[newIndex];
			
			if (eventFromOld.date > eventFromNew.date) {
				augmentedEvents.push(eventFromNew);
				newIndex++;
			} else if (eventFromOld.date < eventFromNew.date) {
				// this event has been deleted, apparently
				Log.w('unreachable branch reached');
				oldIndex++;
			} else if (eventFromOld.block > eventFromNew.block) {
				augmentedEvents.push(eventFromNew);
				newIndex++;
			} else if (eventFromOld.block < eventFromNew.block) {
				// this event has also evidently been deleted
				Log.w('unreachable branch reached');
				oldIndex++;
			} else {
				augmentedEvents.push({
					id: eventFromNew.id,
					date: eventFromNew.date,
					block: eventFromNew.block,
					explanation: eventFromNew.explanation,
					read: eventFromOld.read
				});
			}
		}
		
		return augmentedEvents;
	}
}