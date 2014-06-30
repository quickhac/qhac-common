/// <reference path='data.ts'/>

interface XHRParams {
	method: string;
	url: string;
	query: Object;
	success: Function;
	fail: (e: Error) => void;
}

/** A helper class for making XMLHttpRequests. */
class XHR {
	_xhr : XMLHttpRequest;
	_params: XHRParams;

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
					var doc: Document;
					try { doc = DOMTools.parse(_this._xhr.responseText); } catch (e) {}
					_this._params.success.apply(_this._xhr, [_this._xhr.responseText, doc]);
				} else if (_this._xhr.status === 404) {
					_this._params.fail.apply(_this._xhr, [new Error('404 File Not Found')]);
				} else if (_this._xhr.status === 500) {
					_this._params.fail.apply(_this._xhr, [new Error('500 Internal Server Error')]);
				}
			}
		}
	}

	/** Cretaes a parameter string from a hash of parameters. */
	static _createParamsString(params : Object) : string {
		if (typeof params === 'undefined') return '';
		return mapOwnProperties(params, XHR._encodeParameter).join('&');
	}

	/** Sends a GET request with the specified parameters. */
	_sendGet() : void {
		// only add ? if params exist
		var query = XHR._createParamsString(this._params.query);
		if (query !== '') query = '?' + query;

		// log
		Log.d('XHR loading: ' + this._params.url + ' via GET');
		Log.d('Params: ' + query);

		// send
		this._xhr.open('GET', this._params.url + query, true);
		this._xhr.onreadystatechange = XHR._stateChangeHandler(this);
		this._xhr.send(null);
	}

	/** Sends a POST request with the specified parameters. */
	_sendPost() : void {
		// open url
		this._xhr.open('POST', this._params.url, true);
		this._xhr.onreadystatechange = XHR._stateChangeHandler(this);

		var paramString = XHR._createParamsString(this._params.query);

		Log.d('XHR loading: ' + this._params.url + ' via POST');
		Log.d('Params: ' + paramString);

		// send the proper header information along with the request
		this._xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

		// send params
		this._xhr.send(paramString);
	}

	/** Creates a new XHR and returns itself for chaining */
	constructor(params: XHRParams) {
		if (params.method !== 'GET' && params.method !== 'POST')
			throw new Error('Unsupported HTTP request type: ' + params.method);

		this._xhr = new XMLHttpRequest();
		this._params = params;
		return this;
	}

	/** Sends an XHR */
	send() : void {
		if (this._params.method === 'GET')
			this._sendGet();
		else
			this._sendPost();
	}

}