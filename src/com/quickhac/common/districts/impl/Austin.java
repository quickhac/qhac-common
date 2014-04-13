package com.quickhac.common.districts.impl;

import java.util.HashMap;
import java.util.Iterator;

import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import com.quickhac.common.data.StudentInfo;
import com.quickhac.common.districts.GradeSpeedDistrict;
import com.quickhac.common.http.ASPNETPageState;

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
	public boolean disambiguatePickerLoadsFromAjax() { return false; }
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
		query.put("__EVENTARGUMENT", "");
		query.put("__LASTFOCUS", "");
		query.put("__VIEWSTATE", state.viewstate);
		query.put("__scrollLeft", "0");
		query.put("__scrollTop", "0");
		query.put("__EVENTVALIDATION", state.eventvalidation);
		query.put("__RUNEVENTTARGET", "");
		query.put("__RUNEVENTARGUMENT", "");
		query.put("__RUNEVENTARGUMENT2", "");
		query.put("_ctl0:ddlStudents", id);
		return query;
	}
	@Override
	public StudentInfo[] getDisambiguationChoices(Document doc) {
		// find the students table
		final Elements students = doc.select("#_ctl0_ddlStudents option");
		final StudentInfo[] choices = new StudentInfo[students.size()];
		
		// parse each student
		final Iterator<Element> studentIterator = students.iterator();
		int i = 0;
		while (studentIterator.hasNext()) {
			final Element studentElem = studentIterator.next();
			final StudentInfo choice = new StudentInfo();
			
			choice.name = studentElem.text();
			choice.id = studentElem.attr("value");
			
			choices[i] = choice;
			i++;
		}
		
		return choices;
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
		HashMap<String, String> query = new HashMap<String, String>();
		query.put("data", hash);
		return query;
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
	public double weightedGPABoost() {
		return 0;
	}

	@Override
	public boolean cycleGradesRequiresAveragesLoaded() {
		return false;
	}
	
	@Override
	public boolean isValidOutput(final Document doc) {
		return doc.text().contains("Log Out");
	}
	
	@Override
	public StudentInfo parseStudentInfo(final Document doc) {
		final StudentInfo info = new StudentInfo();
		info.name = doc.getElementsByClass("StudentName").first().text();
		info.school = doc.getElementsByClass("DistrictName").first()
				// DistrictName contains the school name in a span
				.getElementsByTag("span").text()
				// The school name is given in the format "018 - LASA High School".
				// Frankly, we don't care about the number, so we chop it off.
				.split("-")[1].substring(1);
		return info;
	}

}
