package com.chatapp.mobile.adapters;

import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.chatapp.mobile.R;
import com.chatapp.mobile.models.Message;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

public class MessageAdapter extends RecyclerView.Adapter<MessageAdapter.ViewHolder> {

    public interface OnMessageInteractionListener {
        void onMessageLongClick(Message message);
        void onMediaClick(String fileUrl, String type);
    }

    private List<Message> messages;
    private String currentUserId;
    private OnMessageInteractionListener listener;

    public MessageAdapter(List<Message> messages, String currentUserId, OnMessageInteractionListener listener) {
        this.messages = messages;
        this.currentUserId = currentUserId;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_message, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Message msg = messages.get(position);
        boolean isMe = msg.getSenderId().equals(currentUserId);

        String time = formatTime(msg.createdAt);

        if (isMe) {
            holder.layoutSent.setVisibility(View.VISIBLE);
            holder.layoutReceived.setVisibility(View.GONE);

            // Time & Ticks
            holder.tvSentTime.setText(time);
            if (msg.isDeletedForEveryone) {
                holder.tvSentText.setText("This message was deleted.");
                holder.tvSentText.setTextColor(Color.parseColor("#94A3B8"));
                holder.ivSentImage.setVisibility(View.GONE);
                holder.layoutSentVideo.setVisibility(View.GONE);
                holder.tvSentTicks.setVisibility(View.GONE);
            } else {
                holder.tvSentText.setText(msg.text);
                holder.tvSentText.setTextColor(Color.WHITE);
                holder.tvSentTicks.setVisibility(View.VISIBLE);

                // Ticks logic
                if ("read".equalsIgnoreCase(msg.status)) {
                    holder.tvSentTicks.setText("✓✓");
                    holder.tvSentTicks.setTextColor(Color.parseColor("#38BDF8")); // light blue
                } else if ("delivered".equalsIgnoreCase(msg.status)) {
                    holder.tvSentTicks.setText("✓✓");
                    holder.tvSentTicks.setTextColor(Color.parseColor("#D1D5DB")); // light grey
                } else {
                    holder.tvSentTicks.setText("✓");
                    holder.tvSentTicks.setTextColor(Color.parseColor("#D1D5DB"));
                }

                // File Logic
                if ("image".equalsIgnoreCase(msg.messageType) && msg.fileUrl != null && !msg.fileUrl.isEmpty()) {
                    holder.ivSentImage.setVisibility(View.VISIBLE);
                    holder.layoutSentVideo.setVisibility(View.GONE);
                    Glide.with(holder.itemView.getContext())
                            .load(msg.fileUrl)
                            .into(holder.ivSentImage);
                    holder.ivSentImage.setOnClickListener(v -> listener.onMediaClick(msg.fileUrl, "image"));
                } else if ("video".equalsIgnoreCase(msg.messageType) && msg.fileUrl != null && !msg.fileUrl.isEmpty()) {
                    holder.layoutSentVideo.setVisibility(View.solid ? View.VISIBLE : View.VISIBLE);
                    holder.ivSentImage.setVisibility(View.GONE);
                    // Use fileUrl as thumbnail loader since glide can extract first frame from video url!
                    Glide.with(holder.itemView.getContext())
                            .load(msg.fileUrl)
                            .into(holder.ivSentVideoThumbnail);
                    holder.layoutSentVideo.setOnClickListener(v -> listener.onMediaClick(msg.fileUrl, "video"));
                } else {
                    holder.ivSentImage.setVisibility(View.GONE);
                    holder.layoutSentVideo.setVisibility(View.GONE);
                }
            }

            // Reactions Sent
            if (msg.reactions != null && !msg.reactions.isEmpty()) {
                holder.tvSentReactions.setVisibility(View.VISIBLE);
                holder.tvSentReactions.setText(getReactionsString(msg.reactions));
            } else {
                holder.tvSentReactions.setVisibility(View.GONE);
            }

        } else {
            holder.layoutSent.setVisibility(View.GONE);
            holder.layoutReceived.setVisibility(View.VISIBLE);

            // Time
            holder.tvReceivedTime.setText(time);
            if (msg.isDeletedForEveryone) {
                holder.tvReceivedText.setText("This message was deleted.");
                holder.tvReceivedText.setTextColor(Color.parseColor("#94A3B8"));
                holder.ivReceivedImage.setVisibility(View.GONE);
                holder.layoutReceivedVideo.setVisibility(View.GONE);
            } else {
                holder.tvReceivedText.setText(msg.text);
                holder.tvReceivedText.setTextColor(Color.parseColor("#F8FAFC"));

                // File Logic
                if ("image".equalsIgnoreCase(msg.messageType) && msg.fileUrl != null && !msg.fileUrl.isEmpty()) {
                    holder.ivReceivedImage.setVisibility(View.VISIBLE);
                    holder.layoutReceivedVideo.setVisibility(View.GONE);
                    Glide.with(holder.itemView.getContext())
                            .load(msg.fileUrl)
                            .into(holder.ivReceivedImage);
                    holder.ivReceivedImage.setOnClickListener(v -> listener.onMediaClick(msg.fileUrl, "image"));
                } else if ("video".equalsIgnoreCase(msg.messageType) && msg.fileUrl != null && !msg.fileUrl.isEmpty()) {
                    holder.layoutReceivedVideo.setVisibility(View.VISIBLE);
                    holder.ivReceivedImage.setVisibility(View.GONE);
                    Glide.with(holder.itemView.getContext())
                            .load(msg.fileUrl)
                            .into(holder.ivReceivedVideoThumbnail);
                    holder.layoutReceivedVideo.setOnClickListener(v -> listener.onMediaClick(msg.fileUrl, "video"));
                } else {
                    holder.ivReceivedImage.setVisibility(View.GONE);
                    holder.layoutReceivedVideo.setVisibility(View.GONE);
                }
            }

            // Reactions Received
            if (msg.reactions != null && !msg.reactions.isEmpty()) {
                holder.tvReceivedReactions.setVisibility(View.VISIBLE);
                holder.tvReceivedReactions.setText(getReactionsString(msg.reactions));
            } else {
                holder.tvReceivedReactions.setVisibility(View.GONE);
            }
        }

        // Long click to react or delete
        holder.itemView.setOnLongClickListener(v -> {
            if (listener != null) {
                listener.onMessageLongClick(msg);
            }
            return true;
        });
    }

