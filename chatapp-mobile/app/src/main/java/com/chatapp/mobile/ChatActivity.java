package com.chatapp.mobile;

import android.app.Activity;
import android.content.DialogInterface;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.chatapp.mobile.adapters.MessageAdapter;
import com.chatapp.mobile.api.ApiClient;
import com.chatapp.mobile.models.ApiResponse;
import com.chatapp.mobile.models.Message;
import com.chatapp.mobile.models.User;
import com.chatapp.mobile.utils.SharedPrefManager;
import com.bumptech.glide.Glide;
import com.chatapp.mobile.utils.SocketManager;
import com.google.gson.Gson;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import io.socket.client.Socket;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ChatActivity extends AppCompatActivity implements MessageAdapter.OnMessageInteractionListener {

    private User activeFriend;
    private SharedPrefManager pref;
    private Socket mSocket;

    private RecyclerView rvMessages;
    private MessageAdapter messageAdapter;
    private List<Message> messageList = new ArrayList<>();

    private EditText etMessage;
    private TextView tvFriendName, tvFriendStatus;
    private ImageView btnSend, ivAttachImage, ivAttachVideo;

    private boolean isTyping = false;
    private android.os.Handler typingHandler = new android.os.Handler();
    private Runnable stopTypingRunnable = () -> sendTypingStatus(false);

    // ActivityResult Launcher for picking attachments
    private String selectedAttachmentType = "image";
    private final ActivityResultLauncher<Intent> attachmentPickerLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                    Uri uri = result.getData().getData();
                    if (uri != null) {
                        uploadAndSendFile(uri, selectedAttachmentType);
                    }
                }
            }
    );

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chat);

        pref = SharedPrefManager.getInstance(this);
        activeFriend = (User) getIntent().getSerializableExtra("friend");

        if (activeFriend == null) {
            finish();
            return;
        }

        // Bind layout views
        rvMessages = findViewById(R.id.rvMessages);
        etMessage = findViewById(R.id.etMessage);
        tvFriendName = findViewById(R.id.tvFriendName);
        tvFriendStatus = findViewById(R.id.tvFriendStatus);
        btnSend = findViewById(R.id.btnSend);
        ivAttachImage = findViewById(R.id.ivAttachImage);
        ivAttachVideo = findViewById(R.id.ivAttachVideo);
        ImageView ivBack = findViewById(R.id.ivBack);

        tvFriendName.setText(activeFriend.name);
        updateStatusDisplay();

        ivBack.setOnClickListener(v -> finish());
        btnSend.setOnClickListener(v -> sendMessage());
        ivAttachImage.setOnClickListener(v -> openFilePicker("image"));
        ivAttachVideo.setOnClickListener(v -> openFilePicker("video"));

        // Setup message lists
        rvMessages.setLayoutManager(new LinearLayoutManager(this));
        messageAdapter = new MessageAdapter(messageList, pref.getUserId(), this);
        rvMessages.setAdapter(messageAdapter);

        // Connect Socket
        mSocket = SocketManager.getSocket(pref.getToken());
        if (mSocket != null) {
            setupSocketListeners();
            try {
                JSONObject readPayload = new JSONObject();
                readPayload.put("senderId", activeFriend._id);
                mSocket.emit("message:read", readPayload);
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        // Fetch Messages
        fetchConversation();

        // Setup typing indicators trigger
        setupTypingIndicatorTrigger();
    }

    private void updateStatusDisplay() {
        if (activeFriend.isOnline) {
            tvFriendStatus.setText("Online");
            tvFriendStatus.setTextColor(Color.parseColor("#10B981"));
        } else {
            tvFriendStatus.setText("Offline");
            tvFriendStatus.setTextColor(Color.parseColor("#94A3B8"));
        }
    }

    private void fetchConversation() {
        String authHeader = "Bearer " + pref.getToken();
        ApiClient.getService().getConversation(authHeader, activeFriend._id).enqueue(new Callback<ApiResponse<Map<String, List<Message>>>>() {
            @Override
            public void onResponse(Call<ApiResponse<Map<String, List<Message>>>> call, Response<ApiResponse<Map<String, List<Message>>>> response) {
                if (response.isSuccessful() && response.body() != null && response.body().success) {
                    List<Message> list = response.body().data.get("messages");
                    messageList.clear();
                    if (list != null) {
                        messageList.addAll(list);
                    }
                    messageAdapter.notifyDataSetChanged();
                    rvMessages.scrollToPosition(messageList.size() - 1);
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Map<String, List<Message>>>> call, Throwable t) {
                Toast.makeText(ChatActivity.this, "Failed to load chats.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void sendMessage() {
        String text = etMessage.getText().toString().trim();
        if (text.isEmpty()) return;

        etMessage.setText("");
        sendTypingStatus(false);

        try {
            JSONObject data = new JSONObject();
            data.put("receiverId", activeFriend._id);
            data.put("text", text);
            data.put("messageType", "text");

            mSocket.emit("message:send", data, args -> {
                runOnUiThread(() -> {
                    try {
                        JSONObject response = (JSONObject) args[0];
                        if (response.getBoolean("success")) {
                            JSONObject msgJson = response.getJSONObject("message");
                            Message msg = new Gson().fromJson(msgJson.toString(), Message.class);
                            messageList.add(msg);
                            messageAdapter.notifyItemInserted(messageList.size() - 1);
                            rvMessages.scrollToPosition(messageList.size() - 1);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                });
            });
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private void openFilePicker(String type) {
        selectedAttachmentType = type;
        Intent intent = new Intent(Intent.ACTION_PICK);
        if ("image".equals(type)) {
            intent.setType("image/*");
        } else {
            intent.setType("video/*");
        }
        attachmentPickerLauncher.launch(intent);
    }

    private void uploadAndSendFile(Uri fileUri, String type) {
        Toast.makeText(this, "Uploading media file in background...", Toast.LENGTH_SHORT).show();
        
        File file = getFileFromUri(fileUri);
        if (file == null) {
            Toast.makeText(this, "Failed to resolve file path.", Toast.LENGTH_SHORT).show();
            return;
        }

        RequestBody requestFile = RequestBody.create(MediaType.parse(getContentResolver().getType(fileUri)), file);
        MultipartBody.Part body = MultipartBody.Part.createFormData("file", file.getName(), requestFile);

        String authHeader = "Bearer " + pref.getToken();
        ApiClient.getService().uploadFile(authHeader, body).enqueue(new Callback<ApiResponse<Map<String, String>>>() {
            @Override
            public void onResponse(Call<ApiResponse<Map<String, String>>> call, Response<ApiResponse<Map<String, String>>> response) {
                if (response.isSuccessful() && response.body() != null && response.body().success) {
                    String fileUrl = response.body().data.get("url");
                    sendFileMessage(fileUrl, type);
                } else {
                    Toast.makeText(ChatActivity.this, "File upload failed.", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Map<String, String>>> call, Throwable t) {
                Toast.makeText(ChatActivity.this, "Upload network error.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void sendFileMessage(String url, String type) {
        try {
            JSONObject data = new JSONObject();
            data.put("receiverId", activeFriend._id);
            data.put("text", "");
            data.put("fileUrl", url);
            data.put("messageType", type);

            mSocket.emit("message:send", data, args -> {
                runOnUiThread(() -> {
                    try {
                        JSONObject response = (JSONObject) args[0];
                        if (response.getBoolean("success")) {
                            JSONObject msgJson = response.getJSONObject("message");
                            Message msg = new Gson().fromJson(msgJson.toString(), Message.class);
                            messageList.add(msg);
                            messageAdapter.notifyItemInserted(messageList.size() - 1);
                            rvMessages.scrollToPosition(messageList.size() - 1);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                });
            });
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private File getFileFromUri(Uri uri) {
        try {
            InputStream inputStream = getContentResolver().openInputStream(uri);
            File file = new File(getCacheDir(), "upload_temp_" + System.currentTimeMillis());
            FileOutputStream outputStream = new FileOutputStream(file);
            byte[] buffer = new byte[1024];
            int read;
            while ((read = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, read);
            }
            outputStream.flush();
            outputStream.close();
            inputStream.close();
            return file;
        } catch (Exception e) {
            return null;
        }
    }

    private void setupTypingIndicatorTrigger() {
        etMessage.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (s.length() > 0) {
                    sendTypingStatus(true);
                    typingHandler.removeCallbacks(stopTypingRunnable);
                    typingHandler.postDelayed(stopTypingRunnable, 2000);
                } else {
                    sendTypingStatus(false);
                }
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });
    }

    private void sendTypingStatus(boolean typing) {
        if (isTyping == typing) return;
        isTyping = typing;
        try {
            JSONObject payload = new JSONObject();
            payload.put("receiverId", activeFriend._id);
            if (isTyping) {
                mSocket.emit("typing:start", payload);
            } else {
                mSocket.emit("typing:stop", payload);
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private void setupSocketListeners() {
        mSocket.on("message:receive", args -> runOnUiThread(() -> {
            try {
                JSONObject payload = (JSONObject) args[0];
                JSONObject msgJson = payload.getJSONObject("message");
                Message msg = new Gson().fromJson(msgJson.toString(), Message.class);
                if (msg.getSenderId().equals(activeFriend._id)) {
                    messageList.add(msg);
                    messageAdapter.notifyItemInserted(messageList.size() - 1);
                    rvMessages.scrollToPosition(messageList.size() - 1);

                    // Send read status
                    try {
                        JSONObject readPayload = new JSONObject();
                        readPayload.put("senderId", activeFriend._id);
                        mSocket.emit("message:read", readPayload);
                    } catch (JSONException readEx) {
                        readEx.printStackTrace();
                    }
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }));

        mSocket.on("message:delivered", args -> runOnUiThread(() -> {
            try {
                JSONObject payload = (JSONObject) args[0];
                String msgId = payload.getString("messageId");
                updateMessageStatus(msgId, "delivered");
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }));

        mSocket.on("message:read", args -> runOnUiThread(() -> {
            try {
                JSONObject payload = (JSONObject) args[0];
                String readerId = payload.getString("readBy");
                if (readerId.equals(activeFriend._id)) {
                    for (int i = 0; i < messageList.size(); i++) {
                        if (!"read".equalsIgnoreCase(messageList.get(i).status)) {
                            messageList.get(i).status = "read";
                        }
                    }
                    messageAdapter.notifyDataSetChanged();
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }));

        mSocket.on("message:deleted", args -> runOnUiThread(() -> {
            try {
                JSONObject payload = (JSONObject) args[0];
                String msgId = payload.getString("messageId");
                for (int i = 0; i < messageList.size(); i++) {
                    if (messageList.get(i)._id.equals(msgId)) {
                        messageList.get(i).isDeletedForEveryone = true;
                        messageList.get(i).text = "This message was deleted.";
                        messageList.get(i).messageType = "text";
                        messageList.get(i).fileUrl = "";
                        messageAdapter.notifyItemChanged(i);
                        break;
                    }
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }));

        mSocket.on("message:reaction", args -> runOnUiThread(() -> {
            try {
                JSONObject payload = (JSONObject) args[0];
                String msgId = payload.getString("messageId");
                JSONArray reactionsJson = payload.getJSONArray("reactions");
                List<Message.Reaction> reactions = new ArrayList<>();
                for (int j = 0; j < reactionsJson.length(); j++) {
                    JSONObject rObj = reactionsJson.getJSONObject(j);
                    Message.Reaction reaction = new Message.Reaction();
                    reaction.user = rObj.getString("user");
                    reaction.emoji = rObj.getString("emoji");
                    reactions.add(reaction);
                }
                for (int i = 0; i < messageList.size(); i++) {
                    if (messageList.get(i)._id.equals(msgId)) {
                        messageList.get(i).reactions = reactions;
                        messageAdapter.notifyItemChanged(i);
                        break;
                    }
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }));

        mSocket.on("typing:start", args -> runOnUiThread(() -> {
            try {
                JSONObject payload = (JSONObject) args[0];
                String senderId = payload.getString("senderId");
                if (senderId.equals(activeFriend._id)) {
                    tvFriendStatus.setText("typing...");
                    tvFriendStatus.setTextColor(Color.parseColor("#818CF8"));
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }));

        mSocket.on("typing:stop", args -> runOnUiThread(() -> {
            try {
                JSONObject payload = (JSONObject) args[0];
                String senderId = payload.getString("senderId");
                if (senderId.equals(activeFriend._id)) {
                    updateStatusDisplay();
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }));
    }

    private void updateMessageStatus(String msgId, String status) {
        for (int i = 0; i < messageList.size(); i++) {
            if (messageList.get(i)._id.equals(msgId)) {
                messageList.get(i).status = status;
                messageAdapter.notifyItemChanged(i);
                break;
            }
        }
    }

    @Override
    public void onMessageLongClick(Message message) {
        if (message.isDeletedForEveryone) return;
        
        boolean isMe = message.getSenderId().equals(pref.getUserId());
        String[] options = isMe ? new String[]{"React 👍", "React ❤️", "React 😂", "React 🙏", "Delete for me", "Delete for everyone"}
                               : new String[]{"React 👍", "React ❤️", "React 😂", "React 🙏", "Delete for me"};

        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Message Actions");
        builder.setItems(options, (dialog, which) -> {
            if (which < 4) {
                String emoji = "";
                if (which == 0) emoji = "👍";
                else if (which == 1) emoji = "❤️";
                else if (which == 2) emoji = "😂";
                else if (which == 3) emoji = "🙏";
                reactToMessage(message._id, emoji);
            } else if (which == 4) {
                deleteMessage(message._id, "me");
            } else if (which == 5) {
                deleteMessage(message._id, "everyone");
            }
        });
        builder.show();
    }

    private void reactToMessage(String messageId, String emoji) {
        try {
            JSONObject data = new JSONObject();
            data.put("messageId", messageId);
            data.put("emoji", emoji);
            mSocket.emit("message:react", data, args -> {
                runOnUiThread(() -> {
                    try {
                        JSONObject res = (JSONObject) args[0];
                        if (res.getBoolean("success")) {
                            fetchConversation(); // Sync reactions list
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                });
            });
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private void deleteMessage(String messageId, String target) {
        String authHeader = "Bearer " + pref.getToken();

        Callback<ApiResponse<Object>> callback = new Callback<ApiResponse<Object>>() {
            @Override
            public void onResponse(Call<ApiResponse<Object>> call, Response<ApiResponse<Object>> response) {
                if (response.isSuccessful() && response.body() != null && response.body().success) {
                    if ("everyone".equals(target)) {
                        // Update local state — the socket listener will also handle this for the receiver
                        for (int i = 0; i < messageList.size(); i++) {
                            if (messageList.get(i)._id.equals(messageId)) {
                                messageList.get(i).isDeletedForEveryone = true;
                                messageList.get(i).text = "This message was deleted.";
                                messageList.get(i).messageType = "text";
                                messageList.get(i).fileUrl = "";
                                messageAdapter.notifyItemChanged(i);
                                break;
                            }
                        }
                    } else {
                        // Remove from local list
                        for (int i = 0; i < messageList.size(); i++) {
                            if (messageList.get(i)._id.equals(messageId)) {
                                messageList.remove(i);
                                messageAdapter.notifyItemRemoved(i);
                                break;
                            }
                        }
                    }
                    Toast.makeText(ChatActivity.this, "Message deleted.", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(ChatActivity.this, "Could not delete message.", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Object>> call, Throwable t) {
                Toast.makeText(ChatActivity.this, "Network error deleting message.", Toast.LENGTH_SHORT).show();
            }
        };

        if ("everyone".equals(target)) {
            ApiClient.getService().deleteMessageForEveryone(authHeader, messageId).enqueue(callback);
        } else {
            ApiClient.getService().deleteMessageForMe(authHeader, messageId).enqueue(callback);
        }
    }

    @Override
    public void onMediaClick(String fileUrl, String type) {
        if ("video".equalsIgnoreCase(type)) {
            // Open video in native player
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(Uri.parse(fileUrl), "video/*");
            try {
                startActivity(intent);
            } catch (Exception e) {
                Toast.makeText(this, "No video player installed.", Toast.LENGTH_SHORT).show();
            }
        } else {
            // Show image in AlertDialog lightbox
            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            ImageView imageView = new ImageView(this);
            imageView.setAdjustViewBounds(true);
            Glide.with(this).load(fileUrl).into(imageView);
            builder.setView(imageView);
            builder.show();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (mSocket != null) {
            mSocket.off("message:receive");
            mSocket.off("message:delivered");
            mSocket.off("message:read");
            mSocket.off("message:deleted");
            mSocket.off("message:reaction");
            mSocket.off("typing:start");
            mSocket.off("typing:stop");
        }
    }
}
