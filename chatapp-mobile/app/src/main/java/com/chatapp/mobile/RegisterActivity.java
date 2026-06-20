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

public class RegisterActivity extends AppCompatActivity {

    private TextInputEditText etName, etMobile, etPassword;
    private Button btnRegister;
    private TextView tvLogin;
    private SharedPrefManager pref;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        pref = SharedPrefManager.getInstance(this);

        etName = findViewById(R.id.etName);
        etMobile = findViewById(R.id.etMobile);
        etPassword = findViewById(R.id.etPassword);
        btnRegister = findViewById(R.id.btnRegister);
        tvLogin = findViewById(R.id.tvLogin);

        btnRegister.setOnClickListener(v -> handleRegister());
        tvLogin.setOnClickListener(v -> finish()); // Go back to login
    }

    private void handleRegister() {
        String name = etName.getText().toString().trim();
        String mobile = etMobile.getText().toString().trim();
        String password = etPassword.getText().toString().trim();

        if (name.isEmpty() || mobile.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please fill in all fields.", Toast.LENGTH_SHORT).show();
            return;
        }

        if (mobile.length() < 8 || mobile.length() > 15) {
            Toast.makeText(this, "Mobile number must be between 8 and 15 digits.", Toast.LENGTH_SHORT).show();
            return;
        }

        if (password.length() < 6) {
            Toast.makeText(this, "Password must be at least 6 characters.", Toast.LENGTH_SHORT).show();
            return;
        }

        btnRegister.setEnabled(false);
        btnRegister.setText("CREATING ACCOUNT...");

        Map<String, String> body = new HashMap<>();
        body.put("name", name);
        body.put("mobilenumber", mobile);
        body.put("password", password);

        ApiClient.getService().register(body).enqueue(new Callback<ApiResponse<Map<String, Object>>>() {
            @Override
            public void onResponse(Call<ApiResponse<Map<String, Object>>> call, Response<ApiResponse<Map<String, Object>>> response) {
                btnRegister.setEnabled(true);
                btnRegister.setText("CREATE ACCOUNT");

                if (response.isSuccessful() && response.body() != null && response.body().success) {
                    Map<String, Object> data = response.body().data;
                    String token = (String) data.get("token");
                    Map<String, Object> userMap = (Map<String, Object>) data.get("user");
                    
                    String userId = (String) userMap.get("id");
                    String userName = (String) userMap.get("name");
                    String userMobile = (String) userMap.get("mobilenumber");

                    pref.saveAuth(token, userId, userName, userMobile);

                    Toast.makeText(RegisterActivity.this, "Account created successfully!", Toast.LENGTH_SHORT).show();
                    Intent intent = new Intent(RegisterActivity.this, MainActivity.class);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    startActivity(intent);
                    finish();
                } else {
                    String msg = "Registration failed";
                    if (response.body() != null) msg = response.body().message;
                    Toast.makeText(RegisterActivity.this, msg, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Map<String, Object>>> call, Throwable t) {
                btnRegister.setEnabled(true);
                btnRegister.setText("CREATE ACCOUNT");
                Toast.makeText(RegisterActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }
}
