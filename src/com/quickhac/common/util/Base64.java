package com.quickhac.common.util;

public class Base64 {
	
	public static String decode(String b) {
		return new String(
				ch.boye.httpclientandroidlib.androidextra.Base64.decode(
						b, ch.boye.httpclientandroidlib.androidextra.Base64.DEFAULT));
	}

}
