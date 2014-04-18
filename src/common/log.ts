module Log {
	var level = LogLevel.ERROR;

	export function setLevel(lvl: LogLevel) : void {
		level = lvl;
	}

	export function d(...args: any[]) : void {
		if (LogLevel.DEBUG >= level)
			args.forEach(msg => console.log(msg));
	}

	export function i(...args: any[]) : void {
		if (LogLevel.INFO >= level)
			args.forEach(msg => console.log(msg));
	}

	export function w(...args: any[]) : void {
		if (LogLevel.WARNING >= level)
			args.forEach(msg => console.log(msg));
	}

	export function err(...args: any[]) : void {
		if (LogLevel.ERROR >= level)
			args.forEach(msg => console.log(msg));
	}
}

enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARNING = 2,
	ERROR = 3
}