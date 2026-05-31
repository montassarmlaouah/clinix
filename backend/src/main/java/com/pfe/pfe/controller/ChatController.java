package com.pfe.pfe.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.ai.GeminiApiException;
import com.pfe.pfe.ai.GeminiChatService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final GeminiChatService geminiChatService;

    @PostMapping("/ask")
    @PreAuthorize("hasRole('MEDECIN')")
    public ResponseEntity<?> ask(@RequestBody Map<String, String> body) {
        try {
            String message = body != null ? body.getOrDefault("message", "") : "";
            String reply = geminiChatService.ask(message);
            return ResponseEntity.ok(Map.of("reply", reply));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("message", e.getMessage()));
        } catch (GeminiApiException e) {
            return ResponseEntity.status(e.getStatus()).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "Assistant temporairement indisponible. Réessayez plus tard."));
        }
    }
}

