package com.chatapp.mobile;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.chatapp.mobile.api.ApiClient;
import com.chatapp.mobile.models.ApiResponse;
import com.chatapp.mobile.utils.SharedPrefManager;
import com.google.android.material.textfield.TextInputEditText;

import java.util.HashMap;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    private TextInputEditText etMobile, etPassword;
    private Button btnLogin;
    private TextView tvRegister;
    private SharedPrefManager pref;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        pref = SharedPrefManager.getInstance(this);
        if (pref.getToken() != null) {
            startActivity(new Intent(LoginActivity.this, MainActivity.class));
            finish();
            return;
        }

        setContentView(R.layout.activity_login);

        etMobile = findViewById(R.id.etMobile);
        etPassword = findViewById(R.id.etPassword);
        btnLogin = findViewById(R.id.btnLogin);
        tvRegister = findViewById(R.id.tvRegister);

        btnLogin.setOnClickListener(v -> handleLogin());
        tvRegister.setOnClickListener(v -> {
            startActivity(new Intent(LoginActivity.this, RegisterActivity.class));
        });
    }

    private void handleLogin() {
        String mobile = etMobile.getText().toString().trim();
        String password = etPassword.getText().toString().trim();

        if (mobile.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please fill in all fields.", Toast.LENGTH_SHORT).show();
            return;
        }

        btnLogin.setEnabled(false);
        btnLogin.setText("LOGGING IN...");

        Map<String, String> body = new HashMap<>();
        body.put("mobilenumber", mobile);
        body.put("password", password);

        ApiClient.getService().login(body).enqueue(new Callback<ApiResponse<Map<String, Object>>>() {
            @Override
            public void onResponse(Call<ApiResponse<Map<String, Object>>> call, Response<ApiResponse<Map<String, Object>>> response) {
                btnLogin.setEnabled(true);
                btnLogin.setText("LOG IN");

                if (response.isSuccessful() && response.body() != null && response.body().success) {
                    Map<String, Object> data = response.body().data;
                    String token = (String) data.get("token");
                    Map<String, Object> userMap = (Map<String, Object>) data.get("user");
                    
                    String userId = (String) userMap.get("id");
                    String userName = (String) userMap.get("name");
                    String userMobile = (String) userMap.get("mobilenumber");

                    pref.saveAuth(token, userId, userName, userMobile);

                    Toast.makeText(LoginActivity.this, "Welcome back!", Toast.LENGTH_SHORT).show();
                    startActivity(new Intent(LoginActivity.this, MainActivity.class));
                    finish();
                } else {
                    String msg = "Login failed";
                    if (response.body() != null) msg = response.body().message;
                    Toast.makeText(LoginActivity.this, msg, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Map<String, Object>>> call, Throwable t) {
                btnLogin.setEnabled(true);
                btnLogin.setText("LOG IN");
                Toast.makeText(LoginActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }
}
