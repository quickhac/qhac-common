package com.quickhac.common.test;

import java.util.Scanner;

import com.quickhac.common.GradeParser;
import com.quickhac.common.GradeRetriever;
import com.quickhac.common.districts.GradeSpeedDistrict;
import com.quickhac.common.districts.impl.Austin;
import com.quickhac.common.districts.impl.RoundRock;
import com.quickhac.common.http.XHR;

public class Test {

	public static void main(String[] args) {
		Scanner s = new Scanner(System.in);
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
		System.out.print("Student ID: ");
		final String id = s.nextLine();
		s.close();
		
		final GradeRetriever retriever = new GradeRetriever(dist);
		final GradeParser parser = new GradeParser(dist);
		retriever.login(user, pass, id, new XHR.ResponseHandler() {

			@Override
			public void onSuccess(String response) {
				
				retriever.getAverages(new XHR.ResponseHandler() {

					@Override
					public void onSuccess(String response) {
						System.out.println(parser.parseAverages(response));
					}

					@Override
					public void onFailure(Exception e) {
						System.err.println("Something failed!");
						e.printStackTrace();
					}
					
				});
			}

			@Override
			public void onFailure(Exception e) {
				e.printStackTrace();
			}
			
		});
	}

}
