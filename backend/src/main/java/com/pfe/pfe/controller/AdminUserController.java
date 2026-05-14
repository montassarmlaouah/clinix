package com.pfe.pfe.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.dto.AdminCreateUserRequest;
import com.pfe.pfe.service.AdminUserProvisioningService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminUserController {

    private final AdminUserProvisioningService adminUserProvisioningService;

    /**
     * Super Admin uniquement : crée un administrateur de clinique ou un patient, envoie le mot de passe par SMS.
     */
    @PostMapping("/create-user")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody AdminCreateUserRequest body) {
        try {
            Map<String, Object> result = adminUserProvisioningService.createUser(body);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
