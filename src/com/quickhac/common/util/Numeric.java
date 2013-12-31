package com.quickhac.common.util;

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

}
