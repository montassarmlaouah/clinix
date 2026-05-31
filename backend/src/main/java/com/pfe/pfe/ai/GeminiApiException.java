package com.pfe.pfe.ai;

import org.springframework.http.HttpStatus;

import lombok.Getter;

@Getter
public class GeminiApiException extends RuntimeException {

    private final HttpStatus status;

    public GeminiApiException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }
}
