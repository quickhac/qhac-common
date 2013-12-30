package com.quickhac.common;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;

public class ASPNETPageState {
	
	public String viewstate;
	public String eventvalidation;
	public String eventtarget;
	public String eventargument;
	
	/**
	 * Parses the ASP.NET page state of a given document.
	 */
	public static ASPNETPageState parse(final Document doc) {
		ASPNETPageState state = new ASPNETPageState();
		state.viewstate = getAttr(doc, "__VIEWSTATE");
		state.eventvalidation = getAttr(doc, "__EVENTVALIDATION");
		state.eventtarget = getAttr(doc, "__EVENTTARGET");
		state.eventargument = getAttr(doc, "__EVENTARGUMENT");
		return state;
	}
	
	/**
	 * Gets the value attribute of an element with the specified ID in the
	 * specified document/element.
	 */
	private static String getAttr(final Document doc, final String id) {
		Element elem = doc.getElementById(id);
		if (elem != null)
			return elem.attr("value");
		else
			return null;
	}

}
