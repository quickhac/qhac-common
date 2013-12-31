package com.quickhac.common.http;

import java.io.IOException;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map.Entry;

import ch.boye.httpclientandroidlib.Consts;
import ch.boye.httpclientandroidlib.HttpEntity;
import ch.boye.httpclientandroidlib.HttpRequest;
import ch.boye.httpclientandroidlib.HttpResponse;
import ch.boye.httpclientandroidlib.NameValuePair;
import ch.boye.httpclientandroidlib.ParseException;
import ch.boye.httpclientandroidlib.ProtocolException;
import ch.boye.httpclientandroidlib.client.ClientProtocolException;
import ch.boye.httpclientandroidlib.client.HttpClient;
import ch.boye.httpclientandroidlib.client.entity.UrlEncodedFormEntity;
import ch.boye.httpclientandroidlib.client.methods.HttpGet;
import ch.boye.httpclientandroidlib.client.methods.HttpPost;
import ch.boye.httpclientandroidlib.client.methods.HttpUriRequest;
import ch.boye.httpclientandroidlib.client.utils.URIBuilder;
import ch.boye.httpclientandroidlib.impl.client.DefaultRedirectStrategy;
import ch.boye.httpclientandroidlib.message.BasicNameValuePair;
import ch.boye.httpclientandroidlib.protocol.HttpContext;
import ch.boye.httpclientandroidlib.util.EntityUtils;

/**
 * 
 * Prerequisites (if you want to mimic JavaScript's XHR behavior):
 *     DefaultHttpClient client = new VerifiedHttpClientFactory().getHttpClient();
 *     client.setRedirectStrategy(new XHR.RedirectStrategy());
 *
 */
public final class XHR {
	
	/**
	 * Creates a new HTTP request and sends it.
	 * @param client An HttpClient, so that state (esp. cookies) persist between
	 * requests
	 * @param method "GET" or "POST"
	 * @param url the URL to send the request to
	 * @param par a collection of parameters to send to the server via GET or POST
	 * @param cb a success and a failure callback to call
	 */
	public static void send(final HttpClient client, final String method,
			final String url, final HashMap<String, String> par,
			final ResponseHandler cb) {
		// check method
		if (method != "GET" && method != "POST")
			throw new IllegalArgumentException("Unsupported HTTP request type: " + method);

		// construct a URI
		final URIBuilder builder;
		try {
			builder = new URIBuilder(url);
		} catch (URISyntaxException e) {
			cb.onFailure(e);
			return;
		}
		
		// make the request
		final HttpUriRequest req;
		// GET and POST require that parameters be put in different places in
		// the request.
		if (method == "GET") {
			if (par != null)
				for (Entry<String, String> p : par.entrySet())
					builder.setParameter(p.getKey(), p.getValue());
			try {
				req = new HttpGet(builder.build());
			} catch (URISyntaxException e) {
				cb.onFailure(e);
				return;
			}
			System.out.println("GET " + req.getURI());
		} else {
			try {
				req = new HttpPost(builder.build());
			} catch (URISyntaxException e) {
				cb.onFailure(e);
				return;
			}
			if (par != null) {
				final List<NameValuePair> params = new LinkedList<NameValuePair>();
				for (Entry<String, String> p : par.entrySet())
					params.add(new BasicNameValuePair(p.getKey(), p.getValue()));
				final UrlEncodedFormEntity entity = new UrlEncodedFormEntity(params, Consts.UTF_8);
				((HttpPost) req).setEntity(entity);
				System.out.println("POST " + req.getURI());
				System.out.print("     with form data: ");
				try { entity.writeTo(System.out); } catch (IOException e) {}
				System.out.println();
			}
		}
		
		// execute the request and try to get a response
		final HttpResponse response;
		try {
			response = client.execute(req);
		} catch (ClientProtocolException e) {
			cb.onFailure(e);
			return;
		} catch (IOException e) {
			cb.onFailure(e);
			return;
		}
		
		// process the response
		final HttpEntity responseEntity = response.getEntity();
		final String responseString;
		try {
			responseString = EntityUtils.toString(responseEntity);
		} catch (ParseException e) {
			cb.onFailure(e);
			return;
		} catch (IOException e) {
			cb.onFailure(e);
			return;
		}
		cb.onSuccess(responseString);
	}
	
	public static class RedirectStrategy extends DefaultRedirectStrategy {            
		public boolean isRedirected(final HttpRequest request, final HttpResponse response, final HttpContext context)  {
			boolean isRedirect = false;
			try {
				isRedirect = super.isRedirected(request, response, context);
			} catch (ProtocolException e) {
				e.printStackTrace();
			}
			if (!isRedirect) {
				final int responseCode = response.getStatusLine().getStatusCode();
				if (responseCode == 301 || responseCode == 302) {
					return true;
				}
			}
			return isRedirect;
		}
	}
	
	public static abstract class ResponseHandler {
		public abstract void onSuccess(String response);
		public abstract void onFailure(Exception e);
	}
}
