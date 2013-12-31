package com.quickhac.common.util;

import javax.xml.bind.DatatypeConverter;

public class Base64 {
	
	public static String decode(String b) {
		return new String(DatatypeConverter.parseBase64Binary(b));
	}

}
