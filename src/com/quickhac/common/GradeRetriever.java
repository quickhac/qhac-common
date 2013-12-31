package com.quickhac.common;

import java.util.HashMap;

import ch.boye.httpclientandroidlib.impl.client.DefaultHttpClient;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

import com.quickhac.common.districts.GradeSpeedDistrict;
import com.quickhac.common.http.ASPNETPageState;
import com.quickhac.common.http.VerifiedHttpClientFactory;
import com.quickhac.common.http.XHR;

public class GradeRetriever {
	
	final DefaultHttpClient client;
	final GradeSpeedDistrict district;
	
	/**
	 * Creates a new grade retriever for the specified district.
	 */
	public GradeRetriever(final GradeSpeedDistrict d) {
		client = new VerifiedHttpClientFactory().getNewHttpClient();
		client.setRedirectStrategy(new XHR.RedirectStrategy());
		district = d;
	}
	
	/**
	 * Logs into a district grades website with the given credentials and
	 * specified callback. 
	 */
	public void login(final String user, final String pass, final String studentId, final XHR.ResponseHandler handler) {
		final XHR.ResponseHandler disambiguate = new XHR.ResponseHandler() {

			@Override
			public void onSuccess(String response) {
				final Document doc = Jsoup.parse(response);
				if (district.requiresDisambiguation(doc)) {
					final ASPNETPageState state = ASPNETPageState.parse(doc);
					final HashMap<String, String> query = district.makeDisambiguateQuery(studentId, state);
					XHR.send(client, district.disambiguateMethod(), district.disambiguateURL(), query, handler);
				} else handler.onSuccess(response);
			}

			@Override
			public void onFailure(Exception e) {
				handler.onFailure(e);
			}
			
		};
		
		final XHR.ResponseHandler doLogin = new XHR.ResponseHandler() {

			@Override
			public void onSuccess(String response) {
				final Document doc = Jsoup.parse(response);
				final ASPNETPageState state = ASPNETPageState.parse(doc);
				final HashMap<String, String> query = district.makeLoginQuery(user, pass, state);
				XHR.send(client, district.loginMethod(), district.loginURL(), query, disambiguate);
			}

			@Override
			public void onFailure(Exception e) {
				handler.onFailure(e);
			}
			
		};
		
		XHR.send(client, "GET", district.loginURL(), null, doLogin);
	}
	
	public void getAverages(final XHR.ResponseHandler handler) {
		XHR.send(client, district.gradesMethod(), district.gradesURL(), null, handler);
	}
	
	public void getCycle(final String urlHash, final Document gradesPage, final XHR.ResponseHandler handler) {
		ASPNETPageState state = null;
		
		// parse grades page if necessary
		if (district.cycleGradesRequiresAveragesLoaded())
			if (gradesPage == null)
				throw new IllegalArgumentException("District requires that averages be loaded before cycle grades can be loaded but no averages page was passed.");
			else
				state = ASPNETPageState.parse(gradesPage);
		
		final HashMap<String, String> query = district.makeCycleQuery(urlHash, state);
		XHR.send(client, district.cycleMethod(), district.cycleURL(), query, handler);
	}

}
