module Districts {

	/** Round Rock Independent School District */
	export var roundrock: District = {
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
					.map((i: HTMLElement) => ({
						name: i.find('.sg-picker-student-name')[0].innerText,
						id: (<HTMLInputElement> i.find('input[name=studentId]')[0]).value
					})))
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
                        if (!/^d+$/.test(cell.innerText)) return;
                        
                        // get the date
                        var date = DateTools.parseSmallEndianDate(cell.innerText);
                        
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
                    return [];
                }
            }
		}
	}

	/** Austin Independent School District */
	export var austin : District = {
		name: 'Austin ISD',
		driver: 'gradespeed',
		examWeight: 25,
		weightedGpaOffset: 0,
		columnOffsets: {
			title: 1,
            period: 2,
			courses: 3
		},
		api: {
			login: {
				loadUrl: '',
				loadMethod: '',
                submitUrl: 'https://gradespeed.austinisd.org/pc/default.aspx?DistrictID=227901',
                submitMethod: 'POST',
                validateLoginPage: (doc: Document) => !!doc.findTag('form').length,
                validateAfterLogin: (doc: Document) => !!doc.find('input[name=__VIEWSTATE]').length,
				makeQuery: (u : string, p: string, doc: Document) => {
                    var state = DOMTools.parseInputs(doc);
                    return {
    					"__EVENTTARGET": null,
    					"__EVENTARGUMENT": null,
    					"__LASTFOCUS": null,
    					"__VIEWSTATE": state['__VIEWSTATE'],
    					"__scrollLeft": 0,
    					"__scrollTop": 0,
    					"ddlDistricts": null,
    					"txtUserName": u,
    					"txtPassword": p,
    					"ddlLanguage": "en",
    					"btnLogOn": "Log On"
    				}
                }
			},
			selectStudent: {
                loadUrl: '', // unused
                loadMethod: '', // unused
				submitUrl: 'https://gradespeed.austinisd.org/pc/ParentMain.aspx',
				submitMethod: 'POST',
                validate: (doc: Document) => true, // unused
				pickerLoadsFromAjax: false,
				isRequired: (doc: Document) => !!doc.find('#_ctl0_ddlStudents').length,
                makeLoadQuery: (doc: Document) => null, // unused
				makeSubmitQuery: (id: string, doc: Document) => {
                    var state = DOMTools.parseInputs(doc);
                    return {
    					'__EVENTTARGET': '_ctl0$ddlStudents',
    					'__EVENTARGUMENT': null,
    					'__LASTFOCUS': null,
    					'__VIEWSTATE': state['__VIEWSTATE'],
    					'__scrollLeft': 0,
    					'__scrollTop': 0,
    					'__EVENTVALIDATION': state['__EVENTVALIDATION'],
    					'__RUNEVENTTARGET': null,
    					'__RUNEVENTARGUMENT': null,
    					'__RUNEVENTARGUMENT2': null,
    					'_ctl0:ddlStudents': id
    				}
                },
				getChoices: (doc: Document) => (
					doc.find('#_ctl0_ddlStudents option').map((o : HTMLElement) => ({
						name: o.innerText,
						id: o.attr('value')
					})))
			},
			year: {
				loadUrl: 'https://gradespeed.austinisd.org/pc/ParentStudentGrades.aspx',
				loadMethod: 'GET',
                validate: (doc: Document) => !!doc.findClass('DataTable').length,
                makeQuery: (doc: Document) => ({})
			},
			cycle: {
				loadUrl: 'https://gradespeed.austinisd.org/pc/ParentStudentGrades.aspx',
				loadMethod: 'GET',
                validate: (doc: Document) => doc.findClass('DataTable').length > 1,
                requiresYearLoaded: false,
				makeQuery: (hash: string, doc: Document) => ({
					data: hash
				})
			},
			attendance: {
                loadUrl: 'https://gradespeed.austinisd.org/pc/ParentStudentAttend.aspx',
                loadMethod: 'GET',
                validate: (doc: Document) => !!doc.findClass('DataTable').length,
                makeQuery: (doc: Document) => ({}),
                getEvents: (doc: Document) => {
                    // read table
                    var table = doc.findClass('DataTable')[0];
                    var rows = table.find('.DataRow, .DataRowAlt');
                    var rowsLen = rows.length;
                    var events: AttendanceEvent[] = [];
                    
                    // iterate through rows, parsing date, block, and reason on each
                    var currDate: number, currBlock: number;
                    for (var i = 0; i < rowsLen; i++) {
                        var cells = rows[i].find('td');
                        if (cells[0].innerText !== '')
                            currDate = DateTools.parseMDYDate(cells[0].innerText.split(' ')[0]);
                        var currBlock = parseInt(cells[1].innerText, 10);
                        events.push({
                            id: CryptoJS.SHA1(currDate + '|' + currBlock).toString(),
                            date: currDate,
                            block: currBlock,
                            explanation: cells[2].innerText,
                            read: false
                        });
                    }
                    
                    return events;
                }
            }
		}
	}
	
}