package com.quickhac.common.districts;

import org.jsoup.nodes.Document;

public abstract class District {
	
	public abstract String name();
	public abstract int examWeight();
	public abstract double weightedGPABoost();
	public abstract boolean cycleGradesRequiresAveragesLoaded();
	public abstract boolean isValidOutput(Document doc);

}
