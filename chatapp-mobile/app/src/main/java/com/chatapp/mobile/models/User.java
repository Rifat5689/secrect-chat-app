package com.chatapp.mobile.models;

import java.io.Serializable;

public class User implements Serializable {
    public String _id;
    public String name;
    public String mobilenumber;
    public String avatar;
    public boolean isOnline;
    public String lastSeen;
}
