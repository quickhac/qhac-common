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
				url: 'https://accesscenter.roundrockisd.org/homeaccess/default.aspx',
				method: 'GET',
				makeQuery: (u : string, p : string, state : ASPNETPageState) => ({
					'__VIEWSTATE': state.viewstate,
					'__EVENTVALIDATION': state.eventvalidation,
					'ctl00$plnMain$txtLogin': u,
					'ctl00$plnMain$txtPassword': p,
					'__EVENTTARGET': null,
					'__EVENTARGUMENT': null,
					'ctl00$strHiddenPageTitle': null,
					'ctl00$plnMain$Submit1': 'Log In'
				})
			},
			disambiguate: {
				url: 'https://accesscenter.roundrockisd.org/homeaccess/Student/DailySummary.aspx',
				method: 'GET',
				isRequired: (dom : HTMLElement) => !!dom.find('#ctl00_plnMain_dgStudents').length,
				makeQuery: (id : string, state : ASPNETPageState) => ({
					'student_id': id
				}),
				getDisambiguationChoices: ((dom : HTMLElement) =>
					dom.find('#ctl00_plnMain_dgStudents .ItemRow a, #ctl00_plnMain_dgStudents .AlternateItemRow a')
					.map((a : HTMLElement) => ({
						name: a.innerText,
						id: a.attr('href').match(/\?student_id=(\d+)/)[1]
					})))
			},
			grades: {
				url: 'https://accesscenter.roundrockisd.org/homeaccess/Student/Gradespeed.aspx?target=https://gradebook.roundrockisd.org/pc/displaygrades.aspx',
				method: 'GET'
			},
			classGrades: {
				url: 'https://gradebook.roundrockisd.org/pc/displaygrades.aspx',
				method: 'GET',
				makeQuery: (hash : string, state : ASPNETPageState) => ({
					data : hash
				})
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
			}
		}
	}
	
}