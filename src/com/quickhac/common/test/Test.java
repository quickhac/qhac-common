package com.quickhac.common.test;

import java.util.Scanner;

import org.jsoup.Jsoup;

import com.quickhac.common.GradeCalc;
import com.quickhac.common.GradeParser;
import com.quickhac.common.GradeRetriever;
import com.quickhac.common.data.ClassGrades;
import com.quickhac.common.data.Course;
import com.quickhac.common.data.DisambiguationChoice;
import com.quickhac.common.districts.GradeSpeedDistrict;
import com.quickhac.common.districts.impl.Austin;
import com.quickhac.common.districts.impl.RoundRock;
import com.quickhac.common.http.ASPNETPageState;
import com.quickhac.common.http.XHR;

public class Test {

	public static void main(String[] args) {
		final Scanner s = new Scanner(System.in);
		System.out.print("District: ");
		GradeSpeedDistrict dist;
		final String distStr = s.nextLine();
		if (distStr.equals("roundrock")) dist = new RoundRock();
		else if (distStr.equals("austin")) dist = new Austin();
		else { s.close(); return; }
		System.out.print("Username: ");
		final String user = s.nextLine();
		System.out.print("Password: ");
		final String pass = s.nextLine();
		
		final GradeRetriever retriever = new GradeRetriever(dist);
		final GradeParser parser = new GradeParser(dist);
		
		final XHR.ResponseHandler getAveragesHandler = new XHR.ResponseHandler() {

			@Override
			public void onSuccess(String response) {
				System.out.println("Almost finished...");
				@SuppressWarnings("unused")
				Course[] courses = parser.parseAverages(response);
				System.out.println("Finished.");
				
				System.out.print("Class to load: ");
				final String hash = s.nextLine();
				s.close();
				
				retriever.getCycle(hash, Jsoup.parse(response), new XHR.ResponseHandler() {

					@Override
					public void onSuccess(String response) {
						System.out.println("Almost finished loading cycle...");
						ClassGrades grades = parser.parseClassGrades(response, hash, 0, 0);
						System.out.println("Finished.");
						
						// set breakpoints somewhere below to test quality
						// of calculations
						@SuppressWarnings("unused")
						Double catAvg = GradeCalc.categoryAverage(grades.categories[0].assignments);
						@SuppressWarnings("unused")
						Integer cycAvg = GradeCalc.cycleAverage(grades);
						System.out.println("GradeCalc testing finished.");
					}

					@Override
					public void onFailure(Exception e) {
						// TODO Auto-generated method stub
						
					}
					
				});
			}

			@Override
			public void onFailure(Exception e) {
				System.err.println("Something failed!");
				e.printStackTrace();
			}
			
		};
		
		final XHR.ResponseHandler disambiguateHandler = new XHR.ResponseHandler() {
			@Override
			public void onSuccess(String response) {
				retriever.getAverages(getAveragesHandler);
			}

			@Override
			public void onFailure(Exception e) {
				e.printStackTrace();
			}
		};
		
		final GradeRetriever.LoginResponseHandler loginHandler = new GradeRetriever.LoginResponseHandler() {

			@Override
			public void onRequiresDisambiguation(String response, DisambiguationChoice[] choices, ASPNETPageState state) {
				for (int i = 0; i < choices.length; i++)
					System.out.println("Choice " + i + ": " + choices[i].name + ", " + choices[i].id);
				System.out.print("Student ID: ");
				final String id = s.nextLine();
				
				retriever.disambiguate(id, state, disambiguateHandler);
			}
			
			@Override
			public void onDoesNotRequireDisambiguation(String response) {
				retriever.getAverages(getAveragesHandler);
			}
			
			@Override
			public void onFailure(Exception e) {
				e.printStackTrace();
			}
			
		};
		
		retriever.login(user, pass, loginHandler);
		
	}

}
