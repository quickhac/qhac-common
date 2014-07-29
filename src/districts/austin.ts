/// <reference path='all.ts'/>
module Districts {
	/** Austin Independent School District */
	export var austin: District = {
		id: 'austin',
		name: 'Austin ISD',
		examWeight: 25,
		weightedGpaOffset: 0,
		columnOffsets: {
			title: 1,
			period: 2,
			courses: 3
		},
		api: {
			login: {
				loadUrl: 'https://gradespeed.austinisd.org/pc/default.aspx?DistrictID=227901',
				loadMethod: 'GET',
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
					doc.find('#_ctl0_ddlStudents option').map((o : HTMLElement) => {
						var name = o.innerText;
						var studentId = o.attr('value');
						return {
							id: CryptoJS.SHA1(name + '|' + studentId).toString(),
							name: name,
							studentId: studentId
						}
					}))
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
			},
			registerUrl: "https://gradespeed.austinisd.org/pc/ParentSignup.aspx?DistrictID=227901",
			forgotPasswordUrl: "https://gradespeed.austinisd.org/pc/ForgotPW.aspx?DistrictID=227901"
		}
	}
}