/// <reference path='data.ts'/>
/// <reference path='query.ts'/>

module Districts {

	/** Round Rock Independent School District */
	export var roundrock : District = {
		name: 'Round Rock ISD',
		driver: GradeSpeedDriver,
		examWeight: 15,
		columnOffsets: {
			title: 0,
			grades: 2
		},
		classGradesRequiresAverageLoaded: true,
		server: <Server<GradeSpeed>> {
			api: {
				login: {
					url: 'https://accesscenter.roundrockisd.org/homeaccess/default.aspx',
					method: 'GET',
					makeQuery: (u : string, p : string, state : ASPNETPageState) => {return {
						'__VIEWSTATE': state.viewstate,
						'__EVENTVALIDATION': state.eventvalidation,
						'ctl00$plnMain$txtLogin': u,
						'ctl00$plnMain$txtPassword': p,
						'__EVENTTARGET': null,
						'__EVENTARGUMENT': null,
						'ctl00$strHiddenPageTitle': null,
						'ctl00$plnMain$Submit1': 'Log In'
					}}
				},
				disambiguate: {
					url: 'https://accesscenter.roundrockisd.org/homeaccess/Student/DailySummary.aspx',
					method: 'GET',
					isRequired: (dom : HTMLElement) => true, // TODO: disambiguation not always required
					makeQuery: (id : string, state : ASPNETPageState) => {return {
						'student_id': id
					}}
				},
				grades: {
					url: 'https://accesscenter.roundrockisd.org/homeaccess/Student/Gradespeed.aspx?target=https://gradebook.roundrockisd.org/pc/displaygrades.aspx',
					method: 'GET'
				},
				classGrades: {
					url: 'https://gradebook.roundrockisd.org/pc/displaygrades.aspx',
					method: 'GET',
					makeQuery: (hash : string, state : ASPNETPageState) => {return {
						data : hash
					}}
				}
			}
		}
	}

	/** Austin Independent School District */
	export var austin : District = {
		name: 'Austin ISD',
		driver: GradeSpeedDriver,
		examWeight: 25,
		columnOffsets: {
			title: 1,
			grades: 3
		},
		classGradesRequiresAverageLoaded: false,
		server: <Server<GradeSpeed>> {
			api: {
				login: {
					url: 'https://gradespeed.austinisd.org/pc/default.aspx?DistrictID=227901',
					method: 'GET',
					makeQuery: (u : string, p : string, state : ASPNETPageState) => {return {
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
					}}
				},
				disambiguate: {
					url: 'https://gradespeed.austinisd.org/pc/ParentMain.aspx',
					method: 'POST',
					isRequired: (dom : HTMLElement) => dom.find('#_ctl0_ddlStudents').length != 0,
					makeQuery: (id : string, state : ASPNETPageState) => {return {
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
					}}
				},
				grades: {
					url: 'https://gradespeed.austinisd.org/pc/ParentStudentGrades.aspx',
					method: 'GET'
				},
				classGrades: {
					url: 'https://gradespeed.austinisd.org/pc/ParentStudentGrades.aspx',
					method: 'GET',
					makeQuery: (hash : string, state : ASPNETPageState) => {return {
						data: hash
					}}
				}
			}
		}
	}
	
}