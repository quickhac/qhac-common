package com.quickhac.common.districts;

import java.util.HashMap;

import org.jsoup.nodes.Document;

import com.quickhac.common.ASPNETPageState;
import com.quickhac.common.GradeSpeedDistrict;

public class Austin extends GradeSpeedDistrict {

	@Override
	public String loginURL() {
		return "https://gradespeed.austinisd.org/pc/default.aspx?DistrictID=227901";
	}
	@Override
	public String loginMethod() { return "POST"; }
	@Override
	public HashMap<String, String> makeLoginQuery(final String user, final String pass,
			final ASPNETPageState state) {
		HashMap<String, String> query = new HashMap<String, String>();
		query.put("__EVENTTARGET", "");
		query.put("__EVENTARGUMENT", "");
		query.put("__LASTFOCUS", "");
		query.put("__VIEWSTATE", state.viewstate);
		query.put("__scrollLeft", "0");
		query.put("__scrollTop", "0");
		query.put("ddlDistricts", "");
		query.put("txtUserName", user);
		query.put("txtPassword", pass);
		query.put("ddlLanguage", "en");
		query.put("btnLogOn", "Log On");
		return query;
	}

	@Override
	public boolean requiresDisambiguation(Document doc) {
		return doc.getElementById("_ctl0_ddlStudents") != null;
	}
	@Override
	public String disambiguateURL() {
		return "https://gradespeed.austinisd.org/pc/ParentMain.aspx";
	}
	@Override
	public String disambiguateMethod() { return "POST"; }

	@Override
	public HashMap<String, String> makeDisambiguateQuery(final String id,
			final ASPNETPageState state) {
		final HashMap<String, String> query = new HashMap<String, String>();
		query.put("__EVENTTARGET", "_ctl0$ddlStudents");
		query.put("__EVENTARGUMENT", null);
		query.put("__LASTFOCUS", null);
		query.put("__VIEWSTATE", state.viewstate);
		query.put("__scrollLeft", "0");
		query.put("__scrollTop", "0");
		query.put("__EVENTVALIDATION", state.eventvalidation);
		query.put("__RUNEVENTTARGET", null);
		query.put("__RUNEVENTARGUMENT", null);
		query.put("__RUNEVENTARGUMENT2", null);
		query.put("_ctl0:ddlStudents", id);
		return null;
	}

	@Override
	public String gradesURL() {
		return "https://gradespeed.austinisd.org/pc/ParentStudentGrades.aspx";
	}
	@Override
	public String gradesMethod() { return "GET"; }
	@Override
	public HashMap<String, String> makeGradesQuery(ASPNETPageState state) {
		return new HashMap<String, String>();
	}

	@Override
	public String cycleURL() {
		return "https://gradespeed.austinisd.org/pc/ParentStudentGrades.aspx";
	}
	@Override
	public String cycleMethod() { return "GET"; }
	@Override
	public HashMap<String, String> makeCycleQuery(String hash,
			ASPNETPageState state) {
		return new HashMap<String, String>();
	}

	@Override
	public int titleColOffset() {
		return 1;
	}

	@Override
	public int periodColOffset() {
		return 2;
	}

	@Override
	public int gradesColOffset() {
		return 3;
	}

	@Override
	public String name() {
		return "Austin ISD";
	}

	@Override
	public int examWeight() {
		return 25;
	}

	@Override
	public boolean cycleGradesRequiresAveragesLoaded() {
		return false;
	}

}
