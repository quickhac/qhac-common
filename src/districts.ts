/// <reference path='data.ts'/>
/// <reference path='query.ts'/>

module Districts {

	/** Round Rock Independent School District */
	export var roundrock : District = {
		name: 'Round Rock ISD',
		driver: 'gradespeed',
		examWeight: 15,
		gpaOffset: 1,
		columnOffsets: {
			title: 0,
			grades: 2
		},
		classGradesRequiresAverageLoaded: true,
		api: {
			login: {
				url: 'https://accesscenter.roundrockisd.org/HomeAccess/Account/LogOn?ReturnUrl=%2fhomeaccess%2f',
				method: 'GET',
				makeQuery: (u : string, p : string, state : ASPNETPageState) => ({
					'Database': 10,
					'LogOnDetails.UserName': u,
					'LogOnDetails.Password': p
				})
			},
			disambiguate: {
				url: 'https://accesscenter.roundrockisd.org/HomeAccess/Frame/StudentPicker',
				method: 'POST',
				pickerLoadsFromAjax: true,
				isRequired: (dom : HTMLElement) => {
					var buttons : Node[] = dom.find('.sg-button').toArray();
					var len : number = buttons.length;
					for (var i = 0; i < len; i++)
						if (buttons[i].innerText.indexOf('Change Student') !== -1)
							return true;
					return false;
				},
				makeQuery: (id : string, state : ASPNETPageState) => ({
					'studentId': 113779,
					'url': '/HomeAccess/Home/WeekView'
				}),
				getDisambiguationChoices: ((dom : HTMLElement) =>
					dom.find('.sg-student-picker-row')
					.map((i : HTMLElement) => ({
						name: i.find('.sg-picker-student-name')[0].innerText,
						id: (<HTMLInputElement> i.find('input[name=studentId]')[0]).value
					})))
			},
			grades: {
				url: 'https://accesscenter.roundrockisd.org/HomeAccess/content/student/gradespeed.aspx?target=https://gradebook.roundrockisd.org/pc/displaygrades.aspx',
				method: 'GET'
			},
			classGrades: {
				url: 'https://gradebook.roundrockisd.org/pc/displaygrades.aspx',
				method: 'GET',
				makeQuery: (hash : string, state : ASPNETPageState) => ({
					data : hash
				})
			},
			parseStudentInfo: ($dom : HTMLElement, id : string) => {
				return {
					name: $dom.findClass('StudentName')[0].innerText,
					school: $dom.find('.StudentHeader')[0].innerText.match(/\((.*)\)/)[1],
					id: id
				};
			}
		}
	}

	/** Austin Independent School District */
	export var austin : District = {
		name: 'Austin ISD',
		driver: 'gradespeed',
		examWeight: 25,
		gpaOffset: 0,
		columnOffsets: {
			title: 1,
			grades: 3
		},
		classGradesRequiresAverageLoaded: false,
		api: {
			login: {
				url: 'https://gradespeed.austinisd.org/pc/default.aspx?DistrictID=227901',
				method: 'GET',
				makeQuery: (u : string, p : string, state : ASPNETPageState) => ({
					"__EVENTTARGET": null,
					"__EVENTARGUMENT": null,
					"__LASTFOCUS": null,
					"__VIEWSTATE": state.viewstate,
					"__scrollLeft": 0,
					"__scrollTop": 0,
					"ddlDistricts": null,
					"txtUserName": u,
					"txtPassword": p,
					"ddlLanguage": "en",
					"btnLogOn": "Log On"
				})
			},
			disambiguate: {
				url: 'https://gradespeed.austinisd.org/pc/ParentMain.aspx',
				method: 'POST',
				pickerLoadsFromAjax: false,
				isRequired: (dom : HTMLElement) => !!dom.find('#_ctl0_ddlStudents').length,
				makeQuery: (id : string, state : ASPNETPageState) => ({
					'__EVENTTARGET': '_ctl0$ddlStudents',
					'__EVENTARGUMENT': null,
					'__LASTFOCUS': null,
					'__VIEWSTATE': state.viewstate,
					'__scrollLeft': 0,
					'__scrollTop': 0,
					'__EVENTVALIDATION': state.eventvalidation,
					'__RUNEVENTTARGET': null,
					'__RUNEVENTARGUMENT': null,
					'__RUNEVENTARGUMENT2': null,
					'_ctl0:ddlStudents': id
				}),
				getDisambiguationChoices: (dom : HTMLElement) => (
					dom.find('#_ctl0_ddlStudents option').map((o : HTMLElement) => ({
						name: o.innerText,
						id: o.attr('value')
					})))
			},
			grades: {
				url: 'https://gradespeed.austinisd.org/pc/ParentStudentGrades.aspx',
				method: 'GET'
			},
			classGrades: {
				url: 'https://gradespeed.austinisd.org/pc/ParentStudentGrades.aspx',
				method: 'GET',
				makeQuery: (hash : string, state : ASPNETPageState) => ({
					data: hash
				})
			},
			parseStudentInfo: ($dom : HTMLElement, id : string) => ({
				name: $dom.findClass('StudentName')[0].innerText,
				school: $dom.findClass('DistrictName')[0]
					// DistrictName contains the school name in a span
					.findTag('span')[0].innerText.
					// The school name is given in the format "018 - LASA High School".
					// Frankly, we don't care about the number, so we chop it off.
					split('-')[1].substr(1),
				id: id
			})
		}
	}
	
}