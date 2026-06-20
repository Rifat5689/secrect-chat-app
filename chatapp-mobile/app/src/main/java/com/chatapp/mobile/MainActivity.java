package com.chatapp.mobile;

import android.content.DialogInterface;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.chatapp.mobile.adapters.FriendAdapter;
import com.chatapp.mobile.adapters.RequestAdapter;
import com.chatapp.mobile.api.ApiClient;
import com.chatapp.mobile.models.ApiResponse;
import com.chatapp.mobile.models.FriendRequest;
import com.chatapp.mobile.models.User;
import com.chatapp.mobile.utils.SharedPrefManager;
import com.chatapp.mobile.utils.SocketManager;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import io.socket.client.Socket;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MainActivity extends AppCompatActivity implements FriendAdapter.OnFriendClickListener, RequestAdapter.OnRequestListener {

    private SharedPrefManager pref;
    private Socket mSocket;

    private LinearLayout viewChats, viewRequests, viewSettings;
    private TextView tabChats, tabRequests, tabSettings;
    
    // Friends list
    private RecyclerView rvFriends;
    private FriendAdapter friendAdapter;
    private List<User> friendList = new ArrayList<>();

    // Pending requests list
    private RecyclerView rvRequests;
    private RequestAdapter requestAdapter;
    private List<FriendRequest> requestList = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        pref = SharedPrefManager.getInstance(this);
        if (pref.getToken() == null) {
            startActivity(new Intent(MainActivity.this, LoginActivity.class));
            finish();
            return;
        }

        setContentView(R.layout.activity_main);

        // Bind layout panels
        viewChats = findViewById(R.id.viewChats);
        viewRequests = findViewById(R.id.viewRequests);
        viewSettings = findViewById(R.id.viewSettings);

        // Bind bottom tabs
        tabChats = findViewById(R.id.tabChats);
        tabRequests = findViewById(R.id.tabRequests);
        tabSettings = findViewById(R.id.tabSettings);

        // Bind action bar buttons
        ImageView ivLogout = findViewById(R.id.ivLogout);
        ImageView ivAddFriend = findViewById(R.id.ivAddFriend);

        // Setup layouts toggle
        tabChats.setOnClickListener(v -> switchTab("chats"));
        tabRequests.setOnClickListener(v -> switchTab("requests"));
        tabSettings.setOnClickListener(v -> switchTab("settings"));

        ivLogout.setOnClickListener(v -> logout());
        ivAddFriend.setOnClickListener(v -> showAddFriendDialog());

        // Setup Friends RecyclerView
        rvFriends = findViewById(R.id.rvFriends);
        rvFriends.setLayoutManager(new LinearLayoutManager(this));
        friendAdapter = new FriendAdapter(friendList, this);
        rvFriends.setAdapter(friendAdapter);

        // Setup Requests RecyclerView
        rvRequests = findViewById(R.id.rvRequests);
        rvRequests.setLayoutManager(new LinearLayoutManager(this));
        requestAdapter = new RequestAdapter(requestList, this);
        rvRequests.setAdapter(requestAdapter);

        // Initialize Sockets
        mSocket = SocketManager.getSocket(pref.getToken());
        if (mSocket != null) {
            mSocket.connect();
            setupSocketListeners();
        }

        // Fetch API data
        fetchFriends();
        fetchPendingRequests();
        setupSettingsView();
    }

    @Override
    protected void onResume() {
        super.onResume();
        fetchFriends();
        fetchPendingRequests();
    }

    private void switchTab(String tabName) {
        viewChats.setVisibility(View.GONE);
        viewRequests.setVisibility(View.GONE);
        viewSettings.setVisibility(View.GONE);

        tabChats.setTextColor(Color.parseColor("#94A3B8"));
        tabRequests.setTextColor(Color.parseColor("#94A3B8"));
        tabSettings.setTextColor(Color.parseColor("#94A3B8"));

        if ("chats".equals(tabName)) {
            viewChats.setVisibility(View.VISIBLE);
            tabChats.setTextColor(Color.WHITE);
            fetchFriends();
        } else if ("requests".equals(tabName)) {
            viewRequests.setVisibility(View.VISIBLE);
            tabRequests.setTextColor(Color.WHITE);
            fetchPendingRequests();
        } else if ("settings".equals(tabName)) {
            viewSettings.setVisibility(View.VISIBLE);
            tabSettings.setTextColor(Color.WHITE);
        }
    }

    private void setupSettingsView() {
        TextView tvUserInitial = findViewById(R.id.tvUserInitial);
        TextView tvUserName = findViewById(R.id.tvUserName);
        TextView tvUserMobile = findViewById(R.id.tvUserMobile);

        String name = pref.getUserName();
        tvUserName.setText(name);
        tvUserMobile.setText(pref.getUserMobile());

        String initial = !name.isEmpty() ? String.valueOf(name.charAt(0)).toUpperCase() : "U";
        tvUserInitial.setText(initial);
    }

    private void fetchFriends() {
        String authHeader = "Bearer " + pref.getToken();
        ApiClient.getService().getFriends(authHeader).enqueue(new Callback<ApiResponse<Map<String, List<User>>>>() {
            @Override
            public void onResponse(Call<ApiResponse<Map<String, List<User>>>> call, Response<ApiResponse<Map<String, List<User>>>> response) {
                if (response.isSuccessful() && response.body() != null && response.body().success) {
                    List<User> list = response.body().data.get("friends");
                    friendList.clear();
                    if (list != null) {
                        friendList.addAll(list);
                    }
                    friendAdapter.notifyDataSetChanged();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Map<String, List<User>>>> call, Throwable t) {
                // Silently ignore or log
            }
        });
    }

    private void fetchPendingRequests() {
        String authHeader = "Bearer " + pref.getToken();
        ApiClient.getService().getPendingRequests(authHeader).enqueue(new Callback<ApiResponse<Map<String, List<FriendRequest>>>>() {
            @Override
            public void onResponse(Call<ApiResponse<Map<String, List<FriendRequest>>>> call, Response<ApiResponse<Map<String, List<FriendRequest>>>> response) {
                if (response.isSuccessful() && response.body() != null && response.body().success) {
                    List<FriendRequest> list = response.body().data.get("requests");
                    requestList.clear();
                    if (list != null) {
                        requestList.addAll(list);
                    }
                    requestAdapter.notifyDataSetChanged();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Map<String, List<FriendRequest>>>> call, Throwable t) {
                // Silently ignore
            }
        });
    }

    private void showAddFriendDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Add Connection");
        builder.setMessage("Enter the mobile number of the user you want to connect with:");

        final EditText input = new EditText(this);
        input.setHint("Mobile number");
        builder.setView(input);

        builder.setPositiveButton("ADD", (dialog, which) -> {
            String mobile = input.getText().toString().trim();
            if (!mobile.isEmpty()) {
                sendFriendRequest(mobile);
            }
        });
        builder.setNegativeButton("Cancel", (dialog, which) -> dialog.cancel());
        builder.show();
    }

    private void sendFriendRequest(String mobile) {
        String authHeader = "Bearer " + pref.getToken();
        Map<String, String> body = new HashMap<>();
        body.put("mobilenumber", mobile);

        ApiClient.getService().sendFriendRequest(authHeader, body).enqueue(new Callback<ApiResponse<Object>>() {
            @Override
            public void onResponse(Call<ApiResponse<Object>> call, Response<ApiResponse<Object>> response) {
                if (response.isSuccessful() && response.body() != null && response.body().success) {
                    Toast.makeText(MainActivity.this, "Request sent successfully!", Toast.LENGTH_SHORT).show();
                    fetchFriends();
                } else {
                    String msg = "Could not add connection";
                    if (response.body() != null) msg = response.body().message;
                    Toast.makeText(MainActivity.this, msg, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Object>> call, Throwable t) {
                Toast.makeText(MainActivity.this, "Network error", Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    public void onAccept(String requesterId) {
        String authHeader = "Bearer " + pref.getToken();
        ApiClient.getService().acceptFriendRequest(authHeader, requesterId).enqueue(new Callback<ApiResponse<Object>>() {
            @Override
            public void onResponse(Call<ApiResponse<Object>> call, Response<ApiResponse<Object>> response) {
                if (response.isSuccessful() && response.body() != null && response.body().success) {
                    Toast.makeText(MainActivity.this, "You are now friends!", Toast.LENGTH_SHORT).show();
                    fetchPendingRequests();
                    fetchFriends();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Object>> call, Throwable t) {
                Toast.makeText(MainActivity.this, "Error accepting request", Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    public void onReject(String requesterId) {
        String authHeader = "Bearer " + pref.getToken();
        ApiClient.getService().rejectFriendRequest(authHeader, requesterId).enqueue(new Callback<ApiResponse<Object>>() {
            @Override
            public void onResponse(Call<ApiResponse<Object>> call, Response<ApiResponse<Object>> response) {
                if (response.isSuccessful() && response.body() != null && response.body().success) {
                    Toast.makeText(MainActivity.this, "Request rejected.", Toast.LENGTH_SHORT).show();
                    fetchPendingRequests();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Object>> call, Throwable t) {
                Toast.makeText(MainActivity.this, "Error rejecting request", Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    public void onFriendClick(User friend) {
        Intent intent = new Intent(MainActivity.this, ChatActivity.class);
        intent.putExtra("friend", friend);
        startActivity(intent);
    }

    private void setupSocketListeners() {
        mSocket.on("friend:online", args -> runOnUiThread(() -> {
            fetchFriends();
        }));
        mSocket.on("friend:offline", args -> runOnUiThread(() -> {
            fetchFriends();
        }));
        mSocket.on("friend:request", args -> runOnUiThread(() -> {
            Toast.makeText(MainActivity.this, "New connection invite received!", Toast.LENGTH_SHORT).show();
            fetchPendingRequests();
        }));
        mSocket.on("friend:accepted", args -> runOnUiThread(() -> {
            Toast.makeText(MainActivity.this, "A connection invite was accepted!", Toast.LENGTH_SHORT).show();
            fetchFriends();
        }));
    }

    private void logout() {
        SocketManager.disconnect();
        pref.clear();
        startActivity(new Intent(MainActivity.this, LoginActivity.class));
        finish();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Don't disconnect if navigating to Chat, but we should clear listeners to avoid leaks
        if (mSocket != null) {
            mSocket.off("friend:online");
            mSocket.off("friend:offline");
            mSocket.off("friend:request");
            mSocket.off("friend:accepted");
        }
    }
}
