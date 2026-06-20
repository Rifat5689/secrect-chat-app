package com.chatapp.mobile.utils;

import android.util.Log;

import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.Map;

import io.socket.client.IO;
import io.socket.client.Socket;

public class SocketManager {
    private static final String SOCKET_URL = "http://10.0.2.2:5000";
    private static Socket mSocket;

    public static synchronized Socket getSocket(String token) {
        if (mSocket == null && token != null) {
            try {
                IO.Options options = new IO.Options();
                Map<String, String> auth = new HashMap<>();
                auth.put("token", "Bearer " + token);
                options.auth = auth;

                mSocket = IO.socket(SOCKET_URL, options);
            } catch (URISyntaxException e) {
                Log.e("SocketManager", "URI syntax error: " + e.getMessage());
            }
        }
        return mSocket;
    }

    public static synchronized void disconnect() {
        if (mSocket != null) {
            mSocket.disconnect();
            mSocket = null;
        }
    }
}
