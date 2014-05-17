interface Preferences {
	colorIntensity: number /*int*/;
	hue: number /*int*/;
	updateOn: boolean;
	updateInterval: number /*int minutes*/;
	notifsConsolidate: boolean;
	badgeOn: boolean;
	passwordOn: boolean;
	passwordHash: string;
	gpaPrecision: number /*int*/;
}

var DEFAULT_PREFERENCES: Preferences = {
	colorIntensity: 4,
	hue: 0,
	updateOn: true,
	updateInterval: 60,
	notifsConsolidate: false,
	badgeOn: true,
	passwordOn: false,
	passwordHash: '',
	gpaPrecision: 4
}