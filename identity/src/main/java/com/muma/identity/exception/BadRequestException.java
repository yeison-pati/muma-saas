package com.muma.identity.exception;

public class BadRequestException extends ApiException {

    public static final String CODE = "BAD_REQUEST";

    public BadRequestException(String message) {
        super(CODE, message);
    }
}
