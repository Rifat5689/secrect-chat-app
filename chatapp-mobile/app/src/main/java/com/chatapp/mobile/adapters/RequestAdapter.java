package com.chatapp.mobile.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.chatapp.mobile.R;
import com.chatapp.mobile.models.FriendRequest;

import java.util.List;

public class RequestAdapter extends RecyclerView.Adapter<RequestAdapter.ViewHolder> {

    public interface OnRequestListener {
        void onAccept(String requesterId);
        void onReject(String requesterId);
    }

    private List<FriendRequest> requests;
    private OnRequestListener listener;

    public RequestAdapter(List<FriendRequest> requests, OnRequestListener listener) {
        this.requests = requests;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_request, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        FriendRequest req = requests.get(position);
        if (req.from != null) {
            holder.tvName.setText(req.from.name);
            holder.tvMobile.setText(req.from.mobilenumber);
            
            holder.btnAccept.setOnClickListener(v -> {
                if (listener != null) listener.onAccept(req.from._id);
            });
            holder.btnReject.setOnClickListener(v -> {
                if (listener != null) listener.onReject(req.from._id);
            });
        }
    }

    @Override
    public int getItemCount() {
        return requests.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvName;
        TextView tvMobile;
        Button btnAccept;
        Button btnReject;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvName = itemView.findViewById(R.id.tvRequesterName);
            tvMobile = itemView.findViewById(R.id.tvRequesterMobile);
            btnAccept = itemView.findViewById(R.id.btnAccept);
            btnReject = itemView.findViewById(R.id.btnReject);
        }
    }
}
