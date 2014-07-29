/// <reference path='all.ts'/>
module Districts {
	/** Round Rock Independent School District */
	export var roundrock: District = {
		id: 'roundrock',
		name: 'Round Rock ISD',
		examWeight: 15,
		weightedGpaOffset: 1,
		columnOffsets: {
			title: 0,
			period: 1,
			courses: 2
		},
		api: {
			login: {
				loadUrl: 'https://accesscenter.roundrockisd.org/HomeAccess/Account/LogOn?ReturnUrl=%2fhomeaccess%2f',
				loadMethod: 'GET',
				submitUrl: 'https://accesscenter.roundrockisd.org/HomeAccess/Account/LogOn?ReturnUrl=%2fhomeaccess%2f',
				submitMethod: 'POST',
				validateLoginPage: (doc: Document) => !!doc.findTag('form').length,
				validateAfterLogin: (doc: Document) => !!doc.find('#MainContent').length,
				makeQuery: (u: string, p: string, doc: Document) => ({
					'Database': 10,
					'LogOnDetails.UserName': u,
					'LogOnDetails.Password': p
				})
			},
			selectStudent: {
				loadUrl: 'https://accesscenter.roundrockisd.org/HomeAccess/Frame/StudentPicker',
				loadMethod: 'GET',
				submitUrl: 'https://accesscenter.roundrockisd.org/HomeAccess/Frame/StudentPicker',
				submitMethod: 'POST',
				validate: (doc: Document) => !!doc.find('form#StudentPicker').length,
				pickerLoadsFromAjax: true,
				isRequired: (doc: Document) => {
					var buttons = doc.find('.sg-button').toArray();
					var len = buttons.length;
					for (var i = 0; i < len; i++)
						if (buttons[i].innerText.indexOf('Change Student') !== -1)
							return true;
					return false;
				},
				makeLoadQuery: (doc: Document) => null,
				makeSubmitQuery: (id: string, doc: Document) => ({
					'studentId': id,
					'url': '/HomeAccess/Home/WeekView'
				}),
				getChoices: ((doc: Document) =>
					doc.find('.sg-student-picker-row')
					.map((i: HTMLElement) => {
						var name = i.find('.sg-picker-student-name')[0].innerText;
						var studentId = (<HTMLInputElement> i.find('input[name=studentId]')[0]).value;
						return {
							id: CryptoJS.SHA1(name + '|' + studentId).toString(),
							name: name,
							studentId: studentId
						}
					}))
			},
			year: {
				loadUrl: 'https://accesscenter.roundrockisd.org/HomeAccess/content/student/gradespeed.aspx?target=https://gradebook.roundrockisd.org/pc/displaygrades.aspx',
				loadMethod: 'GET',
				validate: (doc: Document) => !!doc.findClass('DataTable').length,
				makeQuery: (doc: Document) => null
			},
			cycle: {
				loadUrl: 'https://gradebook.roundrockisd.org/pc/displaygrades.aspx',
				loadMethod: 'GET',
				validate: (doc: Document) => doc.findClass('DataTable').length > 1,
				requiresYearLoaded: true,
				makeQuery: (hash: string, doc: Document) => ({
					data: hash
				})
			},
			attendance: {
				loadUrl: 'https://accesscenter.roundrockisd.org/HomeAccess/Content/Attendance/MonthlyView.aspx',
				loadMethod: 'GET',
				validate: (doc: Document) => !!doc.find('table#plnMain_cldAttendance').length,
				makeQuery: (doc: Document) => null,
				getEvents: (doc: Document) => {
					var attendanceTable = doc.find('table#plnMain_cldAttendance')[0];
					var monthText = attendanceTable.find('table.sg-asp-calendar-header td')[1].innerText;
					var tableDays = attendanceTable.find('td').toArray();
					var events: AttendanceEvent[] = [];
					tableDays.forEach((cell: HTMLElement) => {
						// test if this is a calendar day
						if (!/^\d+$/.test(cell.innerText)) return;
						
						// get the date
						var date = DateTools.parseSmallEndianDate(cell.innerText + ' ' + monthText);
						
						// parse the title attribute to get blocks and reasons
						var title = cell.getAttribute('title');
						if (title === null) return;
						var splits = title.split('\n');
						var splitLen = splits.length;
						
						// push events
						for (var i = 0; i < splitLen; i += 2) {
							var currBlock = parseInt(splits[i], 10);
							events.push({
								id: CryptoJS.SHA1(date + '|' + currBlock).toString(),
								date: date,
								block: currBlock,
								explanation: splits[i+1],
								read: false
							});
						}
					});
					return events;
				}
			},
			registerUrl: "https://accesscenter.roundrockisd.org/HomeAccess/Content/Register/Default2.aspx",
			forgotPasswordUrl: "https://accesscenter.roundrockisd.org/HomeAccess/Content/Register/ForgotCredentials.aspx"
		}
	}
}