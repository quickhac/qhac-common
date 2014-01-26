package com.quickhac.common.data;

import com.quickhac.common.util.Numeric;

public class Assignment {
	
	public String id;
	public String title;
	public String dateAssigned;
	public String dateDue;
	public Double ptsEarned;
	public double ptsPossible;
	public double weight;
	public String note;
	public boolean extraCredit;
	
	public String pointsString() {
		if (ptsEarned == null)
			return "-";
		
		final StringBuilder pts = new StringBuilder();
		
		pts.append(Numeric.doubleToPrettyString(ptsEarned));
		
		if (ptsPossible != 100)
			pts.append("/" + Numeric.doubleToPrettyString(ptsPossible));
		
		if(weight != 1.0)
			pts.append("\u00D7" + Numeric.doubleToPrettyString(weight));
		
		return pts.toString();
	}

}
