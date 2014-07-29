interface LocalForage {
	config: (options: Object) => any;
	ready: () => Promise;
	clear: (callback?: () => any) => Promise;
	getItem: (key: string, callback?: (result?: any, error?: Error) => any) => Promise;
	key: (key: number, callback?: (result?: any) => any) => Promise;
	length: (callback?: (length?: number) => any) => Promise;
	removeItem: (key: string, callback?: () => any) => Promise;
	setItem: (key: string, value: any, callback?: (originalValue?: any, error?: Error) => any) => Promise;
}

declare var localforage: LocalForage;

class Store {
	namespace: string;
	storage: LocalForage;
	
	constructor(ns: string) {
		this.namespace = ns;
		this.storage = localforage;
	}
	
	init(): Promise {
		return new Promise((resolve: Function, reject: (e: Error) => any) => {
			this.storage.ready().then(() => {
				this.storage.config({
					name: 'QuickHAC',
					storeName: this.namespace
				});
				
				// version upgrades
				return this.storage.getItem('version');
			}, reject).then((version: string) => {
				if (typeof version === 'undefined' || version === null) {
					// initialise version 1
					this.storage.setItem('state', {
							activeStudent: null,
							activeAccount: null,
							lastUpdated: NaN,
							loginStatus: LoginStatus.NOT_LOGGED_IN }).then(() => {
						return this.storage.setItem('preferences', DEFAULT_PREFERENCES);
					}, reject).then(() => {
						return this.storage.setItem('version', 1);
					}, reject).then(() => {
						return this.storage.setItem('accounts', []);
					}, reject).then(resolve, reject);
				} else resolve();
			}, reject);
		});
	}
	
	getAccounts(): Promise {
		return new Promise((resolve: (accounts: Account[]) => any, reject: (e: Error) => any) => {
			this.storage.getItem('accounts').then((idList: string[]) => {
				if (typeof idList === 'undefined' || idList === null || !idList.length)
					resolve.apply(null, [[]]);
				else {
					// link accounts individually
					var len = idList.length,
						accounts: Account[] = new Array(len),
						loaded = 0;
					idList.forEach((id: string, idx: number) => {
						this.getAccount(id).then((acc: Account) => {
							accounts[idx] = acc;
							if (++loaded === len) resolve.apply(null, [accounts]);
						}, reject);
					});
				}
			});
		});
	}
	
	getAccount(id: string): Promise {
		return new Promise((resolve: (account: Account) => any, reject: (e: Error) => any) => {
			this.storage.getItem('account-' + id).then((unlinked: UnlinkedAccount) => {
				return this.linkAccount(unlinked);
			}, reject).then(resolve, reject);
		});
	}
	
	linkAccount(unlinked: UnlinkedAccount): Promise {
		return new Promise((resolve: (account: Account) => any, reject: (e: Error) => any) => {
			var len = unlinked.students.length,
				students: Student[] = Array(len),
				loaded = 0;
			unlinked.students.forEach((unlinkedStudent: UnlinkedStudent, idx: number) => {
				this.getStudent(unlinkedStudent.id).then((student: Student) => {
					students[idx] = student;
					if (++loaded === len) finalize();
				}, reject);
			});
			
			function finalize() {
				var account: Account = {
					id: unlinked.id,
					credentials: this.linkCredentials(unlinked.credentials),
					students: students
				};
				resolve.apply(null, [account]);
			}
		});
	}
	
	unlinkAccount(account: Account): UnlinkedAccount {
		return {
			id: account.id,
			credentials: this.unlinkCredentials(account.credentials),
			students: account.students.map(this.unlinkStudent)
		};
	}
	
	linkCredentials(creds: UnlinkedCredentials): Credentials {
		return {
			district: Districts[creds.district],
			username: creds.username,
			password: creds.password
		};
	}
	
	unlinkCredentials(creds: Credentials): UnlinkedCredentials {
		return {
			district: creds.district.id,
			username: creds.username,
			password: creds.password
		};
	}
	
	addAccount(account: Account): Promise {
		var unlinked: UnlinkedAccount = this.unlinkAccount(account);
		return new Promise((resolve: Function, reject: (e: Error) => any) => {
			this.doesAccountExist(account.id).then((exists: boolean) => {
				if (exists)
					reject.apply(null, [new Error('account with that id already exists')]);
				else
					// save the account
					this.storage.setItem('account-' + account.id, unlinked).then(() => {
						// update account list
						return this.storage.getItem('accounts');
					}, reject).then((accounts: string[]) => {
						accounts.push(account.id);
						return this.storage.setItem('accounts', accounts);
					}).then(resolve, reject);
			}, reject);
		});
	}
	
	updateAccount(account: Account): Promise {
		var unlinked: UnlinkedAccount = this.unlinkAccount(account);
		return new Promise((resolve: Function, reject: (e: Error) => any) => {
			this.doesAccountExist(account.id).then((exists: boolean) => {
				if (!exists)
					reject.apply(null, [new Error('account with that id does not exist')]);
				else this.storage.setItem('account-' + account.id, unlinked).then(resolve, reject);
			}, reject);
		});
	}

