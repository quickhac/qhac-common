package com.quickhac.common.districts;

public abstract class District {
	
	public abstract String name();
	public abstract int examWeight();
	public abstract double weightedGPABoost();
	public abstract boolean cycleGradesRequiresAveragesLoaded();

}
