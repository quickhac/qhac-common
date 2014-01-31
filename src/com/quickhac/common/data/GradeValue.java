package com.quickhac.common.data;

import java.util.HashMap;

import com.quickhac.common.util.Numeric;

public class GradeValue {
	
	// constants
	public static final int TYPE_NONE = 0;
	public static final int TYPE_INTEGER = 1;
	public static final int TYPE_DOUBLE = 2;
	public static final int TYPE_LETTER = 3;
	
	public static final int VALUE_NOT_APPLICABLE = -3;
	public static final int VALUE_EXEMPT = -2;
	public static final int VALUE_NONE = -1;
	
	public static final int VALUE_A_PLUS  = 0;
	public static final int VALUE_A       = 1;
	public static final int VALUE_A_MINUS = 2;
	
	public static final int VALUE_B_PLUS  = 3;
	public static final int VALUE_B       = 4;
	public static final int VALUE_B_MINUS = 5;
	
	public static final int VALUE_C_PLUS  = 6;
	public static final int VALUE_C       = 7;
	public static final int VALUE_C_MINUS = 8;
	
	public static final int VALUE_D_PLUS  = 9;
	public static final int VALUE_D       = 10;
	public static final int VALUE_D_MINUS = 11;
	
	public static final int VALUE_F       = 12;
	
	static final HashMap<String, Integer> letterToValue = new HashMap<String, Integer>();
	static final HashMap<Integer, String> valueToLetter = new HashMap<Integer, String>();
	
	static {
		letterToValue.put("A+", VALUE_A_PLUS);
		valueToLetter.put(VALUE_A_PLUS, "A+");
		
		letterToValue.put("A", VALUE_A);
		valueToLetter.put(VALUE_A, "A");
		
		letterToValue.put("A-", VALUE_A_MINUS);
		valueToLetter.put(VALUE_A_MINUS, "A-");
		
		letterToValue.put("B+", VALUE_B_PLUS);
		valueToLetter.put(VALUE_B_PLUS, "B+");
		
		letterToValue.put("B", VALUE_B);
		valueToLetter.put(VALUE_B, "B");
		
		letterToValue.put("B-", VALUE_B_MINUS);
		valueToLetter.put(VALUE_B_MINUS, "B-");
		
		letterToValue.put("C+", VALUE_C_PLUS);
		valueToLetter.put(VALUE_C_PLUS, "C+");
		
		letterToValue.put("C", VALUE_C);
		valueToLetter.put(VALUE_C, "C");
		
		letterToValue.put("C-", VALUE_C_MINUS);
		valueToLetter.put(VALUE_C_MINUS, "C-");
		
		letterToValue.put("D+", VALUE_D_PLUS);
		valueToLetter.put(VALUE_D_PLUS, "D+");
		
		letterToValue.put("D", VALUE_D);
		valueToLetter.put(VALUE_D, "D");
		
		letterToValue.put("D-", VALUE_D_MINUS);
		valueToLetter.put(VALUE_D_MINUS, "D-");
		
		letterToValue.put("F", VALUE_F);
		valueToLetter.put(VALUE_F, "F");
	}
	
	// instance fields
	public int type;
	public int value;
	public double value_d;
	
	// constructors
	public GradeValue() {
		super();
	}
	
	public GradeValue(String grade) {
		try {
			// try to read a integer grade
			value = Integer.parseInt(grade);
			type = TYPE_INTEGER;
		} catch (NumberFormatException e1) {
			
			try {
				// try to read a double grade
				value_d = Double.parseDouble(grade);
				type = TYPE_DOUBLE;
			} catch (NumberFormatException e2) {
				
				// if that fails, parse it as a letter grade
				type = TYPE_LETTER;
				Integer val = letterToValue.get(grade);
				
				if (val == null) {
					// if that fails as well, say it's not a grade
					type = TYPE_NONE;
					value = VALUE_NONE;
				} else {
					value = val;
				}
			}
		}
	}
	
	public GradeValue(int grade) {
		value = grade;
		type = TYPE_INTEGER;
	}
	
	public GradeValue(double grade) {
		value_d = grade;
		type = TYPE_DOUBLE;
	}
	
	// converters
	@Override
	public String toString() {
		switch (type) {
		case TYPE_NONE:    return "";
		case TYPE_INTEGER: return Integer.toString(value);
		case TYPE_DOUBLE:  return Numeric.doubleToPrettyString(value_d);
		case TYPE_LETTER:  return valueToLetter.get(value);
		default:
			System.err.println("Invalid grade type in GradeValue.toString()");
			return "";
		}
	}
	
	public Integer parseLetterGrade(String letter) {
		return letterToValue.get(letter); // returns null if not found
	}

}
