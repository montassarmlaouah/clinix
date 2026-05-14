package com.pfe.pfe.controller;

import com.pfe.pfe.model.MessageInterne;
import com.pfe.pfe.service.MessagerieService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MessagerieController {

    private final MessagerieService messagerieService;

    @PostMapping
    public ResponseEntity<MessageInterne> envoyerMessage(@RequestBody Map<String, String> request) {
        String expediteurId = request.get("expediteurId");
        String destinataireId = request.get("destinataireId");
        String sujet = request.get("sujet");
        String contenu = request.get("contenu");
        String prioriteStr = request.get("priorite");

        MessageInterne.PrioriteMessage priorite = null;
        if (prioriteStr != null && !prioriteStr.isBlank()) {
            priorite = MessageInterne.PrioriteMessage.valueOf(prioriteStr);
        }

        MessageInterne message = messagerieService.envoyerMessage(
                expediteurId, destinataireId, sujet, contenu, priorite);
        return new ResponseEntity<>(message, HttpStatus.CREATED);
    }

    @GetMapping("/recus/{userId}")
    public ResponseEntity<List<MessageInterne>> obtenirMessagesRecus(@PathVariable String userId) {
        return ResponseEntity.ok(messagerieService.obtenirMessagesRecus(userId));
    }

    @GetMapping("/envoyes/{userId}")
    public ResponseEntity<List<MessageInterne>> obtenirMessagesEnvoyes(@PathVariable String userId) {
        return ResponseEntity.ok(messagerieService.obtenirMessagesEnvoyes(userId));
    }

    @GetMapping("/non-lus/{userId}")
    public ResponseEntity<List<MessageInterne>> obtenirMessagesNonLus(@PathVariable String userId) {
        return ResponseEntity.ok(messagerieService.obtenirMessagesNonLus(userId));
    }

    @GetMapping("/non-lus/{userId}/count")
    public ResponseEntity<Map<String, Long>> compterMessagesNonLus(@PathVariable String userId) {
        long count = messagerieService.compterMessagesNonLus(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/conversation/{userId}/{otherUserId}")
    public ResponseEntity<List<MessageInterne>> obtenirConversation(
            @PathVariable String userId,
            @PathVariable String otherUserId) {
        return ResponseEntity.ok(messagerieService.obtenirConversation(userId, otherUserId));
    }

    @GetMapping("/contacts/{userId}")
    public ResponseEntity<List<Map<String, Object>>> obtenirContacts(@PathVariable String userId) {
        return ResponseEntity.ok(messagerieService.obtenirContacts(userId));
    }

    @PatchMapping("/{messageId}/lire")
    public ResponseEntity<MessageInterne> marquerCommeLu(
            @PathVariable String messageId,
            @RequestParam String userId) {
        return ResponseEntity.ok(messagerieService.marquerCommeLu(messageId, userId));
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> supprimerMessage(
            @PathVariable String messageId,
            @RequestParam String userId) {
        messagerieService.supprimerMessage(messageId, userId);
        return ResponseEntity.noContent().build();
    }
}
