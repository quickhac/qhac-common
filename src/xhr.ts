/// <reference path='data.ts'/>

/** A helper class for making XMLHttpRequests. */
class XHR {
	_xhr : XMLHttpRequest;
	_method : string;
	_url : string;
	_params : Object;
	_success : Function;
	_fail : Function;

	/** Calls 'f' with arguments if it is a function, otherwise does nothing. */
	static _maybeCall(f : any, _this : any, args : any[]) : any {
		if (typeof f === 'function')
			return f.apply(_this, args);
	}

	/** Encodes a parameter from a key/value pair. */
	static _encodeParameter(key : string, value : any) : string {
		// null -> empty string
		if (value === null) value = '';

		// encode
		return encodeURIComponent(key) + '=' + encodeURIComponent(value);
	}

	/** Handles state changes in the backing XHR */
	static _stateChangeHandler(_this : XHR) : () => void {
		return function () {
			if (_this._xhr.readyState === 4) {
				if (_this._xhr.status === 200) {
					XHR._maybeCall(_this._success, _this._xhr, [_this._xhr.responseText, _this._xhr.responseXML]);
				} else if (_this._xhr.status === 500) {
					XHR._maybeCall(_this._fail, _this._xhr, [
						new ErrorEvent('xhr', {
							message: 'Internal Server Error',
							error: {
								message:'Internal Servor Error',
								description: 'Something went wrong on the server side.'
							}
						})
					]);
				}
			}
		}
	}

	/** Cretaes a parameter string from a hash of parameters. */
	static _createParamsString(params : Object) : string {
		if (typeof params === 'undefined') return '';
		return params.mapOwnProperties(XHR._encodeParameter).join('&');
	}

	/** Sends a GET request with the specified parameters. */
	_sendGet() : void {
		// only add ? if params exist
		var params = XHR._createParamsString(this._params);
		if (params !== '') params = '?' + params;
		this._xhr.open('GET', this._url + params, true);
		this._xhr.onreadystatechange = XHR._stateChangeHandler(this);
		this._xhr.send(null);
	}

	/** Sends a POST request with the specified parameters. */
	_sendPost() : void {
		// open url
		this._xhr.open('Post', this._url, true);
		this._xhr.onreadystatechange = XHR._stateChangeHandler(this);

		var paramString = XHR._createParamsString(this._params);

		// send the proper header information along with the request
		this._xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

		// send params
		this._xhr.send(paramString);
	}

	/** Creates a new XHR and returns itself for chaining */
	constructor(method : string, url : string) {
		if (method !== 'GET' && method !== 'POST')
			throw new Error('Unsupported HTTP request type: ' + method);

		this._xhr = new XMLHttpRequest();
		this._method = method;
		this._url = url;
		return this;
	}

	/** Sets the callback for when the request succeeds. */
	success(f : Function) : XHR {
		this._success = f;
		return this;
	}

	/** Sets the callback for when the request fails. */
	fail(f : (ev : ErrorEvent) => any) : XHR {
		this._fail = f;
		this._xhr.onerror = function (ev : ErrorEvent) {
			return XHR._maybeCall(f, this, [ev]);
		}
		return this;
	}

	/** Sets the parameters to be passed to the server. */
	params(params : Object) : XHR {
		this._params = params;
		return this;
	}

	/** Sends an XHR */
	send() : void {
		if (this._method === 'GET')
			this._sendGet();
		else
			this._sendPost();
	}

}