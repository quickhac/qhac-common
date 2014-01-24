package com.quickhac.common.util;

/**
 * Utility functions for dealing with names.
 */
public class Name {

	/**
	 * Returns the first name of a name in either "First Middle Last" or "Last,
	 * First Middle" format.
	 */
	public static String parseFirstName(String name) {
		// After splitting on ", ", the first name will always be in the last
		// element of nameSplit.
		String[] nameSplit = name.split(", ");
		
		// We only want the first word, so we split on space.
		return nameSplit[nameSplit.length - 1].split(" ")[0];
	}
}
