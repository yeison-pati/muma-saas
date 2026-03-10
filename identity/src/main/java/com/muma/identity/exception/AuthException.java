package com.muma.identity.exception;

public class AuthException extends ApiException {

    public static final String CODE = "AUTH_ERROR";

    public AuthException(String message) {
        super(CODE, message);
    }
}