    @Override
    public int getItemCount() {
        return messages.size();
    }

    private String getReactionsString(List<Message.Reaction> reactions) {
        StringBuilder sb = new StringBuilder();
        for (Message.Reaction r : reactions) {
            sb.append(r.emoji);
        }
        return sb.toString();
    }

    private String formatTime(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) return "";
        try {
            // Server date format: 2026-06-11T10:39:29.000Z
            SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault());
            inputFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
            Date date = inputFormat.parse(dateStr);

            SimpleDateFormat outputFormat = new SimpleDateFormat("hh:mm a", Locale.getDefault());
            outputFormat.setTimeZone(TimeZone.getDefault());
            return outputFormat.format(date);
        } catch (ParseException e) {
            return "";
        }
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        View layoutSent;
        TextView tvSentText;
        TextView tvSentTime;
        TextView tvSentTicks;
        ImageView ivSentImage;
        FrameLayout layoutSentVideo;
        ImageView ivSentVideoThumbnail;
        TextView tvSentReactions;

        View layoutReceived;
        TextView tvReceivedText;
        TextView tvReceivedTime;
        ImageView ivReceivedImage;
        FrameLayout layoutReceivedVideo;
        ImageView ivReceivedVideoThumbnail;
        TextView tvReceivedReactions;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            layoutSent = itemView.findViewById(R.id.layoutSent);
            tvSentText = itemView.findViewById(R.id.tvSentText);
            tvSentTime = itemView.findViewById(R.id.tvSentTime);
            tvSentTicks = itemView.findViewById(R.id.tvSentTicks);
            ivSentImage = itemView.findViewById(R.id.ivSentImage);
            layoutSentVideo = itemView.findViewById(R.id.layoutSentVideo);
            ivSentVideoThumbnail = itemView.findViewById(R.id.ivSentVideoThumbnail);
            tvSentReactions = itemView.findViewById(R.id.tvSentReactions);

            layoutReceived = itemView.findViewById(R.id.layoutReceived);
            tvReceivedText = itemView.findViewById(R.id.tvReceivedText);
            tvReceivedTime = itemView.findViewById(R.id.tvReceivedTime);
            ivReceivedImage = itemView.findViewById(R.id.ivReceivedImage);
            layoutReceivedVideo = itemView.findViewById(R.id.layoutReceivedVideo);
            ivReceivedVideoThumbnail = itemView.findViewById(R.id.ivReceivedVideoThumbnail);
            tvReceivedReactions = itemView.findViewById(R.id.tvReceivedReactions);
        }
    }
}
