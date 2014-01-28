package com.quickhac.common.err;

public class InvalidGradeSpeedOutputException extends Exception {

	private static final long serialVersionUID = -2387270663812902736L;
	
	public InvalidGradeSpeedOutputException() {
		super();
	}
	
	public InvalidGradeSpeedOutputException(String message) {
		super(message);
	}
	
	public InvalidGradeSpeedOutputException(String message, Throwable cause) {
		super(message, cause);
	}
	
	public InvalidGradeSpeedOutputException(Throwable cause) {
		super(cause);
	}

}
