package com.quickhac.common;

import java.util.Scanner;

import com.quickhac.common.districts.Austin;
import com.quickhac.common.districts.RoundRock;

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
		retriever.login(user, pass, id, new XHR.ResponseHandler() {

			@Override
			void onSuccess(String response) {
				System.out.println(response);
				
				retriever.getAverages(new XHR.ResponseHandler() {

					@Override
					void onSuccess(String response) {
						System.out.println(response);
					}

					@Override
					void onFailure(Exception e) {
						e.printStackTrace();
					}
					
				});
			}

			@Override
			void onFailure(Exception e) {
				e.printStackTrace();
			}
			
		});
	}

}
