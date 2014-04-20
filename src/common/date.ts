/** Tools to normalise dates into milliseconds since 1970. */
module DateTools {
	/**
	 * Format: Jan-01
	 * Assumes the date occurs during the current school year. Also assumes that
	 * school years end and start on 1 July every year.
	 */
	export function parseGradeSpeedDate(input: string) : number {
		var splits = input.split('-');
		var date = parseInt(splits[1], 10);
		var month = shortMonthToNum(splits[0]);
		var year: number;
		
		// get the current school year
		var now = new Date();
		var startOfCurrentSchoolYear : number;
		if (now.getUTCMonth() >= 6)
			startOfCurrentSchoolYear = now.getUTCFullYear();
		else
			startOfCurrentSchoolYear = now.getUTCFullYear() - 1;
		
		// add a year to the given date
		if (month >= 6)
			year = startOfCurrentSchoolYear;
		else
			year = startOfCurrentSchoolYear + 1;
		
		return Date.UTC(year, month, date);
	}
	
	/** Format: 1 January 1970 */
	export function parseSmallEndianDate(input: string) : number {
		var splits = input.split(' ');
		var date = parseInt(splits[0], 10);
		var month = longMonthToNum(splits[1]);
		var year = parseInt(splits[2], 10);
		
		return Date.UTC(year, month, date);
	}
	
	/** Format: 1/1/1970 or 01/01/1970 */
	export function parseMDYDate(input: string) : number {
		var splits = input.split('/');
		var month = parseInt(splits[0], 10);
		var date = parseInt(splits[1], 10);
		var year = parseInt(splits[2], 10);
	
		return Date.UTC(year, month, date);
	}
	
	var longMonthNames =
		['January', 'February', 'March', 'April', 'May', 'June',
		 'July', 'August', 'September', 'October', 'November', 'December'];
	export function longMonthToNum(input: string) : number {
		return longMonthNames.indexOf(input);
	}
	
	var shortMonthNames =
		['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
		 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	export function shortMonthToNum(input: string) : number {
		return shortMonthNames.indexOf(input);
	}
}