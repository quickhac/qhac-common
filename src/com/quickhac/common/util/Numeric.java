package com.quickhac.common.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

public class Numeric {

	public static boolean isNumeric(String num) {
		return num.matches("((-|\\+)?[0-9]+(\\.[0-9]+)?)+");
	}
	
	public static double average(List<Double> nums) {
		double sum = 0; int count = 0;
		
		for (Double num : nums)
			if (num != null) {
				sum += num;
				count++;
			}
		
		return sum / count;
	}
	
	// http://stackoverflow.com/questions/153724/how-to-round-a-number-to-n-decimal-places-in-java
	public static double round(double d, int decimalPlaces) {
		BigDecimal bd = new BigDecimal(d).setScale(decimalPlaces, RoundingMode.HALF_EVEN);
		return bd.doubleValue();
	}

}