	// only call after removing all students belonging to the account
	removeAccount(accountId: string): Promise {
		// remove account data
		return new Promise((resolve: Function, reject: (e: Error) => any) => {
			this.storage.removeItem('account-' + accountId).then(() => {
				return this.storage.getItem('accounts');
			}, reject).then((accounts: string[]) => {
				// remove account from account list
				accounts.splice(accounts.indexOf(accountId), 1);
				return this.storage.setItem('accounts', accounts);
			}, reject).then(resolve, reject);
		});
	}
	
	doesAccountExist(id: string): Promise {
		return new Promise((resolve: (exists: boolean) => any, reject: (e: Error) => any) => {
			this.storage.getItem('account-' + id).then((account: UnlinkedAccount) => {
				var exists = typeof account !== 'undefined' && account !== null;
				resolve.apply(null, [exists]);
			}, reject);
		});
	}
	
	getStudent(id: string): Promise {
		return this.storage.getItem('student-' + id);
	}
	
	addStudent(student: Student): Promise {
		return new Promise((resolve: Function, reject: (e: Error) => any) => {
			this.doesStudentExist(student.id).then((exists: boolean) => {
				if (exists)
					reject.apply(null, [new Error('student with that id already exists')]);
				else this.storage.setItem('student-' + student.id, student).then(resolve, reject);
			}, reject);
		});
	}
	
	updateStudent(student: Student): Promise {
		return new Promise((resolve: Function, reject: (e: Error) => any) => {
			this.doesStudentExist(student.id).then((exists: boolean) => {
				if (!exists)
					reject.apply(null, [new Error('student with that id does not exist')]);
				else this.storage.setItem('student-' + student.id, student).then(resolve, reject);
			}, reject);
		});
	}
	
	removeStudent(id: string): Promise {
		return new Promise((resolve: Function, reject: (e: Error) => any) => {
			this.doesStudentExist(id).then((exists: Boolean) => {
				if (!exists)
					reject.apply(null, [new Error('student with that id does not exist')]);
				else this.storage.removeItem('student-' + id).then(resolve, reject);
			}, reject);
		});
	}
	
	doesStudentExist(id: string): Promise {
		return new Promise((resolve: (exists: boolean) => any, reject: (e: Error) => any) => {
			this.getStudent(id).then((s: Student) => {
				var exists = typeof s !== 'undefined' && s !== null;
				resolve.apply(null, [exists]);
			}, reject);
		});
	}
	
	getActiveStudent(): Promise {
		return this.getStateProperty('activeStudent').then((student: string) => {
			return this.storage.getItem('student-' + student);
		});
	}
	
	setActiveStudent(id: string): Promise {
		return this.setStateProperty('activeStudent', id);
	}

	getActiveAccount(): Promise {
		return this.getStateProperty('activeAccount').then((account: string) => {
			return this.getAccount(account);
		});
	}

	setActiveAccount(id: string): Promise {
		return this.setStateProperty('activeAccount', id);
	}

	getLastUpdatedTime(): Promise {
		return this.getStateProperty('lastUpdated');
	}

	setLastUpdatedTime(time: string): Promise {
		return this.setStateProperty('lastUpdated', time);
	}

	getLoginStatus(): Promise {
		return this.getStateProperty('loginStatus');
	}

	setLoginStatus(status: LoginStatus): Promise {
		return this.setStateProperty('loginStatus', status);
	}

	getStateProperty(prop: string): Promise {
		return new Promise((resolve: Function, reject: (e: Error) => any) => {
			this.storage.getItem('state').then((state: State) => {
				if (typeof state[prop] === 'undefined' || state[prop] === null)
					resolve.apply(null, [null]);
				else resolve(state[prop]);
			}, reject);
		});
	}

	setStateProperty(prop: string, val: any): Promise {
		return this.storage.getItem('state').then((state: State) => {
			state[prop] = val;
			return this.storage.setItem('state', state);
		});
	}
	
	unlinkStudent(student: Student): UnlinkedStudent {
		return {
			id: student.id,
			name: student.name,
			school: student.school,
			studentId: student.studentId
		};
	}
	
	linkStudent(unlinked: UnlinkedStudent): Promise {
		return this.getStudent(unlinked.id);
	}
	
	getPreferences(): Promise {
		return this.storage.getItem('preferences');
	}
	
	setPreferences(prefs: Preferences): Promise {
		return this.storage.setItem('preferences', prefs);
	}
	
	setPreference(key: string, value: any): Promise {
		return new Promise((resolve: Function, reject: (e: Error) => any) => {
			this.getPreferences().then((prefs: Preferences) => {
				prefs[key] = value;
				this.setPreferences(prefs).then(resolve, reject);
			}, reject);
		});
	}
}