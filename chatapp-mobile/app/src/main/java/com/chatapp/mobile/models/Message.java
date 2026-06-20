package com.chatapp.mobile.models;

import java.util.List;

public class Message {
    public String _id;
    public Object sender; // Can be a User object or a String ID depending on query
    public String receiver;
    public String messageType; // "text", "image", "video"
    public String text;
    public String fileUrl;
    public String status; // "sent", "delivered", "read"
    public String createdAt;
    public boolean isDeletedForEveryone;
    public List<Reaction> reactions;

    public static class Reaction {
        public String user;
        public String emoji;
    }

    public String getSenderId() {
        if (sender instanceof String) {
            return (String) sender;
        } else if (sender instanceof com.google.gson.internal.LinkedTreeMap) {
            // Gson can parse nested objects as LinkedTreeMap
            com.google.gson.internal.LinkedTreeMap map = (com.google.gson.internal.LinkedTreeMap) sender;
            return (String) map.get("_id");
        } else if (sender instanceof User) {
            return ((User) sender)._id;
        }
        return "";
    }
}
