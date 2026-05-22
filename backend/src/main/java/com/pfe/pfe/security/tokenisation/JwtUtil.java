package com.pfe.pfe.security.tokenisation;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import com.pfe.pfe.security.services.CustomUserDetails;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    private final Key secretKey;
    private final long expirationMs;

    public JwtUtil(
            @Value("${jwt.secret:MaCleSecreteTresLongueEtSecurisee123456789ABCDEF}") String secret,
            @Value("${jwt.expiration-ms:3600000}") long expirationMs) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(UserDetails user) {
        var builder = Jwts.builder()
                .setSubject(user.getUsername())
                .claim("role", user.getAuthorities().iterator().next().getAuthority());

        if (user instanceof CustomUserDetails customUser) {
            if (customUser.getId() != null) {
                builder.claim("id", customUser.getId());
            }
            if (customUser.getNom() != null) {
                builder.claim("nom", customUser.getNom());
            }
            if (customUser.getPrenom() != null) {
                builder.claim("prenom", customUser.getPrenom());
            }
            if (customUser.getTelephone() != null) {
                builder.claim("telephone", customUser.getTelephone());
            }
            if (customUser.getCliniqueId() != null) {
                builder.claim("cliniqueId", customUser.getCliniqueId());
            }
            if ("MEDECIN".equalsIgnoreCase(customUser.getRole())) {
                builder.claim("accesCabinet", customUser.isAccesCabinet());
                boolean estCabinet = customUser.isAccesCabinet()
                        || customUser.getCliniqueId() == null
                        || customUser.getCliniqueId().isBlank();
                builder.claim("estCabinet", estCabinet);
            }
        }

        return builder
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(secretKey)
                .compact();
    }

    public String extractUsername(String token) {
        return Jwts.parser()
                .setSigningKey(secretKey)
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }
}
