/// <reference path='data.ts'/>

/** A helper class for making XMLHttpRequests. */
class XHR {
	xhr : XMLHttpRequest;
	method : string;
	url : string;
	params : Object;
	success : Function;
	fail : Function;

	/** Calls 'f' with arguments if it is a function, otherwise does nothing. */
	_maybeCall(f : any, _this : any, args : any[]) : any {
		if (typeof f === 'function')
			return f.apply(_this, args);
	}

	/** Encodes a parameter from a key/value pair. */
	_encodeParameter(key : string, value : any) : string {
		return key + '=' + encodeURIComponent(value);
	}

	/** Handles state changes in the backing XHR */
	_stateChangeHandler(_this : XHR) : () => void {
		return function () {
			if (_this.xhr.readyState === 4) {
				if (_this.xhr.status === 200) {
					_this._maybeCall(_this.success, _this.xhr, [_this.xhr.responseText, _this.xhr.responseXML]);
				} else {
					_this._maybeCall(_this.fail, _this.xhr, [null]);
				}
			}
		}
	}

	/** Cretaes a parameter string from a hash of parameters. */
	_createParamsString(params : Object) : string {
		if (typeof params === 'undefined') return '';
		return params.mapOwnProperties(this._encodeParameter).join('&');
	}

	/** Sends a GET request with the specified parameters. */
	_sendGet() {
		this.xhr.open('GET', this.url + '?' + this._createParamsString(this.params), true);
		this.xhr.onreadystatechange = this._stateChangeHandler(this);
		this.xhr.send(null);
	}

	/** Sends a POST request with the specified parameters. */
	_sendPost() {
		// open url
		this.xhr.open('Post', this.url, true);

		var paramString = this._createParamsString(this.params);

		// send the proper header information along with the request
		this.xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		this.xhr.setRequestHeader("Content-length", paramString.length.toString());
		this.xhr.setRequestHeader("Connection", "close");

		// send params
		this.xhr.send(paramString);
	}

	/** Creates a new XHR and returns itself for chaining */
	constructor(method : string, url : string) {
		if (method !== 'GET' && method !== 'POST')
			throw new Error('Unsupported HTTP request type: ' + method);

		this.xhr = new XMLHttpRequest();
		this.method = method;
		this.url = url;
		return this;
	}

	/** Sets the callback for when the request succeeds. */
	onSuccess(f : Function) : XHR {
		this.success = f;
		return this;
	}

	/** Sets the callback for when the request fails. */
	onFail(f : (ev : ErrorEvent) => any) : XHR {
		this.fail = f;
		this.xhr.onerror = f;
		return this;
	}

	/** Sets the parameters to be passed to the server. */
	setParams(params : Object) : XHR {
		this.params = params;
		return this;
	}

	/** Sends an XHR */
	send() : void {
		if (this.method === 'GET')
			this._sendGet();
		else
			this._sendPost();
	}

}