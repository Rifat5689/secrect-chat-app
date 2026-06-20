package com.chatapp.mobile.api;

import com.chatapp.mobile.models.ApiResponse;
import com.chatapp.mobile.models.FriendRequest;
import com.chatapp.mobile.models.Message;
import com.chatapp.mobile.models.User;

import java.util.List;
import java.util.Map;

import okhttp3.MultipartBody;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.Multipart;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Part;
import retrofit2.http.Path;

public interface ApiService {

    @POST("api/auth/register")
    Call<ApiResponse<Map<String, Object>>> register(@Body Map<String, String> body);

    @POST("api/auth/login")
    Call<ApiResponse<Map<String, Object>>> login(@Body Map<String, String> body);

    @GET("api/friends")
    Call<ApiResponse<Map<String, List<User>>>> getFriends(@Header("Authorization") String token);

    @GET("api/friends/requests/pending")
    Call<ApiResponse<Map<String, List<FriendRequest>>>> getPendingRequests(@Header("Authorization") String token);

    @POST("api/friends/request")
    Call<ApiResponse<Object>> sendFriendRequest(@Header("Authorization") String token, @Body Map<String, String> body);

    @PUT("api/friends/accept/{id}")
    Call<ApiResponse<Object>> acceptFriendRequest(@Header("Authorization") String token, @Path("id") String requesterId);

    @DELETE("api/friends/reject/{id}")
    Call<ApiResponse<Object>> rejectFriendRequest(@Header("Authorization") String token, @Path("id") String requesterId);

    @GET("api/messages/conversation/{friendId}")
    Call<ApiResponse<Map<String, List<Message>>>> getConversation(@Header("Authorization") String token, @Path("friendId") String friendId);

    @Multipart
    @POST("api/upload")
    Call<ApiResponse<Map<String, String>>> uploadFile(@Header("Authorization") String token, @Part MultipartBody.Part file);
}
