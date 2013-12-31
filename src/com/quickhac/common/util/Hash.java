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
		
		return new String(SHA1_HASHER.digest(str.getBytes()));
	}

}
