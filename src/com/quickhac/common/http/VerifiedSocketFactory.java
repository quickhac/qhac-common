package com.quickhac.common.http;

import java.io.IOException;
import java.net.Socket;
import java.net.UnknownHostException;
import java.security.KeyManagementException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.UnrecoverableKeyException;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

import org.apache.http.conn.ssl.SSLSocketFactory;

public class VerifiedSocketFactory extends SSLSocketFactory {
	final SSLContext sslContext = SSLContext.getInstance("TLS");

	public VerifiedSocketFactory(final KeyStore truststore)
			throws NoSuchAlgorithmException, KeyManagementException,
			KeyStoreException, UnrecoverableKeyException {
		super(truststore);

		final TrustManager tm = new X509TrustManager() {
			public void checkClientTrusted(final X509Certificate[] chain,
					final String authType) throws CertificateException {
			}

			public void checkServerTrusted(final X509Certificate[] chain,
					final String authType) throws CertificateException {
			}

			public X509Certificate[] getAcceptedIssuers() {
				return null;
			}
		};

		sslContext.init(null, new TrustManager[] { tm }, null);
	}

	@Override
	public Socket createSocket(final Socket socket, final String host,
			final int port, final boolean autoClose) throws IOException,
			UnknownHostException {
		return sslContext.getSocketFactory().createSocket(socket, host, port,
				autoClose);
	}

	@Override
	public Socket createSocket() throws IOException {
		return sslContext.getSocketFactory().createSocket();
	}
}
