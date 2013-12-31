package com.quickhac.common.districts.impl;

import java.util.HashMap;

import org.jsoup.nodes.Document;

import com.quickhac.common.districts.GradeSpeedDistrict;
import com.quickhac.common.http.ASPNETPageState;

public final class RoundRock extends GradeSpeedDistrict {
	
	@Override
	public String name() { return "Round Rock ISD"; }
	@Override
	public int examWeight() { return 15; }
	@Override
	public boolean cycleGradesRequiresAveragesLoaded() { return true; }

	@Override
	public String loginURL() {
		return "https://accesscenter.roundrockisd.org/homeaccess/default.aspx";
	}
	@Override
	public String loginMethod() { return "POST"; }

	@Override
	public String disambiguateURL() {
		return "https://accesscenter.roundrockisd.org/homeaccess/Student/DailySummary.aspx";
	}
	@Override
	public String disambiguateMethod() { return "GET"; }

	@Override
	public String gradesURL() {
		return "https://accesscenter.roundrockisd.org/homeaccess/Student/Gradespeed.aspx?target=https://gradebook.roundrockisd.org/pc/displaygrades.aspx";
	}
	@Override
	public String gradesMethod() { return "GET"; }

	@Override
	public String cycleURL() {
		return "https://gradebook.roundrockisd.org/pc/displaygrades.aspx";
	}
	@Override
	public String cycleMethod() { return "GET"; }

	@Override
	public int titleColOffset() { return 0; }
	@Override
	public int periodColOffset() { return 1; }
	@Override
	public int gradesColOffset() { return 2; }

	@Override
	public HashMap<String, String> makeLoginQuery(String user, String pass,
			ASPNETPageState state) {
		HashMap<String, String> query = new HashMap<String, String>();
		query.put("__VIEWSTATE", state.viewstate);
		query.put("__EVENTVALIDATION", state.eventvalidation);
		query.put("ctl00$plnMain$txtLogin", user);
		query.put("ctl00$plnMain$txtPassword", pass);
		query.put("__EVENTTARGET", "");
		query.put("__EVENTARGUMENT", "");
		query.put("ctl00$strHiddenPageTitle", "");
		query.put("ctl00$plnMain$Submit1", "Log In");
		return query;
	}
	
	@Override
	public boolean requiresDisambiguation(Document doc) {
		return true; // TODO: not always required
	}
	
	@Override
	public HashMap<String, String> makeDisambiguateQuery(String id,
			ASPNETPageState state) {
		HashMap<String, String> query = new HashMap<String, String>();
		query.put("student_id", id);
		return query;
	}

	@Override
	public HashMap<String, String> makeGradesQuery(ASPNETPageState state) {
		HashMap<String, String> query = new HashMap<String, String>();
		return query;
	}

	@Override
	public HashMap<String, String> makeCycleQuery(String hash,
			ASPNETPageState state) {
		HashMap<String, String> query = new HashMap<String, String>();
		query.put("data", hash);
		return query;
	}

}
