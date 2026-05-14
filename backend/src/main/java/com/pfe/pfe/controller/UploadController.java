package com.pfe.pfe.controller;

import com.pfe.pfe.service.FileParserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class UploadController {

    private static final String RESPONSE_SANS_IA =
            "L'extraction du texte est disponible ci-dessous. "
                    + "L'analyse automatique par modèle de langage n'est plus proposée dans cette version.";

    @Autowired
    private FileParserService parserService;

    @PostMapping("/upload")
    @SuppressWarnings("unused")
    public ResponseEntity<Map<String, String>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "message", defaultValue = "Analyse ce document médical") String message)
            throws Exception {

        String contentType = file.getContentType();
        String extractedText;

        if (contentType == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Type de fichier inconnu."));
        }

        if (contentType.equals("application/pdf")) {
            extractedText = parserService.parsePdf(file);
        } else if (contentType.startsWith("image/")) {
            extractedText = parserService.parseImage(file);
        } else {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Format non supporté. Utilisez PDF ou image."));
        }

        return ResponseEntity.ok(Map.of(
                "response", RESPONSE_SANS_IA,
                "extracted", extractedText.substring(0, Math.min(500, extractedText.length()))
        ));
    }
}
