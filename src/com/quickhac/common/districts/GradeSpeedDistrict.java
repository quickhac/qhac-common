package com.quickhac.common.districts;

import java.util.HashMap;

import org.jsoup.nodes.Document;

import com.quickhac.common.data.DisambiguationChoice;
import com.quickhac.common.http.ASPNETPageState;

public abstract class GradeSpeedDistrict extends District {
	
	// for interacting with a server
	public abstract String loginURL();
	public abstract String loginMethod();
	public abstract HashMap<String, String> makeLoginQuery(String user,
			String pass, ASPNETPageState state);
	
	public abstract boolean requiresDisambiguation(Document doc);
	public abstract String disambiguateURL();
	public abstract String disambiguateMethod();
	public abstract HashMap<String, String> makeDisambiguateQuery(String id,
			ASPNETPageState state);
	public abstract DisambiguationChoice[] getDisambiguationChoices(Document doc);
	
	public abstract String gradesURL();
	public abstract String gradesMethod();
	public abstract HashMap<String, String> makeGradesQuery(
			ASPNETPageState state);
	
	public abstract String cycleURL();
	public abstract String cycleMethod();
	public abstract HashMap<String, String> makeCycleQuery(String hash,
			ASPNETPageState state);
	
	// cycle offsets
	public abstract int titleColOffset();
	public abstract int periodColOffset();
	public abstract int gradesColOffset();

}
