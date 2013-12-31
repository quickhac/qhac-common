package com.quickhac.common.util;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class Hash {
	
	static MessageDigest SHA1_HASHER;
	
	static {
		try {
			SHA1_HASHER = MessageDigest.getInstance("SHA-1");
		} catch (NoSuchAlgorithmException e) {
			System.err.println("Could not initialize SHA-1 hasher.");
		}
	}
	
	public static String SHA1(String str) {
		// fail silently (oops)
		if (SHA1_HASHER == null) return str;
		
		return byteArrayToHexString(SHA1_HASHER.digest(str.getBytes()));
	}
	
	public static String byteArrayToHexString(byte[] b) {
		String result = "";
		for (int i=0; i < b.length; i++) {
			result +=
					Integer.toString( ( b[i] & 0xff ) + 0x100, 16).substring( 1 );
		}
		return result;
	}

}
