/**
 * Assuming that GradeSpeed will only display grades for one year, and assuming
 * that no school year extends beyond July, we can unambiguously add a year to
 * a date in the format 'Jan-01' if we know the current date. This function
 * converts a date string in that format into a Date object with the year value
 * correctly set.
 */
module DateTools {
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
    
    export function parseSmallEndianDate(input: string) : number {
        Log.err('unimplemented');
        
        return 0;
    }
    
    export function parseMDYDate(input: string) : number {
        Log.err('unimplemented');
    
        return 0;
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