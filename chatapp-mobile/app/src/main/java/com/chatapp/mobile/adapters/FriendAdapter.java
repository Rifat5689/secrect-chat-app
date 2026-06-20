package com.chatapp.mobile.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.chatapp.mobile.R;
import com.chatapp.mobile.models.User;

import java.util.List;

public class FriendAdapter extends RecyclerView.Adapter<FriendAdapter.ViewHolder> {

    public interface OnFriendClickListener {
        void onFriendClick(User friend);
    }

    private List<User> friendList;
    private OnFriendClickListener listener;

    public FriendAdapter(List<User> friendList, OnFriendClickListener listener) {
        this.friendList = friendList;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_friend, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        User friend = friendList.get(position);
        holder.tvName.setText(friend.name);
        holder.tvMobile.setText(friend.mobilenumber);
        
        String initials = friend.name != null && !friend.name.isEmpty() 
                ? String.valueOf(friend.name.charAt(0)).toUpperCase() 
                : "?";
        holder.tvAvatar.setText(initials);

        if (friend.isOnline) {
            holder.viewOnlineDot.setVisibility(View.VISIBLE);
        } else {
            holder.viewOnlineDot.setVisibility(View.GONE);
        }

        holder.itemView.setOnClickListener(v -> {
            if (listener != null) {
                listener.onFriendClick(friend);
            }
        });
    }

    @Override
    public int getItemCount() {
        return friendList.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvAvatar;
        TextView tvName;
        TextView tvMobile;
        View viewOnlineDot;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvAvatar = itemView.findViewById(R.id.tvAvatar);
            tvName = itemView.findViewById(R.id.tvName);
            tvMobile = itemView.findViewById(R.id.tvMobile);
            viewOnlineDot = itemView.findViewById(R.id.viewOnlineDot);
        }
    }
}
