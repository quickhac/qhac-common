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

interface State {
	activeStudent: string;
}

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
					this.storage.setItem('state', { activeStudent: null }).then(() => {
						return this.storage.setItem('preferences', DEFAULT_PREFERENCES);
					}, reject).then(() => {
						return this.storage.setItem('version', 1);
					}, reject).then(resolve, reject);
				}
			}, reject);
		});
	}
	
	getAccounts(): Promise {
		return new Promise((resolve: (accounts: Account[]) => any, reject: (e: Error) => any) => {
			this.storage.getItem('accounts').then((unlinked: UnlinkedAccount[]) => {
				if (typeof unlinked === 'undefined' || unlinked === null)
					Function.maybeCall(resolve, null, [[]]);
				else {
					// link accounts individually
					var len = unlinked.length,
						accounts: Account[] = new Array(len),
						loaded = 0;
					unlinked.forEach((acc: UnlinkedAccount, idx: number) => {
						this.linkAccount(acc).then((account: Account) => {
							accounts[idx] = account;
							if (++loaded === len) Function.maybeCall(resolve, null, [accounts]);
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
				Function.maybeCall(resolve, null, [account]);
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
					Function.maybeCall(reject, null, [new Error('account with that id already exists')]);
				else this.storage.setItem('account-' + account.id, unlinked).then(resolve, reject);
			}, reject);
		});
	}
	
	updateAccount(account: Account): Promise {
		var unlinked: UnlinkedAccount = this.unlinkAccount(account);
		return new Promise((resolve: Function, reject: (e: Error) => any) => {
			this.doesAccountExist(account.id).then((exists: boolean) => {
				if (!exists)
					Function.maybeCall(reject, null, [new Error('account with that id does not exist')]);
				else this.storage.setItem('account-' + account.id, unlinked).then(resolve, reject);
			}, reject);
		});
	}
	
	doesAccountExist(id: string): Promise {
		return new Promise((resolve: (exists: boolean) => any, reject: (e: Error) => any) => {
			this.storage.getItem('account-' + id).then((account: UnlinkedAccount) => {
				var exists = typeof account !== 'undefined' && account !== null;
				Function.maybeCall(resolve, null, [exists]);
			}, reject);
		});
	}
	
	getStudent(id: string): Promise {
		return this.storage.getItem('student-' + id);
	}
	
	addStudent(accountId: string, student: Student): Promise {
		return new Promise((resolve: Function, reject: (e: Error) => any) => {
			this.doesStudentExist(student.id).then((exists: boolean) => {
				if (exists)
					Function.maybeCall(reject, null, [new Error('student with that id already exists')]);
				else this.storage.setItem('student-' + student.id, student).then(() => {
					this.storage.getItem('account-' + accountId).then((account: UnlinkedAccount) => {
						account.students.push(this.unlinkStudent(student));
						return this.storage.setItem('account-' + accountId, account);
					}, reject).then(resolve, reject);
				}, reject);
			}, reject);
		});
	}
	
	updateStudent(student: Student): Promise {
		return new Promise((resolve: Function, reject: (e: Error) => any) => {
			this.doesStudentExist(student.id).then((exists: boolean) => {
				if (!exists)
					Function.maybeCall(reject, null, [new Error('student with that id does not exist')]);
				else this.storage.setItem('student-' + student.id, student).then(resolve, reject);
			}, reject);
		});
	}
	
	removeStudent(id: string): Promise {
		return new Promise((resolve: Function, reject: (e: Error) => any) => {
			this.doesStudentExist(id).then((exists: Boolean) => {
				if (!exists)
					Function.maybeCall(reject, null, [new Error('student with that id does not exist')]);
				else this.storage.removeItem('student-' + id).then(resolve, reject);
			}, reject);
		});
	}
	
	doesStudentExist(id: string): Promise {
		return new Promise((resolve: (exists: boolean) => any, reject: (e: Error) => any) => {
			this.getStudent(id).then((s: Student) => {
				var exists = typeof s !== 'undefined' && s !== null;
				Function.maybeCall(resolve, null, [exists]);
			}, reject);
		});
	}
	
	getActiveStudent(): Promise {
		return new Promise((resolve: (student: Student) => any, reject: (e: Error) => any) => {
			this.storage.getItem('state').then((state: State) => {
				if (typeof state.activeStudent == 'undefined' || state.activeStudent == null)
					Function.maybeCall(resolve, null, [null]);
				else this.storage.getItem('student-' + state.activeStudent).then(resolve, reject);
			}, reject);
		});
	}
	
	setActiveStudent(id: string): Promise {
		return new Promise((resolve: Function, reject: (e: Error) => any) => {
			this.storage.getItem('state').then((state: State) => {
				state.activeStudent = id;
				this.storage.setItem('state', state).then(resolve, reject);
			});
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