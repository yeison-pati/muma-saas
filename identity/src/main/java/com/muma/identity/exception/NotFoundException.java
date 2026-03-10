package com.muma.identity.exception;

public class NotFoundException extends ApiException {

    public static final String CODE = "NOT_FOUND";

    public NotFoundException(String message) {
        super(CODE, message);
    }
}
