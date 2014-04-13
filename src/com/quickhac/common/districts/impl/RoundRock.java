package com.quickhac.common.districts.impl;

import java.util.HashMap;
import java.util.Iterator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import com.quickhac.common.data.StudentInfo;
import com.quickhac.common.districts.GradeSpeedDistrict;
import com.quickhac.common.http.ASPNETPageState;

public final class RoundRock extends GradeSpeedDistrict {
	
	static final Pattern STUDENT_ID_REGEX =
			Pattern.compile("\\?student_id=(\\d+)");
	static final Pattern SCHOOL_REGEX =
			Pattern.compile("\\((.*)\\)");
	
	@Override
	public String name() { return "Round Rock ISD"; }
	@Override
	public int examWeight() { return 15; }
	@Override
	public double weightedGPABoost() { return 1; }
	@Override
	public boolean cycleGradesRequiresAveragesLoaded() { return true; }

	@Override
	public String loginURL() {
		return "https://accesscenter.roundrockisd.org/HomeAccess/Account/LogOn?ReturnUrl=%2fhomeaccess%2f";
	}
	@Override
	public String loginMethod() { return "POST"; }

	@Override
	public String disambiguateURL() {
		return "https://accesscenter.roundrockisd.org/HomeAccess/Frame/StudentPicker";
	}
	@Override
	public String disambiguateMethod() { return "POST"; }
	@Override
	public StudentInfo[] getDisambiguationChoices(Document doc) {
		// find the students table
		final Elements students = doc.getElementsByClass("sg-student-picker-row");
		final StudentInfo[] choices = new StudentInfo[students.size()];
		
		// parse each student
		final Iterator<Element> studentIterator = students.iterator();
		int i = 0;
		while (studentIterator.hasNext()) {
			final Element studentElem = studentIterator.next();
			final StudentInfo choice = new StudentInfo();
			
			choice.name = studentElem.getElementsByClass("sg-picker-student-name").first().text();
			choice.id = studentElem.select("input[name=studentId]").first().val();
			
			choices[i] = choice;
			i++;
		}
		
		return choices;
	}

	@Override
	public String gradesURL() {
		return "https://accesscenter.roundrockisd.org/HomeAccess/content/student/gradespeed.aspx?target=https://gradebook.roundrockisd.org/pc/displaygrades.aspx";
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
		query.put("Database", "10");
		query.put("LogOnDetails.UserName", user);
		query.put("LogOnDetails.Password", pass);
		return query;
	}
	
	@Override
	public boolean requiresDisambiguation(Document doc) {
		final Elements buttons = doc.getElementsByClass("sg-button");
		for (Element button : buttons)
			if (button.text().indexOf("Change Student") != -1)
				return true;
		return false;
	}
	
	@Override
	public boolean disambiguatePickerLoadsFromAjax() { return true; }
	
	@Override
	public HashMap<String, String> makeDisambiguateQuery(String id,
			ASPNETPageState state) {
		HashMap<String, String> query = new HashMap<String, String>();
		query.put("studentId", id);
		query.put("url", "/HomeAccess/Home/WeekView");
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
	
	@Override
	public boolean isValidOutput(final Document doc) {
		return doc.text().contains("Logoff") || doc.getElementsByClass("DataTable").size() != 0;
	}

	@Override
	public StudentInfo parseStudentInfo(final Document doc) {
		final StudentInfo info = new StudentInfo();
		info.name = doc.getElementsByClass("StudentName").first().text();
		
		final Matcher schoolMatcher = SCHOOL_REGEX.matcher(doc.getElementsByClass("StudentHeader").first().text());
		if (schoolMatcher.find())
			info.school = schoolMatcher.group(1);
		
		return info;
	}

}
